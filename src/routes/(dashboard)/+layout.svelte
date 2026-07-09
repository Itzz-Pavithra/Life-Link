<script>
	import { db } from '$lib/auth.svelte.js';
	import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children, data } = $props();
	let sidebarOpen = $state(false);

	$effect(() => {
		if (!db.authLoading) {
			if (!db.user) {
				goto('/login');
			} else {
				const path = window.location.pathname;
				const segments = path.split('/');
				const roleSegment = segments[2];
				if (!roleSegment) {
					goto(`/dashboard/${db.user.role}`);
				} else if (roleSegment !== db.user.role) {
					goto('/login');
				}
			}
		}
	});
</script>

<div class="flex bg-baby-pink min-h-screen relative">
	{#if !db.authLoading && db.user}
		<!-- Sidebar navigation -->
		<Sidebar data={{ user: db.user }} bind:sidebarOpen={sidebarOpen} />

		{#if sidebarOpen}
			<!-- Mobile drawer backdrop overlay -->
			<button
				class="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-30 md:hidden cursor-pointer w-full h-full border-none text-transparent"
				onclick={() => sidebarOpen = false}
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
						onclick={() => sidebarOpen = !sidebarOpen}
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
						<span class="text-[10px] text-gray-500 font-medium mt-1 block">Location: {db.user.location} (Active)</span>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<!-- Notifications Bell Indicator -->
					<div class="relative group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition">
						<span class="text-xl">🔔</span>
						<span class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-650 border border-white rounded-full animate-ping"></span>
						<span class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-650 rounded-full border border-white"></span>
					</div>

					<span class="h-6 w-[1px] bg-slate-200"></span>

					<!-- User Info Summary -->
					<div class="flex items-center gap-2.5">
						<img
							src={db.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
							alt="Profile Avatar"
							class="w-9 h-9 rounded-full border border-slate-200 object-cover"
						/>
						<div class="hidden sm:block text-left">
							<p class="text-xs font-bold text-slate-900 leading-none">{db.user.name}</p>
							<span class="text-[10px] text-red-700 font-bold uppercase tracking-widest mt-0.5 block">{db.user.role}</span>
						</div>
					</div>
				</div>
			</header>

			<!-- Dynamic children content -->
			<main class="flex-grow p-4 sm:p-8">
				{@render children()}
			</main>
		</div>
	{:else}
		<!-- Simple loading skeleton while redirecting -->
		<div class="flex-grow flex items-center justify-center min-h-screen w-full">
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="w-12 h-12 rounded-full border-4 border-red-200 border-t-red-700 animate-spin"></div>
				<p class="text-sm font-semibold text-slate-600">Verifying session context...</p>
			</div>
		</div>
	{/if}
</div>