import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals }) {
	// If already logged in, redirect to their dashboard directly
	if (locals.user) {
		throw redirect(303, `/dashboard/${locals.user.role}`);
	}
	return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const role = formData.get('role');

		if (!email || !role) {
			return fail(400, { success: false, error: 'Email and Role are required' });
		}

		if (role !== 'admin' && role !== 'donor' && role !== 'recipient') {
			return fail(400, { success: false, error: 'Invalid user role selected.' });
		}

		let name = 'User';
		if (role === 'admin') name = 'Admin Team';
		else if (role === 'donor') name = 'John Doe (Donor)';
		else if (role === 'recipient') name = 'Sarah Connor (Recipient)';

		const user = {
			name,
			email: String(email),
			role: String(role),
			location: 'Salem',
			bloodGroup: role === 'donor' ? 'O+' : (role === 'recipient' ? 'A+' : ''),
			profileCompletion: 85,
			avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'
		};


		// Set httpOnly session cookie
		cookies.set('lifelink_user', JSON.stringify(user), {
			path: '/',
			httpOnly: false, // Set to false so client components can read it if needed
			maxAge: 60 * 60 * 24 // 1 day
		});

		throw redirect(303, `/dashboard/${role}`);
	},

	logout: async ({ cookies }) => {
		cookies.delete('lifelink_user', { path: '/' });
		throw redirect(303, '/login');
	}
};
