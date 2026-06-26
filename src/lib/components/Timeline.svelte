<script>
	let { currentStatus = 'Matching Donor' } = $props();

	const steps = ['Submitted', 'Verified', 'Matching Donor', 'Accepted', 'Completed'];

	// Get index of the current status
	const activeIndex = $derived(steps.indexOf(currentStatus));
</script>

<div class="w-full bg-gray-50 border border-gray-100/50 rounded-2xl p-6 shadow-inner">
	<h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
		Request Tracking Status
	</h4>

	<div class="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
		<!-- Connector bar for desktop -->
		<div class="absolute hidden md:block left-0 right-0 top-[22px] h-[3px] bg-gray-200 z-0">
			<div
				class="h-full bg-red-600 transition-all duration-700"
				style="width: {(activeIndex / (steps.length - 1)) * 100}%"
			></div>
		</div>

		<!-- Steps -->
		{#each steps as step, index}
			<div class="flex md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:w-auto relative">
				<!-- Step Dot -->
				<div
					class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500
					{index < activeIndex
						? 'bg-red-700 border-red-600 text-white shadow-lg shadow-red-700/25'
						: index === activeIndex
						? 'bg-white border-red-600 text-red-700 shadow-xl shadow-red-700/20 scale-110 animate-pulse'
						: 'bg-white border-gray-200 text-gray-400'}"
				>
					{#if index < activeIndex}
						✓
					{:else}
						{index + 1}
					{/if}
				</div>

				<!-- Step Text and Info -->
				<div class="text-left md:text-center flex-1">
					<p
						class="text-sm font-bold transition-all duration-300
						{index <= activeIndex ? 'text-gray-900' : 'text-gray-400'}"
					>
						{step}
					</p>
					<span class="text-[10px] text-gray-400">
						{#if index < activeIndex}
							Done
						{:else if index === activeIndex}
							In Progress
						{:else}
							Pending
						{/if}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>
