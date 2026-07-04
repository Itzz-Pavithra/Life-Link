import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { getUserByEmail, verifyPassword } from '$lib/server/db.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const body = await request.json();
		const { email, password, role } = body;

		if (!email || !password || !role) {
			return json({ error: 'Email, Password, and Role are required.' }, { status: 400 });
		}

		const user = await getUserByEmail(email);
		if (!user) {
			return json({ error: 'Invalid email or password.' }, { status: 400 });
		}

		if (user.role !== role) {
			return json({ error: 'Selected role does not match this account.' }, { status: 400 });
		}

		if (user.status === 'suspended') {
			return json({ error: 'This account has been suspended by the administrator.' }, { status: 400 });
		}

		// Verify hashed password securely
		const matches = verifyPassword(password, user.password);
		if (!matches) {
			return json({ error: 'Invalid email or password.' }, { status: 400 });
		}

		// Issue JWT
		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				name: user.name,
				location: user.location,
				bloodGroup: user.bloodGroup,
				avatar: user.avatar,
				profileCompletion: user.profileCompletion
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		// Set secure cookies
		cookies.set('lifelink_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 // 1 day
		});

		cookies.set('lifelink_user', JSON.stringify({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			location: user.location,
			bloodGroup: user.bloodGroup,
			avatar: user.avatar,
			profileCompletion: user.profileCompletion
		}), {
			path: '/',
			httpOnly: false,
			maxAge: 24 * 60 * 60 // 1 day
		});

		return json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				location: user.location,
				bloodGroup: user.bloodGroup
			}
		});
	} catch (err) {
		console.error('Login failed:', err);
		return json({ error: 'Internal server error during login.' }, { status: 500 });
	}
}
