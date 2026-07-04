import { json } from '@sveltejs/kit';
import { hasAdmin } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const adminExists = await hasAdmin();
		return json({ hasAdminAccount: adminExists });
	} catch (err) {
		console.error('System check failed:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
