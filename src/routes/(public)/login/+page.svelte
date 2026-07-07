<script>
	import axios from 'axios';
	import { db } from '$lib/auth.svelte.js';
	import { getClientAuth } from '$lib/firebase.client.js';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

	let showSetupPassword = $state(false);
	let showPassword = $state(false);

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

	async function handleGoogleSignIn() {
		errorMessage = '';
		try {
			const auth = getClientAuth();
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			if (!user.emailVerified) {
				db.addToast('Your Google account email is not verified.', 'error');
				errorMessage = 'Email address not verified by Google.';
				return;
			}

			const idToken = await user.getIdToken();
			
			db.addToast('Google verified. Syncing profile...', 'info');

			const res = await axios.post('/api/auth/google', {
				idToken,
				role: selectedRole
			});

			if (res.data.success) {
				db.addToast('Welcome! Logging you in...', 'success');
				window.location.href = `/dashboard/${res.data.user.role}`;
			}
		} catch (err) {
			console.error(err);
			errorMessage = err.response?.data?.error || err.message || 'Google Sign-In failed.';
			db.addToast(errorMessage, 'error');
		}
	}
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center p-6 relative">
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-450/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-lg space-y-8 relative z-10">
		
		{#if !data.hasAdminAccount}
			<!-- System Initialization Setup Screen (renders only if no admin is registered) -->
			<div class="text-center space-y-2">
				<div class="inline-flex items-center gap-2.5 mb-2">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
				</div>
				<h2 class="text-xl font-bold text-red-700">Initialize Admin Account</h2>
				<p class="text-slate-550 text-xs">No system administrator account detected. Setup the primary admin profile.</p>
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

				<div class="grid sm:grid-cols-2 gap-4">
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
					<div class="relative w-full">
						<input
							id="admin-pass"
							type={showSetupPassword ? "text" : "password"}
							bind:value={setupPassword}
							placeholder="••••••••"
							class="w-full border border-slate-200 p-3 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
							required
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => showSetupPassword = !showSetupPassword}
							aria-label={showSetupPassword ? "Hide password" : "Show password"}
						>
							{#if showSetupPassword}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
								</svg>
							{/if}
						</button>
					</div>
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
					<div class="relative w-full">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							bind:value={password}
							placeholder="••••••••"
							class="w-full border border-slate-200 p-3 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
							required
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => showPassword = !showPassword}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{#if showPassword}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
								</svg>
							{/if}
						</button>
					</div>
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

			<div class="relative flex py-2 items-center">
				<div class="flex-grow border-t border-slate-200"></div>
				<span class="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">Or</span>
				<div class="flex-grow border-t border-slate-200"></div>
			</div>

			<button
				type="button"
				onclick={handleGoogleSignIn}
				class="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer text-sm"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="#EA4335"
						d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.76 3.5-4.51 6.76-4.51z"
					/>
					<path
						fill="#4285F4"
						d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.69-4.92 3.69-8.54z"
					/>
					<path
						fill="#FBBC05"
						d="M5.24 14.54c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.39 6.97C.5 8.78 0 10.82 0 13s.5 4.22 1.39 6.03l3.85-2.99z"
					/>
					<path
						fill="#34A853"
						d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.11-3.96 1.11-3.26 0-5.84-2.15-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"
					/>
				</svg>
				Continue with Google
			</button>

			<div class="text-center text-xs text-slate-400">
				Don't have an account?
				<a href="/register" class="text-red-700 font-bold hover:underline ml-1">Create Account</a>
			</div>
		{/if}
	</div>
</div>