import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail, getUserById } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		let idToken = null;
		try {
			const body = await request.json();
			idToken = body?.idToken;
		} catch (e) {
			// Body might not be JSON or empty, which is fine if we use cookie fallback
		}

		let user = null;
		let decodedToken = null;

		if (idToken) {
			// 1. Verify Firebase ID Token
			try {
				decodedToken = await getAuth().verifyIdToken(idToken);
				if (decodedToken && decodedToken.email) {
					const email = decodedToken.email.toLowerCase();
					// Fetch user from Firestore by Firebase UID first, fallback to email search
					const usersSnap = await db.collection('users')
						.where('uid', '==', decodedToken.uid)
						.limit(1)
						.get();
					if (!usersSnap.empty) {
						user = usersSnap.docs[0].data();
					}
					if (!user) {
						user = await getUserByEmail(email);
					}
				}
			} catch (fbErr) {
				console.warn('[LifeLink] Firebase ID Token verification failed in session endpoint:', fbErr.message);
			}
		}

		// 2. Fallback: Check lifelink_token cookie if firebase auth verification didn't resolve a user
		if (!user) {
			const cookieToken = cookies.get('lifelink_token');
			if (cookieToken) {
				try {
					const decoded = jwt.verify(cookieToken, JWT_SECRET);
					if (decoded && decoded.id) {
						user = await getUserById(decoded.id);
					}
				} catch (jwtErr) {
					console.warn('[LifeLink] Cookie token verification failed in session endpoint:', jwtErr.message);
				}
			}
		}

		// 3. Handle user resolution
		if (!user) {
			// No valid session/user found - clear invalid cookies
			cookies.delete('lifelink_token', { path: '/' });
			cookies.delete('lifelink_user', { path: '/' });
			return json({
				success: false,
				user: null
			});
		}

		if (user.status === 'suspended') {
			cookies.delete('lifelink_token', { path: '/' });
			cookies.delete('lifelink_user', { path: '/' });
			return json({
				success: false,
				error: 'This account has been suspended by the administrator.',
				user: null
			});
		}

		// Sync Firebase UID to user document if it was verified via Firebase and is different/missing
		if (decodedToken && (!user.uid || user.uid !== decodedToken.uid)) {
			await db.collection('users').doc(user.id).update({ uid: decodedToken.uid });
			user.uid = decodedToken.uid;
		}

		// Issue/re-issue JWT
		const token = jwt.sign(
			{
				id: user.id || user.uid,
				email: user.email,
				role: user.role,
				name: user.name,
				location: user.location || user.city || '',
				bloodGroup: user.bloodGroup || '',
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`,
				profileCompletion: user.profileCompletion || 50
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		// Set secure cookies
		cookies.set('lifelink_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 // 1 day
		});

		cookies.set('lifelink_user', JSON.stringify({
			id: user.id || user.uid,
			name: user.name,
			email: user.email,
			role: user.role,
			location: user.location || user.city || '',
			bloodGroup: user.bloodGroup || '',
			avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`,
			profileCompletion: user.profileCompletion || 50
		}), {
			path: '/',
			httpOnly: false,
			maxAge: 24 * 60 * 60 // 1 day
		});

		return json({
			success: true,
			user: {
				uid: user.uid || user.id,
				email: user.email,
				role: user.role,
				id: user.id || user.uid,
				name: user.name,
				location: user.location || user.city || '',
				bloodGroup: user.bloodGroup || '',
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`,
				profileCompletion: user.profileCompletion || 50
			}
		});

	} catch (error) {
		console.error("===== SESSION API ERROR =====", error);
		// Return JSON format and never let request hang or return 404
		return json({
			success: false,
			error: error.message,
			user: null
		});
	}
}
