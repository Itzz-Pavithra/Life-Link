import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const donors = await database.getDonors();
	const requests = await database.getRequests();
	const donations = await database.getDonations();

	const getLast6MonthsStats = (reqs, dons) => {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const result = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthIndex = d.getMonth();
			const year = d.getFullYear();
			const monthStr = String(monthIndex + 1).padStart(2, '0');
			const yearMonth = `${year}-${monthStr}`;
			
			const monthReqs = reqs.filter(r => r.date && r.date.startsWith(yearMonth)).length;
			const monthDons = dons.filter(don => don.date && don.date.startsWith(yearMonth)).length;
			
			result.push({
				month: `${monthNames[monthIndex]} ${year}`,
				requests: monthReqs,
				donations: monthDons
			});
		}
		return result;
	};

	const totalDonors = donors.length;
	const distribution = [];
	if (totalDonors > 0) {
		const colors = {
			'O+': '#b91c1c', 'A+': '#dc2626', 'B+': '#ef4444', 'AB+': '#f87171',
			'O-': '#fca5a5', 'A-': '#fecaca', 'B-': '#fee2e2', 'AB-': '#fef2f2',
			'A1+': '#e11d48', 'A1-': '#fb7185', 'A2+': '#f43f5e', 'A2-': '#fda4af',
			'A1B+': '#be123c', 'A1B-': '#f43f5e', 'A2B+': '#9f1239', 'A2B-': '#fb7185'
		};
		const bloodGroups = [
			'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
			'A1+', 'A1-', 'A2+', 'A2-',
			'A1B+', 'A1B-', 'A2B+', 'A2B-'
		];
		bloodGroups.forEach(bg => {
			const count = donors.filter(u => u.bloodGroup === bg).length;
			if (count > 0) {
				const pct = Math.round((count / totalDonors) * 100);
				distribution.push({
					group: bg,
					value: pct,
					color: colors[bg] || '#ef4444'
				});
			}
		});
	}

	const analytics = {
		monthlyActivity: getLast6MonthsStats(requests, donations),
		distribution
	};

	return json(analytics);
}
