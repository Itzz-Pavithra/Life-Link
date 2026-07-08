<script>
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AccessibilityPanel from '$lib/components/AccessibilityPanel.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/firebase.client.js';
	import { onAuthStateChanged } from 'firebase/auth';
	import { db } from '$lib/auth.svelte.js';
	import { onMount } from 'svelte';
	import axios from 'axios';

	let { children, data } = $props();

	axios.defaults.withCredentials = true;

	onMount(() => {
		db.authLoading = true;
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				try {
					const res = await axios.get('/api/user/profile');
					if (res.data && res.data.success && res.data.profile) {
						db.user = {
							uid: user.uid,
							email: user.email,
							...res.data.profile
						};
					} else {
						db.user = null;
					}
				} catch (err) {
					console.error("Error fetching profile on auth change:", err);
					db.user = null;
				}
			} else {
				db.user = null;
				// If guest, clear stale cookies if lifelink_user exists
				if (typeof document !== 'undefined' && document.cookie.includes('lifelink_user')) {
					try {
						await axios.post('/api/auth/logout');
					} catch (err) {
						// Ignore
					}
				}
			}
			db.authLoading = false;
		});
		return unsubscribe;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Navbar {data} />
<Toast />
<AccessibilityPanel />
<div class="flex flex-col min-h-screen">
	<main class="flex-grow">
		{@render children()}
	</main>
</div>
<Footer />
