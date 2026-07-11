import { database } from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user || locals.user.role !== 'recipient') {
		return {
			user: null,
			donors: [],
			bloodBanks: []
		};
	}

	const users = await database.getUsers();
	const bloodRequests = await database.getRequests();
	const bloodBanks = await database.getBloodBanks();

	const myRequests = bloodRequests.filter(r => r.submittedBy === locals.user.email);

	const myRequestsWithResponses = await Promise.all(
		myRequests.map(async (req) => {
			const responses = await database.getRequestResponses(req.id);
			
			// Find all matching donors for this request
			const matchingDonors = users.filter(u => 
				u.role === 'donor' && 
				u.status === 'active' && 
				u.isAvailable !== false &&
				u.emailVerified === true &&
				u.bloodGroup === req.bloodGroup
			);

			// Map matching donors to their responses or 'Waiting' status
			const donorResponses = matchingDonors.map(donor => {
				const resp = responses.find(r => r.donorId === donor.id);
				return {
					donorId: donor.id,
					donorName: donor.name,
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
			});

			return {
				...req,
				donorResponses
			};
		})
	);

	return {
		user: locals.user,
		donors: users.filter(u => u.role === 'donor' && u.status === 'active'),
		bloodBanks,
		myRequests: myRequestsWithResponses
	};
}
