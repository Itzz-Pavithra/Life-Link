import { fail } from '@sveltejs/kit';
import { getUserByEmail } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';
import { sendPasswordResetEmail } from '$lib/server/email.js';
import crypto from 'crypto';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email) {
			return fail(400, { success: false, error: 'Email address is required.' });
		}

		const cleanEmail = String(email).trim().toLowerCase();

		try {
			// Verify if user exists in the database
			const user = await getUserByEmail(cleanEmail);
			if (!user) {
				return fail(400, { success: false, error: 'No account registered with this email address.' });
			}

			// Generate 32-byte secure token
			const token = crypto.randomBytes(32).toString('hex');
			const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

			// Save to password_resets collection in Firestore
			await db.collection('password_resets').doc(cleanEmail).set({
				email: cleanEmail,
				token: token,
				expiresAt: expiresAt
			});

			// Generate reset link: http://<domain>/reset-password?token=<token>&email=<email>
			const resetLink = `${url.origin}/reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

			// Send email using email service
			await sendPasswordResetEmail({
				to: cleanEmail,
				name: user.name,
				resetLink: resetLink
			});

			return { success: true, message: 'Password reset link has been sent to your email.' };
		} catch (err) {
			console.error('Forgot password error:', err);
			return fail(500, { success: false, error: 'An unexpected error occurred. Please try again.' });
		}
	}
};
