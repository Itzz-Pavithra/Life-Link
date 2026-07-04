import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

console.log(`Firebase project id exists: ${!!process.env.FIREBASE_PROJECT_ID}`);
console.log(`Firebase email exists: ${!!process.env.FIREBASE_CLIENT_EMAIL}`);
console.log(`Firebase key exists: ${!!process.env.FIREBASE_PRIVATE_KEY}`);

const hasEnv = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
const isBuild = process.env.npm_lifecycle_event === 'build' || !!process.env.SVELTEKIT_FORK;

if (!isBuild || hasEnv) {
	if (
		!process.env.FIREBASE_PROJECT_ID ||
		!process.env.FIREBASE_CLIENT_EMAIL ||
		!process.env.FIREBASE_PRIVATE_KEY
	) {
		throw new Error('Missing Firebase environment variables');
	}

	const privateKey =
	process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

	if (!getApps().length) {
		initializeApp({
			credential: cert({
				projectId: process.env.FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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