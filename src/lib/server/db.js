import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
	db,
	createDocument,
	getDocument,
	getCollection,
	updateDocument,
	deleteDocument
} from './firebase.js';

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
			const reqs = await getCollection('blood_requests');
			// Sort descending by id
			return reqs.sort((a, b) => b.id.localeCompare(a.id));
		} catch (err) {
			console.error('Error getting requests:', err);
			return [];
		}
	},
	async getDonors() {
		try {
			const users = await getCollection('users');
			return users.filter(u => u.role === 'donor');
		} catch (err) {
			console.error('Error getting donors:', err);
			return [];
		}
	},
	async getBloodBanks() {
		try {
			return await getCollection('blood_banks');
		} catch (err) {
			console.error('Error getting blood banks:', err);
			return [];
		}
	},
	async getSystemLogs() {
		try {
			const logs = await getCollection('logs');
			// Sort descending by id
			return logs.sort((a, b) => b.id.localeCompare(a.id));
		} catch (err) {
			console.error('Error getting system logs:', err);
			return [];
		}
	},
	async getEligibilityRequests() {
		try {
			return await getCollection('eligibility_requests');
		} catch (err) {
			console.error('Error getting eligibility requests:', err);
			return [];
		}
	},
	async getUsers() {
		try {
			return await getCollection('users');
		} catch (err) {
			console.error('Error getting users:', err);
			return [];
		}
	},
	async getDonations() {
		try {
			const donations = await getCollection('donations');
			// Sort descending by id
			return donations.sort((a, b) => b.id.localeCompare(a.id));
		} catch (err) {
			console.error('Error getting donations:', err);
			return [];
		}
	},

	// Generate statistics dynamically
	async getLandingData() {
		try {
			const users = await getCollection('users');
			const activeDonorsCount = users.filter(u => u.role === 'donor' && u.status === 'active').length;

			const requests = await getCollection('blood_requests');
			const resolvedRequestsCount = requests.filter(r => r.status === 'Completed').length;

			const bloodBanks = await getCollection('blood_banks');
			const partnerBanksCount = bloodBanks.length;

			const donations = await getCollection('donations');
			const totalDonations = donations.length;

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
		const users = await getCollection('users');
		return users.some(u => u.role === 'admin');
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
		const eligReqs = await getCollection('eligibility_requests');
		const approvedElig = eligReqs.some(
			r => r.email.toLowerCase() === userData.email.toLowerCase() && r.status === 'Approved'
		);
		if (!approvedElig) {
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
		status: userData.status || 'active', // 'active', 'suspended', 'pending'
		emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : true,
		bloodGroup: userData.bloodGroup || '',
		avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
		profileCompletion: 100,
		createdAt: new Date().toISOString()
	};

	await createDocument('users', userId, newUser);

	// Add log
	await addLog(newUser.email, `${newUser.role.toUpperCase()} User Registered: ${newUser.name}`);

	return newUser;
}

export async function getUserByEmail(email) {
	if (!email) return null;
	try {
		const users = await getCollection('users');
		return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
	} catch (err) {
		console.error(`Error getUserByEmail for ${email}:`, err);
		return null;
	}
}

export async function getUserById(id) {
	if (!id) return null;
	try {
		return await getDocument('users', id);
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

	await deleteDocument('users', userId);

	await addLog(operatorEmail, `Deleted User: ${user.email} (${user.role})`);
	return true;
}

export async function suspendUser(userId, operatorEmail, reason = '') {
	const user = await getUserById(userId);
	if (!user) return false;

	if (user.role === 'admin') {
		throw new Error('Administrator account cannot be suspended.');
	}

	const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
	const updates = { status: newStatus };
	if (newStatus === 'suspended') {
		updates.suspensionReason = reason || 'No reason provided';
	} else {
		updates.suspensionReason = '';
	}

	await updateDocument('users', userId, updates);

	await addLog(operatorEmail, `User status toggled to ${newStatus} for ${user.email}`);
	return { ...user, ...updates };
}

// Eligibility Questionnaire Actions
export async function submitEligibilityQuiz(email, name, phone, location, bloodGroup, answers) {
	const lowercaseEmail = email.toLowerCase();
	const eligReqs = await getCollection('eligibility_requests');
	const existing = eligReqs.find(r => r.email.toLowerCase() === lowercaseEmail);
	const isEligible = answers.age >= 18 && answers.weight >= 45;
	const newStatus = isEligible ? 'Pending' : 'Rejected';

	if (existing) {
		if (existing.status === 'Approved') {
			throw new Error('This email is already approved for blood donation.');
		} else if (existing.status === 'Pending') {
			throw new Error('You already have a pending eligibility submission. Please wait for admin verification.');
		} else {
			// If rejected, allow re-submission
			await updateDocument('eligibility_requests', existing.id, {
				status: newStatus,
				answers,
				name,
				phone,
				location,
				bloodGroup: bloodGroup || 'O+',
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
			bloodGroup: bloodGroup || 'O+',
			answers,
			status: newStatus,
			submittedAt: new Date().toISOString()
		};
		await createDocument('eligibility_requests', id, newRequest);
	}

	await addLog(lowercaseEmail, `Eligibility Questionnaire Submitted`);
	return true;
}

export async function reviewEligibility(requestId, status, reviewerEmail) {
	const req = await getDocument('eligibility_requests', requestId);
	if (!req) return false;

	const formattedStatus = status === 'Approved' ? 'Approved' : 'Rejected';

	await updateDocument('eligibility_requests', requestId, {
		status: formattedStatus,
		eligibilityStatus: status.toLowerCase(),
		reviewedAt: new Date().toISOString()
	});

	// If the user already registered, update their user record as well
	const user = await getUserByEmail(req.email);
	if (user) {
		await updateDocument('users', user.id, {
			eligibilityStatus: status.toLowerCase()
		});
	}

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

	await createDocument('blood_requests', newId, newReq);

	// Add log
	await addLog(userEmail, `Blood Request Submitted for ${req.patientName}`);
	return newReq;
}

export async function updateBloodRequestStatus(requestId, status, operatorEmail) {
	const req = await getDocument('blood_requests', requestId);
	if (!req) return false;

	await updateDocument('blood_requests', requestId, { status });

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
		await createDocument('donations', newDonation.id, newDonation);
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

	await createDocument('blood_banks', newId, newBank);

	await addLog(operatorEmail, `Blood Bank Created: ${bank.name}`);
	return newBank;
}

export async function editBloodBank(id, updates, operatorEmail) {
	const bank = await getDocument('blood_banks', id);
	if (!bank) return false;

	const newBank = { ...bank, ...updates };
	await createDocument('blood_banks', id, newBank);

	await addLog(operatorEmail, `Blood Bank Updated: ${bank.name}`);
	return newBank;
}

export async function deleteBloodBank(id, operatorEmail) {
	const bank = await getDocument('blood_banks', id);
	if (!bank) return false;

	await deleteDocument('blood_banks', id);

	await addLog(operatorEmail, `Blood Bank Deleted: ${bank.name}`);
	return true;
}

export async function updateInventory(bloodGroup, units, userEmail) {
	const bloodBanks = await getCollection('blood_banks');
	if (bloodBanks.length === 0) return false;

	const bank = bloodBanks[0];
	
	if (bank.inventory[bloodGroup] !== undefined) {
		const newInventory = { ...bank.inventory };
		newInventory[bloodGroup] = Number(units);
		await updateDocument('blood_banks', bank.id, { inventory: newInventory });

		await addLog(userEmail, `Inventory updated at ${bank.name}: ${bloodGroup} = ${units} Units`);
		return true;
	}
	return false;
}

// Log actions
export async function addLog(user, activity) {
	const newId = `LOG${Date.now()}`;
	const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
	await createDocument('logs', newId, {
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

	await createDocument('donations', newId, newDonation);

	await addLog(operatorEmail, `Log Donation: ${donation.units} units of ${donation.bloodGroup} by ${donation.donorName}`);
	return newDonation;
}
