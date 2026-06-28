import { redirect } from '@sveltejs/kit';
import { readDB } from '$lib/server/db.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const userCookie = event.cookies.get('lifelink_user');

	if (userCookie) {
		try {
			const parsed = JSON.parse(userCookie);
			const db = readDB();
			const user = db.users.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());

			if (user && user.status === 'active') {
				event.locals.user = {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					location: user.location,
					bloodGroup: user.bloodGroup,
					avatar: user.avatar,
					profileCompletion: user.profileCompletion
				};
				event.locals.role = user.role || null;
			} else {
				// Invalidate cookie if user suspended, deleted, or not found
				event.cookies.delete('lifelink_user', { path: '/' });
				event.locals.user = null;
				event.locals.role = null;
			}
		} catch (err) {
			event.cookies.delete('lifelink_user', { path: '/' });
			event.locals.user = null;
			event.locals.role = null;
		}
	} else {
		event.locals.user = null;
		event.locals.role = null;
	}

	const path = event.url.pathname;
	if (path.startsWith('/dashboard')) {
		if (!event.locals.user || !event.locals.role) {
			throw redirect(303, '/login');
		}

		const segments = path.split('/');
		const roleSegment = segments[2];
		if (roleSegment && roleSegment !== event.locals.role) {
			throw redirect(303, `/dashboard/${event.locals.role}`);
		}
	}

	const response = await resolve(event);
	return response;
}
