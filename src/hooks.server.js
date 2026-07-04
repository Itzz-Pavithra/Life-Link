import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { getUserById, getUserByEmail } from '$lib/server/db.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('lifelink_token');
	const userCookie = event.cookies.get('lifelink_user');

	if (token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			const user = await getUserById(decoded.id);

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
				event.cookies.delete('lifelink_token', { path: '/' });
				event.locals.user = null;
				event.locals.role = null;
			}
		} catch (err) {
			event.cookies.delete('lifelink_token', { path: '/' });
			event.locals.user = null;
			event.locals.role = null;
		}
	} else if (userCookie) {
		try {
			const parsed = JSON.parse(userCookie);
			const user = await getUserByEmail(parsed.email);

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
