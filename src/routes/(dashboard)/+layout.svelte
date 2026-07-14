<script>
	import { db } from "$lib/auth.svelte.js";
	import { goto } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth } from '$lib/firebase.client.js';
	import { signOut } from 'firebase/auth';
	import axios from 'axios';

	let { children, data } = $props();
	let sidebarOpen = $state(false);

	async function handleLogout(e) {
		if (e) e.preventDefault();
		try {
			await signOut(auth);
			const consent = localStorage.getItem('lifelink_cookie_consent');
			localStorage.clear();
			if (consent !== null) {
				localStorage.setItem('lifelink_cookie_consent', consent);
			}
			sessionStorage.clear();
			db.user = null;
			try {
				await axios.post('/api/auth/logout');
			} catch (err) {
				// Ignore
			}
			db.addToast('Logged out successfully.', 'info');
			window.location.href = '/';
		} catch (err) {
			db.addToast('Failed to logout. Please try again.', 'error');
		}
	}

	$effect(() => {
		// Only act when auth loading is fully complete
		if (db.authLoading) return;

		if (!db.user) {
			// No session — redirect to login
			goto("/login");
		} else {
			// Check the URL role segment matches the user's actual role
			if (typeof window !== 'undefined') {
				const path = window.location.pathname;
				const segments = path.split("/");
				// segments: ['', 'dashboard', 'donor|recipient|admin']
				const roleSegment = segments[2];
				if (!roleSegment) {
					goto(`/dashboard/${db.user.role}`);
				} else if (roleSegment !== db.user.role) {
					// Role mismatch — send to correct dashboard
					goto(`/dashboard/${db.user.role}`);
				}
			}
		}
	});
</script>

<div class="flex bg-baby-pink min-h-screen relative">
	{#if db.authLoading}
		<!-- Loading skeleton while session is being verified -->
		<div class="flex-grow flex items-center justify-center min-h-screen w-full">
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="w-12 h-12 rounded-full border-4 border-red-200 border-t-red-700 animate-spin"></div>
				<p class="text-sm font-semibold text-slate-600">Verifying session context...</p>
			</div>
		</div>
	{:else if db.user}
		<!-- Sidebar navigation -->
		<Sidebar data={{ user: db.user }} bind:sidebarOpen />

		{#if sidebarOpen}
			<!-- Mobile drawer backdrop overlay -->
			<button
				class="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-30 md:hidden cursor-pointer w-full h-full border-none text-transparent"
				onclick={() => (sidebarOpen = false)}
				aria-label="Close sidebar panel"
			>
				Close
			</button>
		{/if}

		<!-- Main content wrapper -->
		<div class="flex-grow flex flex-col min-h-screen overflow-x-hidden w-full">
			<!-- Header panel inside dashboard -->
			<header class="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
				<div class="flex items-center gap-3">
					<!-- Hamburger button (visible on mobile only) -->
					<button
						onclick={() => (sidebarOpen = !sidebarOpen)}
						class="md:hidden p-2 rounded-xl hover:bg-slate-50 text-slate-700 transition cursor-pointer"
						aria-expanded={sidebarOpen}
						aria-label="Toggle navigation drawer"
					>
						<span class="text-xl">☰</span>
					</button>

					<div>
						<h2 class="text-sm font-bold text-slate-800 uppercase tracking-widest leading-none">
							LifeLink Dashboard
						</h2>
						<span class="text-[10px] text-gray-500 font-medium mt-1 block"
							>Location: {db.user.location} (Active)</span
						>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<!-- User Info Summary -->
					<div class="flex items-center gap-2.5">
						<img
							src={db.user.avatar ||
								"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"}
							alt="Profile Avatar"
							class="w-9 h-9 rounded-full border border-slate-200 object-cover"
						/>
						<div class="hidden sm:block text-left">
							<p class="text-xs font-bold text-slate-900 leading-none">
								{db.user.name}
							</p>
							<span class="text-[10px] text-red-700 font-bold uppercase tracking-widest mt-0.5 block"
								>{db.user.role}</span
							>
						</div>
					</div>
					<!-- Logout Button -->
					<button
						onclick={handleLogout}
						class="px-4 py-2 border border-slate-200 hover:bg-rose-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-bold transition cursor-pointer"
					>
						Logout
					</button>
				</div>
			</header>

			<!-- Dynamic children content -->
			<main class="flex-grow p-4 sm:p-8">
				{@render children()}
			</main>
		</div>
	{:else}
		<!-- Auth resolved but no user — redirect will happen via $effect -->
		<div class="flex-grow flex items-center justify-center min-h-screen w-full">
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="w-12 h-12 rounded-full border-4 border-red-200 border-t-red-700 animate-spin"></div>
				<p class="text-sm font-semibold text-slate-600">Redirecting to login...</p>
			</div>
		</div>
	{/if}
</div>
