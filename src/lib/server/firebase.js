import { initializeApp, cert, getApps } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables in development
dotenv.config();

if (!getApps().length) {
	const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
	const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

	if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
		console.warn('WARNING: Missing one or more Firebase Admin environment variables.');
	}

	initializeApp({
		credential: cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: privateKey
		})
	});
}

export const db = getFirestore();

// Firestore Helper Functions

/**
 * Create or overwrite a document in a collection
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 */
export async function createDocument(collectionName, docId, data) {
	try {
		await db.collection(collectionName).doc(docId).set(data);
		return true;
	} catch (err) {
		console.error(`Error creating document in ${collectionName}/${docId}:`, err);
		throw err;
	}
}

/**
 * Get a document from a collection
 * @param {string} collectionName
 * @param {string} docId
 */
export async function getDocument(collectionName, docId) {
	try {
		const doc = await db.collection(collectionName).doc(docId).get();
		return doc.exists ? doc.data() : null;
	} catch (err) {
		console.error(`Error getting document ${collectionName}/${docId}:`, err);
		throw err;
	}
}

/**
 * Get all documents from a collection
 * @param {string} collectionName
 */
export async function getCollection(collectionName) {
	try {
		const snap = await db.collection(collectionName).get();
		return snap.docs.map(doc => doc.data());
	} catch (err) {
		console.error(`Error getting collection ${collectionName}:`, err);
		throw err;
	}
}

/**
 * Update dynamic fields in an existing document
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 */
export async function updateDocument(collectionName, docId, data) {
	try {
		await db.collection(collectionName).doc(docId).update(data);
		return true;
	} catch (err) {
		console.error(`Error updating document ${collectionName}/${docId}:`, err);
		throw err;
	}
}

/**
 * Delete a document from a collection
 * @param {string} collectionName
 * @param {string} docId
 */
export async function deleteDocument(collectionName, docId) {
	try {
		await db.collection(collectionName).doc(docId).delete();
		return true;
	} catch (err) {
		console.error(`Error deleting document ${collectionName}/${docId}:`, err);
		throw err;
	}
}
