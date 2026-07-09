import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '$lib/server/db.js';
import { db } from '$lib/server/firebase.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const body = await request.json();
		const { idToken } = body;

		if (!idToken) {
			return json({ success: false, error: 'Firebase ID Token is required.' }, { status: 400 });
		}

		// Verify client-side Firebase ID token using firebase-admin Auth
		const decodedToken = await getAuth().verifyIdToken(idToken);

		if (!decodedToken.email) {
			return json({ success: false, error: 'Account email is missing.' }, { status: 400 });
		}

		const email = decodedToken.email.toLowerCase();

		// Fetch user from Firestore by Firebase UID first, fallback to email search
		let user = null;
		const usersSnap = await db.collection('users')
			.where('uid', '==', decodedToken.uid)
			.limit(1)
			.get();
		if (!usersSnap.empty) {
			user = usersSnap.docs[0].data();
		}

		if (!user && email) {
			user = await getUserByEmail(email);
		}

		if (!user) {
			return json({ success: false, error: 'User profile not found in database.' }, { status: 404 });
		}

		if (user.status === 'suspended') {
			return json({ success: false, error: 'This account has been suspended by the administrator.' }, { status: 400 });
		}

		// Sync Firebase UID to user document if not already set
		if (!user.uid || user.uid !== decodedToken.uid) {
			await db.collection('users').doc(user.id).update({ uid: decodedToken.uid });
			user.uid = decodedToken.uid;
		}

		// Issue JWT
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
				id: user.id || user.uid,
				uid: user.uid || user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				location: user.location || user.city || '',
				city: user.city || user.location || '',
				bloodGroup: user.bloodGroup || '',
				phone: user.phone || '',
				profileCompleted: user.profileCompleted !== undefined ? user.profileCompleted : false,
				profileCompletion: user.profileCompletion || 50,
				avatar: user.avatar || user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`,
				profileImage: user.profileImage || user.avatar || '',
				authProvider: user.authProvider || 'email',
				createdAt: user.createdAt
			}
		});
	} catch (error) {
		console.error("===== SESSION API ERROR =====", error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
