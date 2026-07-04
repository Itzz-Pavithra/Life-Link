import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
	cookies.delete('lifelink_token', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});
	cookies.delete('lifelink_user', {
		path: '/'
	});

	return json({ success: true, message: 'Logged out successfully.' });
}
