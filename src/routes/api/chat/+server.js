import { json } from '@sveltejs/kit';
import { database } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const chats = await database.getChatsForUser(locals.user.email, locals.user.id);
		return json({ success: true, chats });
	} catch (err) {
		console.error('Error in GET /api/chat:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { chatId, text } = body;

		if (!chatId || !text || !text.trim()) {
			return json({ success: false, error: 'Missing chatId or text.' }, { status: 400 });
		}

		const chat = await database.getChatById(chatId);
		if (!chat) {
			return json({ success: false, error: 'Chat session not found.' }, { status: 404 });
		}

		// Security Check: Verify that logged-in user is a participant
		const userEmail = locals.user.email.toLowerCase();
		const isParticipant =
			userEmail === (chat.recipientEmail || '').toLowerCase() ||
			userEmail === (chat.donorEmail || '').toLowerCase() ||
			locals.user.id === chat.donorId;

		if (!isParticipant) {
			return json({ success: false, error: 'Forbidden. You are not a participant in this conversation.' }, { status: 403 });
		}

		const message = await database.addChatMessage(chatId, {
			senderId: locals.user.id,
			senderEmail: locals.user.email,
			senderRole: locals.user.role,
			senderName: locals.user.name,
			text: text.trim()
		});

		// Trigger lightweight email notification to recipient/donor if offline
		try {
			const recipientEmail = isParticipant && userEmail === chat.donorEmail.toLowerCase() ? chat.recipientEmail : chat.donorEmail;
			const { sendEmail } = await import('$lib/server/email.js');
			await sendEmail({
				to: recipientEmail,
				subject: `LifeLink Chat: New Message regarding Blood Request #${chat.requestId}`,
				html: `
					<div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
						<h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">New Emergency Chat Message</h3>
						<p>Hello,</p>
						<p>You have received a new message from <strong>${locals.user.name}</strong> regarding emergency blood request for <strong>${chat.patientName}</strong> (${chat.bloodGroup}).</p>
						<p style="background-color: #fff5f6; padding: 12px; border-radius: 8px; font-style: italic; color: #475569;">
							"Log in to LifeLink to view and reply to this message."
						</p>
						<p>Please log in to your dashboard to continue the conversation.</p>
						<br/>
						<p style="font-weight: bold; color: #1e3a5f;">- LifeLink Team</p>
					</div>
				`,
				type: 'Emergency Chat Alert'
			});
		} catch (emailErr) {
			console.error('Email alert dispatch error:', emailErr);
		}

		return json({ success: true, message });
	} catch (err) {
		console.error('Error in POST /api/chat:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
