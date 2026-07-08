import { json } from '@sveltejs/kit';
import { db } from '$lib/server/firebase.js';
import { createUser, getUserByEmail } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { fullName, email, password, confirmPassword, phone, location, role, bloodGroup } = body;

		if (!fullName || !email || !password || !confirmPassword || !phone || !location || !role) {
			return json({ error: 'Missing required registration parameters.' }, { status: 400 });
		}

		if (password !== confirmPassword) {
			return json({ error: 'Passwords do not match.' }, { status: 400 });
		}

		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
		}
		if (!/[A-Z]/.test(password)) {
			return json({ error: 'Password must contain at least one uppercase letter (A-Z).' }, { status: 400 });
		}
		if (!/[a-z]/.test(password)) {
			return json({ error: 'Password must contain at least one lowercase letter (a-z).' }, { status: 400 });
		}
		if (!/[0-9]/.test(password)) {
			return json({ error: 'Password must contain at least one number (0-9).' }, { status: 400 });
		}
		if (!/[!@#$%^&*()_+\-=\[\]{}|;:\',.<>?\/~`]/.test(password)) {
			return json({ error: 'Password must contain at least one special character.' }, { status: 400 });
		}

		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return json({ error: 'Email address is already registered.' }, { status: 400 });
		}

		// Verify clinical eligibility for donors
		if (role === 'donor') {
			const eligibilitySnap = await db.collection('eligibility_requests')
				.where('email', '==', email.toLowerCase())
				.where('status', '==', 'Approved')
				.limit(1)
				.get();
			if (eligibilitySnap.empty) {
				return json({ error: 'You must submit the Eligibility Checker and receive Admin Approval before registering as a donor.' }, { status: 400 });
			}
		}

		await createUser({
			name: fullName,
			email: email.toLowerCase(),
			password,
			phone,
			location,
			role,
			bloodGroup
		});

		return json({ success: true, message: 'Registration completed successfully.' }, { status: 201 });
	} catch (err) {
		console.error('Registration failed:', err);
		return json({ error: err.message }, { status: 400 });
	}
}
