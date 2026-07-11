import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals, url }) {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const role = locals.role;
	const path = url.pathname;

	if (path.startsWith('/dashboard/admin') && role !== 'admin') {
		throw redirect(302, `/dashboard/${role}`);
	}
	if (path.startsWith('/dashboard/donor') && role !== 'donor') {
		throw redirect(302, `/dashboard/${role}`);
	}
	if (path.startsWith('/dashboard/recipient') && role !== 'recipient') {
		throw redirect(302, `/dashboard/${role}`);
	}

	return {
		user: locals.user,
		role: locals.role
	};
}

