import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const donors = await database.getDonors();
	const requests = await database.getRequests();
	const donations = await database.getDonations();

	// Calculate counts dynamically from actual database
	const bloodGroupCounts = {};
	donors.forEach(u => {
		if (u.bloodGroup) {
			bloodGroupCounts[u.bloodGroup] = (bloodGroupCounts[u.bloodGroup] || 0) + 1;
		}
	});

	const distribution = Object.entries(bloodGroupCounts).map(([group, val]) => ({
		group,
		value: val,
		color: group.startsWith('O') ? '#b91c1c' : (group.startsWith('A') ? '#dc2626' : '#ef4444')
	}));

	if (distribution.length === 0) {
		distribution.push({ group: 'No Donors', value: 0, color: '#6b7280' });
	}

	const analytics = {
		monthlyActivity: [
			{ month: 'Jan', requests: 0, donations: 0 },
			{ month: 'Feb', requests: 0, donations: 0 },
			{ month: 'Mar', requests: 0, donations: 0 },
			{ month: 'Apr', requests: 0, donations: 0 },
			{ month: 'May', requests: 0, donations: 0 },
			{ month: 'Jun', requests: requests.length, donations: donations.length }
		],
		distribution
	};

	return json(analytics);
}
