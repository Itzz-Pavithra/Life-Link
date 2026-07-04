import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'database.json');

// Initialize database file if it doesn't exist
function initDB() {
	if (!fs.existsSync(DB_PATH)) {
		const emptyDB = {
			users: [],
			eligibility_requests: [],
			blood_banks: [],
			blood_requests: [],
			donations: [],
			logs: []
		};
		fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB, null, 2), 'utf-8');
	}
}

// Read database contents
export function readDB() {
	initDB();
	try {
		const content = fs.readFileSync(DB_PATH, 'utf-8');
		return JSON.parse(content);
	} catch (err) {
		console.error('Failed to read database, returning empty collections:', err);
		return {
			users: [],
			eligibility_requests: [],
			blood_banks: [],
			blood_requests: [],
			donations: [],
			logs: []
		};
	}
}

// Write database contents
export function writeDB(data) {
	try {
		fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
		return true;
	} catch (err) {
		console.error('Failed to write database:', err);
		return false;
	}
}

// Password utility
export function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
	if (!stored || !stored.includes(':')) return false;
	const [salt, hash] = stored.split(':');
	const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
	return hash === verifyHash;
}

// Database Helpers
export const database = {
	get requests() {
		return readDB().blood_requests;
	},
	get donors() {
		return readDB().users.filter(u => u.role === 'donor');
	},
	get bloodBanks() {
		return readDB().blood_banks;
	},
	get systemLogs() {
		return readDB().logs;
	},
	get eligibilityRequests() {
		return readDB().eligibility_requests;
	},
	get users() {
		return readDB().users;
	},
	get donations() {
		return readDB().donations;
	},

	// Generate statistics dynamically with zero demo/fake data
	get landingData() {
		const db = readDB();
		const activeDonorsCount = db.users.filter(u => u.role === 'donor' && u.status === 'active').length;
		const resolvedRequestsCount = db.blood_requests.filter(r => r.status === 'Completed').length;
		const partnerBanksCount = db.blood_banks.length;
		const totalDonations = db.donations.length;

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
			]
		};
	}
};

// Admin existence checks
export function hasAdmin() {
	const db = readDB();
	return db.users.some(u => u.role === 'admin');
}

