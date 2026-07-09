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
					phone: user.phone || '',
					location: user.location || '',
					address: user.address || '',
					isAvailable: user.isAvailable !== false,
					bloodGroup: user.bloodGroup || '',
					avatar: user.avatar || '',
					profileCompletion: user.profileCompletion || 0,
					createdAt: user.createdAt
				};
				event.locals.role = user.role || null;
			} else {
				event.cookies.delete('lifelink_token', { path: '/' });
				event.cookies.delete('lifelink_user', { path: '/' });
				event.locals.user = null;
				event.locals.role = null;
			}
		} catch (err) {
			event.cookies.delete('lifelink_token', { path: '/' });
			event.cookies.delete('lifelink_user', { path: '/' });
			event.locals.user = null;
			event.locals.role = null;
		}
	} else {
		if (event.cookies.get('lifelink_user')) {
			event.cookies.delete('lifelink_user', { path: '/' });
		}
		event.locals.user = null;
		event.locals.role = null;
	}

	const response = await resolve(event);
	return response;
}
