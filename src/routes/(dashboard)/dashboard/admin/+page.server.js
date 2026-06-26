/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, locals }) {
	const donorsRes = await fetch('/api/donors');
	const donors = await donorsRes.json();

	const bloodRes = await fetch('/api/blood');
	const bloodBanks = await bloodRes.json();

	const requestsRes = await fetch('/api/requests');
	const { requests, systemLogs } = await requestsRes.json();

	const analyticsRes = await fetch('/api/analytics');
	const analytics = await analyticsRes.json();

	const totalDonors = donors.length;
	const totalRequests = requests.length;
	const resolvedRequests = requests.filter(r => r.status === 'Completed').length;
	const partnerBanks = bloodBanks.length;

	const stats = {
		totalDonors,
		totalRequests,
		resolvedRequests,
		partnerBanks
	};

	return {
		user: locals.user,
		donors,
		bloodBanks,
		requests,
		systemLogs,
		analytics,
		stats
	};
}

