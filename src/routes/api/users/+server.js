import { json } from '@sveltejs/kit';
import { deleteUser, suspendUser, database } from '$lib/server/db.js';
import { sendEmail } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
	}
	const users = await database.getUsers();
	return json({ success: true, users });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	// Suspend toggle route
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { userId, reason } = body;

		if (!userId) {
			return json({ success: false, error: 'Missing userId parameter.' }, { status: 400 });
		}

		const updatedUser = await suspendUser(userId, locals.user.email, reason);
		if (updatedUser) {
			if (updatedUser.status === 'suspended') {
				try {
					await sendEmail({
						to: updatedUser.email,
						subject: "LifeLink Account Suspended",
						html: `
							<p>Your account has been suspended.</p>
							<p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
							<p>Please contact support if you think this is incorrect.</p>
						`,
						type: 'Account Suspension'
					});
				} catch (emailErr) {
					console.error('Failed to send suspension email:', emailErr);
				}
			}
			return json({ success: true, user: updatedUser });
		} else {
			return json({ success: false, error: 'User not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
	// Delete user route
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return json({ success: false, error: 'Missing userId parameter.' }, { status: 400 });
		}

		const success = await deleteUser(userId, locals.user.email);
		if (success) {
			return json({ success: true });
		} else {
			return json({ success: false, error: 'User not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
