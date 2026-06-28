import { readDB } from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		throw redirect(303, '/login');
	}

	const db = readDB();

	// Load only the requests submitted by this recipient
	const userRequests = db.blood_requests.filter(
		r => r.submittedBy === locals.user.email
	);

	// Calculate statistics
	const activeRequestsCount = userRequests.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
	
	// Find matching active donors in same region or compatible blood types
	const userBg = locals.user.bloodGroup || 'O+';
	const matchingDonors = db.users.filter(
		u => u.role === 'donor' && u.status === 'active' && u.bloodGroup === userBg
	);

	const stats = {
		activeRequests: activeRequestsCount,
		matchingDonors: matchingDonors.length
	};

	return {
		user: locals.user,
		donors: db.users.filter(u => u.role === 'donor' && u.status === 'active'),
		requests: userRequests,
		bloodBanks: db.blood_banks,
		stats
	};
}
