import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './firebase.js';

// Password utility
export function hashPassword(password) {
	return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, stored) {
	if (!stored) return false;
	if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
		return bcrypt.compareSync(password, stored);
	}
	// Fallback to existing pbkdf2 format (salt:hash)
	if (!stored.includes(':')) return false;
	const [salt, hash] = stored.split(':');
	const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
	return hash === verifyHash;
}

// Database Helpers
export const database = {
	async getRequests() {
		try {
			const snap = await db.collection('blood_requests').orderBy('id', 'desc').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting requests:', err);
			return [];
		}
	},
	async getDonors() {
		try {
			const snap = await db.collection('users').where('role', '==', 'donor').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting donors:', err);
			return [];
		}
	},
	async getBloodBanks() {
		try {
			const snap = await db.collection('blood_banks').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting blood banks:', err);
			return [];
		}
	},
	async getSystemLogs() {
		try {
			const snap = await db.collection('logs').orderBy('id', 'desc').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting system logs:', err);
			return [];
		}
	},
	async getEligibilityRequests() {
		try {
			const snap = await db.collection('eligibility_requests').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting eligibility requests:', err);
			return [];
		}
	},
	async getUsers() {
		try {
			const snap = await db.collection('users').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting users:', err);
			return [];
		}
	},
	async getDonations() {
		try {
			const snap = await db.collection('donations').orderBy('id', 'desc').get();
			return snap.docs.map(doc => doc.data());
		} catch (err) {
			console.error('Error getting donations:', err);
			return [];
		}
	},

	// Generate statistics dynamically
	async getLandingData() {
		try {
			const activeDonorsCount = (await db.collection('users')
				.where('role', '==', 'donor')
				.where('status', '==', 'active')
				.get()).size;
			const resolvedRequestsCount = (await db.collection('blood_requests')
				.where('status', '==', 'Completed')
				.get()).size;
			const partnerBanksCount = (await db.collection('blood_banks').get()).size;
			const totalDonations = (await db.collection('donations').get()).size;

			return {
				steps: [
					{ step: '01', title: 'Eligibility Checker', desc: 'Prospective donors take our standard questionnaire.', icon: '📋' },
					{ step: '02', title: 'Admin Verification', desc: 'Administrators verify questionnaire answers securely.', icon: '🔍' },
					{ step: '03', title: 'Register & Match', desc: 'Eligible donors register and match with local patient requests.', icon: '⚡' },
					{ step: '04', title: 'Save Lives', desc: 'Donate blood, log history, and rescue patient emergencies.', icon: '🩸' }
				],
				benefits: [
					{ title: 'Zero Latency Matching', desc: 'Instantly coordinates compatibility matches for urgent blood requests.', icon: '⚡' },
					{ title: 'Strict Eligibility Rules', desc: 'Enforces clinical verification criteria for donor safety.', icon: '🛡️' },
					{ title: 'Hospital Inventory Alerts', desc: 'Monitors real-time blood bank units by group to prevent deficits.', icon: '📊' }
				],
				faqs: [
					{ q: 'Who can register as a blood donor on LifeLink?', a: 'Any user between 18 and 65 years old who passes our Eligibility Checker. Once approved by an Admin, you can register and receive emergency requests.' },
					{ q: 'Can receivers register directly?', a: 'Yes. Receivers requesting emergency blood do not require eligibility verification and can register, search blood banks, and submit requests immediately.' },
					{ q: 'Is there only one admin account?', a: 'Yes. LifeLink enforces role security. The initial admin is configured on the first login run and no further admin accounts can ever be created.' }
				],
				testimonials: [
					{ quote: "Our hospital required O+ units in minutes. The direct matching on LifeLink resolved our ticket with nearby donors faster than traditional phone channels.", author: "Dr. Anish Sharma", role: "Emergency Medical Officer" },
					{ quote: "Knowing my eligibility questionnaire was personally reviewed by the clinical team gave me confidence in LifeLink's standards. Highly professional.", author: "Meera Patel", role: "Approved Donor" }
				],
				stats: {
					activeDonors: activeDonorsCount,
					resolvedRequests: resolvedRequestsCount,
					partnerBanks: partnerBanksCount,
					totalDonations: totalDonations
				}
			};
		} catch (err) {
			console.error('Error generating landing data:', err);
			return {
				steps: [],
				benefits: [],
				faqs: [],
				testimonials: [],
				stats: { activeDonors: 0, resolvedRequests: 0, partnerBanks: 0, totalDonations: 0 }
			};
		}
	}
};

// Admin existence checks
export async function hasAdmin() {
	try {
		const snap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
		return !snap.empty;
	} catch (err) {
		console.error('Error in hasAdmin:', err);
		return false;
	}
}

