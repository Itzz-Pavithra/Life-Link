import { json, redirect } from '@sveltejs/kit';
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

	const path = event.url.pathname;

	// 1. Dashboard page route protection and role verification
	if (path.startsWith('/dashboard')) {
		if (!event.locals.user) {
			event.cookies.delete('lifelink_token', { path: '/' });
			event.cookies.delete('lifelink_user', { path: '/' });
			throw redirect(302, '/login');
		}

		const role = event.locals.role;
		if (path === '/dashboard') {
			throw redirect(302, `/dashboard/${role}`);
		}
		if (path.startsWith('/dashboard/admin') && role !== 'admin') {
			throw redirect(302, `/dashboard/${role}`);
		}
		if (path.startsWith('/dashboard/donor') && role !== 'donor') {
			throw redirect(302, `/dashboard/${role}`);
		}
		if (path.startsWith('/dashboard/recipient') && role !== 'recipient') {
			throw redirect(302, `/dashboard/${role}`);
		}
	}

	// 2. Sensitive API route protection
	if (path.startsWith('/api/')) {
		const isPublicApi = 
			path.startsWith('/api/auth/') || 
			path.startsWith('/api/contact') || 
			path.startsWith('/api/landing') || 
			path.startsWith('/api/eligibility') ||
			path.startsWith('/api/test-users');

		if (!isPublicApi) {
			if (!event.locals.user) {
				return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
			}

			// Admin-only endpoints
			const isAdminApi = 
				path.startsWith('/api/users') || 
				path.startsWith('/api/blood') || 
				path.startsWith('/api/analytics');

			if (isAdminApi && event.locals.role !== 'admin') {
				return json({ success: false, error: 'Forbidden.' }, { status: 403 });
			}

			// Donor-only endpoints
			if (path.startsWith('/api/requests/respond') && event.locals.role !== 'donor') {
				return json({ success: false, error: 'Forbidden.' }, { status: 403 });
			}
		}
	}

	const response = await resolve(event);
	return response;
}
