import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
import { getUserByEmail } from '$lib/server/db.js';
import bcrypt from 'bcryptjs';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { email, otp } = body;

		if (!email || !otp) {
			return json({ error: 'Email and OTP parameters are required.' }, { status: 400 });
		}

		const lowercaseEmail = email.trim().toLowerCase();
		const user = await getUserByEmail(lowercaseEmail);
		if (!user) {
			return json({ error: 'User registration details not found.' }, { status: 404 });
		}

		// Fetch the OTP verification document from database
		const otpDoc = await db.collection('otp_verifications').doc(lowercaseEmail).get();
		if (!otpDoc.exists) {
			return json({ error: 'No active OTP verification session found. Please request a new OTP.' }, { status: 400 });
		}

		const otpData = otpDoc.data();

		// Check expiration time (10 minutes)
		if (Date.now() > otpData.expiresAt) {
			await db.collection('otp_verifications').doc(lowercaseEmail).delete();
			return json({ error: 'Verification code has expired. Please request a new OTP.' }, { status: 400 });
		}

		// Compare input OTP to hashed OTP stored in database
		const matches = await bcrypt.compare(otp.trim(), otpData.otp);
		if (!matches) {
			const attempts = (otpData.attempts || 0) + 1;
			if (attempts >= 5) {
				// Delete OTP record on excessive failed attempts
				await db.collection('otp_verifications').doc(lowercaseEmail).delete();
				return json({ error: 'Too many incorrect attempts. This code has been invalidated. Please request a new OTP.' }, { status: 400 });
			} else {
				await db.collection('otp_verifications').doc(lowercaseEmail).update({ attempts });
				return json({ error: `Invalid verification code. Remaining attempts: ${5 - attempts}` }, { status: 400 });
			}
		}

		// Clear OTP verification session
		await db.collection('otp_verifications').doc(lowercaseEmail).delete();

		// Update user record: emailVerified = true, status = 'active'
		await db.collection('users').doc(user.id).update({
			emailVerified: true,
			status: 'active'
		});

		return json({ success: true, message: 'Email address verified successfully. You can now login.' });
	} catch (err) {
		console.error('OTP verification failed:', err);
		return json({ error: err.message || 'Internal server error during verification.' }, { status: 500 });
	}
}
