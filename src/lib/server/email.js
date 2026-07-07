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
 * Sends an emergency blood alert email using the Resend API.
 * @param {Object} params
 */
export async function sendEmergencyBloodAlert({ donorEmails, bloodGroup, city, recipientName, contactPhone }) {
	const apiKey = process.env.EMAIL_RESEND;
	if (!apiKey) {
		throw new Error('EMAIL_RESEND environment variable is not defined.');
	}

	const emailSubject = `🚨 EMERGENCY: Blood Needed (${bloodGroup}) in ${city}`;
	const emailBody = `Hello,

This is an emergency alert from LifeLink.

A recipient has requested an emergency match for Blood Group: ${bloodGroup} in City: ${city}.

Recipient Details:
Name: ${recipientName}
Contact Phone: ${contactPhone || 'Check dashboard for details'}

Please log in to your LifeLink dashboard to accept this emergency request and save a life.

Best regards,
LifeLink Team`;

	let response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: 'LifeLink Alerts <onboarding@resend.dev>',
			to: donorEmails.length > 0 ? donorEmails : ['lifelinklifelink2@gmail.com'],
			subject: emailSubject,
			text: emailBody
		})
	});

	if (!response.ok) {
		const errText = await response.text();
		console.warn('Initial Resend call failed, trying sandbox fallback...', errText);
		response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'LifeLink Alerts <onboarding@resend.dev>',
				to: ['lifelinklifelink2@gmail.com'],
				subject: emailSubject + ' (Sandbox Fallback)',
				text: emailBody
			})
		});
	}

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Resend fallback API call failed:', errorText);
		throw new Error(`Resend email dispatch failed: ${response.status} - ${response.statusText}`);
	}

	return await response.json();
}
