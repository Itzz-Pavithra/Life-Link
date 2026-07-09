import { database } from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		return {
			user: null,
			donors: [],
			requests: [],
			bloodBanks: [],
			stats: { activeRequests: 0, matchingDonors: 0 }
		};
	}

	const bloodRequests = await database.getRequests();
	const users = await database.getUsers();
	const bloodBanks = await database.getBloodBanks();

	// Load only the requests submitted by this recipient
	const userRequests = bloodRequests.filter(
		r => r.submittedBy === locals.user.email
	);

	// Calculate statistics
	const activeRequestsCount = userRequests.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
	
	// Find matching active donors in same region or compatible blood types
	const userBg = locals.user.bloodGroup || 'O+';
	const matchingDonors = users.filter(
		u => u.role === 'donor' && u.status === 'active' && u.bloodGroup === userBg
	);

	const stats = {
		activeRequests: activeRequestsCount,
		matchingDonors: matchingDonors.length
	};

	return {
		user: locals.user,
		donors: users.filter(u => u.role === 'donor' && u.status === 'active'),
		requests: userRequests,
		bloodBanks,
		stats
	};
}
