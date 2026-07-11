<script>
	import { enhance } from '$app/forms';
	import { db } from '$lib/auth.svelte.js';
	import { goto } from '$app/navigation';
	import BloodWaveBackground from '$lib/components/BloodWaveBackground.svelte';

	let { data, form } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);

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
				: !/[!@#$%^&*()_+\-=\[\]{}|;:\',.<>?\/~`]/.test(password)
				? 'Password must contain at least one special character.'
				: ''
			: ''
	);

	$effect(() => {
		if (form?.success) {
			db.addToast(form.message || 'Password reset successfully!', 'success');
			setTimeout(() => {
				goto('/login');
			}, 2000);
		} else if (form?.error) {
			db.addToast(form.error, 'error');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
	<BloodWaveBackground />
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-md space-y-6 relative z-10">

		<!-- Header -->
		<div class="text-center space-y-2">
			<a href="/" class="inline-flex items-center gap-2.5 mb-2">
				<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
				<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
			</a>
			<h2 class="text-xl font-bold text-slate-800">Reset Password</h2>
			<p class="text-slate-400 text-xs">Enter your new secure password below to regain access.</p>
		</div>

		{#if !data.isValid}
			<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl text-center space-y-4">
				<p>⚠️ {data.error || 'Invalid or expired password reset link.'}</p>
				<a href="/forgot-password" class="inline-block bg-primary hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
					Request New Reset Link
				</a>
			</div>
		{:else if form?.success}
			<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl text-center space-y-2">
				<p>✔️ {form.message}</p>
				<p class="text-[10px] text-slate-500 font-normal">Redirecting you to Sign In...</p>
			</div>
		{:else}
			{#if form?.error}
				<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
					⚠️ {form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						update();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="email" value={data.email} />
				<input type="hidden" name="token" value={data.token} />

				<!-- New Password -->
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">New Password *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</span>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••"
							class="w-full border {passwordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-red-500'} p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:outline-none text-sm bg-white transition-all"
							required
							disabled={loading}
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => (showPassword = !showPassword)}
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
						<span class="text-[10px] text-red-600 font-semibold mt-1">⚠️ {passwordError}</span>
					{/if}
				</div>

				<!-- Confirm Password -->
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="confirmPassword">Confirm Password *</label>
					<div class="relative w-full">
						<span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</span>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="••••••••"
							class="w-full border border-slate-200 p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white transition-all"
							required
							disabled={loading}
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 transition cursor-pointer"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
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

				<button
					type="submit"
					class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
					disabled={loading || !!passwordError || password !== confirmPassword}
				>
					{#if loading}
						<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Updating Password...
					{:else}
						Reset Password
					{/if}
				</button>
			</form>
		{/if}

		<div class="text-center">
			<a href="/login" class="text-xs text-primary font-bold hover:text-red-700 hover:underline">
				← Back to Sign In
			</a>
		</div>

	</div>
</div>
