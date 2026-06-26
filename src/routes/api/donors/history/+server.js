import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json({
		history: database.donorHistory,
		badges: database.donorBadges
	});
}
