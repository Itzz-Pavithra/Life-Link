<script>
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AccessibilityPanel from '$lib/components/AccessibilityPanel.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/firebase.client.js';
	import { onAuthStateChanged } from 'firebase/auth';
	import { db, setAuthenticatedUser } from '$lib/auth.svelte.js';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { invalidateAll } from '$app/navigation';

	let { children, data } = $props();

	axios.defaults.withCredentials = true;

	onMount(() => {
		db.authLoading = true;
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				try {
					const idToken = await firebaseUser.getIdToken();
					const res = await axios.post('/api/auth/session', { idToken });
					if (res.data && res.data.success && res.data.user) {
						setAuthenticatedUser({
							uid: firebaseUser.uid,
							email: firebaseUser.email,
							...res.data.user
						});
						await invalidateAll();
					} else {
						setAuthenticatedUser(null);
					}
				} catch (err) {
					console.error("Error restoring Google session:", err);
					setAuthenticatedUser(null);
				}
			} else {
				// No Firebase user logged in (might be a manual login user or guest)
				try {
					const res = await axios.get('/api/user/profile');
					if (res.data && res.data.success && res.data.profile) {
						setAuthenticatedUser(res.data.profile);
						await invalidateAll();
					} else {
						setAuthenticatedUser(null);
						if (typeof window !== 'undefined') {
							localStorage.clear();
							sessionStorage.clear();
						}
						try {
							await axios.post('/api/auth/logout');
						} catch (err) {
							// Ignore
						}
					}
				} catch (err) {
					setAuthenticatedUser(null);
					if (typeof window !== 'undefined') {
						localStorage.clear();
						sessionStorage.clear();
					}
					try {
						await axios.post('/api/auth/logout');
					} catch (err) {
						// Ignore
					}
				}
			}
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
