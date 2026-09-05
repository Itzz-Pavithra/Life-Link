import { database } from '$lib/server/db.js';
import { calculateDonorRecovery } from '$lib/server/recovery.js';
import { calculateHaversineDistance, resolveLocationCoordinates, getFuzzedDonorLocation } from '$lib/server/location.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		return {
			user: null,
			donors: [],
			bloodBanks: [],
			myRequests: [],
			chats: []
		};
	}

	const users = await database.getUsers();
	const bloodRequests = await database.getRequests();
	const bloodBanks = await database.getBloodBanks();
	const chats = await database.getChatsForUser(locals.user.email, locals.user.id);

	const recipientCoords = resolveLocationCoordinates(locals.user.location || locals.user.city || 'Salem');

	// Active donors (exclude suspended, unavailable, or donors currently in RECOVERY)
	const donors = users
		.filter(u => {
			if (u.role !== 'donor' || u.status === 'suspended') return false;
			const rec = calculateDonorRecovery(u);
			if (rec.inRecovery) return false;
			return true;
		})
		.map(donor => {
			const donorLoc = getFuzzedDonorLocation(donor);
			const dist = calculateHaversineDistance(recipientCoords.lat, recipientCoords.lng, donorLoc.lat, donorLoc.lng);
			return {
				...donor,
				distanceKm: dist != null ? dist : 3.5,
				approxArea: donorLoc.area
			};
		})
		.sort((a, b) => a.distanceKm - b.distanceKm);

	const myRequests = bloodRequests.filter(r => r.submittedBy === locals.user.email);

	const myRequestsWithResponses = await Promise.all(
		myRequests.map(async (req) => {
			const responses = await database.getRequestResponses(req.id);
			
			// Find all matching donors for this request (Compatible group, Verified, Available, NOT in recovery)
			const matchingDonors = users.filter(u => {
				if (u.role !== 'donor') return false;
				if (u.status === 'suspended') return false;
				if (u.isAvailable === false) return false;
				if (u.emailVerified === false) return false;
				if (u.bloodGroup !== req.bloodGroup) return false;
				const rec = calculateDonorRecovery(u);
				if (rec.inRecovery) return false;
				return true;
			});

			// Map matching donors to their responses or 'Waiting' status
			const donorResponses = matchingDonors.map(donor => {
				const resp = responses.find(r => r.donorId === donor.id);
				const donorLoc = getFuzzedDonorLocation(donor);
				const dist = calculateHaversineDistance(recipientCoords.lat, recipientCoords.lng, donorLoc.lat, donorLoc.lng);
				return {
					donorId: donor.id,
					donorName: donor.name,
					distanceKm: dist != null ? dist : 3.2,
					approxArea: donorLoc.area,
					status: resp ? resp.status : 'Waiting',
					respondedAt: resp ? (resp.respondedAt || resp.acceptedAt) : null,
					acceptedAt: resp ? resp.acceptedAt : null,
					donorDetails: (resp && resp.status === 'Accepted') ? {
						name: donor.name,
						bloodGroup: donor.bloodGroup,
						location: donor.location || '',
						phone: donor.phone || '',
						email: donor.email
					} : null
				};
			}).sort((a, b) => a.distanceKm - b.distanceKm);

			return {
				...req,
				donorResponses
			};
		})
	);

	return {
		user: locals.user,
		donors,
		bloodBanks,
		myRequests: myRequestsWithResponses,
		chats
	};
}
