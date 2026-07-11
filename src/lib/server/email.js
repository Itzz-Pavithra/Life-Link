import dotenv from 'dotenv';
import { env as dynamicEnv } from '$env/dynamic/private';
import { database } from './db.js';
import nodemailer from 'nodemailer';

dotenv.config();

/**
 * Reusable email service using Gmail SMTP Nodemailer.
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Email body (HTML)
 * @param {string} [params.type] - Email type for logs
 */
export async function sendEmail({ to, subject, html, type = 'General' }) {
	const user = dynamicEnv.GMAIL_USER || process.env.GMAIL_USER;
	const pass = dynamicEnv.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

	if (!user || !pass) {
		throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD environment variables are not defined.');
	}

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: { user, pass }
	});

	let status = 'SUCCESS';
	let res;

	try {
		res = await transporter.sendMail({
			from: `"LifeLink" <${user}>`,
			to,
			subject,
			html
		});
	} catch (err) {
		status = `FAILED: ${err.message}`;
		throw err;
	} finally {
		console.log(`EMAIL TYPE: ${type}`);
		console.log(`RECEIVER: ${to}`);
		console.log(`STATUS: ${status}`);
	}

	return res;
}

/**
 * Sends a contact query email using Nodemailer.
 * @param {Object} params
 */
export async function sendContactEmail({ name, email: userEmail, subject, message }) {
	const emailSubject = `New LifeLink Contact Query - ${subject}`;
	const emailBody = `New user message received:\n\nName:\n${name}\n\nEmail:\n${userEmail}\n\nSubject:\n${subject}\n\nMessage:\n${message}\n\nSent from:\nLifeLink Contact Page`;

	const emailHtml = emailBody.replace(/\n/g, '<br/>');

	return await sendEmail({
		to: 'lifelinklifelink2@gmail.com',
		subject: emailSubject,
		html: `<div style="font-family: sans-serif; line-height: 1.6;">${emailHtml}</div>`,
		type: 'Contact Query'
	});
}

/**
 * Sends an emergency blood alert email using Nodemailer.
 * @param {Object} params
 */
export async function sendEmergencyBloodAlert({ donorEmails, bloodGroup, city, recipientName, contactPhone }) {
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
		lastResult = await sendEmail({
			to: donor.email,
			subject: "🚨 Emergency Blood Request Alert",
			html: `
				<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
					<h2 style="color: #b91c1c; margin-bottom: 20px;">🚨 Emergency Blood Request</h2>
					<p>Dear ${donor.name},</p>
					<p>An emergency blood request has been posted on LifeLink. Please respond quickly as a life is at stake!</p>
					
					<h3 style="color: #1e293b; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Request Details:</h3>
					<table style="width: 100%; text-align: left; font-size: 14px; border-collapse: collapse;">
						<tr>
							<th style="padding: 6px 0; color: #64748b; width: 180px;">Required Blood Group:</th>
							<td style="padding: 6px 0; color: #b91c1c; font-weight: bold;">${bloodGroup}</td>
						</tr>
						<tr>
							<th style="padding: 6px 0; color: #64748b;">Recipient Name:</th>
							<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${recipientName}</td>
						</tr>
						<tr>
							<th style="padding: 6px 0; color: #64748b;">Contact Number:</th>
							<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${contactPhone || 'Check dashboard'}</td>
						</tr>
						<tr>
							<th style="padding: 6px 0; color: #64748b;">Location:</th>
							<td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${city}</td>
						</tr>
					</table>
					
					<p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
						LifeLink Emergency matching system. Thank you for your fast action.
					</p>
				</div>
			`,
			type: 'Emergency Alert'
		});
	}

	return lastResult || { success: true, message: 'Processed successfully.' };
}

/**
 * Sends a password reset link using Nodemailer.
 * @param {Object} params
 */
export async function sendPasswordResetEmail({ to, name, resetLink }) {
	return await sendEmail({
		to,
		subject: "🔑 Reset Your LifeLink Password",
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
				<h2 style="color: #dc2626; margin-bottom: 20px; text-align: center;">LifeLink Password Reset ❤️</h2>
				<p>Hello <strong>${name}</strong>,</p>
				<p>We received a request to reset your password for your LifeLink account. Click the button below to choose a new password:</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="${resetLink}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 12px; display: inline-block;">Reset Password</a>
				</div>
				
				<p style="font-size: 13px; color: #6b7280;">If the button above does not work, copy and paste this URL into your browser:</p>
				<p style="font-size: 13px; word-break: break-all; color: #dc2626;"><a href="${resetLink}" style="color: #dc2626;">${resetLink}</a></p>
				
				<p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 30px;">
					This reset link is valid for 15 minutes and can only be used once. If you did not request a password reset, please ignore this email.
				</p>
				<p style="margin-top: 10px; font-weight: bold; color: #1e3a5f;">- LifeLink Team</p>
			</div>
		`,
		type: 'Password Reset'
	});
}

