<script>
	let { children } = $props();
</script>

<div class="relative inline-block animate-heartbeat">
	{@render children()}
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
