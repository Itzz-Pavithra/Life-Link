import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const donors = await database.getDonors();
	return json(donors);
}
