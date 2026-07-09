import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
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

		// Log to Firestore emergency_alerts collection (keeps original donor emails)
		const alertId = `ALT${Date.now()}`;
		await db.collection('emergency_alerts').doc(alertId).set({
			id: alertId,
			recipientEmail: locals.user.email,
			donorEmails: donorEmails,
			bloodGroup: bloodGroup || 'Compatible Blood Type',
			city: city || 'Requested Location',
			timestamp: new Date().toISOString()
		});

		// Write to system logs
		const logId = `LOG${Date.now()}`;
		await db.collection('logs').doc(logId).set({
			id: logId,
			user: locals.user.email,
			activity: `Emergency alert processed for ${donorEmails.length} matching donors (Blood: ${bloodGroup || 'N/A'}, City: ${city || 'N/A'})`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});

		return json({ 
			success: true, 
			message: `Emergency alert processed successfully for ${donorEmails.length} matching donors` 
		});
	} catch (err) {
		console.error('Failed to send emergency alert:', err);
		return json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
	}
}
