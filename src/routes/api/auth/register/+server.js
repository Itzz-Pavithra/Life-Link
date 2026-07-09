import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
import { createUser, getUserByEmail } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { fullName, email, password, confirmPassword, phone, location, role, bloodGroup } = body;

		if (!fullName || !email || !password || !confirmPassword || !phone || !location || !role) {
			return json({ error: 'Missing required registration parameters.' }, { status: 400 });
		}

		if (password !== confirmPassword) {
			return json({ error: 'Passwords do not match.' }, { status: 400 });
		}

		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
		}
		if (!/[A-Z]/.test(password)) {
			return json({ error: 'Password must contain at least one uppercase letter (A-Z).' }, { status: 400 });
		}
		if (!/[a-z]/.test(password)) {
			return json({ error: 'Password must contain at least one lowercase letter (a-z).' }, { status: 400 });
		}
		if (!/[0-9]/.test(password)) {
			return json({ error: 'Password must contain at least one number (0-9).' }, { status: 400 });
		}
		if (!/[!@#$%^&*()_+\-=\[\]{}|;:\',.<>?\/~`]/.test(password)) {
			return json({ error: 'Password must contain at least one special character.' }, { status: 400 });
		}

		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return json({ error: 'An account already exists with this email. One email can only have one LifeLink role. Please delete your existing account before creating a new one.' }, { status: 400 });
		}

		// Block admin role creation
		if (role === 'admin') {
			return json({ error: 'Admin accounts cannot be created through registration.' }, { status: 403 });
		}

		// Verify clinical eligibility for donors
		if (role === 'donor') {
			const eligibilitySnap = await db.collection('eligibility_requests')
				.where('email', '==', email.toLowerCase())
				.where('status', '==', 'Approved')
				.limit(1)
				.get();
			if (eligibilitySnap.empty) {
				return json({ error: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.' }, { status: 400 });
			}
		}

		const newUser = await createUser({
			name: fullName,
			email: email.toLowerCase(),
			password,
			phone,
			location,
			role,
			bloodGroup,
			status: 'pending',
			emailVerified: false
		});

		// Generate secure verification OTP
		try {
			const { default: crypto } = await import('crypto');
			const { default: bcrypt } = await import('bcryptjs');
			const { sendEmail } = await import('$lib/server/email.js');

			const otp = crypto.randomInt(100000, 999999).toString();
			const hashedOtp = await bcrypt.hash(otp, 10);

			await db.collection('otp_verifications').doc(email.toLowerCase()).set({
				email: email.toLowerCase(),
				otp: hashedOtp,
				attempts: 0,
				expiresAt: Date.now() + 10 * 60 * 1000
			});

			await sendEmail({
				to: email.toLowerCase(),
				subject: 'LifeLink Email Verification OTP',
				html: `
					<div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
						<h2 style="color: #dc2626; margin-bottom: 20px; text-align: center;">Welcome to LifeLink ❤️</h2>
						<p>Hello ${fullName},</p>
						<p>Thank you for signing up. Please verify your email address to activate your account using the code below:</p>
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
		} catch (otpErr) {
			console.error('Initial verification OTP generation failed:', otpErr);
		}

		// Sync with Firebase Auth
		try {
			const { getAuth } = await import('firebase-admin/auth');
			await getAuth().createUser({
				uid: newUser.id,
				email: email.toLowerCase(),
				password: password,
				displayName: fullName
			});
		} catch (fbErr) {
			console.warn('Firebase Auth user sync during registration failed:', fbErr);
		}

		return json({ success: true, message: 'Registration completed successfully.' }, { status: 201 });
	} catch (err) {
		console.error('Registration failed:', err);
		return json({ error: err.message }, { status: 400 });
	}
}
