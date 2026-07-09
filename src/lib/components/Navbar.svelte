<script>
	import axios from 'axios';
	import { db } from '$lib/auth.svelte.js';
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
			localStorage.clear();
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
				{:else if db.user && !isPublicPage}
					<!-- Authenticated user INSIDE dashboard pages: show Dashboard link + Logout -->
					<a
						href="/dashboard/{db.user.role}"
						class="text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition"
					>
						💻 Dashboard
					</a>
					<button
						onclick={handleLogout}
						class="text-sm font-semibold text-gray-500 hover:text-red-650 transition cursor-pointer font-bold bg-transparent border-none text-slate-500 hover:text-red-650"
					>
						Logout
					</button>
				{:else if db.user && isPublicPage}
					<!-- Authenticated user on PUBLIC pages: just show Dashboard link, no Logout -->
					<a
						href="/dashboard/{db.user.role}"
						class="text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition"
					>
						💻 Dashboard
					</a>
				{:else}
					<!-- Not logged in: show Login + Register -->
					<a href="/login" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Login</a>
					<a
						href="/register"
						class="bg-red-700 hover:bg-red-850 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95"
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
				<span class="text-2xl" aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
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
		{:else if db.user && !isPublicPage}
			<!-- Authenticated user inside dashboard pages -->
			<a
				href="/dashboard/{db.user.role}"
				class="block text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-xl transition"
				onclick={() => mobileMenuOpen = false}
			>
				💻 Dashboard
			</a>
			<button
				onclick={(e) => { mobileMenuOpen = false; handleLogout(e); }}
				class="block w-full text-left text-sm font-semibold text-gray-500 hover:text-red-650 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition cursor-pointer"
			>
				Logout
			</button>
		{:else if db.user && isPublicPage}
			<!-- Authenticated user on public pages: just Dashboard link -->
			<a
				href="/dashboard/{db.user.role}"
				class="block text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-xl transition"
				onclick={() => mobileMenuOpen = false}
			>
				💻 Dashboard
			</a>
		{:else}
			<a
				href="/login"
				class="block text-sm font-semibold text-gray-700 hover:text-red-750 hover:bg-rose-50/50 px-3 py-2 rounded-xl transition"
				onclick={() => mobileMenuOpen = false}
			>Login</a>
			<a
				href="/register"
				class="block text-center bg-red-700 hover:bg-red-850 bg-red-700 hover:bg-red-800 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg transition active:scale-95"
				onclick={() => mobileMenuOpen = false}
			>
				Register
			</a>
		{/if}
	</div>
</nav>