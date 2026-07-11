<script>
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AccessibilityPanel from '$lib/components/AccessibilityPanel.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
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

	// Initialize store synchronously (works for both SSR and client hydration)
	db.user = data.user || null;
	db.authLoading = false;

	// Keep store in sync reactively during client-side navigations
	$effect.pre(() => {
		db.user = data.user || null;
		db.authLoading = false;
	});

	onMount(() => {
		async function syncWithServerSession() {
			if (!data.user) {
				// No valid server session -> clear Firebase and local cache
				try {
					const { signOut } = await import('firebase/auth');
					if (auth) {
						await signOut(auth);
					}
				} catch (e) {
					// Ignore
				}
				clearLocalStorage();
				await silentLogout();
			}
		}
		syncWithServerSession();
	});

	function clearLocalStorage() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch (e) {
				// ignore
			}
		}
	}

	async function silentLogout() {
		try {
			await axios.post('/api/auth/logout');
		} catch (e) {
			// ignore — best effort
		}
	}
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
<CookieConsent />
