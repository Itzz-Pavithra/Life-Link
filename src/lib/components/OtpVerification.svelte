<script>
	import { db } from '$lib/auth.svelte.js';
	import axios from 'axios';

	let { email, onVerified } = $props();

	let otpCode = $state('');
	let loading = $state(false);
	let resending = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');
	let remainingAttempts = $state(5);
	let timer = $state(600); // 10 minutes (600 seconds)
	let timerInterval;

	$effect(() => {
		timerInterval = setInterval(() => {
			if (timer > 0) {
				timer -= 1;
			}
		}, 1000);

		return () => clearInterval(timerInterval);
	});

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
	}

	async function handleVerify(e) {
		e.preventDefault();
		if (otpCode.length !== 6) {
			errorMsg = 'Please enter a valid 6-digit code.';
			return;
		}

		loading = true;
		errorMsg = '';
		successMsg = '';

		try {
			const res = await axios.post('/api/auth/verify-otp', {
				email: email,
				otp: otpCode
			});

			if (res.data.success) {
				db.addToast('Email verified successfully! You can now log in.', 'success');
				if (onVerified) onVerified();
			}
		} catch (err) {
			console.error(err);
			const apiError = err.response?.data?.error || 'Verification failed.';
			errorMsg = apiError;
			db.addToast(errorMsg, 'error');

			// If the code was invalidated due to attempts, set attempts to 0 or ask to resend
			if (apiError.toLowerCase().includes('too many incorrect attempts') || apiError.toLowerCase().includes('expired')) {
				remainingAttempts = 0;
			} else {
				// Parse remaining attempts from error message if available
				const match = apiError.match(/attempts:\s*(\d+)/i);
				if (match) {
					remainingAttempts = parseInt(match[1]);
				} else {
					remainingAttempts = Math.max(0, remainingAttempts - 1);
				}
			}
		} finally {
			loading = false;
		}
	}

	async function handleResend() {
		resending = true;
		errorMsg = '';
		successMsg = '';

		try {
			const res = await axios.post('/api/auth/send-otp', {
				email: email
			});

			if (res.data.success) {
				successMsg = 'A new 6-digit OTP code has been sent successfully.';
				db.addToast(successMsg, 'success');
				timer = 600; // Reset 10 minute timer
				remainingAttempts = 5; // Reset attempts
				otpCode = '';
			}
		} catch (err) {
			console.error(err);
			errorMsg = err.response?.data?.error || 'Failed to resend verification OTP.';
			db.addToast(errorMsg, 'error');
		} finally {
			resending = false;
		}
	}
</script>

<div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
	<div class="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-md space-y-6 relative hover-card-premium">
		<div class="text-center space-y-2">
			<span class="text-4xl block mb-2 animate-pulse">✉️</span>
			<h3 class="text-xl font-bold text-slate-800">Verify Your Email</h3>
			<p class="text-slate-655 font-medium text-xs leading-relaxed">
				We have sent a 6-digit verification code to <br />
				<span class="font-bold text-red-700">{email}</span>
			</p>
		</div>

		{#if errorMsg}
			<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
				⚠️ {errorMsg}
			</div>
		{/if}

		{#if successMsg}
			<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl">
				✓ {successMsg}
			</div>
		{/if}

		<form onsubmit={handleVerify} class="space-y-4">
			<div class="flex flex-col gap-1.5 text-center">
				<label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider" for="otp-input">
					Verification Code (OTP)
				</label>
				<input
					id="otp-input"
					type="text"
					maxLength="6"
					bind:value={otpCode}
					placeholder="Enter 6-digit OTP"
					disabled={loading || remainingAttempts === 0 || timer === 0}
					class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-center font-bold tracking-[8px] text-lg bg-white"
					required
				/>
			</div>

			{#if timer > 0 && remainingAttempts > 0}
				<div class="flex items-center justify-between text-xs font-medium text-slate-600 px-1">
					<span>Code Expires: <strong class="text-red-700">{formatTime(timer)}</strong></span>
					<span>Attempts Left: <strong class="text-red-700">{remainingAttempts}</strong></span>
				</div>
			{:else}
				<div class="text-center text-xs font-semibold text-red-655 p-1">
					⚠️ Code has expired or attempts limit exceeded. Please request a new OTP.
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading || otpCode.length !== 6 || remainingAttempts === 0 || timer === 0}
				class="w-full bg-red-650 hover:bg-red-750 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Verifying Code...' : 'Verify & Activate Account'}
			</button>
		</form>

		<div class="text-center text-xs text-slate-400">
			Didn't receive the email code?
			<button
				type="button"
				onclick={handleResend}
				disabled={resending}
				class="text-red-700 font-bold hover:underline ml-1 cursor-pointer disabled:opacity-50"
			>
				{resending ? 'Sending...' : 'Resend OTP'}
			</button>
		</div>
	</div>
</div>
