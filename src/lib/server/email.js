import dotenv from 'dotenv';
import { env as dynamicEnv } from '$env/dynamic/private';
import { database } from './db.js';

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
	const apiKey = dynamicEnv.EMAIL_RESEND || process.env.EMAIL_RESEND;
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

	// Safe Debugging Logs (Task 3)
	console.log(`[Email Debug] API key exists: ${!!apiKey}`);
	console.log(`[Email Debug] Sender email: "LifeLink Emergency <onboarding@resend.dev>"`);
	console.log(`[Email Debug] Recipient count: 1`);

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: "LifeLink Emergency <onboarding@resend.dev>",
			to: 'lifelinklifelink2@gmail.com',
			subject: emailSubject,
			text: emailBody
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error(`[Resend Error Details]: Status ${response.status} - ${response.statusText}`, errorText);
		throw new Error(`Resend email dispatch failed: Status ${response.status} - ${errorText || response.statusText}`);
	}

	return await response.json();
}

/**
 * Sends an emergency blood alert email using the Resend API.
 * @param {Object} params
 */
export async function sendEmergencyBloodAlert({ donorEmails, bloodGroup, city, recipientName, contactPhone }) {
	const apiKey = dynamicEnv.EMAIL_RESEND || process.env.EMAIL_RESEND;
	if (!apiKey) {
		throw new Error('EMAIL_RESEND environment variable is not defined.');
	}

	const testEmail = dynamicEnv.RESEND_TEST_EMAIL || process.env.RESEND_TEST_EMAIL;

	let emailSubject = `🚨 EMERGENCY: Blood Needed (${bloodGroup}) in ${city}`;
	let emailBody = `Hello,

This is an emergency alert from LifeLink.

A recipient has requested an emergency match for Blood Group: ${bloodGroup} in City: ${city}.

Recipient Details:
Name: ${recipientName}
Contact Phone: ${contactPhone || 'Check dashboard for details'}

Please log in to your LifeLink dashboard to accept this emergency request and save a life.

Best regards,
LifeLink Team`;

	let finalRecipients = donorEmails;

	if (testEmail) {
		console.log(`[Email Debug] Demo Mode Active. Redirecting email to RESEND_TEST_EMAIL: ${testEmail}`);
		let donorDetailsText = '';
		try {
			const allUsers = await database.getUsers();
			const matchedDonors = allUsers.filter(u => donorEmails.includes(u.email));
			matchedDonors.forEach((donor, idx) => {
				donorDetailsText += `\n${idx + 1}. ${donor.name}\nEmail: ${donor.email}\nBlood: ${donor.bloodGroup || 'N/A'}\nPhone: ${donor.phone || 'N/A'}\n`;
			});
		} catch (dbErr) {
			console.error('[Email Debug] Failed to fetch user profiles for demo list:', dbErr);
			donorDetailsText = '\n(Unable to retrieve donor details from database)\n';
		}

		emailSubject = `🚨 EMERGENCY DEMO: Blood Needed (${bloodGroup}) in ${city}`;
		emailBody = `Hello,

This is a DEMO MODE emergency alert from LifeLink.

A recipient has requested an emergency match for Blood Group: ${bloodGroup} in City: ${city}.

Recipient Details:
Name: ${recipientName}
Contact Phone: ${contactPhone || 'Check dashboard for details'}

Matched Donors:${donorDetailsText}
Please log in to your LifeLink dashboard to accept this emergency request and save a life.

Best regards,
LifeLink Team`;

		finalRecipients = [testEmail];
	}

	// Safe Debugging Logs (Task 3)
	console.log(`[Email Debug] API key exists: ${!!apiKey}`);
	console.log(`[Email Debug] Sender email: "LifeLink Emergency <onboarding@resend.dev>"`);
	console.log(`[Email Debug] Recipient count: ${finalRecipients.length}`);

	let response;
	try {
		console.log(`[Email Debug] Attempting to send emergency alert to ${finalRecipients.length} recipients...`);
		response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: "LifeLink Emergency <onboarding@resend.dev>",
				to: finalRecipients.length > 0 ? finalRecipients : ["lifelinklifelink2@gmail.com"],
				subject: emailSubject,
				text: emailBody
			})
		});
	} catch (err) {
		console.error('[Email Debug] Initial send fetch error:', err);
	}

	if (!response || !response.ok) {
		const errText = response ? await response.text() : 'No response';
		console.warn('[Email Debug] Initial Resend call failed, trying sandbox fallback to verified email...', errText);
		
		response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: "LifeLink Emergency <onboarding@resend.dev>",
				to: ["lifelinklifelink2@gmail.com"],
				subject: emailSubject + ' (Sandbox Fallback)',
				text: emailBody
			})
		});
	}

	if (!response.ok) {
		const errorText = await response.text();
		console.error('[Resend Fallback Error Details]:', errorText);
		throw new Error(`Resend email dispatch failed: Status ${response.status} - ${errorText}`);
	}

	return await response.json();
}
