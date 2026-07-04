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
	let errorMessage = $state('');

	axios.defaults.withCredentials = true;

	async function handleRegister(e) {
		e.preventDefault();
		errorMessage = '';
		try {
			const res = await axios.post('http://localhost:5000/api/auth/register', {
				fullName: name,
				email,
				password,
				confirmPassword: password,
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

			<!-- Password Field -->
			<div class="flex flex-col gap-1">
				<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Choose Password *</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					required
				/>
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