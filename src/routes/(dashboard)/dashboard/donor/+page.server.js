/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, locals }) {
	const requestsRes = await fetch('/api/requests');
	const { requests } = await requestsRes.json();

	const historyRes = await fetch('/api/donors/history');
	const { history, badges } = await historyRes.json();

	const donationsCount = history.length;
	const livesSavedCount = donationsCount * 3;

	const stats = {
		donationsCount,
		livesSavedCount
	};

	return {
		user: locals.user,
		requests,
		history,
		badges,
		stats
	};
}

