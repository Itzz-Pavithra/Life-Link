import { readDB } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const res = await fetch('/api/landing');
	const landingData = await res.json();

	const db = readDB();
	const activeRequests = db.blood_requests.filter(
		r => r.status === 'Approved' || r.status === 'Pending'
	);

	return {
		landing: landingData,
		activeRequests
	};
}

