import { fail, redirect } from '@sveltejs/kit';
import { createUser, hasAdmin, getUserByEmail, verifyPassword } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// If already logged in, redirect to dashboard
	if (locals.user) {
		throw redirect(303, `/dashboard/${locals.user.role}`);
	}

	return {
		hasAdminAccount: await hasAdmin()
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const role = formData.get('role'); // 'admin', 'donor', 'recipient'

		if (!email || !password || !role) {
			return fail(400, { success: false, error: 'Email, Password, and Role are required.' });
		}

		const user = await getUserByEmail(String(email));

		if (!user) {
			return fail(400, { success: false, error: 'Invalid email or password.' });
		}

		if (user.role !== String(role)) {
			return fail(400, { success: false, error: 'The selected role does not match this account.' });
		}

		if (user.status === 'suspended') {
			return fail(400, { success: false, error: 'This account has been suspended by the administrator.' });
		}

		// Verify password securely
		const passwordMatch = verifyPassword(String(password), user.password);
		if (!passwordMatch) {
			return fail(400, { success: false, error: 'Invalid email or password.' });
		}

		// Set cookie
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
			maxAge: 60 * 60 * 24 // 1 day
		});

		throw redirect(303, `/dashboard/${user.role}`);
	},

	createAdmin: async ({ request, cookies }) => {
		// Verify if admin exists first
		const adminExists = await hasAdmin();
		if (adminExists) {
			return fail(400, { success: false, error: 'Admin account already exists.' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const email = formData.get('email');
		const phone = formData.get('phone');
		const location = formData.get('location');
		const password = formData.get('password');

		if (!name || !email || !phone || !location || !password) {
			return fail(400, { success: false, error: 'All fields are required to initialize the admin account.' });
		}

		try {
			const adminUser = await createUser({
				name: String(name),
				email: String(email),
				phone: String(phone),
				location: String(location),
				password: String(password),
				role: 'admin',
				bloodGroup: ''
			});

			// Automatically log in the admin
			cookies.set('lifelink_user', JSON.stringify({
				id: adminUser.id,
				name: adminUser.name,
				email: adminUser.email,
				role: adminUser.role,
				location: adminUser.location,
				bloodGroup: '',
				avatar: adminUser.avatar,
				profileCompletion: 100
			}), {
				path: '/',
				httpOnly: false,
				maxAge: 60 * 60 * 24 // 1 day
			});

			throw redirect(303, '/dashboard/admin');
		} catch (err) {
			if (err.status === 303) {
				throw err;
			}
			return fail(400, { success: false, error: err.message });
		}
	},

	logout: async ({ cookies }) => {
		cookies.delete('lifelink_token', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production'
		});
		cookies.delete('lifelink_user', { path: '/' });
		throw redirect(303, '/login');
	}
};
