import dotenv from 'dotenv';
import { env as dynamicEnv } from '$env/dynamic/private';
import { database } from './db.js';
import { Resend } from 'resend';

dotenv.config();

const emailWrapper = {
	send({ to, subject, html }) {
		const finalRecipient = process.env.RESEND_TEST_EMAIL || to;

		console.log("====== FINAL RESEND WRAPPER ======");
		console.log("ORIGINAL RECEIVER:", to);
		console.log("TEST EMAIL:", process.env.RESEND_TEST_EMAIL);
		console.log("ACTUAL RESEND TO:", finalRecipient);

		const resend = new Resend(dynamicEnv.EMAIL_RESEND || process.env.EMAIL_RESEND);
		return resend.emails.send({
			from: "LifeLink <onboarding@resend.dev>",
			to: finalRecipient,
			subject,
			html
		});
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
	const emailBody = `New user message received:\n\nName:\n${name}\n\nEmail:\n${userEmail}\n\nSubject:\n${subject}\n\nMessage:\n${message}\n\nSent from:\nLifeLink Contact Page`;

	const emailHtml = emailBody.replace(/\n/g, '<br/>');

	const response = await emailWrapper.send({
		to: 'lifelinklifelink2@gmail.com',
		subject: emailSubject,
		html: `<div style="font-family: sans-serif; line-height: 1.6;">${emailHtml}</div>`
	});

	return response;
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

	let lastResult = null;

	for (const donor of donorsToProcess) {
		console.log("====== RESEND DEBUG START ======");
		console.log("ENV TEST EMAIL:", process.env.RESEND_TEST_EMAIL);
		console.log("ORIGINAL DONOR EMAIL:", donor.email);

		const finalRecipient = process.env.RESEND_TEST_EMAIL 
			? process.env.RESEND_TEST_EMAIL 
			: donor.email;

		console.log("FINAL RESEND TO:", finalRecipient);

		lastResult = await emailWrapper.send({
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
