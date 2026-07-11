<script>
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import { auth } from '$lib/firebase.client.js';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
	import BloodWaveBackground from '$lib/components/BloodWaveBackground.svelte';
	import OtpVerification from '$lib/components/OtpVerification.svelte';
	import { onMount } from 'svelte';

	let showOtp = $state(false);
	let registeredEmail = $state('');

	let role = $state('');
	let name = $state('');

	onMount(() => {
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('role')) role = searchParams.get('role');
		if (searchParams.has('name')) name = searchParams.get('name');
		if (searchParams.has('email')) email = searchParams.get('email');
		if (searchParams.has('phone')) phone = searchParams.get('phone');
		if (searchParams.has('location')) location = searchParams.get('location');
		if (searchParams.has('bloodGroup')) bloodGroup = searchParams.get('bloodGroup');
	});
	let email = $state('');
	let phone = $state('');
	let location = $state('');
	let bloodGroup = $state('O+');
	let password = $state('');
	let confirmPassword = $state('');
	let errorMessage = $state('');

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	let passwordError = $derived(
		password
			? password.length < 8
				? 'Password must be at least 8 characters long.'
				: !/[A-Z]/.test(password)
				? 'Password must contain at least one uppercase letter (A-Z).'
				: !/[a-z]/.test(password)
				? 'Password must contain at least one lowercase letter (a-z).'
				: !/[0-9]/.test(password)
				? 'Password must contain at least one number (0-9).'
				: !/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/~`]/.test(password)
				? 'Password must contain at least one special character.'
				: ''
			: ''
	);

	let passwordStrength = $derived.by(() => {
		if (!password) return 0;
		let score = 0;
		if (password.length >= 8) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[a-z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/~`]/.test(password)) score++;
		return score;
	});


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

	function suggestPassword() {
		const gen = generateStrongPassword();
		password = gen;
		confirmPassword = gen;
		showPassword = true;
		showConfirmPassword = true;
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

	async function handleRegister(e) {
		e.preventDefault();
		errorMessage = '';

		const pwdError = validatePassword(password);
		if (pwdError) {
			errorMessage = pwdError;
			db.addToast(errorMessage, 'error');
			return;
		}

		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			db.addToast(errorMessage, 'error');
			return;
		}
		try {
			const res = await axios.post('/api/auth/register', {
				fullName: name,
				email,
				password,
				confirmPassword,
				phone,
				location,
				role,
				bloodGroup: (role === 'donor' || role === 'recipient') ? bloodGroup : ''
			});
			if (res.data.success) {
				db.addToast('Registration completed successfully! Please verify your email.', 'success');
				registeredEmail = email;
				showOtp = true;
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
			db.addToast(errorMessage, 'error');
		}
	}

	async function handleGoogleSignIn() {
		errorMessage = '';
		if (!role) {
			errorMessage = 'Please select a role before continuing with Google.';
			db.addToast(errorMessage, 'error');
			return;
		}

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
				role
			});

			if (res.data.success) {
				db.addToast('Welcome! Logging you in...', 'success');
				
				// Sync auth store immediately before navigating
				const userData = res.data.user;
				db.user = {
					uid: userData.uid || userData.id,
					email: userData.email,
					role: userData.role,
					name: userData.name,
					location: userData.location || userData.city || '',
					avatar: userData.avatar || userData.profileImage || '',
					bloodGroup: userData.bloodGroup || '',
					profileCompletion: userData.profileCompletion || 50
				};
				db.authLoading = false;

				window.location.href = `/dashboard/${userData.role}`;
			}
		} catch (err) {
			console.error(err);
			errorMessage = err.response?.data?.error || err.message || 'Google Sign-In failed.';
			db.addToast(errorMessage, 'error');
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative bg-baby-pink overflow-hidden">
	<BloodWaveBackground />
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>

	<!-- Centered Glassmorphic Card -->
	<div class="w-full max-w-xl bg-white/75 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
		
		<!-- Heartbeat Logo Header -->
		<div class="flex flex-col items-center gap-2 group text-center mb-2">
			<div class="relative inline-block animate-heartbeat">
				<img src="/logo.png" alt="LifeLink Logo" class="h-14 w-14 object-contain" />
				<div class="absolute -inset-1.5 rounded-full bg-red-500/10 -z-10 blur-sm scale-105"></div>
			</div>
			<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
		</div>

		<!-- Subheading -->
		<div class="text-center space-y-1">
			<h2 class="text-xl font-bold text-slate-800 font-sans">Create Your Account</h2>
			<p class="text-slate-500 text-xs">Join our network to donate blood or request emergency support.</p>
		</div>

		{#if errorMessage}
			<div class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
				⚠️ {errorMessage}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<!-- Role Selector -->
			<div class="flex flex-col gap-1">
				<label class="text-[10px] font-bold text-slate-500 uppercase" for="role-select">I want to register as a *</label>
				<div class="relative w-full">
					<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</span>
					<select
						id="role-select"
						bind:value={role}
						class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white font-semibold text-slate-800"
						required
					>
						<option value="">-- Choose Role --</option>
						<option value="donor">Whole Blood Donor (Requires Eligibility Approval)</option>
						<option value="recipient">Recipient / Receiver</option>
					</select>
				</div>
			</div>

			{#if role === 'donor'}
				<div class="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-2xl animate-fade-in-up">
					⚠️ <strong>Donor Eligibility Required:</strong> Your email address must have an approved eligibility request from the Admin. If you haven't taken the questionnaire, please do so <a href="/eligibility" class="text-red-700 underline font-bold">here</a>.
				</div>
			{/if}

			<!-- Common Fields Grid -->
			<div class="grid sm:grid-cols-2 gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="fullname">Full Name *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</span>
						<input
							id="fullname"
							type="text"
							bind:value={name}
							placeholder="Enter your name"
							class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="email">Email Address *</label>
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
							placeholder="email@example.com"
							class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="phone">Phone Number *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
							</svg>
						</span>
						<input
							id="phone"
							type="tel"
							bind:value={phone}
							placeholder="9876543210"
							class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="city">City / Location *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</span>
						<input
							id="city"
							type="text"
							bind:value={location}
							placeholder="Salem"
							class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
							required
						/>
					</div>
				</div>

				{#if role === 'donor' || role === 'recipient'}
					<div class="flex flex-col gap-1 col-span-2 animate-fade-in-up">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="bloodGroup">Blood Group *</label>
						<div class="relative w-full">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
								<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
								</svg>
							</span>
							<select
								id="bloodGroup"
								bind:value={bloodGroup}
								class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white font-semibold text-slate-800"
								required
							>
								<option value="O+">O+</option>
								<option value="A+">A+</option>
								<option value="B+">B+</option>
								<option value="AB+">AB+</option>
								<option value="O-">O-</option>
								<option value="A-">A-</option>
								<option value="B-">B-</option>
								<option value="AB-">AB-</option>
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- Password Fields Grid -->
			<div class="grid sm:grid-cols-2 gap-4">
				<!-- Choose Password -->
				<div class="flex flex-col gap-1">
					<div class="flex justify-between items-center mb-0.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Choose Password *</label>
						<button
							type="button"
							class="text-[9px] font-bold text-primary hover:text-red-700 hover:underline cursor-pointer"
							onclick={suggestPassword}
						>
							Suggest Password
						</button>
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
							class="w-full border {passwordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-red-500'} p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:outline-none text-sm bg-white transition-all"
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
					{#if passwordError}
						<span class="text-[10px] text-red-650 font-semibold leading-tight mt-1 inline-block">⚠️ {passwordError}</span>
					{/if}

					<!-- Dynamic Password Strength Bar -->
					{#if password}
						<div class="mt-1 space-y-1">
							<div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
								<div 
									class="h-full transition-all duration-300 {
										passwordStrength <= 2 ? 'bg-red-500' :
										passwordStrength <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
									}"
									style="width: {(passwordStrength / 5) * 100}%"
								></div>
							</div>
							<div class="flex justify-between text-[9px] font-bold text-slate-500 font-sans">
								<span>Strength: {
									passwordStrength <= 2 ? 'Weak' :
									passwordStrength <= 4 ? 'Fair' : 'Strong'
								}</span>
								<span>{passwordStrength}/5 rules</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Confirm Password -->
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="confirm-password">Confirm Password *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</span>
						<input
							id="confirm-password"
							type={showConfirmPassword ? "text" : "password"}
							bind:value={confirmPassword}
							placeholder="••••••••"
							class="w-full border border-slate-200 p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white transition-all"
							required
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => showConfirmPassword = !showConfirmPassword}
							aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
						>
							{#if showConfirmPassword}
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
			</div>

			<button
				type="submit"
				class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer text-sm"
			>
				Register Account
			</button>
		</form>

		<div class="relative flex py-2 items-center">
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

		<div class="text-center text-xs text-slate-455 mt-2">
			Already have an account?
			<a href="/login" class="text-red-700 font-bold hover:underline ml-1">Sign In</a>
		</div>
	</div>
</div>

{#if showOtp}
	<OtpVerification email={registeredEmail} onVerified={() => goto('/login')} />
{/if}

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