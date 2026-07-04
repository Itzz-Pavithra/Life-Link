import { database } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const res = await fetch('/api/landing');
	const landingData = await res.json();

	const bloodRequests = await database.getRequests();
	const activeRequests = bloodRequests.filter(
		r => r.status === 'Approved' || r.status === 'Pending'
	);

	return {
		landing: landingData,
		activeRequests
	};
}
