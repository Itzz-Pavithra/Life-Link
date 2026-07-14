import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
import { getUserByEmail } from '$lib/server/db.js';
import { sendEmail } from '$lib/server/email.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return json({ error: 'Email parameter is required.' }, { status: 400 });
		}

		const lowercaseEmail = email.trim().toLowerCase();
		const user = await getUserByEmail(lowercaseEmail);
		if (!user) {
			return json({ error: 'Registration record not found.' }, { status: 404 });
		}

		if (user.emailVerified === true) {
			return json({ error: 'This email is already verified.' }, { status: 400 });
		}

		// Generate cryptographically secure 6-digit OTP
		const otp = crypto.randomInt(100000, 999999).toString();
		const hashedOtp = await bcrypt.hash(otp, 10);

		// Store/Overwrite OTP record in FireStore
		await db.collection('otp_verifications').doc(lowercaseEmail).set({
			email: lowercaseEmail,
			otp: hashedOtp,
			attempts: 0,
			expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes from now
		});

		// Send Email using unified SMTP service
		await sendEmail({
			to: lowercaseEmail,
			subject: 'LifeLink Email Verification OTP',
			html: `
				<div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
					<h2 style="color: #dc2626; margin-bottom: 20px; text-align: center;">Welcome to LifeLink</h2>
					<p>Hello ${user.name},</p>
					<p>Thank you for signing up. Please verify your email address to active your account using the code below:</p>
					<div style="text-align: center; margin: 30px 0;">
						<span style="font-size: 32px; font-weight: 800; color: #dc2626; letter-spacing: 4px; padding: 10px 20px; background-color: #fff5f6; border-radius: 12px; border: 1px solid #fee2e2;">${otp}</span>
					</div>
					<p style="font-size: 13px; color: #6b7280;">This OTP is valid for 10 minutes. Only 5 verification attempts are allowed.</p>
					<p style="font-size: 13px; color: #6b7280;">Verify your account to continue saving lives.</p>
					<br/>
					<p style="margin-top: 10px; font-weight: bold; color: #1e3a5f;">- LifeLink Team</p>
				</div>
			`,
			type: 'OTP Verification'
		});

		return json({ success: true, message: 'Verification OTP sent successfully.' });
	} catch (err) {
		console.error('Failed to send OTP:', err);
		return json({ error: err.message || 'Internal server error.' }, { status: 500 });
	}
}
