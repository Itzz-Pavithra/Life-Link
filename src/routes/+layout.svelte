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

	onMount(() => {
		db.authLoading = true;

		// Safety timeout: if auth never resolves in 8s, stop loading
		const safetyTimer = setTimeout(() => {
			if (db.authLoading) {
				console.warn('[LifeLink] Auth resolution timeout — clearing loading state.');
				setAuthenticatedUser(null);
			}
		}, 8000);

		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			try {
				if (firebaseUser) {
					// Firebase user signed in (Google or Firebase email/password)
					try {
						const idToken = await firebaseUser.getIdToken(true);
						const res = await axios.post('/api/auth/session', { idToken });
						if (res.data && res.data.success && res.data.user) {
							clearTimeout(safetyTimer);
							setAuthenticatedUser({
								uid: firebaseUser.uid,
								email: firebaseUser.email,
								...res.data.user
							});
							await invalidateAll();
						} else {
							// Session endpoint returned failure — try profile fallback (manual login)
							await tryProfileFallback(safetyTimer);
						}
					} catch (err) {
						console.warn('[LifeLink] Firebase session restore failed, trying profile fallback:', err.message);
						await tryProfileFallback(safetyTimer);
					}
				} else {
					// No Firebase user — check if manual login session exists via cookie
					await tryProfileFallback(safetyTimer);
				}
			} catch (err) {
				console.error('[LifeLink] Auth state change error:', err);
				clearTimeout(safetyTimer);
				setAuthenticatedUser(null);
				clearLocalStorage();
			}
		});

		return () => {
			clearTimeout(safetyTimer);
			unsubscribe();
		};
	});

	async function tryProfileFallback(safetyTimer) {
		try {
			const res = await axios.get('/api/user/profile');
			if (res.data && res.data.success && res.data.profile) {
				// Valid manual login session via cookie
				clearTimeout(safetyTimer);
				setAuthenticatedUser(res.data.profile);
				await invalidateAll();
			} else {
				// No valid session at all
				clearTimeout(safetyTimer);
				setAuthenticatedUser(null);
				clearLocalStorage();
				await silentLogout();
			}
		} catch (err) {
			// 401 = no session cookie, that's fine for guests
			if (err.response?.status !== 401) {
				console.warn('[LifeLink] Profile fetch error:', err.message);
			}
			clearTimeout(safetyTimer);
			setAuthenticatedUser(null);
			clearLocalStorage();
		}
	}

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
