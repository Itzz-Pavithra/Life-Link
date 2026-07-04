<script>
	import axios from 'axios';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let selectedRole = $state('recipient'); // Default to receiver

	let setupName = $state('');
	let setupEmail = $state('');
	let setupPhone = $state('');
	let setupLocation = $state('');
	let setupPassword = $state('');

	let errorMessage = $state('');

	axios.defaults.withCredentials = true;

	async function handleLogin(e) {
		e.preventDefault();
		errorMessage = '';
		try {
			const res = await axios.post('/api/auth/login', {
				email,
				password,
				role: selectedRole
			});
			if (res.data.success) {
				db.addToast('Welcome back! Logging you in...', 'success');
				// Full navigation refresh so SvelteKit hooks parse the cookie
				window.location.href = `/dashboard/${res.data.user.role}`;
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || 'Failed to login. Please check details.';
			db.addToast(errorMessage, 'error');
		}
	}

	async function handleCreateAdmin(e) {
		e.preventDefault();
		errorMessage = '';
		try {
			const res = await axios.post('/api/auth/createAdmin', {
				name: setupName,
				email: setupEmail,
				phone: setupPhone,
				location: setupLocation,
				password: setupPassword
			});
			if (res.data.success) {
				db.addToast('System initialized! Welcome Admin.', 'success');
				window.location.href = '/dashboard/admin';
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || 'Failed to initialize system admin.';
			db.addToast(errorMessage, 'error');
		}
	}
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center p-6 relative">
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-450/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl w-full max-w-lg space-y-8 relative z-10">
		
		{#if !data.hasAdminAccount}
			<!-- System Initialization Setup Screen (renders only if no admin is registered) -->
			<div class="text-center space-y-2">
				<div class="inline-flex items-center gap-2.5 mb-2">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
				</div>
				<h2 class="text-xl font-bold text-red-700">Initialize Admin Account</h2>
				<p class="text-slate-500 text-xs">No system administrator account detected. Setup the primary admin profile.</p>
			</div>

			{#if errorMessage}
				<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
					⚠️ {errorMessage}
				</div>
			{/if}

			<form onsubmit={handleCreateAdmin} class="space-y-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-name">Admin Name *</label>
					<input
						id="admin-name"
						type="text"
						bind:value={setupName}
						placeholder="Administrator Name"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-email">Admin Email *</label>
					<input
						id="admin-email"
						type="email"
						bind:value={setupEmail}
						placeholder="admin@lifelink.org"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-phone">Phone *</label>
						<input
							id="admin-phone"
							type="tel"
							bind:value={setupPhone}
							placeholder="9876543210"
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-loc">Location *</label>
						<input
							id="admin-loc"
							type="text"
							bind:value={setupLocation}
							placeholder="Salem"
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-pass">Choose Password *</label>
					<input
						id="admin-pass"
						type="password"
						bind:value={setupPassword}
						placeholder="••••••••"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
				>
					Initialize System Node
				</button>
			</form>
		{:else}
			<!-- Standard Login Screen -->
			<div class="text-center space-y-2">
				<a href="/" class="inline-flex items-center gap-2.5 mb-2">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
				</a>
				<h2 class="text-xl font-bold text-slate-800">Welcome Back</h2>
				<p class="text-slate-400 text-xs">Enter your details to sign in to your dashboard.</p>
			</div>

			{#if errorMessage}
				<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
					⚠️ {errorMessage}
				</div>
			{/if}

			<form onsubmit={handleLogin} class="space-y-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="email">Email Address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="name@example.com"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="role-select">Dashboard Role</label>
					<select
						id="role-select"
						bind:value={selectedRole}
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="recipient">Recipient / Patient / Receiver</option>
						<option value="donor">Blood Donor</option>
						<option value="admin">System Admin</option>
					</select>
				</div>

				<button
					type="submit"
					class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
				>
					Sign In
				</button>
			</form>

			<div class="text-center text-xs text-slate-400">
				Don't have an account?
				<a href="/register" class="text-red-700 font-bold hover:underline ml-1">Create Account</a>
			</div>
		{/if}
	</div>
</div>