import { database, addBloodBank, addDonation } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'admin') {
		return {
			user: null,
			users: [],
			donors: [],
			receivers: [],
			eligibilityRequests: [],
			bloodBanks: [],
			requests: [],
			donations: [],
			systemLogs: [],
			analytics: { monthlyActivity: [], distribution: [] },
			stats: { totalDonors: 0, totalRequests: 0, resolvedRequests: 0, partnerBanks: 0 }
		};
	}

	const users = await database.getUsers();
	const bloodRequests = await database.getRequests();
	const bloodBanks = await database.getBloodBanks();
	const donations = await database.getDonations();
	const logs = await database.getSystemLogs();

	const requestsWithResponses = await Promise.all(
		bloodRequests.map(async (req) => {
			const responses = await database.getRequestResponses(req.id);
			
			// Find all matching donors for this request
			const matchingDonors = users.filter(u => 
				u.role === 'donor' && 
				u.status === 'active' && 
				u.isAvailable !== false &&
				u.emailVerified === true &&
				u.bloodGroup === req.bloodGroup
			);

			// Map matching donors to their responses or 'Waiting' status
			const donorResponses = matchingDonors.map(donor => {
				const resp = responses.find(r => r.donorId === donor.id);
				return {
					donorId: donor.id,
					donorName: donor.name,
					status: resp ? resp.status : 'Waiting',
					respondedAt: resp ? (resp.respondedAt || resp.acceptedAt) : null,
					acceptedAt: resp ? resp.acceptedAt : null
				};
			});

			return {
				...req,
				donorResponses,
				matchingDonorsCount: matchingDonors.length,
				acceptedCount: donorResponses.filter(dr => dr.status === 'Accepted').length,
				rejectedCount: donorResponses.filter(dr => dr.status === 'Rejected').length,
				waitingCount: donorResponses.filter(dr => dr.status === 'Waiting').length
			};
		})
	);

	// Helper function for last 6 months stats
	const getLast6MonthsStats = (requests, donations) => {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const result = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthIndex = d.getMonth();
			const year = d.getFullYear();
			const monthStr = String(monthIndex + 1).padStart(2, '0');
			const yearMonth = `${year}-${monthStr}`;
			
			const monthReqs = requests.filter(r => r.date && r.date.startsWith(yearMonth)).length;
			const monthDons = donations.filter(don => don.date && don.date.startsWith(yearMonth)).length;
			
			result.push({
				month: `${monthNames[monthIndex]} ${year}`,
				requests: monthReqs,
				donations: monthDons
			});
		}
		return result;
	};

	// Calculate counts
	const donorsList = users.filter(u => u.role === 'donor');
	const totalDonors = donorsList.length;
	const totalRequests = bloodRequests.length;
	const resolvedRequests = bloodRequests.filter(r => r.status === 'Completed').length;
	const partnerBanks = bloodBanks.length;

	const stats = {
		totalDonors,
		totalRequests,
		resolvedRequests,
		partnerBanks
	};

	// Generate blood distribution metrics dynamically based on actual database contents
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
			const count = donorsList.filter(u => u.bloodGroup === bg).length;
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
		monthlyActivity: getLast6MonthsStats(bloodRequests, donations),
		distribution
	};

	return {
		user: locals.user,
		users,
		donors: donorsList,
		receivers: users.filter(u => u.role === 'recipient'),
		eligibilityRequests: [],
		bloodBanks,
		requests: requestsWithResponses,
		donations,
		systemLogs: logs,
		analytics,
		stats
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	// Add new blood bank
	addBloodBank: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized action.' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const address = formData.get('address');
		const phone = formData.get('phone');
		const email = formData.get('email');
		const workingHours = formData.get('workingHours');
		const mapLink = formData.get('mapLink');

		if (!name || !address || !phone || !email) {
			return fail(400, { error: 'Name, Address, Phone, and Email are required fields.' });
		}

		await addBloodBank({
			name: String(name),
			address: String(address),
			phone: String(phone),
			email: String(email),
			workingHours: workingHours ? String(workingHours) : '9:00 AM - 5:00 PM',
			mapLink: mapLink ? String(mapLink) : '',
			inventory: {
				'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
				'A1+': 0, 'A1-': 0, 'A2+': 0, 'A2-': 0,
				'A1B+': 0, 'A1B-': 0, 'A2B+': 0, 'A2B-': 0
			}
		}, locals.user.email);

		return { success: true, message: 'Blood bank successfully added.' };
	},

	// Log a new donation manually
	logDonation: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized action.' });
		}

		const formData = await request.formData();
		const donorName = formData.get('donorName');
		const bloodGroup = formData.get('bloodGroup');
		const units = formData.get('units');
		const hospital = formData.get('hospital');
		const date = formData.get('date');

		if (!donorName || !bloodGroup || !units || !hospital) {
			return fail(400, { error: 'Donor Name, Blood Group, Units, and Hospital are required.' });
		}

		await addDonation({
			donorName: String(donorName),
			bloodGroup: String(bloodGroup),
			units: Number(units),
			hospital: String(hospital),
			date: date ? String(date) : new Date().toISOString().split('T')[0]
		}, locals.user.email);

		return { success: true, message: 'Donation logged successfully.' };
	}
};
