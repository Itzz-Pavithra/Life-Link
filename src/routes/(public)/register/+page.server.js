import { fail, redirect } from '@sveltejs/kit';

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
		const role = formData.get('role');
		const name = formData.get('name');
		const email = formData.get('email');
		const phone = formData.get('phone');
		const location = formData.get('location');

		if (!role || !name || !email || !phone || !location) {
			return fail(400, { success: false, error: 'Please fill in all common fields.' });
		}

		const user = {
			name: String(name),
			email: String(email),
			role: String(role),
			location: String(location),
			bloodGroup: role === 'donor' ? 'O+' : (role === 'recipient' ? 'A+' : ''),
			profileCompletion: 85,
			avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'
		};

		cookies.set('lifelink_user', JSON.stringify(user), {
			path: '/',
			httpOnly: false,
			maxAge: 60 * 60 * 24 // 1 day
		});

		throw redirect(303, `/dashboard/${role}`);
	}
};
