import { json } from '@sveltejs/kit';
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

function base64UrlEncode(str) {
	return Buffer.from(str)
		.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

function signJwt(payload, secret) {
	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	
	const signature = crypto
		.createHmac('sha256', secret)
		.update(`${encodedHeader}.${encodedPayload}`)
		.digest('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
		
	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		// Initialize Firebase Admin SDK
		let projectId = process.env.FIREBASE_PROJECT_ID;
		let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
		let privateKey = process.env.FIREBASE_PRIVATE_KEY;

		if (!projectId || !clientEmail || !privateKey) {
			try {
				const svelteEnv = await import('$env/dynamic/private');
				if (svelteEnv && svelteEnv.env) {
					projectId = projectId || svelteEnv.env.FIREBASE_PROJECT_ID;
					clientEmail = clientEmail || svelteEnv.env.FIREBASE_CLIENT_EMAIL;
					privateKey = privateKey || svelteEnv.env.FIREBASE_PRIVATE_KEY || svelteEnv.env.FIREBASE_PRIVATEKEY;
				}
			} catch (e) {
				// Ignore
			}
		}

		if (!getApps().length) {
			initializeApp({
				credential: cert({
					projectId: projectId,
					clientEmail: clientEmail,
					privateKey: (privateKey || '').replace(/\\n/g, "\n")
				})
			});
		}

		let body;
		try {
			body = await request.json();
		} catch (e) {
			body = {};
		}
		// Log request body
		console.log("GOOGLE AUTH - REQUEST BODY:", body);

		const { idToken, role } = body;

		if (!idToken) {
			return json({ success: false, error: 'Firebase ID Token is required.', message: 'Firebase ID Token is required.' }, { status: 400 });
		}

		// Verify Google ID token using Firebase Admin Auth only
		const decodedToken = await getAuth().verifyIdToken(idToken);

		// Log Firebase details
		console.log("GOOGLE AUTH - Firebase UID:", decodedToken.uid);
		console.log("GOOGLE AUTH - Email:", decodedToken.email);
		console.log("GOOGLE AUTH - Display Name:", decodedToken.name);
		console.log("GOOGLE AUTH - Role:", role);

		if (!decodedToken.email) {
			return json({ success: false, error: 'Google account email is missing.', message: 'Google account email is missing.' }, { status: 400 });
		}

		const email = decodedToken.email.toLowerCase();
		
		// Check existing user: check Firebase UID first, fallback to email.
		let user = null;
		
		// 1. Search by Firebase UID
		const usersSnap = await db.collection('users')
			.where('uid', '==', decodedToken.uid)
			.limit(1)
			.get();
		if (!usersSnap.empty) {
			user = usersSnap.docs[0].data();
		}
		
		// 2. Fallback: Search by Email
		if (!user && email) {
			user = await getUserByEmail(email);
		}

		if (user) {
			// Account exists, log user in (Do not overwrite any fields)
			if (user.status === 'suspended') {
				return json({ success: false, error: 'This account has been suspended by the administrator.', message: 'This account has been suspended by the administrator.' }, { status: 400 });
			}
			// Block role switching: same email cannot be used for a different role
			if (role && role !== user.role && user.role !== 'admin') {
				return json({
					success: false,
					error: `An account already exists with this email as a ${user.role}. One email can only have one LifeLink role. Please delete your existing account before creating a new one.`,
					message: `An account already exists with this email as a ${user.role}. One email can only have one LifeLink role. Please delete your existing account before creating a new one.`
				}, { status: 400 });
			}
		} else {
			// New user, create profile
			// Block admin creation via Google signup entirely
			const finalRole = role === 'admin' ? null : (role || 'recipient');
			if (!finalRole || (finalRole !== 'donor' && finalRole !== 'recipient')) {
				return json({ success: false, error: 'Invalid role selected. Only Donor or Recipient accounts can be created.', message: 'Invalid role selected. Only Donor or Recipient accounts can be created.' }, { status: 400 });
			}

			// Validate eligibility if registering as a donor
			if (finalRole === 'donor') {
				const eligibilitySnap = await db.collection('eligibility_requests')
					.where('email', '==', email)
					.where('status', '==', 'Approved')
					.limit(1)
					.get();
				if (eligibilitySnap.empty) {
					return json({ success: false, error: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.', message: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.' }, { status: 400 });
				}
			}

			const userId = decodedToken.uid;
			
			user = {
				id: userId,
				uid: decodedToken.uid,
				name: decodedToken.name || 'Google User',
				email: email,
				profileImage: decodedToken.picture || '',
				avatar: decodedToken.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(decodedToken.name || 'Google User')}`,
				authProvider: "google",
				role: finalRole,
				status: 'active',
				emailVerified: true,
				phone: '',
				city: '',
				location: '',
				bloodGroup: '',
				profileCompleted: false,
				profileCompletion: 50,
				isAvailable: finalRole === 'donor',
				createdAt: new Date().toISOString()
			};

			// Save profile to Firestore
			await db.collection('users').doc(userId).set(user);

			// Log user registration
			const logId = `LOG${Date.now()}`;
			await db.collection('logs').doc(logId).set({
				id: logId,
				user: email,
				activity: `${finalRole.toUpperCase()} User Registered via Google: ${user.name}`,
				timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
			});
		}

		// Handle missing/undefined fields safely in JWT and cookies
		// Sign session token using native signature helper
		const token = signJwt(
			{
				id: user.id || user.uid,
				email: user.email,
				role: user.role,
				name: user.name || 'Google User',
				location: user.location || user.city || '',
				bloodGroup: user.bloodGroup || '',
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Google User')}`,
				profileCompletion: user.profileCompletion || 50
			},
			JWT_SECRET
		);

		// Set cookies
		cookies.set('lifelink_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 // 1 day
		});

		cookies.set('lifelink_user', JSON.stringify({
			id: user.id || user.uid,
			name: user.name || 'Google User',
			email: user.email,
			role: user.role,
			location: user.location || user.city || '',
			bloodGroup: user.bloodGroup || '',
			avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Google User')}`,
			profileCompletion: user.profileCompletion || 50
		}), {
			path: '/',
			httpOnly: false,
			maxAge: 24 * 60 * 60 // 1 day
		});

		// Success response
		return json({
			success: true,
			user: {
				id: user.id || user.uid,
				uid: user.uid || user.id,
				name: user.name || 'Google User',
				email: user.email,
				role: user.role,
				location: user.location || user.city || '',
				city: user.city || user.location || '',
				bloodGroup: user.bloodGroup || '',
				phone: user.phone || '',
				profileCompleted: user.profileCompleted !== undefined ? user.profileCompleted : false,
				profileCompletion: user.profileCompletion || 50,
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Google User')}`,
				profileImage: user.profileImage || user.avatar || '',
				authProvider: user.authProvider || 'google',
				createdAt: user.createdAt
			}
		});
	} catch (error) {
		console.error("===== GOOGLE AUTH API ERROR =====");
		console.error("MESSAGE:", error.message);
		console.error("STACK:", error.stack);
		console.error("FULL ERROR:", error);
		
		return json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
}
