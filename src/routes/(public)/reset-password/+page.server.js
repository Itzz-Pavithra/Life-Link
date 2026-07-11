import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, hashPassword } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');

	if (!token || !email) {
		return { isValid: false, error: 'Missing reset parameters.' };
	}

	const cleanEmail = email.trim().toLowerCase();

	try {
		const resetDoc = await db.collection('password_resets').doc(cleanEmail).get();
		if (!resetDoc.exists) {
			return { isValid: false, error: 'The password reset link is invalid or has expired.' };
		}

		const resetData = resetDoc.data();
		if (resetData.token !== token) {
			return { isValid: false, error: 'The password reset link is invalid.' };
		}

		if (Date.now() > resetData.expiresAt) {
			// Clean up expired document
			await db.collection('password_resets').doc(cleanEmail).delete();
			return { isValid: false, error: 'The password reset link has expired.' };
		}

		return { isValid: true, email: cleanEmail, token };
	} catch (err) {
		console.error('Password reset load error:', err);
		return { isValid: false, error: 'Failed to validate reset link.' };
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const token = formData.get('token');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		if (!email || !token || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required.' });
		}

		const cleanEmail = String(email).trim().toLowerCase();
		const newPassword = String(password);
		const confirmPwd = String(confirmPassword);

		if (newPassword !== confirmPwd) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		// Validate password strength
		if (newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}
		if (!/[A-Z]/.test(newPassword)) {
			return fail(400, { error: 'Password must contain at least one uppercase letter (A-Z).' });
		}
		if (!/[a-z]/.test(newPassword)) {
			return fail(400, { error: 'Password must contain at least one lowercase letter (a-z).' });
		}
		if (!/[0-9]/.test(newPassword)) {
			return fail(400, { error: 'Password must contain at least one number (0-9).' });
		}
		if (!/[!@#$%^&*()_+\-=\[\]{}|;:\',.<>?\/~`]/.test(newPassword)) {
			return fail(400, { error: 'Password must contain at least one special character.' });
		}

		try {
			// Verify reset token is still valid
			const resetDoc = await db.collection('password_resets').doc(cleanEmail).get();
			if (!resetDoc.exists) {
				return fail(400, { error: 'Invalid or expired session.' });
			}

			const resetData = resetDoc.data();
			if (resetData.token !== token || Date.now() > resetData.expiresAt) {
				return fail(400, { error: 'Session has expired or token is invalid.' });
			}

			// Get user from Firestore
			const user = await getUserByEmail(cleanEmail);
			if (!user) {
				return fail(400, { error: 'Associated user account not found.' });
			}

			// Hash new password using standard bcrypt implementation in db.js
			const hashedPassword = hashPassword(newPassword);

			// Update in Firestore
			await db.collection('users').doc(user.id).update({
				password: hashedPassword
			});

			// Sync with Firebase Authentication if the user has been registered/synced there
			try {
				const { getAuth } = await import('firebase-admin/auth');
				await getAuth().updateUser(user.id, {
					password: newPassword
				});
			} catch (fbErr) {
				console.warn('Firebase Auth user password sync failed (may not be registered in Firebase Auth):', fbErr.message);
			}

			// Delete reset token
			await db.collection('password_resets').doc(cleanEmail).delete();

			return { success: true, message: 'Password has been successfully updated.' };
		} catch (err) {
			console.error('Password reset action error:', err);
			return fail(500, { error: err.message || 'Failed to update password.' });
		}
	}
};
