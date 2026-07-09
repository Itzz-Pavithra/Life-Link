import { json } from '@sveltejs/kit';
import { submitEligibilityQuiz, reviewEligibility, database } from '$lib/server/db.js';
import { sendEmail } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	// Only logged-in admin can read all eligibility requests
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
	}

	const requests = await database.getEligibilityRequests();
	return json({ success: true, requests });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { email, name, phone, location, bloodGroup, answers } = body;

		if (!email || !name || !phone || !location || !answers) {
			return json({ success: false, error: 'Missing required registration details.' }, { status: 400 });
		}

		// Basic validation on answers
		const requiredQuestions = [
			'age', 'weight', 'gender', 'lastDonation', 'medicalHistory', 'diabetes',
			'bloodPressure', 'surgeryHistory', 'pregnancy', 'fever', 'tattoo',
			'smoking', 'alcohol', 'medication', 'covidHistory', 'vaccination',
			'hemoglobin', 'chronicDisease'
		];

		for (const q of requiredQuestions) {
			if (answers[q] === undefined || answers[q] === null || answers[q] === '') {
				return json({ success: false, error: `Missing answer for question: ${q}` }, { status: 400 });
			}
		}

		// Submit the questionnaire
		await submitEligibilityQuiz(email, name, phone, location, bloodGroup, answers);

		// Send email notification to Admin
		try {
			const users = await database.getUsers();
			const admins = users.filter(u => u.role === 'admin');
			const adminEmails = admins.map(a => a.email);

			if (adminEmails.length === 0) {
				adminEmails.push('admin@lifelink.com');
			}

			for (const adminEmail of adminEmails) {
				await sendEmail({
					to: adminEmail,
					subject: "New Donor Eligibility Request Pending",
					html: `
						<p>A donor submitted eligibility verification.</p>
						<p>Please login to admin dashboard.</p>
						<br/>
						<p><strong>Donor Name:</strong> ${name}</p>
						<p><strong>Blood Group:</strong> ${bloodGroup || 'O+'}</p>
						<p><strong>Email:</strong> ${email}</p>
					`,
					type: 'Admin Notification'
				});
			}
		} catch (emailErr) {
			console.error('Failed to send admin notification email:', emailErr);
		}

		return json({ success: true, message: 'Eligibility questionnaire submitted successfully.' });
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 400 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
	// Only Admin can review requests
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { requestId, status } = body; // status = 'Approved' or 'Rejected'

		if (!requestId || !status) {
			return json({ success: false, error: 'Missing parameters.' }, { status: 400 });
		}

		if (status !== 'Approved' && status !== 'Rejected') {
			return json({ success: false, error: 'Invalid status update.' }, { status: 400 });
		}

		const success = await reviewEligibility(requestId, status, locals.user.email);
		if (success) {
			// Fetch the request document to get the donor's email and details
			const reqDoc = await database.getEligibilityRequests().then(reqs => reqs.find(r => r.id === requestId));
			if (reqDoc) {
				try {
					if (status === 'Approved') {
						await sendEmail({
							to: reqDoc.email,
							subject: "LifeLink Donor Verification Approved",
							html: `
								<p>Congratulations, your donor eligibility has been approved.</p>
								<p>You can now receive emergency blood requests.</p>
							`,
							type: 'Donor Approval'
						});
					} else {
						await sendEmail({
							to: reqDoc.email,
							subject: "LifeLink Donor Verification Rejected",
							html: `
								<p>Unfortunately, your donor eligibility has been rejected.</p>
								<p>Please review our safety guidelines and contact support if you think this is incorrect.</p>
							`,
							type: 'Donor Rejection'
						});
					}
				} catch (emailErr) {
					console.error('Failed to send donor notification email:', emailErr);
				}
			}

			return json({ success: true, message: `Request successfully ${status.toLowerCase()}.` });
		} else {
			return json({ success: false, error: 'Eligibility request not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
