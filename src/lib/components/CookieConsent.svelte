<script>
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		const consent = localStorage.getItem('lifelink_cookie_consent');
		if (!consent) {
			// Show banner with a slight delay for smooth entrance
			setTimeout(() => {
				visible = true;
			}, 1000);
		}
	});

	function accept() {
		localStorage.setItem('lifelink_cookie_consent', 'accepted');
		visible = false;
	}

	function reject() {
		localStorage.setItem('lifelink_cookie_consent', 'rejected');
		visible = false;
	}
</script>

{#if visible}
	<div class="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-white/90 backdrop-blur-md border border-red-100 rounded-3xl p-5 shadow-2xl z-[9999] flex flex-col gap-4 animate-slide-up hover-card-premium">
		<div class="flex items-start gap-3">
			<span class="text-2xl mt-0.5" role="img" aria-label="cookie">🍪</span>
			<div class="space-y-1">
				<h4 class="font-bold text-slate-800 text-sm">Cookie Preferences</h4>
				<p class="text-xs text-slate-655 font-medium leading-relaxed">
					LifeLink uses cookies to improve your experience and keep your session secure.
				</p>
			</div>
		</div>
		<div class="flex gap-3 justify-end text-xs font-bold">
			<button
				onclick={reject}
				class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-secondary rounded-xl transition cursor-pointer font-bold"
			>
				Reject Cookies
			</button>
			<button
				onclick={accept}
				class="px-4 py-2 bg-primary hover:bg-red-700 text-white rounded-xl shadow-md transition cursor-pointer font-bold"
			>
				Accept Cookies
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(24px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-slide-up {
		animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
