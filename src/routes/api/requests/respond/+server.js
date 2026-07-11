import { json } from '@sveltejs/kit';
import { database, updateBloodRequestStatus, addLog } from '$lib/server/db.js';
import { getDocument } from '$lib/server/firebase.js';
import { sendEmail } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user || locals.user.role !== 'donor') {
		return json({ success: false, error: 'Unauthorized. Only donors can respond.' }, { status: 401 });
	}

	const body = await request.json();
	const { requestId, status } = body;

	if (!requestId || !status || (status !== 'Accepted' && status !== 'Rejected')) {
		return json({ success: false, error: 'Invalid parameters.' }, { status: 400 });
	}

	try {
		// Get request
		const req = await getDocument('blood_requests', requestId);
		if (!req) {
			return json({ success: false, error: 'Blood request not found.' }, { status: 404 });
		}

		// Check if donor already responded
		const existingResponse = await database.getDonorResponse(requestId, locals.user.id);
		if (existingResponse) {
			return json({ success: false, error: 'You have already responded to this request.' }, { status: 400 });
		}

		// Save response
		const response = await database.saveDonorResponse(requestId, locals.user.id, locals.user.name, status);

		// If accepted, update parent request status and send email notification
		if (status === 'Accepted') {
			await updateBloodRequestStatus(requestId, 'Accepted', locals.user.email);

			// Add log
			await addLog(locals.user.email, `Accepted blood request for ${req.patientName}`);

			// Send email notification to recipient (req.submittedBy)
			try {
				await sendEmail({
					to: req.submittedBy,
					subject: `🩸 LifeLink Match: Request Accepted by ${locals.user.name}`,
					html: `
						<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
							<h2 style="color: #10b981; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px; text-align: center;">🩸 Emergency Request Accepted</h2>
							<p>Hello,</p>
							<p>Great news! A verified active donor has <strong>ACCEPTED</strong> your blood request for <strong>${req.patientName}</strong>.</p>
							
							<h3 style="color: #1e3a5f;">Donor Contact Details:</h3>
							<div style="background-color: #f0fdf4; border: 1px solid #d1fae5; padding: 15px; border-radius: 12px; margin: 20px 0;">
								<p style="margin: 4px 0;"><strong>Name:</strong> ${locals.user.name}</p>
								<p style="margin: 4px 0;"><strong>Blood Group:</strong> ${locals.user.bloodGroup}</p>
								<p style="margin: 4px 0;"><strong>Location/City:</strong> ${locals.user.location}</p>
								<p style="margin: 4px 0;"><strong>Phone Number:</strong> ${locals.user.phone || 'Not Provided'}</p>
								<p style="margin: 4px 0;"><strong>Email:</strong> ${locals.user.email}</p>
							</div>
							
							<p>Please get in touch with the donor as soon as possible to coordinate the donation.</p>
							<br/>
							<p style="margin-top: 10px; font-weight: bold; color: #1e3a5f;">- LifeLink Team</p>
						</div>
					`,
					type: 'Donor Response Accepted Notification'
				});
			} catch (emailErr) {
				console.error(`Failed to send acceptance notification email to ${req.submittedBy}:`, emailErr);
			}
		} else {
			// If rejected
			await addLog(locals.user.email, `Rejected blood request for ${req.patientName}`);
		}

		return json({ success: true, response });
	} catch (err) {
		console.error('Error in respond API:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
