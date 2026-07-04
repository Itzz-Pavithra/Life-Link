<script>
	import axios from 'axios';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();
	let mobileMenuOpen = $state(false);

	axios.defaults.withCredentials = true;

	async function handleLogout(e) {
		if (e) e.preventDefault();
		try {
			await axios.post('/api/auth/logout');
			db.addToast('Logged out successfully.', 'info');
			window.location.href = '/login';
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

				{#if data?.user}
					<a
						href="/dashboard/{data.user.role}"
						class="text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition"
					>
						💻 Dashboard
					</a>
					<button
						onclick={handleLogout}
						class="text-sm font-semibold text-gray-500 hover:text-red-650 transition cursor-pointer"
					>
						Logout
					</button>
				{:else}
					<a href="/login" class="text-sm font-semibold text-gray-700 hover:text-red-700 transition">Login</a>
					<a
						href="/register"
						class="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95"
					>
						Register
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-500"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
			>
				<span class="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
			</button>
		</div>
	</div>

	<!-- Mobile Menu Panel -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md py-4 px-6 space-y-3 shadow-inner">
			<a
				href="/"
				class="block text-sm font-semibold text-gray-700 hover:text-red-700 transition py-2"
				onclick={() => mobileMenuOpen = false}
			>Home</a>
			<a
				href="/about"
				class="block text-sm font-semibold text-gray-700 hover:text-red-700 transition py-2"
				onclick={() => mobileMenuOpen = false}
			>About</a>
			<a
				href="/eligibility"
				class="block text-sm font-semibold text-gray-700 hover:text-red-700 transition py-2"
				onclick={() => mobileMenuOpen = false}
			>Eligibility Checker</a>
			<a
				href="/contact"
				class="block text-sm font-semibold text-gray-700 hover:text-red-700 transition py-2"
				onclick={() => mobileMenuOpen = false}
			>Contact</a>
			
			<hr class="border-gray-150 my-2" />

			{#if data?.user}
				<a
					href="/dashboard/{data.user.role}"
					class="block text-sm font-bold text-red-700 bg-red-50 px-4 py-2.5 rounded-xl transition"
					onclick={() => mobileMenuOpen = false}
				>
					💻 Dashboard
				</a>
				<button
					onclick={(e) => { mobileMenuOpen = false; handleLogout(e); }}
					class="block w-full text-left text-sm font-semibold text-gray-500 hover:text-red-650 transition py-2 cursor-pointer"
				>
					Logout
				</button>
			{:else}
				<a
					href="/login"
					class="block text-sm font-semibold text-gray-700 hover:text-red-700 transition py-2"
					onclick={() => mobileMenuOpen = false}
				>Login</a>
				<a
					href="/register"
					class="block text-center bg-red-700 text-white text-sm font-bold py-3 rounded-xl transition"
					onclick={() => mobileMenuOpen = false}
				>
					Register
				</a>
			{/if}
		</div>
	{/if}
</nav>