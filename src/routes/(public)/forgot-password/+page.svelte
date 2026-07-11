<script>
	import { enhance } from '$app/forms';
	import { db } from '$lib/auth.svelte.js';
	import BloodWaveBackground from '$lib/components/BloodWaveBackground.svelte';

	let { form } = $props();

	let email = $state('');
	let loading = $state(false);

	$effect(() => {
		if (form?.success) {
			db.addToast(form.message || 'Verification link sent successfully!', 'success');
		} else if (form?.error) {
			db.addToast(form.error, 'error');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
	<BloodWaveBackground />
	<!-- Ambient glow -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-md space-y-6 relative z-10">
		
		<!-- Header -->
		<div class="text-center space-y-2">
			<a href="/" class="inline-flex items-center gap-2.5 mb-2">
				<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
				<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
			</a>
			<h2 class="text-xl font-bold text-slate-800">Forgot Password</h2>
			<p class="text-slate-400 text-xs">Enter your email and we'll send you a link to reset your password.</p>
		</div>

		{#if form?.error}
			<div class="p-4 bg-red-50 border border-red-200 text-red-750 text-xs font-semibold rounded-2xl">
				⚠️ {form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl text-center space-y-2">
				<p>✔️ {form.message}</p>
				<p class="text-[10px] text-slate-500 font-normal">You can close this tab and check your email inbox.</p>
			</div>
		{/if}

		{#if !form?.success}
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
							name="email"
							type="email"
							bind:value={email}
							placeholder="name@example.com"
							class="w-full border border-slate-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all bg-white"
							required
							disabled={loading}
						/>
					</div>
				</div>

				<button
					type="submit"
					class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
					disabled={loading}
				>
					{#if loading}
						<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Sending Link...
					{:else}
						Send Reset Link
					{/if}
				</button>
			</form>
		{/if}

		<div class="text-center">
			<a href="/login" class="text-xs text-primary font-bold hover:text-red-700 hover:underline inline-flex items-center gap-1">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to Sign In
			</a>
		</div>

	</div>
</div>