import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const userCookie = event.cookies.get('lifelink_user');

	if (userCookie) {
		try {
			const user = JSON.parse(userCookie);
			event.locals.user = user;
			event.locals.role = user.role || null;
		} catch (err) {
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

