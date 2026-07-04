import { json } from '@sveltejs/kit';
import { deleteUser, suspendUser, database } from '$lib/server/db.js';

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
		const { userId } = body;

		if (!userId) {
			return json({ success: false, error: 'Missing userId parameter.' }, { status: 400 });
		}

		const updatedUser = await suspendUser(userId, locals.user.email);
		if (updatedUser) {
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