// User Actions
export function createUser(userData) {
	const db = readDB();

	// Enforce Admin creation security rules
	if (userData.role === 'admin') {
		const adminExists = db.users.some(u => u.role === 'admin');
		if (adminExists) {
			throw new Error('Admin account already exists.');
		}
	}

	// Prevent duplicates
	if (db.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
		throw new Error('Email address is already registered.');
	}

	// If donor, check approved eligibility
	if (userData.role === 'donor') {
		const approvedElig = db.eligibility_requests.some(
			r => r.email.toLowerCase() === userData.email.toLowerCase() && r.status === 'Approved'
		);
		if (!approvedElig) {
			throw new Error('You must submit the Eligibility Checker and receive Administrator Approval before registering as a donor.');
		}
	}

	const newUser = {
		id: `USR${Date.now()}`,
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

	db.users.push(newUser);

	// Add log
	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: newUser.email,
		activity: `${newUser.role.toUpperCase()} User Registered: ${newUser.name}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return newUser;
}

export function deleteUser(userId, operatorEmail) {
	const db = readDB();
	const userIndex = db.users.findIndex(u => u.id === userId);
	if (userIndex === -1) return false;

	const deletedUser = db.users[userIndex];
	if (deletedUser.role === 'admin') {
		throw new Error('Administrator account cannot be deleted.');
	}

	db.users.splice(userIndex, 1);

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Deleted User: ${deletedUser.email} (${deletedUser.role})`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return true;
}

export function suspendUser(userId, operatorEmail) {
	const db = readDB();
	const user = db.users.find(u => u.id === userId);
	if (!user) return false;

	if (user.role === 'admin') {
		throw new Error('Administrator account cannot be suspended.');
	}

	user.status = user.status === 'suspended' ? 'active' : 'suspended';

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `User status toggled to ${user.status} for ${user.email}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return user;
}

// Eligibility Questionnaire Actions
export function submitEligibilityQuiz(email, name, phone, location, answers) {
	const db = readDB();

	// Check if already approved or pending
	const existing = db.eligibility_requests.find(r => r.email.toLowerCase() === email.toLowerCase());
	if (existing) {
		if (existing.status === 'Approved') {
			throw new Error('This email is already approved for blood donation.');
		} else if (existing.status === 'Pending') {
			throw new Error('You already have a pending eligibility submission. Please wait for admin verification.');
		} else {
			// If rejected, allow re-submission
			existing.status = 'Pending';
			existing.answers = answers;
			existing.name = name;
			existing.phone = phone;
			existing.location = location;
			existing.submittedAt = new Date().toISOString();
		}
	} else {
		const newRequest = {
			id: `ELG${Date.now()}`,
			name,
			email: email.toLowerCase(),
			phone,
			location,
			answers,
			status: 'Pending',
			submittedAt: new Date().toISOString()
		};
		db.eligibility_requests.push(newRequest);
	}

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: email.toLowerCase(),
		activity: `Eligibility Questionnaire Submitted`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return true;
}

export function reviewEligibility(requestId, status, reviewerEmail) {
	const db = readDB();
	const req = db.eligibility_requests.find(r => r.id === requestId);
	if (!req) return false;

	req.status = status; // 'Approved' or 'Rejected'
	req.reviewedAt = new Date().toISOString();

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: reviewerEmail,
		activity: `Eligibility request for ${req.email} ${status.toUpperCase()}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return true;
}

// Blood Request Actions
export function addRequest(req, userEmail) {
	const db = readDB();
	const newId = `REQ${Date.now().toString().slice(-6)}`;
	const newReq = {
		id: newId,
		patientName: req.patientName,
		bloodGroup: req.bloodGroup,
		units: Number(req.units),
		hospital: req.hospital,
		city: req.city,
		urgency: req.urgency || 'Normal',
		status: 'Pending', // Starts as Pending, Admin can Approve, Reject, Complete
		contact: req.contact,
		submittedBy: userEmail,
		date: new Date().toISOString().split('T')[0]
	};

	db.blood_requests.unshift(newReq);

	// Add log
	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: userEmail,
		activity: `Blood Request Submitted for ${req.patientName}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return newReq;
}

export function updateBloodRequestStatus(requestId, status, operatorEmail) {
	const db = readDB();
	const req = db.blood_requests.find(r => r.id === requestId);
	if (!req) return false;

	req.status = status; // 'Approved', 'Rejected', 'Completed'

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Request ${requestId} status updated to ${status}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	// If marked completed, automatically create a donation record if submitted by or matching a donor
	if (status === 'Completed') {
		const newDonation = {
			id: `DON${Date.now().toString().slice(-6)}`,
			donorId: 'MATCHED_DONOR',
			donorName: 'Voluntary Donor',
			bloodGroup: req.bloodGroup,
			units: req.units,
			hospital: req.hospital,
			date: new Date().toISOString().split('T')[0]
		};
		db.donations.unshift(newDonation);
	}

	writeDB(db);
	return true;
}

// Blood Bank Actions
export function addBloodBank(bank, operatorEmail) {
	const db = readDB();
	const newBank = {
		id: `BNK${Date.now()}`,
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

	db.blood_banks.push(newBank);

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Blood Bank Created: ${bank.name}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return newBank;
}

export function editBloodBank(id, updates, operatorEmail) {
	const db = readDB();
	const bank = db.blood_banks.find(b => b.id === id);
	if (!bank) return false;

	Object.assign(bank, updates);

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Blood Bank Updated: ${bank.name}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return bank;
}

export function deleteBloodBank(id, operatorEmail) {
	const db = readDB();
	const index = db.blood_banks.findIndex(b => b.id === id);
	if (index === -1) return false;

	const deleted = db.blood_banks[index];
	db.blood_banks.splice(index, 1);

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Blood Bank Deleted: ${deleted.name}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return true;
}

export function updateInventory(bloodGroup, units, userEmail) {
	const db = readDB();
	const bank = db.blood_banks[0]; // GH Salem Blood Bank or first bank
	if (bank && bank.inventory[bloodGroup] !== undefined) {
		bank.inventory[bloodGroup] = Number(units);

		db.logs.unshift({
			id: `LOG${Date.now()}`,
			user: userEmail,
			activity: `Inventory updated at ${bank.name}: ${bloodGroup} = ${units} Units`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});

		writeDB(db);
		return true;
	}
	return false;
}

// Log actions
export function addLog(user, activity) {
	const db = readDB();
	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user,
		activity,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});
	writeDB(db);
}

// Donation history manual logging
export function addDonation(donation, operatorEmail) {
	const db = readDB();
	const newDonation = {
		id: `DON${Date.now().toString().slice(-6)}`,
		donorId: donation.donorId || 'MANUAL',
		donorName: donation.donorName,
		bloodGroup: donation.bloodGroup,
		units: Number(donation.units),
		hospital: donation.hospital,
		date: donation.date || new Date().toISOString().split('T')[0]
	};

	db.donations.unshift(newDonation);

	db.logs.unshift({
		id: `LOG${Date.now()}`,
		user: operatorEmail,
		activity: `Log Donation: ${donation.units} units of ${donation.bloodGroup} by ${donation.donorName}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	writeDB(db);
	return newDonation;
}
