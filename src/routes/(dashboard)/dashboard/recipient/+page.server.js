import { database } from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		return {
			user: null,
			donors: [],
			bloodBanks: []
		};
	}

	const users = await database.getUsers();
	const bloodBanks = await database.getBloodBanks();

	return {
		user: locals.user,
		donors: users.filter(u => u.role === 'donor' && u.status === 'active'),
		bloodBanks
	};
}
