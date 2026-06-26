/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, locals }) {
	const donorsRes = await fetch('/api/donors');
	const donors = await donorsRes.json();

	const requestsRes = await fetch('/api/requests');
	const { requests } = await requestsRes.json();

	const bloodRes = await fetch('/api/blood');
	const bloodBanks = await bloodRes.json();

	// Calculate recipient stats
	const userRequests = requests.filter(r => r.contact === '9876543211' || r.contact === '9876543212' || r.contact === '9999999999');
	const activeRequestsCount = userRequests.filter(r => r.status !== 'Completed').length;
	const userBg = locals.user?.bloodGroup || 'A+';
	const matchingDonorsCount = donors.filter(d => d.available && d.bloodGroup === userBg).length;

	const stats = {
		activeRequests: activeRequestsCount,
		matchingDonors: matchingDonorsCount
	};

	return {
		user: locals.user,
		donors,
		requests: userRequests,
		bloodBanks,
		stats
	};
}

