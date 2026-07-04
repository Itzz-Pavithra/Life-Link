import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { createUser, hasAdmin } from '$lib/server/db.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const adminExists = await hasAdmin();
		if (adminExists) {
			return json({ error: 'System already initialized. Admin account exists.' }, { status: 400 });
		}

		const body = await request.json();
		const { name, email, phone, location, password } = body;

		if (!name || !email || !phone || !location || !password) {
			return json({ error: 'All fields are required.' }, { status: 400 });
		}

		const newAdmin = await createUser({
			name,
			email,
			phone,
			location,
			password,
			role: 'admin',
			bloodGroup: ''
		});

		// Issue JWT
		const token = jwt.sign(
			{ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role, name: newAdmin.name },
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		cookies.set('lifelink_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 // 1 day in seconds
		});

		cookies.set('lifelink_user', JSON.stringify({
			id: newAdmin.id,
			name: newAdmin.name,
			email: newAdmin.email,
			role: newAdmin.role,
			location: newAdmin.location,
			bloodGroup: '',
			avatar: newAdmin.avatar,
			profileCompletion: 100
		}), {
			path: '/',
			httpOnly: false,
			maxAge: 24 * 60 * 60 // 1 day in seconds
		});

		return json({ success: true, user: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role } }, { status: 201 });
	} catch (err) {
		console.error('Create admin failed:', err);
		return json({ error: err.message }, { status: 400 });
	}
}
