import { json } from '@sveltejs/kit';
import { sendEmergencyBloodAlert } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { donorEmails, bloodGroup, city, recipientName, contactPhone } = body;

		if (!donorEmails || !Array.isArray(donorEmails)) {
			return json({ success: false, error: 'donorEmails must be an array.' }, { status: 400 });
		}

		await sendEmergencyBloodAlert({
			donorEmails,
			bloodGroup: bloodGroup || 'Compatible Blood Type',
			city: city || 'Requested Location',
			recipientName: recipientName || locals.user.name,
			contactPhone: contactPhone || locals.user.phone
		});

		return json({ success: true, message: 'Emergency alert sent successfully.' });
	} catch (err) {
		console.error('Failed to send emergency alert:', err);
		return json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
	}
}
