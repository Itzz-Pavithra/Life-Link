<script>
	import axios from 'axios';
	import { db } from '$lib/auth.svelte.js';
	import Icon from '$lib/components/Icon.svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/firebase.client.js';
	import { signOut } from 'firebase/auth';

	let { data } = $props();
	let mobileMenuOpen = $state(false);

	axios.defaults.withCredentials = true;

	const isPublicPage = $derived(['/', '/about', '/eligibility', '/contact'].includes($page.url.pathname));

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
</script>

<nav class="sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-300">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-20">
			<!-- Logo Branding -->
			<a href="/" class="flex items-center gap-3 group">
				<img
					src="/logo.png"
					alt="LifeLink Logo"
					class="h-12 w-12 object-contain group-hover:scale-105 transition-transform"
				/>
				<div class="flex flex-col">
					<span class="text-xl font-extrabold text-gray-900 tracking-tight leading-none">LifeLink</span>
					<span class="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Donate Blood • Save Lives</span>
				</div>
			</a>

			<!-- Desktop Nav Links -->
			<div class="hidden md:flex items-center gap-6">
				<a href="/" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Home</a>
				<a href="/about" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">About</a>
				<a href="/eligibility" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Eligibility Checker</a>
				<a href="/contact" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Contact</a>
				
				<span class="h-5 w-[1px] bg-gray-200"></span>

				{#if db.authLoading}
					<div class="w-5 h-5 border-2 border-red-200 border-t-red-700 rounded-full animate-spin" aria-label="Authenticating session"></div>
				{:else if db.user}
					<!-- Hidden after login -->
				{:else}
					<a href="/login" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Login</a>
					<a
						href="/register"
						class="bg-primary hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg transition transform active:scale-95"
					>
						Register
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden p-2.5 rounded-xl hover:bg-rose-50 hover:text-red-700 text-gray-500 transition cursor-pointer"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				aria-expanded={mobileMenuOpen}
				aria-controls="mobile-menu"
				aria-label="Toggle Navigation Menu"
			>
				<span class="flex items-center justify-center" aria-hidden="true">
					{#if mobileMenuOpen}
						<Icon name="x" class="w-6 h-6" />
					{:else}
						<Icon name="menu" class="w-6 h-6" />
					{/if}
				</span>
			</button>
		</div>
	</div>

	<!-- Mobile Menu Panel -->
	<div
		id="mobile-menu"
		class="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out overflow-hidden shadow-inner
		{mobileMenuOpen ? 'max-h-[500px] opacity-100 py-4 px-6 space-y-3' : 'max-h-0 opacity-0 py-0 px-6 space-y-0 border-t-0 pointer-events-none'}"
	>
		<a
			href="/"
			class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
			onclick={() => mobileMenuOpen = false}
		>Home</a>
		<a
			href="/about"
			class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
			onclick={() => mobileMenuOpen = false}
		>About</a>
		<a
			href="/eligibility"
			class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
			onclick={() => mobileMenuOpen = false}
		>Eligibility Checker</a>
		<a
			href="/contact"
			class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
			onclick={() => mobileMenuOpen = false}
		>Contact</a>
		
		<hr class="border-rose-100 my-2" />

		{#if db.authLoading}
			<div class="py-2 flex justify-center">
				<div class="w-5 h-5 border-2 border-red-200 border-t-red-700 rounded-full animate-spin" aria-label="Authenticating session"></div>
			</div>
		{:else if db.user}
			<!-- Hidden after login -->
		{:else}
			<a
				href="/login"
				class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
				onclick={() => mobileMenuOpen = false}
			>Login</a>
			<a
				href="/register"
				class="block text-center bg-primary hover:bg-red-700 text-white text-sm font-semibold py-3.5 rounded-xl shadow-lg transition active:scale-95"
				onclick={() => mobileMenuOpen = false}
			>
				Register
			</a>
		{/if}
	</div>
</nav>