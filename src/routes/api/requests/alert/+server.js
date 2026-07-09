import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
import { database } from '$lib/server/db.js';
import { sendEmergencyBloodAlert } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { bloodGroup, city, recipientName, contactPhone } = body;

		if (!bloodGroup) {
			return json({ success: false, error: 'bloodGroup is required.' }, { status: 400 });
		}

		// Fetch matched donors dynamically from database
		const allUsers = await database.getUsers();
		const matchedDonors = allUsers.filter(u => 
			u.role === 'donor' &&
			u.status === 'active' &&
			u.isAvailable !== false &&
			u.bloodGroup === bloodGroup
		);
		const dynamicDonorEmails = matchedDonors.map(d => d.email);

		if (dynamicDonorEmails.length === 0) {
			return json({ 
				success: true, 
				message: 'No matching active available donors found.',
				count: 0
			});
		}

		await sendEmergencyBloodAlert({
			donorEmails: dynamicDonorEmails,
			bloodGroup: bloodGroup,
			city: city || 'Requested Location',
			recipientName: recipientName || locals.user.name,
			contactPhone: contactPhone || locals.user.phone
		});

		// Log to Firestore emergency_alerts collection (keeps original donor emails)
		const alertId = `ALT${Date.now()}`;
		await db.collection('emergency_alerts').doc(alertId).set({
			id: alertId,
			recipientEmail: locals.user.email,
			donorEmails: dynamicDonorEmails,
			bloodGroup: bloodGroup,
			city: city || 'Requested Location',
			timestamp: new Date().toISOString()
		});

		// Write to system logs
		const logId = `LOG${Date.now()}`;
		await db.collection('logs').doc(logId).set({
			id: logId,
			user: locals.user.email,
			activity: `Emergency alert processed for ${dynamicDonorEmails.length} matching donors (Blood: ${bloodGroup}, City: ${city || 'N/A'})`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});

		return json({ 
			success: true, 
			message: `Emergency alert processed successfully for ${dynamicDonorEmails.length} matching donors` 
		});
	} catch (err) {
		console.error('Failed to send emergency alert:', err);
		return json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
	}
}
