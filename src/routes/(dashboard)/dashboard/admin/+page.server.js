import { database, addBloodBank, addDonation } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(303, '/login');
	}

	const users = await database.getUsers();
	const bloodRequests = await database.getRequests();
	const bloodBanks = await database.getBloodBanks();
	const donations = await database.getDonations();
	const eligibilityRequests = await database.getEligibilityRequests();
	const logs = await database.getSystemLogs();

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
	const bloodGroupCounts = {};
	donorsList.forEach(u => {
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
			{ month: 'Jun', requests: bloodRequests.length, donations: donations.length }
		],
		distribution
	};

	return {
		user: locals.user,
		users,
		donors: donorsList,
		receivers: users.filter(u => u.role === 'recipient'),
		eligibilityRequests,
		bloodBanks,
		requests: bloodRequests,
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
				'A+': 0, 'B+': 0, 'O+': 0, 'AB+': 0,
				'A-': 0, 'B-': 0, 'O-': 0, 'AB-': 0
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
