import { json } from '@sveltejs/kit';
import { submitEligibilityQuiz, reviewEligibility, database } from '$lib/server/db.js';

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
		const { email, name, phone, location, answers } = body;

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
		await submitEligibilityQuiz(email, name, phone, location, answers);

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
			return json({ success: true, message: `Request successfully ${status.toLowerCase()}.` });
		} else {
			return json({ success: false, error: 'Eligibility request not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
