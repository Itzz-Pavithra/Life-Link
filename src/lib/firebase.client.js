import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { env } from '$env/dynamic/public';

const firebaseConfig = {
	apiKey: env.PUBLIC_FIREBASE_API_KEY,
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN || `${env.PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID
};

export function getClientAuth() {
	if (!env.PUBLIC_FIREBASE_API_KEY || !env.PUBLIC_FIREBASE_PROJECT_ID) {
		console.warn('Firebase client environment variables PUBLIC_FIREBASE_API_KEY or PUBLIC_FIREBASE_PROJECT_ID are not set.');
		return null;
	}
	const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
	return getAuth(app);
}

export { GoogleAuthProvider, signInWithPopup };
