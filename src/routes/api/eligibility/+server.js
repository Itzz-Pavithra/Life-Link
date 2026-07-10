import { json } from '@sveltejs/kit';

export async function GET() {
	return json({ success: false, error: 'Endpoint deprecated.' }, { status: 410 });
}

export async function POST() {
	return json({ success: false, error: 'Endpoint deprecated.' }, { status: 410 });
}

export async function PUT() {
	return json({ success: false, error: 'Endpoint deprecated.' }, { status: 410 });
}
