import { json } from '@sveltejs/kit';
import { database, updateInventory } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json(database.bloodBanks);
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	const body = await request.json();
	const { bloodGroup, units } = body;
	const user = locals.user?.name || 'Staff';

	if (!bloodGroup || units === undefined) {
		return json({ success: false, error: 'Missing parameters' }, { status: 400 });
	}

	const success = updateInventory(bloodGroup, units, user);
	return json({ success, bloodBanks: database.bloodBanks });
}
