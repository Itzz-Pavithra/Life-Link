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
		const finalRecipient = testEmail || donor.email;

		console.log("RESEND TEST EMAIL:", process.env.RESEND_TEST_EMAIL);
		console.log("FINAL EMAIL RECEIVER:", finalRecipient);

		const emailTemplate = `
			<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
				<h2 style="color: #b91c1c; margin-bottom: 20px;">🚨 Emergency Blood Request Alert</h2>
				<p>An emergency matching alert has been triggered on LifeLink.</p>
				
				<h3 style="color: #1e293b; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Matched Donor Details:</h3>
				<table style="width: 100%; text-align: left; font-size: 14px; border-collapse: collapse;">
					<tr>
						<th style="padding: 6px 0; color: #64748b; width: 160px;">Name:</th>
						<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${donor.name}</td>
					</tr>
					<tr>
						<th style="padding: 6px 0; color: #64748b;">Original Donor Email:</th>
						<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${donor.email}</td>
					</tr>
					<tr>
						<th style="padding: 6px 0; color: #64748b;">Blood Group:</th>
						<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${donor.bloodGroup || bloodGroup}</td>
					</tr>
					<tr>
						<th style="padding: 6px 0; color: #64748b;">Phone:</th>
						<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${donor.phone || 'N/A'}</td>
					</tr>
					<tr>
						<th style="padding: 6px 0; color: #64748b;">Location:</th>
						<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${donor.location || city}</td>
					</tr>
				</table>

				<h3 style="color: #1e293b; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Recipient Information:</h3>
				<table style="width: 100%; text-align: left; font-size: 14px; border-collapse: collapse;">
					<tr>
						<th style="padding: 6px 0; color: #64748b; width: 160px;">Patient Coordinator:</th>
						<td style="padding: 6px 0; color: #0f172a;">${recipientName}</td>
					</tr>
					<tr>
						<th style="padding: 6px 0; color: #64748b;">Coordinator Phone:</th>
						<td style="padding: 6px 0; color: #0f172a;">${contactPhone || 'N/A'}</td>
					</tr>
				</table>
				
				<p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
					LifeLink Emergency Dispatch System. Please check your recipient dashboard for more details.
				</p>
			</div>
		`;

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: "LifeLink <onboarding@resend.dev>",
				to: finalRecipient,
				subject: "🚨 Emergency Blood Request Alert",
				html: emailTemplate
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Resend Send Alert Failure Details]: Status ${response.status}`, errorText);
			throw new Error(`Resend email dispatch failed: Status ${response.status} - ${errorText}`);
		}

		lastResult = await response.json();
	}

	return lastResult || { success: true, message: 'Processed successfully.' };
}
