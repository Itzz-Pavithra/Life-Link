import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { getUserById } from '$lib/server/db.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('lifelink_token');

	if (token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			const user = await getUserById(decoded.id);

			// Accept both 'active' and 'admin' status; also accept pending users who are verified
			if (user && (user.status === 'active' || user.role === 'admin')) {
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
			} else if (user && user.status === 'suspended') {
				// Suspended: clear session
				event.cookies.delete('lifelink_token', { path: '/' });
				event.cookies.delete('lifelink_user', { path: '/' });
				event.locals.user = null;
				event.locals.role = null;
			} else {
				// User not found or invalid — clear cookies
				event.cookies.delete('lifelink_token', { path: '/' });
				event.cookies.delete('lifelink_user', { path: '/' });
				event.locals.user = null;
				event.locals.role = null;
			}
		} catch (err) {
			// JWT invalid/expired — clear cookies
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