// User Actions
export async function createUser(userData) {
	// Enforce Admin creation security rules
	if (userData.role === 'admin') {
		const adminExists = await hasAdmin();
		if (adminExists) {
			throw new Error('Admin account already exists.');
		}
	}

	// Prevent duplicates
	const existingUser = await getUserByEmail(userData.email);
	if (existingUser) {
		throw new Error('Email address is already registered.');
	}

	// If donor, check approved eligibility
	if (userData.role === 'donor') {
		const snapshot = await db.collection('eligibility_requests')
			.where('email', '==', userData.email.toLowerCase())
			.where('status', '==', 'Approved')
			.limit(1)
			.get();
		if (snapshot.empty) {
			throw new Error('You must submit the Eligibility Checker and receive Administrator Approval before registering as a donor.');
		}
	}

	const userId = `USR${Date.now()}`;
	const newUser = {
		id: userId,
		name: userData.name,
		email: userData.email.toLowerCase(),
		password: hashPassword(userData.password),
		phone: userData.phone,
		location: userData.location,
		role: userData.role, // 'admin', 'donor', 'receiver'
		status: 'active', // 'active', 'suspended'
		bloodGroup: userData.bloodGroup || '',
		avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
		profileCompletion: 100,
		createdAt: new Date().toISOString()
	};

	await db.collection('users').doc(userId).set(newUser);

	// Add log
	await addLog(newUser.email, `${newUser.role.toUpperCase()} User Registered: ${newUser.name}`);

	return newUser;
}

export async function getUserByEmail(email) {
	if (!email) return null;
	try {
		const snap = await db.collection('users')
			.where('email', '==', email.toLowerCase())
			.limit(1)
			.get();
		return snap.empty ? null : snap.docs[0].data();
	} catch (err) {
		console.error(`Error getUserByEmail for ${email}:`, err);
		return null;
	}
}

export async function getUserById(id) {
	if (!id) return null;
	try {
		const doc = await db.collection('users').doc(id).get();
		return doc.exists ? doc.data() : null;
	} catch (err) {
		console.error(`Error getUserById for ${id}:`, err);
		return null;
	}
}

export async function deleteUser(userId, operatorEmail) {
	const user = await getUserById(userId);
	if (!user) return false;

	if (user.role === 'admin') {
		throw new Error('Administrator account cannot be deleted.');
	}

	await db.collection('users').doc(userId).delete();

	await addLog(operatorEmail, `Deleted User: ${user.email} (${user.role})`);
	return true;
}

export async function suspendUser(userId, operatorEmail) {
	const userRef = db.collection('users').doc(userId);
	const userDoc = await userRef.get();
	if (!userDoc.exists) return false;

	const user = userDoc.data();
	if (user.role === 'admin') {
		throw new Error('Administrator account cannot be suspended.');
	}

	const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
	await userRef.update({ status: newStatus });

	await addLog(operatorEmail, `User status toggled to ${newStatus} for ${user.email}`);
	return { ...user, status: newStatus };
}

// Eligibility Questionnaire Actions
export async function submitEligibilityQuiz(email, name, phone, location, answers) {
	const lowercaseEmail = email.toLowerCase();
	const snapshot = await db.collection('eligibility_requests')
		.where('email', '==', lowercaseEmail)
		.limit(1)
		.get();

	if (!snapshot.empty) {
		const doc = snapshot.docs[0];
		const existing = doc.data();
		if (existing.status === 'Approved') {
			throw new Error('This email is already approved for blood donation.');
		} else if (existing.status === 'Pending') {
			throw new Error('You already have a pending eligibility submission. Please wait for admin verification.');
		} else {
			// If rejected, allow re-submission
			await doc.ref.update({
				status: 'Pending',
				answers,
				name,
				phone,
				location,
				submittedAt: new Date().toISOString()
			});
		}
	} else {
		const id = `ELG${Date.now()}`;
		const newRequest = {
			id,
			name,
			email: lowercaseEmail,
			phone,
			location,
			answers,
			status: 'Pending',
			submittedAt: new Date().toISOString()
		};
		await db.collection('eligibility_requests').doc(id).set(newRequest);
	}

	await addLog(lowercaseEmail, `Eligibility Questionnaire Submitted`);
	return true;
}

export async function reviewEligibility(requestId, status, reviewerEmail) {
	const ref = db.collection('eligibility_requests').doc(requestId);
	const doc = await ref.get();
	if (!doc.exists) return false;

	const req = doc.data();
	await ref.update({
		status,
		reviewedAt: new Date().toISOString()
	});

	await addLog(reviewerEmail, `Eligibility request for ${req.email} ${status.toUpperCase()}`);
	return true;
}

