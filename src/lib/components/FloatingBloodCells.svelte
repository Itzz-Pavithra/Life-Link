<script>
	// Simple lightweight floating circles that look like blood cells
	let cells = Array.from({ length: 12 }, (_, i) => ({
		id: i,
		size: Math.random() * 16 + 8, // 8px to 24px
		left: Math.random() * 100, // percentage
		top: Math.random() * 100, // percentage
		duration: Math.random() * 15 + 10, // seconds
		delay: Math.random() * -15 // start immediately
	}));
</script>

<div class="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
	{#each cells as cell (cell.id)}
		<div
			class="absolute rounded-full bg-red-500 opacity-[0.06] blur-[0.5px] animate-float"
			style="
				width: {cell.size}px;
				height: {cell.size}px;
				left: {cell.left}%;
				top: {cell.top}%;
				animation-duration: {cell.duration}s;
				animation-delay: {cell.delay}s;
			"
		></div>
	{/each}
</div>

<style>
	@keyframes float {
		0% {
			transform: translateY(100vh) scale(0.8) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 0.08;
		}
		90% {
			opacity: 0.08;
		}
		100% {
			transform: translateY(-20vh) scale(1.2) rotate(360deg);
			opacity: 0;
		}
	}
	.animate-float {
		animation-name: float;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
	}
</style>
