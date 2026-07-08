<script>
	import { db } from '$lib/auth.svelte.js';
	import { auth } from '$lib/firebase.client.js';
	import { signOut } from 'firebase/auth';
	import axios from 'axios';

	let { data, sidebarOpen = $bindable(false) } = $props();

	axios.defaults.withCredentials = true;

	async function handleLogout(e) {
		if (e) e.preventDefault();
		try {
			await signOut(auth);
			localStorage.removeItem('lifelink_user');
			localStorage.removeItem('user');
			sessionStorage.clear();
			await axios.post('/api/auth/logout');
			db.addToast('Logged out successfully.', 'info');
			window.location.href = '/';
		} catch (err) {
			db.addToast('Failed to logout. Please try again.', 'error');
		}
	}

	// Define all sidebar items for each role
	const menuItems = {
		recipient: [
			{ id: 'dashboard', label: 'Dashboard', icon: '🏠' },
			{ id: 'request-blood', label: 'Request Blood', icon: '📝' },
			{ id: 'my-requests', label: 'My Requests', icon: '📋' },
			{ id: 'search-donors', label: 'Search Donors', icon: '🔍' },
			{ id: 'profile', label: 'Profile', icon: '👤' }
		],
		donor: [
			{ id: 'dashboard', label: 'Dashboard', icon: '🏠' },
			{ id: 'donation-history', label: 'Donation History', icon: '🕒' },
			{ id: 'availability', label: 'Availability', icon: '⚡' },
			{ id: 'profile', label: 'Profile', icon: '👤' }
		],
		admin: [
			{ id: 'dashboard', label: 'Overview', icon: '🏠' },
			{ id: 'users', label: 'All Users', icon: '👥' },
			{ id: 'donors', label: 'Donors List', icon: '🩸' },
			{ id: 'receivers', label: 'Receivers List', icon: '📋' },
			{ id: 'eligibility-requests', label: 'Eligibility Queue', icon: '🛡️' },
			{ id: 'blood-requests', label: 'Blood Requests', icon: '📋' },
			{ id: 'blood-banks', label: 'Blood Banks', icon: '🏥' },
			{ id: 'donation-history', label: 'Donation History', icon: '🕒' },
			{ id: 'reports', label: 'System Reports', icon: '📈' },
			{ id: 'settings', label: 'Settings', icon: '⚙️' }
		]
	};

	const activeRoleItems = $derived(data?.user ? menuItems[data.user.role] : []);
</script>

<aside
	class="fixed md:sticky top-0 left-0 h-screen w-68 bg-slate-900 border-r border-slate-800 text-slate-400 p-6 flex flex-col justify-between shrink-0 z-40 transition-transform duration-300
	{sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"
>
	<div class="space-y-6">
		<!-- Branding Header -->
		<div class="flex items-center justify-between">
			<a href="/" class="flex items-center gap-3 group">
				<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain group-hover:scale-105 transition" />
				<div class="flex flex-col">
					<span class="text-lg font-black text-white tracking-tight">LifeLink</span>
					<span class="text-[9px] text-red-500 font-bold uppercase tracking-widest leading-none mt-1">Donate Blood • Save Lives</span>
				</div>
			</a>
			<!-- Close button for mobile -->
			<button
				onclick={() => sidebarOpen = false}
				class="md:hidden text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
				aria-label="Close sidebar panel"
			>
				✕
			</button>
		</div>

		<!-- Navigation Menu -->
		<nav class="space-y-1 overflow-y-auto max-h-[70vh] pr-1">
			{#each activeRoleItems as item}
				<button
					class="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 text-left cursor-pointer
					{db.activeTab === item.id 
						? 'bg-red-700 text-white shadow-lg shadow-red-700/20 font-bold' 
						: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
					onclick={() => { db.activeTab = item.id; sidebarOpen = false; }}
				>
					<span class="text-base" aria-hidden="true">{item.icon}</span>
					<span>{item.label}</span>
				</button>
			{/each}
		</nav>
	</div>

	<!-- Logout Footer Button -->
	<div class="w-full pt-4">
		<button
			onclick={handleLogout}
			class="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:bg-red-950/20 hover:text-red-400 border border-slate-800 hover:border-red-950/40 transition cursor-pointer text-left"
		>
			<span aria-hidden="true">🚪</span>
			<span>Sign Out</span>
		</button>
	</div>
</aside>