<script>
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	// Define all sidebar items for each role
	const menuItems = {
		recipient: [
			{ id: 'dashboard', label: 'Dashboard', icon: '🏠' },
			{ id: 'request-blood', label: 'Request Blood', icon: '📝' },
			{ id: 'my-requests', label: 'My Requests', icon: '📋' },
			{ id: 'profile', label: 'Profile', icon: '👤' }
		],
		donor: [
			{ id: 'dashboard', label: 'Dashboard', icon: '🏠' },
			{ id: 'donation-history', label: 'Donation History', icon: '🕒' },
			{ id: 'availability', label: 'Availability', icon: '⚡' },
			{ id: 'profile', label: 'Profile', icon: '👤' }
		],
		admin: [
			{ id: 'dashboard', label: 'Dashboard', icon: '🏠' },
			{ id: 'users', label: 'Manage Users', icon: '👥' },
			{ id: 'blood-requests', label: 'Blood Requests', icon: '📋' },
			{ id: 'blood-banks', label: 'Blood Banks', icon: '🏥' },
			{ id: 'reports', label: 'Reports', icon: '📈' }
		]
	};

	const activeRoleItems = $derived(data?.user ? menuItems[data.user.role] : []);
</script>

<aside class="w-68 min-h-screen bg-slate-900 border-r border-slate-800 text-slate-400 p-6 flex flex-col justify-between shrink-0">
	<div class="space-y-8">
		<!-- Branding Header -->
		<a href="/" class="flex items-center gap-3 group">
			<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain group-hover:scale-105 transition" />
			<div class="flex flex-col">
				<span class="text-lg font-black text-white tracking-tight">LifeLink</span>
				<span class="text-[9px] text-red-500 font-bold uppercase tracking-widest leading-none mt-1">Donate Blood • Save Lives</span>
			</div>
		</a>

		<!-- Navigation Menu -->
		<nav class="space-y-1">
			{#each activeRoleItems as item}
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 text-left cursor-pointer
					{db.activeTab === item.id 
						? 'bg-red-700 text-white shadow-lg shadow-red-700/20 font-bold' 
						: 'hover:bg-slate-800 hover:text-slate-200'}"
					onclick={() => db.activeTab = item.id}
				>
					<span class="text-lg">{item.icon}</span>
					<span>{item.label}</span>
				</button>
			{/each}
		</nav>
	</div>

	<!-- Logout Footer Button -->
	<form action="/login?/logout" method="POST" class="w-full">
		<button
			type="submit"
			class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-950/20 hover:text-red-400 border border-slate-800 hover:border-red-950/40 transition cursor-pointer text-left"
		>
			<span>🚪</span>
			<span>Logout System</span>
		</button>
	</form>
</aside>