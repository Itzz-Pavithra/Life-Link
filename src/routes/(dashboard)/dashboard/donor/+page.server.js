import { database } from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'donor') {
		return {
			user: null,
			requests: [],
			history: [],
			badges: [],
			stats: { donationsCount: 0, livesSavedCount: 0 }
		};
	}

	const donations = await database.getDonations();
	const bloodRequests = await database.getRequests();

	// Load donor's personal donation history from the real donations table
	const history = donations.filter(
		d => d.donorId === locals.user.id || d.donorName.toLowerCase() === locals.user.name.toLowerCase()
	);

	// Load approved/pending requests that match donor's blood type compatibility
	const requests = bloodRequests.filter(
		r => r.status === 'Approved' || r.status === 'Pending'
	);

	const donationsCount = history.length;
	const livesSavedCount = donationsCount * 3;

	const stats = {
		donationsCount,
		livesSavedCount
	};

	// Generate badges dynamically based on real history
	const badges = [
		{ name: 'Bronze Donor', desc: 'Completed 1 whole blood donation drive.', progress: donationsCount >= 1 ? 100 : 0, earned: donationsCount >= 1, icon: '🥉' },
		{ name: 'Silver Donor', desc: 'Completed 3 whole blood donation drives.', progress: donationsCount >= 3 ? 100 : Math.round((donationsCount / 3) * 100), earned: donationsCount >= 3, icon: '🥈' },
		{ name: 'Gold Donor', desc: 'Completed 5 whole blood donation drives.', progress: donationsCount >= 5 ? 100 : Math.round((donationsCount / 5) * 100), earned: donationsCount >= 5, icon: '🥇' },
		{ name: 'Life Saver Badge', desc: 'Successfully matched and accepted emergency tickets.', progress: donationsCount >= 1 ? 100 : 0, earned: donationsCount >= 1, icon: '🏆' }
	];

	return {
		user: locals.user,
		requests,
		history,
		badges,
		stats
	};
}
