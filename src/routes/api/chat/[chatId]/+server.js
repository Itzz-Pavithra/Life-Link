import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	const { chatId } = params;

	try {
		const chat = await database.getChatById(chatId);
		if (!chat) {
			return json({ success: false, error: 'Chat session not found.' }, { status: 404 });
		}

		// Verify participant or admin
		const userEmail = locals.user.email.toLowerCase();
		const isParticipant =
			userEmail === (chat.recipientEmail || '').toLowerCase() ||
			userEmail === (chat.donorEmail || '').toLowerCase() ||
			locals.user.id === chat.donorId;

		const isAdmin = locals.user.role === 'admin';

		// Admins can view message content ONLY if reported or if moderation is required
		if (!isParticipant && (!isAdmin || !chat.reported)) {
			return json({ success: false, error: 'Forbidden. You do not have access to this conversation.' }, { status: 403 });
		}

		// Mark read for current participant
		if (isParticipant) {
			await database.markChatRead(chatId, locals.user.email);
		}

		const messages = await database.getChatMessages(chatId);

		return json({
			success: true,
			chat,
			messages
		});
	} catch (err) {
		console.error(`Error in GET /api/chat/${chatId}:`, err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	const { chatId } = params;

	try {
		const body = await request.json();
		const { action, reason } = body;

		const chat = await database.getChatById(chatId);
		if (!chat) {
			return json({ success: false, error: 'Chat session not found.' }, { status: 404 });
		}

		const userEmail = locals.user.email.toLowerCase();
		const isParticipant =
			userEmail === (chat.recipientEmail || '').toLowerCase() ||
			userEmail === (chat.donorEmail || '').toLowerCase() ||
			locals.user.id === chat.donorId;

		if (!isParticipant && locals.user.role !== 'admin') {
			return json({ success: false, error: 'Forbidden.' }, { status: 403 });
		}

		if (action === 'report') {
			await database.reportChat(chatId, reason, locals.user.email);
			return json({ success: true, message: 'Conversation reported to safety moderation team.' });
		} else if (action === 'read') {
			await database.markChatRead(chatId, locals.user.email);
			return json({ success: true });
		}

		return json({ success: false, error: 'Invalid action.' }, { status: 400 });
	} catch (err) {
		console.error(`Error in POST /api/chat/${chatId}:`, err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
