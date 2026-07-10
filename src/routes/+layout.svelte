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

		let unsubscribe = () => {};

		async function verifySession() {
			try {
				if (!auth) {
					// No Firebase Auth client — fallback to manual session cookie
					await tryProfileFallback();
					return;
				}

				await new Promise((resolve, reject) => {
					let resolved = false;
					const unsubscribeAuth = onAuthStateChanged(
						auth,
						async (firebaseUser) => {
							if (resolved) return;
							resolved = true;
							try {
								if (firebaseUser) {
									const idToken = await firebaseUser.getIdToken(true);
									const res = await axios.post('/api/auth/session', { idToken });
									if (res.data && res.data.success && res.data.user) {
										setAuthenticatedUser({
											uid: firebaseUser.uid,
											email: firebaseUser.email,
											...res.data.user
										});
										await invalidateAll();
									} else {
										await tryProfileFallback();
									}
								} else {
									await tryProfileFallback();
								}
								resolve();
							} catch (err) {
								reject(err);
							}
						},
						(err) => {
							if (!resolved) {
								resolved = true;
								reject(err);
							}
						}
					);
					unsubscribe = unsubscribeAuth;
				});
			} catch (error) {
				console.error('[LifeLink] verifySession exception:', error);
				setAuthenticatedUser(null);
				clearLocalStorage();
				await silentLogout();
			} finally {
				clearTimeout(safetyTimer);
				db.authLoading = false;
			}
		}

		verifySession();

		return () => {
			clearTimeout(safetyTimer);
			unsubscribe();
		};
	});

	async function tryProfileFallback() {
		try {
			const res = await axios.get('/api/user/profile');
			if (res.data && res.data.success && res.data.profile) {
				// Valid manual login session via cookie
				setAuthenticatedUser(res.data.profile);
				await invalidateAll();
			} else {
				// No valid session at all
				setAuthenticatedUser(null);
				clearLocalStorage();
				await silentLogout();
			}
		} catch (err) {
			// 401 = no session cookie, that's fine for guests
			if (err.response?.status !== 401) {
				console.warn('[LifeLink] Profile fetch error:', err.message);
			}
			setAuthenticatedUser(null);
			clearLocalStorage();
			await silentLogout();
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
