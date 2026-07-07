import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading env files in order of priority from root
const rootDir = process.cwd();
const envPaths = [
	path.resolve(rootDir, '.env.development.local'),
	path.resolve(rootDir, '.env.local'),
	path.resolve(rootDir, '.env.development'),
	path.resolve(rootDir, '.env')
];

for (const p of envPaths) {
	if (fs.existsSync(p)) {
		dotenv.config({ path: p });
	}
}

// Access process.env
let projectId = process.env.FIREBASE_PROJECT_ID;
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATEKEY;

// Try SvelteKit virtual env module if process.env is empty
if (!projectId || !clientEmail || !rawPrivateKey) {
	try {
		const svelteEnv = await import('$env/dynamic/private');
		if (svelteEnv && svelteEnv.env) {
			projectId = projectId || svelteEnv.env.FIREBASE_PROJECT_ID;
			clientEmail = clientEmail || svelteEnv.env.FIREBASE_CLIENT_EMAIL;
			rawPrivateKey = rawPrivateKey || svelteEnv.env.FIREBASE_PRIVATE_KEY || svelteEnv.env.FIREBASE_PRIVATEKEY;
		}
	} catch (err) {
		// Not running in SvelteKit or virtual module not available (e.g. server.js)
	}
}

const hasProjectId = !!projectId;
const hasClientEmail = !!clientEmail;
const hasPrivateKey = !!rawPrivateKey;

console.log(`Firebase project id exists: ${hasProjectId}`);
console.log(`Firebase email exists: ${hasClientEmail}`);
console.log(`Firebase key exists: ${hasPrivateKey}`);

const hasEnv = hasProjectId && hasClientEmail && hasPrivateKey;
const isBuild = process.env.npm_lifecycle_event === 'build' || !!process.env.SVELTEKIT_FORK;

if (!isBuild || hasEnv) {
	const missing = [];
	if (!projectId) missing.push('FIREBASE_PROJECT_ID');
	if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
	if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');

	if (missing.length > 0) {
		throw new Error(`Missing ${missing.join(', ')}`);
	}

	const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || rawPrivateKey
		?.replace(/\\n/g, '\n')
		?.replace(/^"|"$/g, "");

	if (!getApps().length) {
		initializeApp({
			credential: cert({
				projectId,
				clientEmail,
				privateKey
			})
		});
	}
}

let dbInstance;
export const db = new Proxy({}, {
	get(target, prop) {
		if (!dbInstance) {
			dbInstance = getFirestore();
		}
		const val = dbInstance[prop];
		if (typeof val === 'function') {
			return val.bind(dbInstance);
		}
		return val;
	}
});


// CREATE
export async function createDocument(collection, id, data) {

	await db
	.collection(collection)
	.doc(id)
	.set(data);

	return true;

}


// READ ONE
export async function getDocument(collection, id) {

	const snap = await db
	.collection(collection)
	.doc(id)
	.get();


	return snap.exists 
		? { id: snap.id, ...snap.data() }
		: null;

}


// READ ALL
export async function getCollection(collection) {

	const snap = await db
	.collection(collection)
	.get();


	return snap.docs.map(doc => ({
		id: doc.id,
		...doc.data()
	}));

}


// UPDATE
export async function updateDocument(collection, id, data) {

	await db
	.collection(collection)
	.doc(id)
	.update(data);

	return true;

}


// DELETE
export async function deleteDocument(collection, id) {

	await db
	.collection(collection)
	.doc(id)
	.delete();

	return true;

}