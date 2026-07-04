import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './src/lib/server/firebase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';


// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
	'http://localhost:5173',
	'http://localhost:5174',
	'http://127.0.0.1:5173',
	'http://127.0.0.1:5174',
	'https://life-link-git-main-pavithra-s-projects1.vercel.app',
	'https://life-link-ashen-rho.vercel.app'
];

app.use(cors({
	origin: function (origin, callback) {
		if (!origin || allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Secure password comparison supporting both bcrypt and existing pbkdf2
function verifyPassword(password, stored) {
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

// Reusable JWT Authentication Middleware
function authenticateToken(req, res, next) {
	const token = req.cookies.lifelink_token;
	if (!token) {
		return res.status(401).json({ error: 'Access denied. No session token provided.' });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		res.clearCookie('lifelink_token');
		return res.status(401).json({ error: 'Session expired or invalid.' });
	}
}

// Role-based Access Control Middleware generator
function authorizeRoles(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
		}
		next();
	};
}

// System check: does any admin exist?
app.get('/api/auth/system-check', async (req, res) => {
	try {
		const snap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
		return res.status(200).json({ hasAdminAccount: !snap.empty });
	} catch (err) {
		console.error('System-check failed:', err);
		return res.status(500).json({ error: 'Database query failed.' });
	}
});

// Admin Setup / Initialization endpoint
app.post('/api/auth/createAdmin', async (req, res) => {
	try {
		const adminSnap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
		if (!adminSnap.empty) {
			return res.status(400).json({ error: 'System already initialized. Admin account exists.' });
		}

		const { name, email, phone, location, password } = req.body;
		if (!name || !email || !phone || !location || !password) {
			return res.status(400).json({ error: 'All fields are required.' });
		}

		const emailLower = email.toLowerCase();
		const userSnap = await db.collection('users').where('email', '==', emailLower).limit(1).get();
		if (!userSnap.empty) {
			return res.status(400).json({ error: 'Email address is already registered.' });
		}

		const hashedPassword = bcrypt.hashSync(password, 10);
		const userId = `USR${Date.now()}`;
		const newAdmin = {
			id: userId,
			name,
			email: emailLower,
			password: hashedPassword,
			phone,
			location,
			role: 'admin',
			status: 'active',
			bloodGroup: '',
			avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
			profileCompletion: 100,
			createdAt: new Date().toISOString()
		};

		await db.collection('users').doc(userId).set(newAdmin);

		const logId = `LOG${Date.now()}`;
		await db.collection('logs').doc(logId).set({
			id: logId,
			user: emailLower,
			activity: `ADMIN User Registered: ${name}`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});

		// Issue JWT
		const token = jwt.sign(
			{ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role, name: newAdmin.name },
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		res.cookie('lifelink_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 * 1000 // 1 day
		});

		return res.status(201).json({ success: true, user: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role } });
	} catch (err) {
		console.error('Create admin failed:', err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
});

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
	try {
		const { fullName, email, password, confirmPassword, phone, location, role, bloodGroup } = req.body;

		if (!fullName || !email || !password || !confirmPassword || !phone || !location || !role) {
			return res.status(400).json({ error: 'Missing required registration parameters.' });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: 'Passwords do not match.' });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
		}

		const emailLower = email.toLowerCase();
		const userSnap = await db.collection('users').where('email', '==', emailLower).limit(1).get();
		if (!userSnap.empty) {
			return res.status(400).json({ error: 'Email address is already registered.' });
		}

		// Verify clinical eligibility for donors
		if (role === 'donor') {
			const eligSnap = await db.collection('eligibility_requests')
				.where('email', '==', emailLower)
				.where('status', '==', 'Approved')
				.limit(1)
				.get();
			if (eligSnap.empty) {
				return res.status(400).json({ error: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.' });
			}
		}

		const hashedPassword = bcrypt.hashSync(password, 10);
		const userId = `USR${Date.now()}`;
		const newUser = {
			id: userId,
			name: fullName,
			email: emailLower,
			password: hashedPassword,
			phone,
			location,
			role,
			status: 'active',
			bloodGroup: bloodGroup || '',
			avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
			profileCompletion: 100,
			createdAt: new Date().toISOString()
		};

		await db.collection('users').doc(userId).set(newUser);

		const logId = `LOG${Date.now()}`;
		await db.collection('logs').doc(logId).set({
			id: logId,
			user: emailLower,
			activity: `${role.toUpperCase()} User Registered: ${fullName}`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});

		return res.status(201).json({ success: true, message: 'Registration completed successfully.' });
	} catch (err) {
		console.error('Registration failed:', err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
	try {
		const { email, password, role } = req.body;

		if (!email || !password || !role) {
			return res.status(400).json({ error: 'Email, Password, and Role are required.' });
		}

		const emailLower = email.toLowerCase();
		const userSnap = await db.collection('users').where('email', '==', emailLower).limit(1).get();
		if (userSnap.empty) {
			return res.status(400).json({ error: 'Invalid email or password.' });
		}

		const user = userSnap.docs[0].data();
		if (user.role !== role) {
			return res.status(400).json({ error: 'Selected role does not match this account.' });
		}

		if (user.status === 'suspended') {
			return res.status(400).json({ error: 'This account has been suspended by the administrator.' });
		}

		// Verify hashed password securely
		if (!verifyPassword(password, user.password)) {
			return res.status(400).json({ error: 'Invalid email or password.' });
		}

		// Issue JWT token with session details
		const token = jwt.sign(
			{ 
				id: user.id, 
				email: user.email, 
				role: user.role, 
				name: user.name, 
				location: user.location, 
				bloodGroup: user.bloodGroup,
				avatar: user.avatar,
				profileCompletion: user.profileCompletion
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		res.cookie('lifelink_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 * 1000 // 1 day
		});

		return res.status(200).json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				location: user.location,
				bloodGroup: user.bloodGroup
			}
		});
	} catch (err) {
		console.error('Login failed:', err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
	res.clearCookie('lifelink_token', {
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});
	return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// Current User Endpoint
app.get('/api/auth/me', authenticateToken, (req, res) => {
	return res.status(200).json({ success: true, user: req.user });
});

// Protected Profile Endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
	try {
		const userDoc = await db.collection('users').doc(req.user.id).get();
		if (!userDoc.exists) {
			return res.status(404).json({ error: 'User profile not found.' });
		}
		const user = userDoc.data();
		return res.status(200).json({
			success: true,
			profile: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				location: user.location,
				role: user.role,
				bloodGroup: user.bloodGroup,
				profileCompletion: user.profileCompletion,
				createdAt: user.createdAt
			}
		});
	} catch (err) {
		console.error('Fetch profile failed:', err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
	console.error('Unhandled exception:', err);
	res.status(500).json({ error: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
	console.log(`Express auth backend server running on port ${PORT}`);
});
