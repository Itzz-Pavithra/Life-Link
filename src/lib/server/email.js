import dotenv from 'dotenv';
import { env as dynamicEnv } from '$env/dynamic/private';
import { database } from './db.js';

dotenv.config();

const resend = {
	emails: {
		async send({ from, to, subject, html }) {
			const apiKey = dynamicEnv.EMAIL_RESEND || process.env.EMAIL_RESEND;
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from,
					to,
					subject,
					html
				})
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Resend email dispatch failed: Status ${response.status} - ${errorText}`);
			}
			return await response.json();
		}
	}
};

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
	console.log(`[Email Debug] Sender email: "LifeLink <onboarding@resend.dev>"`);
	console.log(`[Email Debug] Recipient count: 1`);

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: "LifeLink <onboarding@resend.dev>",
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

	// Fetch all matching donor profiles to obtain Name, Blood Group, Phone, and Location
	let matchedDonors = [];
	try {
		const allUsers = await database.getUsers();
		matchedDonors = allUsers.filter(u => donorEmails.includes(u.email));
	} catch (dbErr) {
		console.error('[Email Debug] Failed to fetch user profiles:', dbErr);
	}

	// Fallback to minimal donor structures if not found in DB
	const donorsToProcess = matchedDonors.length > 0 ? matchedDonors : donorEmails.map(email => ({
		name: 'Compatible Donor',
		email: email,
		bloodGroup: bloodGroup,
		phone: 'Check dashboard',
		location: city || 'Requested Location'
	}));

	const testEmail = dynamicEnv.RESEND_TEST_EMAIL || process.env.RESEND_TEST_EMAIL;

	let lastResult = null;

	for (const donor of donorsToProcess) {
		console.log("====== RESEND DEBUG START ======");
		console.log("ENV TEST EMAIL:", process.env.RESEND_TEST_EMAIL);
		console.log("ORIGINAL DONOR EMAIL:", donor.email);

		const finalRecipient = process.env.RESEND_TEST_EMAIL 
			? process.env.RESEND_TEST_EMAIL 
			: donor.email;

		console.log("FINAL RESEND TO:", finalRecipient);

		lastResult = await resend.emails.send({
			from: "LifeLink <onboarding@resend.dev>",
			to: finalRecipient,
			subject: "🚨 Emergency Blood Alert",
			html: `
				<h2>Emergency Blood Alert</h2>

				<p>Donor Name: ${donor.name}</p>
				<p>Original Email: ${donor.email}</p>
				<p>Blood Group: ${donor.bloodGroup}</p>
				<p>Phone: ${donor.phone}</p>
				<p>Location: ${donor.location}</p>
			`
		});
	}

	return lastResult || { success: true, message: 'Processed successfully.' };
}
