import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const body = await request.json();
		// TASK 2: Print request body
		console.log("GOOGLE AUTH - REQUEST BODY:", body);

		const { idToken, role } = body;

		if (!idToken) {
			return json({ error: 'Firebase ID Token is required.' }, { status: 400 });
		}

		// Verify Google ID token using Firebase Admin Auth
		const adminAuth = getAuth();
		const decodedToken = await adminAuth.verifyIdToken(idToken);

		// TASK 2: Print Firebase uid, email, displayName, role
		console.log("GOOGLE AUTH - Firebase UID:", decodedToken.uid);
		console.log("GOOGLE AUTH - Email:", decodedToken.email);
		console.log("GOOGLE AUTH - Display Name:", decodedToken.name || decodedToken.displayName);
		console.log("GOOGLE AUTH - Role:", role);

		if (!decodedToken.email_verified) {
			return json({ error: 'Google account email is not verified.' }, { status: 400 });
		}

		const email = decodedToken.email.toLowerCase();
		
		// TASK 6: Check existing user by uid/email.
		let user = await getUserByEmail(email);
		if (!user) {
			const usersSnap = await db.collection('users')
				.where('uid', '==', decodedToken.uid)
				.limit(1)
				.get();
			if (!usersSnap.empty) {
				user = usersSnap.docs[0].data();
			}
		}

		if (user) {
			// Account exists, log user in
			if (user.status === 'suspended') {
				return json({ error: 'This account has been suspended by the administrator.' }, { status: 400 });
			}
		} else {
			// New user, create profile
			if (!role) {
				return json({ error: 'Role selection is required for new Google sign-ups.' }, { status: 400 });
			}
			if (role !== 'donor' && role !== 'recipient') {
				return json({ error: 'Invalid role selected.' }, { status: 400 });
			}

			// Validate eligibility if registering as a donor
			if (role === 'donor') {
				const eligibilitySnap = await db.collection('eligibility_requests')
					.where('email', '==', email)
					.where('status', '==', 'Approved')
					.limit(1)
					.get();
				if (eligibilitySnap.empty) {
					return json({ error: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.' }, { status: 400 });
				}
			}

			const userId = decodedToken.uid;
			
			// TASK 3 & 4: Map user profile fields safely. Do not require password, bloodGroup, phone, city, hospitalCode.
			user = {
				id: userId,
				uid: decodedToken.uid,
				name: decodedToken.name || decodedToken.displayName || 'Google User',
				email: email,
				profileImage: decodedToken.picture || '',
				avatar: decodedToken.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(decodedToken.name || 'Google User')}`,
				authProvider: "google",
				role: role,
				status: 'active',
				location: 'Salem',
				phone: '',
				bloodGroup: '',
				profileCompletion: 50,
				createdAt: new Date().toISOString()
			};

			// Save profile to Firestore
			await db.collection('users').doc(userId).set(user);

			// Log user registration
			const logId = `LOG${Date.now()}`;
			await db.collection('logs').doc(logId).set({
				id: logId,
				user: email,
				activity: `${role.toUpperCase()} User Registered via Google: ${user.name}`,
				timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
			});
		}

		// TASK 3: Handle missing/undefined fields safely in JWT and cookies
		const token = jwt.sign(
			{
				id: user.id || user.uid,
				email: user.email,
				role: user.role,
				name: user.name || 'Google User',
				location: user.location || '',
				bloodGroup: user.bloodGroup || '',
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Google User')}`,
				profileCompletion: user.profileCompletion || 50
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
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
			location: user.location || '',
			bloodGroup: user.bloodGroup || '',
			avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Google User')}`,
			profileCompletion: user.profileCompletion || 50
		}), {
			path: '/',
			httpOnly: false,
			maxAge: 24 * 60 * 60 // 1 day
		});

		// TASK 7: Fix API response. Success format: { success: true, user: data }
		return json({
			success: true,
			user: {
				id: user.id || user.uid,
				name: user.name || 'Google User',
				email: user.email,
				role: user.role,
				location: user.location || '',
				bloodGroup: user.bloodGroup || ''
			}
		});
	} catch (err) {
		console.error("SERVER ERROR IN GOOGLE AUTH:", err);
		return json({ error: err.message || 'Verification of Google token failed.' }, { status: 500 });
	}
}
