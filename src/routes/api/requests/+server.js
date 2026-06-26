import { json } from '@sveltejs/kit';
import { database, addRequest } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json({
		requests: database.requests,
		systemLogs: database.systemLogs
	});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	const body = await request.json();
	const user = locals.user?.name || 'User';

	// Check if this is a status update transaction
	if (body.id && body.status) {
		const req = database.requests.find(r => r.id === body.id);
		if (req) {
			req.status = body.status;
			database.systemLogs.unshift({
				id: `LOG${Date.now()}`,
				user,
				activity: `Request ${body.id} status updated to ${body.status}`,
				timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
			});
			return json({ success: true, requests: database.requests, systemLogs: database.systemLogs });
		}
		return json({ success: false, error: 'Request not found' }, { status: 404 });
	}

	// Otherwise, this is a new blood request submission
	if (!body.patientName || !body.bloodGroup || !body.units || !body.hospital || !body.city) {
		return json({ success: false, error: 'Missing required fields' }, { status: 400 });
	}

	const newReq = addRequest(body, user);
	return json({ success: true, request: newReq, requests: database.requests, systemLogs: database.systemLogs });
}
