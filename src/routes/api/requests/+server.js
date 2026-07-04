import { json } from '@sveltejs/kit';
import { database, addRequest, updateBloodRequestStatus } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const requests = await database.getRequests();
	const systemLogs = await database.getSystemLogs();
	return json({
		requests,
		systemLogs
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
		const success = await updateBloodRequestStatus(body.id, body.status, userEmail);
		if (success) {
			const requests = await database.getRequests();
			const systemLogs = await database.getSystemLogs();
			return json({ success: true, requests, systemLogs });
		}
		return json({ success: false, error: 'Request not found.' }, { status: 404 });
	}

	// Otherwise, this is a new blood request submission
	if (!body.patientName || !body.bloodGroup || !body.units || !body.hospital || !body.city || !body.contact) {
		return json({ success: false, error: 'Missing required blood request fields.' }, { status: 400 });
	}

	try {
		const newReq = await addRequest(body, userEmail);
		const requests = await database.getRequests();
		const systemLogs = await database.getSystemLogs();
		return json({ success: true, request: newReq, requests, systemLogs });
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
