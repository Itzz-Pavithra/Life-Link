import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	const donations = await database.getDonations();
	const history = donations.filter(
		d => d.donorId === locals.user.id || d.donorName.toLowerCase() === locals.user.name.toLowerCase()
	);

	const donationsCount = history.length;
	const badges = [
		{ name: 'Bronze Donor', desc: 'Completed 1 whole blood donation drive.', progress: donationsCount >= 1 ? 100 : 0, earned: donationsCount >= 1, icon: '🥉' },
		{ name: 'Silver Donor', desc: 'Completed 3 whole blood donation drives.', progress: donationsCount >= 3 ? 100 : Math.round((donationsCount / 3) * 100), earned: donationsCount >= 3, icon: '🥈' },
		{ name: 'Gold Donor', desc: 'Completed 5 whole blood donation drives.', progress: donationsCount >= 5 ? 100 : Math.round((donationsCount / 5) * 100), earned: donationsCount >= 5, icon: '🥇' },
		{ name: 'Life Saver Badge', desc: 'Successfully matched and accepted emergency tickets.', progress: donationsCount >= 1 ? 100 : 0, earned: donationsCount >= 1, icon: '🏆' }
	];

	return json({ history, badges });
}
