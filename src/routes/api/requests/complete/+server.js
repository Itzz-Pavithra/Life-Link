import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';
import { getDocument } from '$lib/server/firebase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		return json({ success: false, error: 'Unauthorized. Only recipients can complete requests.' }, { status: 401 });
	}

	const body = await request.json();
	const { requestId } = body;

	if (!requestId) {
		return json({ success: false, error: 'Invalid parameters.' }, { status: 400 });
	}

	try {
		const req = await getDocument('blood_requests', requestId);
		if (!req) {
			return json({ success: false, error: 'Request not found.' }, { status: 404 });
		}

		// Verify ownership: only the creator can complete it
		if (req.submittedBy !== locals.user.email) {
			return json({ success: false, error: 'Forbidden. You do not own this request.' }, { status: 403 });
		}

		// Ensure it has at least one acceptance
		const responses = await database.getRequestResponses(requestId);
		const hasAcceptance = responses.some(r => r.status === 'Accepted');
		if (!hasAcceptance) {
			return json({ success: false, error: 'Request cannot be completed without at least one accepted donor.' }, { status: 400 });
		}

		await database.completeBloodRequest(requestId, locals.user.email);
		return json({ success: true });
	} catch (err) {
		console.error('Error in request complete API:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
