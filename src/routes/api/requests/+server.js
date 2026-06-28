import { json } from '@sveltejs/kit';
import { database, addRequest, updateBloodRequestStatus } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json({
		requests: database.requests,
		systemLogs: database.systemLogs
	});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	const body = await request.json();
	const userEmail = locals.user.email;

	// Check if this is a status update
	if (body.id && body.status) {
		const success = updateBloodRequestStatus(body.id, body.status, userEmail);
		if (success) {
			return json({ success: true, requests: database.requests, systemLogs: database.systemLogs });
		}
		return json({ success: false, error: 'Request not found.' }, { status: 404 });
	}

	// Otherwise, this is a new blood request submission
	if (!body.patientName || !body.bloodGroup || !body.units || !body.hospital || !body.city || !body.contact) {
		return json({ success: false, error: 'Missing required blood request fields.' }, { status: 400 });
	}

	try {
		const newReq = addRequest(body, userEmail);
		return json({ success: true, request: newReq, requests: database.requests, systemLogs: database.systemLogs });
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
