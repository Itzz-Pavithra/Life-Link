import { json } from '@sveltejs/kit';
import { createDocument } from '$lib/server/firebase.js';
import { sendContactEmail } from '$lib/server/email.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { name, email, subject, message } = body;

		// Validation: Name, email, subject, message required
		if (!name || !email || !subject || !message) {
			return json({ success: false, error: 'Name, email, subject, and message are required.' }, { status: 400 });
		}

		// Valid email required (regex check)
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ success: false, error: 'Valid email required.' }, { status: 400 });
		}

		// Firebase Log: Save contact queries in Firebase collection `contactMessages`
		const id = `MSG${Date.now()}`;
		const contactMessage = {
			name: name.trim(),
			email: email.trim().toLowerCase(),
			subject: subject.trim(),
			message: message.trim(),
			createdAt: new Date().toISOString()
		};

		// Write to firebase collection `contactMessages` using existing structure
		await createDocument('contactMessages', id, contactMessage);

		// Backend email dispatch via Nodemailer
		await sendContactEmail({
			name: contactMessage.name,
			email: contactMessage.email,
			subject: contactMessage.subject,
			message: contactMessage.message
		});

		return json({ success: true, message: 'Your message has been sent successfully.' });
	} catch (err) {
		console.error('Error handling contact form submission:', err);
		return json({ success: false, error: 'Unable to send message. Please try again.' }, { status: 500 });
	}
}
