import { json } from '@sveltejs/kit';
import { getUserById } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Access denied. No session token provided.' }, { status: 401 });
	}

	try {
		const user = await getUserById(locals.user.id);
		if (!user) {
			return json({ error: 'User profile not found.' }, { status: 404 });
		}

		return json({
			success: true,
			profile: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				location: user.location,
				role: user.role,
				bloodGroup: user.bloodGroup,
				profileCompletion: user.profileCompletion,
				createdAt: user.createdAt
			}
		});
	} catch (err) {
		console.error('Error fetching user profile:', err);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
}
