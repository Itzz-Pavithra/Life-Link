import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a contact query email using the Resend API.
 * @param {Object} params
 * @param {string} params.name - Full name of the user
 * @param {string} params.email - Email address of the user
 * @param {string} params.subject - Message subject
 * @param {string} params.message - Message body
 */
export async function sendContactEmail({ name, email: userEmail, subject, message }) {
	const apiKey = process.env.EMAIL_RESEND;
	if (!apiKey) {
		throw new Error('EMAIL_RESEND environment variable is not defined.');
	}

	const emailSubject = `New LifeLink Contact Query - ${subject}`;
	const emailBody = `New user message received:

Name:
${name}

Email:
${userEmail}

Subject:
${subject}

Message:
${message}

Sent from:
LifeLink Contact Page`;

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: 'LifeLink Contact <onboarding@resend.dev>',
			to: 'lifelinklifelink2@gmail.com',
			subject: emailSubject,
			text: emailBody
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Resend API call failed:', errorText);
		throw new Error(`Resend email dispatch failed with status: ${response.status} - ${response.statusText}`);
	}

	return await response.json();
}

/**
 * Sends an emergency blood alert email (placeholder to keep it separate as requested).
 * @param {Object} alertData
 */
export async function sendEmergencyBloodAlert(alertData) {
	// Keep separate from sendContactEmail and do not modify existing emergency blood alert email features
	console.log('sendEmergencyBloodAlert placeholder called with data:', alertData);
}
