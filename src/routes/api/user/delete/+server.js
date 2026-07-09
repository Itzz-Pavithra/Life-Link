import { json } from '@sveltejs/kit';
import { db as firestoreDb } from '$lib/server/firebase.js';

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ locals, cookies }) {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
		}

		// Prevent admin account deletion through this endpoint
		if (user.role === 'admin') {
			return json({ error: 'Admin accounts cannot be deleted through the dashboard.' }, { status: 403 });
		}

		const uid = user.id || user.uid;
		const email = user.email;

		if (!uid) {
			return json({ error: 'User ID not found.' }, { status: 400 });
		}

		// 1. Delete user document from Firestore
		try {
			await firestoreDb.collection('users').doc(uid).delete();
		} catch (e) {
			console.warn('Failed to delete user document:', e.message);
		}

		// 2. Delete eligibility requests by email
		try {
			const eligSnap = await firestoreDb.collection('eligibility_requests')
				.where('email', '==', email)
				.get();
			const batch1 = firestoreDb.batch();
			eligSnap.docs.forEach(doc => batch1.delete(doc.ref));
			if (!eligSnap.empty) await batch1.commit();
		} catch (e) {
			console.warn('Failed to delete eligibility records:', e.message);
		}

		// 3. Delete blood requests by user email/uid
		try {
			const reqSnap = await firestoreDb.collection('blood_requests')
				.where('userEmail', '==', email)
				.get();
			const batch2 = firestoreDb.batch();
			reqSnap.docs.forEach(doc => batch2.delete(doc.ref));
			if (!reqSnap.empty) await batch2.commit();
		} catch (e) {
			console.warn('Failed to delete blood requests:', e.message);
		}

		// 4. Delete OTP verifications
		try {
			await firestoreDb.collection('otp_verifications').doc(email).delete();
		} catch (e) {
			console.warn('Failed to delete OTP record:', e.message);
		}

		// 5. Delete Firebase Auth account (server-side via admin SDK)
		try {
			const { getApps, initializeApp, cert } = await import('firebase-admin/app');
			const { getAuth } = await import('firebase-admin/auth');
			const { env } = await import('$env/dynamic/private');

			const projectId = process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
			const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_CLIENT_EMAIL;
			const privateKey = (process.env.FIREBASE_PRIVATE_KEY || env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

			if (!getApps().length && projectId && clientEmail && privateKey) {
				initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
			}
			await getAuth().deleteUser(uid);
		} catch (e) {
			console.warn('Firebase Auth delete failed (may already be deleted):', e.message);
		}

		// 6. Clear session cookies
		cookies.delete('lifelink_token', { path: '/' });
		cookies.delete('lifelink_user', { path: '/' });

		// 7. Log the deletion
		try {
			const logId = `LOG${Date.now()}`;
			await firestoreDb.collection('logs').doc(logId).set({
				id: logId,
				user: email,
				activity: `Account permanently deleted: ${email} (Role: ${user.role})`,
				timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
			});
		} catch (e) {
			// Non-critical
		}

		return json({ success: true, message: 'Your account has been permanently deleted.' });
	} catch (error) {
		console.error('Account deletion error:', error);
		return json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
	}
}
