<script>
	import axios from 'axios';
	import { db, setAuthenticatedUser } from '$lib/auth.svelte.js';
	import { auth } from '$lib/firebase.client.js';
	import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
	import { onMount } from 'svelte';
	import BloodWaveBackground from '$lib/components/BloodWaveBackground.svelte';
	import Icon from '$lib/components/Icon.svelte';

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

	let setupPasswordError = $derived(
		setupPassword
			? setupPassword.length < 8
				? 'Password must be at least 8 characters long.'
				: !/[A-Z]/.test(setupPassword)
				? 'Password must contain at least one uppercase letter (A-Z).'
				: !/[a-z]/.test(setupPassword)
				? 'Password must contain at least one lowercase letter (a-z).'
				: !/[0-9]/.test(setupPassword)
				? 'Password must contain at least one number (0-9).'
				: !/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/~`]/.test(setupPassword)
				? 'Password must contain at least one special character.'
				: ''
			: ''
	);

	function generateStrongPassword() {
		const length = 12;
		const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const lowercase = "abcdefghijklmnopqrstuvwxyz";
		const numbers = "0123456789";
		const specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";
		
		let pwd = [];
		pwd.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
		pwd.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
		pwd.push(numbers[Math.floor(Math.random() * numbers.length)]);
		pwd.push(specials[Math.floor(Math.random() * specials.length)]);
		
		const allChars = uppercase + lowercase + numbers + specials;
		for (let i = 4; i < length; i++) {
			pwd.push(allChars[Math.floor(Math.random() * allChars.length)]);
		}
		
		for (let i = pwd.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pwd[i], pwd[j]] = [pwd[j], pwd[i]];
		}
		
		return pwd.join('');
	}

	function suggestSetupPassword() {
		const gen = generateStrongPassword();
		setupPassword = gen;
		showSetupPassword = true;
		db.addToast('Generated and applied a strong password!', 'success');
	}

	function validatePassword(pwd) {
		if (pwd.length < 8) return "Password must be at least 8 characters long.";
		if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter (A-Z).";
		if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter (a-z).";
		if (!/[0-9]/.test(pwd)) return "Password must contain at least one number (0-9).";
		if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/~`]/.test(pwd)) return "Password must contain at least one special character.";
		return null;
	}

	axios.defaults.withCredentials = true;

	async function handleAuthSuccess(userData, firebaseUser) {
		db.addToast('Welcome back! Logging you in...', 'success');
		
		const uid = firebaseUser ? (firebaseUser.uid || firebaseUser.id) : (userData.uid || userData.id);
		
		setAuthenticatedUser({
			uid,
			email: userData.email,
			role: userData.role,
			name: userData.name,
			location: userData.location || userData.city || '',
			avatar: userData.avatar || userData.profileImage || '',
			bloodGroup: userData.bloodGroup || '',
			profileCompletion: userData.profileCompletion || 50
		});

		window.location.href = `/dashboard/${userData.role}`;
	}

	async function handleLogin(e) {
		e.preventDefault();
		errorMessage = '';
		try {
			// Restore manual login logic by querying the Firestore database via custom API
			const res = await axios.post('/api/auth/login', {
				email,
				password,
				role: selectedRole
			});

			if (res.data.success) {
				await handleAuthSuccess(res.data.user, null);
			} else {
				throw new Error(res.data.error || 'Invalid email or password');
			}
		} catch (err) {
			console.error(err);
			const errorMsg = err.response?.data?.error || err.message || 'Invalid email or password';
			errorMessage = errorMsg;
			db.addToast(errorMessage, 'error');
		}
	}

	async function handleCreateAdmin(e) {
		e.preventDefault();
		errorMessage = '';

		const pwdError = validatePassword(setupPassword);
		if (pwdError) {
			errorMessage = pwdError;
			db.addToast(errorMessage, 'error');
			return;
		}

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
				await handleAuthSuccess(res.data.user, null);
			}
		} catch (err) {
			console.error(err);
			errorMessage = err.response?.data?.error || 'Failed to initialize system admin.';
			db.addToast(errorMessage, 'error');
		}
	}

	async function handleGoogleSignIn() {
		errorMessage = '';
		try {
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
				await handleAuthSuccess(res.data.user, user);
			}
		} catch (err) {
			console.log(err.code);
			console.log(err.message);
			errorMessage = err.response?.data?.error || err.message || 'Google Sign-In failed.';
			db.addToast(errorMessage, 'error');
		}
	}

	$effect(() => {
		if (!db.authLoading && db.user) {
			window.location.href = `/dashboard/${db.user.role}`;
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative bg-baby-pink overflow-hidden">
	<BloodWaveBackground />
	
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-450/5 rounded-full blur-3xl pointer-events-none"></div>

	<!-- Centered Glassmorphic Card -->
	<div class="w-full max-w-md bg-white/75 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
		
		<!-- Heartbeat Logo Header -->
		<div class="flex flex-col items-center gap-2 group text-center mb-2">
			<div class="relative inline-block animate-heartbeat">
				<img src="/logo.png" alt="LifeLink Logo" class="h-14 w-14 object-contain" />
				<div class="absolute -inset-1.5 rounded-full bg-red-500/10 -z-10 blur-sm scale-105"></div>
			</div>
			<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
		</div>

		{#if !data.hasAdminAccount}
			<!-- State A: System Initialization Setup Screen -->
			<div class="space-y-4">
				<div class="text-center space-y-1">
					<h2 class="text-xl font-bold text-red-700">Initialize Admin Profile</h2>
					<p class="text-slate-500 text-xs">No primary administrator account detected. Setup the system profile.</p>
				</div>

				{#if errorMessage}
					<div class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl animate-pulse flex items-center gap-2">
						<Icon name="alert-triangle" class="w-4 h-4" /> {errorMessage}
					</div>
				{/if}

				<form onsubmit={handleCreateAdmin} class="space-y-4">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-name">Admin Name *</label>
						<input
							id="admin-name"
							type="text"
							bind:value={setupName}
							placeholder="Full Name"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
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
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
							required
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-phone">Phone *</label>
							<input
								id="admin-phone"
								type="tel"
								bind:value={setupPhone}
								placeholder="Phone number"
								class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
								required
							/>
						</div>

						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-loc">Location *</label>
							<input
								id="admin-loc"
								type="text"
								bind:value={setupLocation}
								placeholder="City"
								class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
								required
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex justify-between items-center mb-0.5">
							<label class="text-[10px] font-bold text-slate-500 uppercase" for="admin-pass">Choose Password *</label>
							<button
								type="button"
								class="text-[9px] font-bold text-primary hover:text-red-700 hover:underline cursor-pointer"
								onclick={suggestSetupPassword}
							>
								Suggest Strong Password
							</button>
						</div>
						<div class="relative w-full">
							<input
								id="admin-pass"
								type={showSetupPassword ? "text" : "password"}
								bind:value={setupPassword}
								placeholder="••••••••"
								class="w-full border {setupPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-red-500'} p-2.5 pr-10 rounded-xl focus:ring-2 focus:outline-none text-sm bg-white transition-all"
								required
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-700 transition cursor-pointer"
								onclick={() => showSetupPassword = !showSetupPassword}
								aria-label={showSetupPassword ? "Hide password" : "Show password"}
							>
								{#if showSetupPassword}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								{:else}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
									</svg>
								{/if}
							</button>
						</div>
						{#if setupPasswordError}
							<span class="text-[10px] text-red-650 font-semibold flex items-center gap-1.5 mt-1">
								<Icon name="alert-triangle" class="w-3.5 h-3.5" /> {setupPasswordError}
							</span>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer text-sm"
					>
						Initialize Admin account
					</button>
				</form>
			</div>
		{:else}
			<!-- State B: Standard Login Screen -->
			<div class="space-y-5">
				<div class="text-center space-y-1">
					<h2 class="text-xl font-bold text-slate-800">Welcome Back</h2>
					<p class="text-slate-400 text-xs">Enter your details to sign in to your dashboard.</p>
				</div>

				{#if errorMessage}
					<div class="p-3 bg-red-50 border border-red-200 text-red-750 text-xs font-semibold rounded-2xl flex items-center gap-2">
						<Icon name="alert-triangle" class="w-4 h-4 text-red-700" /> {errorMessage}
					</div>
				{/if}

				<form onsubmit={handleLogin} class="space-y-4">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="email">Email Address</label>
						<div class="relative w-full">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
								</svg>
							</span>
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="name@example.com"
								class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
								required
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex justify-between items-center">
							<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Password</label>
							<a href="/forgot-password" class="text-[10px] font-bold text-primary hover:text-red-700 hover:underline">
								Forgot Password?
							</a>
						</div>
						<div class="relative w-full">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</span>
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								bind:value={password}
								placeholder="••••••••"
								class="w-full border border-slate-200 p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
								required
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
								onclick={() => showPassword = !showPassword}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{#if showPassword}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								{:else}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="role-select">Dashboard Role</label>
						<div class="relative w-full">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</span>
							<select
								id="role-select"
								bind:value={selectedRole}
								class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white font-semibold text-slate-800"
							>
								<option value="recipient">Recipient / Receiver</option>
								<option value="donor">Blood Donor</option>
								<option value="admin">System Admin</option>
							</select>
						</div>
					</div>

					<!-- Remember Me and options row -->
					<div class="flex items-center justify-between py-1">
						<label class="inline-flex items-center gap-2 cursor-pointer select-none">
							<input type="checkbox" class="h-4 w-4 rounded border-slate-350 text-primary focus:ring-primary accent-red-600" />
							<span class="text-xs text-slate-500 font-medium">Remember Me</span>
						</label>
					</div>

					<button
						type="submit"
						class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer text-sm"
					>
						Sign In
					</button>
				</form>

				<div class="relative flex py-1 items-center">
					<div class="flex-grow border-t border-slate-100"></div>
					<span class="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase">Or</span>
					<div class="flex-grow border-t border-slate-100"></div>
				</div>

				<button
					type="button"
					onclick={handleGoogleSignIn}
					class="w-full bg-white hover:bg-slate-50 border border-slate-200 text-secondary font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer text-sm"
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

				<div class="text-center text-xs text-slate-450 mt-2">
					Don't have an account?
					<a href="/register" class="text-red-700 font-bold hover:underline ml-1">Create Account</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes heartbeat {
		0%, 100% {
			transform: scale(1);
		}
		25% {
			transform: scale(1.08);
		}
		40% {
			transform: scale(1.02);
		}
		60% {
			transform: scale(1.06);
		}
	}
	.animate-heartbeat {
		animation: heartbeat 1.6s ease-in-out infinite;
	}
</style>