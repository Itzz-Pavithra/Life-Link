import { json } from '@sveltejs/kit';
import { database, updateInventory, addBloodBank, editBloodBank, deleteBloodBank } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const bloodBanks = await database.getBloodBanks();
	return json(bloodBanks);
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const userEmail = locals.user.email;

		// Check if this is an inventory update
		if (body.bloodGroup !== undefined && body.units !== undefined) {
			const success = await updateInventory(body.bloodGroup, body.units, userEmail);
			const bloodBanks = await database.getBloodBanks();
			return json({ success, bloodBanks });
		}

		// Otherwise, it's a new Blood Bank creation (Admin only)
		if (locals.user.role !== 'admin') {
			return json({ success: false, error: 'Forbidden.' }, { status: 403 });
		}

		if (!body.name || !body.address || !body.phone || !body.email) {
			return json({ success: false, error: 'Missing required blood bank details.' }, { status: 400 });
		}

		const newBank = await addBloodBank(body, userEmail);
		const bloodBanks = await database.getBloodBanks();
		return json({ success: true, bloodBank: newBank, bloodBanks });
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
	// Edit Blood Bank (Admin only)
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { id, ...updates } = body;

		if (!id) {
			return json({ success: false, error: 'Missing blood bank ID.' }, { status: 400 });
		}

		const updatedBank = await editBloodBank(id, updates, locals.user.email);
		if (updatedBank) {
			const bloodBanks = await database.getBloodBanks();
			return json({ success: true, bloodBank: updatedBank, bloodBanks });
		} else {
			return json({ success: false, error: 'Blood bank not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
	// Delete Blood Bank (Admin only)
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ success: false, error: 'Unauthorized.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return json({ success: false, error: 'Missing blood bank ID.' }, { status: 400 });
		}

		const success = await deleteBloodBank(id, locals.user.email);
		if (success) {
			const bloodBanks = await database.getBloodBanks();
			return json({ success: true, bloodBanks });
		} else {
			return json({ success: false, error: 'Blood bank not found.' }, { status: 404 });
		}
	} catch (err) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
