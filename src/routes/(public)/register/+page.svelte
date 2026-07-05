<script>
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';

	let role = $state('');
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let location = $state('');
	let bloodGroup = $state('O+');
	let password = $state('');
	let confirmPassword = $state('');
	let errorMessage = $state('');

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	axios.defaults.withCredentials = true;

	async function handleRegister(e) {
		e.preventDefault();
		errorMessage = '';

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
				db.addToast('Registration successful! Please login.', 'success');
				goto('/login');
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
			db.addToast(errorMessage, 'error');
		}
	}
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center p-6 relative">
	<!-- Glowing accents -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl w-full max-w-2xl space-y-8 relative z-10">
		<!-- Header -->
		<div class="text-center space-y-2">
			<a href="/" class="inline-flex items-center gap-2.5 mb-2">
				<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
				<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
			</a>
			<h2 class="text-xl font-bold text-slate-800">Create Your Account</h2>
			<p class="text-slate-400 text-xs">Join our network to donate blood or request emergency support.</p>
		</div>

		{#if errorMessage}
			<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
				⚠️ {errorMessage}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-6">
			<!-- Role Selector -->
			<div class="flex flex-col gap-1.5">
				<label class="text-[10px] font-bold text-slate-500 uppercase">I want to register as a *</label>
				<select
					bind:value={role}
					class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white font-semibold text-slate-800"
					required
				>
					<option value="">-- Choose Role --</option>
					<option value="donor">Whole Blood Donor (Requires Eligibility Approval)</option>
					<option value="recipient">Recipient / Patient / Receiver</option>
				</select>
			</div>

			{#if role === 'donor'}
				<div class="p-4 bg-amber-50 border border-amber-250 text-amber-900 text-xs font-semibold rounded-2xl">
					⚠️ <strong>Donor Eligibility Required:</strong> Your email address must have an approved eligibility request from the Admin. If you haven't taken the questionnaire, please do so <a href="/eligibility" class="text-red-700 underline font-bold">here</a>.
				</div>
			{/if}

			<!-- Common Fields Grid -->
			<div class="grid sm:grid-cols-2 gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="fullname">Full Name *</label>
					<input
						id="fullname"
						type="text"
						bind:value={name}
						placeholder="Enter your name"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="email">Email Address *</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="email@example.com"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="phone">Phone Number *</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						placeholder="e.g. 9876543210"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="city">City / Location *</label>
					<input
						id="city"
						type="text"
						bind:value={location}
						placeholder="e.g. Salem"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				{#if role === 'donor' || role === 'recipient'}
					<div class="flex flex-col gap-1 col-span-2">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="bloodGroup">Blood Group *</label>
						<select
							id="bloodGroup"
							bind:value={bloodGroup}
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
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
				{/if}
			</div>

			<!-- Password Fields Grid -->
			<div class="grid sm:grid-cols-2 gap-4">
				<!-- Choose Password -->
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Choose Password *</label>
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

				<!-- Confirm Password -->
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="confirm-password">Confirm Password *</label>
					<div class="relative w-full">
						<input
							id="confirm-password"
							type={showConfirmPassword ? "text" : "password"}
							bind:value={confirmPassword}
							placeholder="••••••••"
							class="w-full border border-slate-200 p-3 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
							required
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => showConfirmPassword = !showConfirmPassword}
							aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
						>
							{#if showConfirmPassword}
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
			</div>

			<button
				type="submit"
				class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
			>
				Register Account
			</button>
		</form>

		<div class="text-center text-xs text-slate-400">
			Already have an account?
			<a href="/login" class="text-red-700 font-bold hover:underline ml-1">Sign In</a>
		</div>
	</div>
</div>