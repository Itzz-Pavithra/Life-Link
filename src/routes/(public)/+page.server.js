/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const res = await fetch('/api/landing');
	const landingData = await res.json();
	return {
		landing: landingData
	};
}