// Blood Request Actions
export async function addRequest(req, userEmail) {
	const newId = `REQ${Date.now().toString().slice(-6)}`;
	const newReq = {
		id: newId,
		patientName: req.patientName,
		bloodGroup: req.bloodGroup,
		units: Number(req.units),
		hospital: req.hospital,
		city: req.city,
		urgency: req.urgency || 'Normal',
		status: 'Pending', // Starts as Pending
		contact: req.contact,
		submittedBy: userEmail,
		date: new Date().toISOString().split('T')[0]
	};

	await db.collection('blood_requests').doc(newId).set(newReq);

	// Add log
	await addLog(userEmail, `Blood Request Submitted for ${req.patientName}`);
	return newReq;
}

export async function updateBloodRequestStatus(requestId, status, operatorEmail) {
	const ref = db.collection('blood_requests').doc(requestId);
	const doc = await ref.get();
	if (!doc.exists) return false;

	const req = doc.data();
	await ref.update({ status });

	await addLog(operatorEmail, `Request ${requestId} status updated to ${status}`);

	// If marked completed, automatically create a donation record
	if (status === 'Completed') {
		const newDonation = {
			id: `DON${Date.now().toString().slice(-6)}`,
			donorId: 'MATCHED_DONOR',
			donorName: 'Voluntary Donor',
			bloodGroup: req.bloodGroup,
			units: Number(req.units),
			hospital: req.hospital,
			date: new Date().toISOString().split('T')[0]
		};
		await db.collection('donations').doc(newDonation.id).set(newDonation);
	}

	return true;
}

// Blood Bank Actions
export async function addBloodBank(bank, operatorEmail) {
	const newId = `BNK${Date.now()}`;
	const newBank = {
		id: newId,
		name: bank.name,
		address: bank.address,
		phone: bank.phone,
		email: bank.email,
		inventory: bank.inventory || {
			'A+': 0, 'B+': 0, 'O+': 0, 'AB+': 0,
			'A-': 0, 'B-': 0, 'O-': 0, 'AB-': 0
		},
		workingHours: bank.workingHours || '9:00 AM - 5:00 PM',
		mapLink: bank.mapLink || ''
	};

	await db.collection('blood_banks').doc(newId).set(newBank);

	await addLog(operatorEmail, `Blood Bank Created: ${bank.name}`);
	return newBank;
}

export async function editBloodBank(id, updates, operatorEmail) {
	const ref = db.collection('blood_banks').doc(id);
	const doc = await ref.get();
	if (!doc.exists) return false;

	const bank = doc.data();
	const newBank = { ...bank, ...updates };
	await ref.set(newBank);

	await addLog(operatorEmail, `Blood Bank Updated: ${bank.name}`);
	return newBank;
}

export async function deleteBloodBank(id, operatorEmail) {
	const ref = db.collection('blood_banks').doc(id);
	const doc = await ref.get();
	if (!doc.exists) return false;

	const bank = doc.data();
	await ref.delete();

	await addLog(operatorEmail, `Blood Bank Deleted: ${bank.name}`);
	return true;
}

export async function updateInventory(bloodGroup, units, userEmail) {
	const snapshot = await db.collection('blood_banks').limit(1).get();
	if (snapshot.empty) return false;

	const doc = snapshot.docs[0];
	const bank = doc.data();
	
	if (bank.inventory[bloodGroup] !== undefined) {
		const newInventory = { ...bank.inventory };
		newInventory[bloodGroup] = Number(units);
		await doc.ref.update({ inventory: newInventory });

		await addLog(userEmail, `Inventory updated at ${bank.name}: ${bloodGroup} = ${units} Units`);
		return true;
	}
	return false;
}

// Log actions
export async function addLog(user, activity) {
	const newId = `LOG${Date.now()}`;
	const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
	await db.collection('logs').doc(newId).set({
		id: newId,
		user,
		activity,
		timestamp
	});
}

// Donation history manual logging
export async function addDonation(donation, operatorEmail) {
	const newId = `DON${Date.now().toString().slice(-6)}`;
	const newDonation = {
		id: newId,
		donorId: donation.donorId || 'MANUAL',
		donorName: donation.donorName,
		bloodGroup: donation.bloodGroup,
		units: Number(donation.units),
		hospital: donation.hospital,
		date: donation.date || new Date().toISOString().split('T')[0]
	};

	await db.collection('donations').doc(newId).set(newDonation);

	await addLog(operatorEmail, `Log Donation: ${donation.units} units of ${donation.bloodGroup} by ${donation.donorName}`);
	return newDonation;
}
