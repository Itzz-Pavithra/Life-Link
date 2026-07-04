import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables in development
dotenv.config();

if (!admin.apps.length) {
	const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
	const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

	if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
		console.warn('WARNING: Missing one or more Firebase Admin environment variables.');
	}

	admin.initializeApp({
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: privateKey
		})
	});
}

export const db = admin.firestore();
