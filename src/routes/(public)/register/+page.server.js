import { fail, redirect } from '@sveltejs/kit';
import { createUser, readDB } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals }) {
	if (locals.user) {
		throw redirect(303, `/dashboard/${locals.user.role}`);
	}
	return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
	register: async ({ request, cookies }) => {
		const formData = await request.formData();
		const role = formData.get('role'); // 'donor' or 'recipient'
		const name = formData.get('name');
		const email = formData.get('email');
		const phone = formData.get('phone');
		const location = formData.get('location');
		const password = formData.get('password');
		const bloodGroup = formData.get('bloodGroup');

		if (!role || !name || !email || !phone || !location || !password) {
			return fail(400, { success: false, error: 'All fields are required.' });
		}

		if (role !== 'donor' && role !== 'recipient') {
			return fail(400, { success: false, error: 'Invalid selection for role.' });
		}

		// Additional validation for blood group
		if (role === 'donor' && !bloodGroup) {
			return fail(400, { success: false, error: 'Please select your blood group.' });
		}

		try {
			const user = createUser({
				name: String(name),
				email: String(email),
				phone: String(phone),
				location: String(location),
				password: String(password),
				role: String(role),
				bloodGroup: bloodGroup ? String(bloodGroup) : ''
			});

			// Save session cookie
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

			throw redirect(303, `/dashboard/${role}`);
		} catch (err) {
			// Handle redirects cleanly
			if (err.status === 303) {
				throw err;
			}
			return fail(400, { success: false, error: err.message });
		}
	}
};
