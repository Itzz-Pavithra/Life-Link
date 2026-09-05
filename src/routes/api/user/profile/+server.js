import { json } from '@sveltejs/kit';
import { getUserById } from '$lib/server/db.js';
import { updateDocument } from '$lib/server/firebase.js';
import { calculateDonorRecovery } from '$lib/server/recovery.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Access denied. No session token provided.' }, { status: 401 });
	}

	try {
		const user = await getUserById(locals.user.id);
		if (!user) {
			return json({ error: 'User profile not found.' }, { status: 404 });
		}

		const recovery = calculateDonorRecovery(user);

		return json({
			success: true,
			profile: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				location: user.location,
				address: user.address || '',
				gender: user.gender || 'male',
				lastDonationDate: user.lastDonationDate || null,
				isAvailable: user.isAvailable !== false,
				role: user.role,
				bloodGroup: user.bloodGroup,
				profileCompletion: user.profileCompletion,
				avatar: user.avatar,
				createdAt: user.createdAt,
				recovery
			}
		});
	} catch (err) {
		console.error('Error fetching user profile:', err);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Access denied. No session token provided.' }, { status: 401 });
	}

	try {
		const currentUser = await getUserById(locals.user.id);
		if (!currentUser) {
			return json({ error: 'User not found.' }, { status: 404 });
		}

		const { name, phone, location, address, gender, bloodGroup, isAvailable, avatar } = await request.json();

		const recovery = calculateDonorRecovery(currentUser);
		if (isAvailable === true && recovery.inRecovery) {
			return json({ error: `Cannot set availability to Available while in Recovery period (${recovery.daysRemaining} days remaining).` }, { status: 400 });
		}

		const updates = {};
		if (name !== undefined) updates.name = name;
		if (phone !== undefined) updates.phone = phone;
		if (location !== undefined) updates.location = location;
		if (address !== undefined) updates.address = address;
		if (gender !== undefined) updates.gender = gender;
		if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;
		if (isAvailable !== undefined) updates.isAvailable = isAvailable;
		if (avatar !== undefined) updates.avatar = avatar;

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No fields provided for update.' }, { status: 400 });
		}

		await updateDocument('users', locals.user.id, updates);

		return json({
			success: true,
			message: 'Profile updated successfully.'
		});
	} catch (err) {
		console.error('Error updating user profile:', err);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
}
