import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Access denied. No session token provided.' }, { status: 401 });
	}
	return json({ success: true, user: locals.user });
}
