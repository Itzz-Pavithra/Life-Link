import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const landingData = await database.getLandingData();
	return json(landingData);
}
