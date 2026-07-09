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

		// Find matching donors
		try {
			const allUsers = await database.getUsers();
			const matchingDonors = allUsers.filter(u => 
				u.role === 'donor' && 
				u.status === 'active' && 
				u.isAvailable !== false &&
				u.bloodGroup === body.bloodGroup
			);

			const { sendEmail } = await import('$lib/server/email.js');
			for (const donor of matchingDonors) {
				try {
					await sendEmail({
						to: donor.email,
						subject: `🚨 LifeLink Emergency: Blood Request for ${body.bloodGroup}`,
						html: `
							<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
								<h2 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; text-align: center;">🚨 Emergency Blood Request</h2>
								<p>Hello <strong>${donor.name}</strong>,</p>
								<p>An emergency blood request matching your blood group (<strong>${body.bloodGroup}</strong>) has been submitted to the LifeLink network.</p>
								
								<div style="background-color: #fff5f6; border: 1px solid #fee2e2; padding: 15px; border-radius: 12px; margin: 20px 0;">
									<p style="margin: 4px 0;"><strong>Patient Name:</strong> ${body.patientName}</p>
									<p style="margin: 4px 0;"><strong>Blood Group Needed:</strong> <span style="color: #dc2626; font-weight: bold;">${body.bloodGroup}</span></p>
									<p style="margin: 4px 0;"><strong>Units Required:</strong> ${body.units} Bags</p>
									<p style="margin: 4px 0;"><strong>Hospital Name:</strong> ${body.hospital}</p>
									<p style="margin: 4px 0;"><strong>City:</strong> ${body.city}</p>
									<p style="margin: 4px 0;"><strong>Recipient Contact Number:</strong> ${body.contact}</p>
									<p style="margin: 4px 0;"><strong>Urgency Level:</strong> <span style="font-weight: bold; color: ${body.urgency === 'Critical' ? '#b91c1c' : '#d97706'}">${body.urgency || 'Normal'}</span></p>
								</div>
								
								<p>If you are available to donate, please log in to your donor dashboard to accept this emergency request ticket.</p>
								<br/>
								<p style="margin-top: 10px; font-weight: bold; color: #1e3a5f;">- LifeLink Team</p>
							</div>
						`,
						type: 'Emergency Request Notification'
					});
				} catch (emailErr) {
					console.error(`Failed to send request email to donor ${donor.email}:`, emailErr);
				}
			}
		} catch (matchingErr) {
			console.error('Error matching donors and dispatching email notifications:', matchingErr);
		}

		const requests = await database.getRequests();
		const systemLogs = await database.getSystemLogs();
		return json({ success: true, request: newReq, requests, systemLogs });
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
