<script>
	import Icon from '$lib/components/Icon.svelte';
	let { chartData } = $props();

	// Reactive data sets derived from props
	const monthlyActivity = $derived(chartData?.monthlyActivity || []);
	const distribution = $derived(chartData?.distribution || []);

	// Runes to track active items for tooltip hover states
	let hoveredBar = $state(null);
	let hoveredSlice = $state(null);

	// Helpers for Donut chart calculations
	const totalValue = $derived(distribution.reduce((sum, item) => sum + item.value, 0) || 1);
	
	// Create accumulated starting angles dynamically using $derived.by
	const donutSlices = $derived.by(() => {
		let accumulatedPercent = 0;
		return distribution.map(slice => {
			const percent = slice.value / totalValue;
			const startPercent = accumulatedPercent;
			accumulatedPercent += percent;
			
			return {
				...slice,
				startPercent,
				endPercent: accumulatedPercent,
				dasharray: `${percent * 100} ${100 - (percent * 100)}`,
				dashoffset: `${-startPercent * 100}`
			};
		});
	});

	// Calculate Y-axis scaling dynamically
	const maxVal = $derived(Math.max(...monthlyActivity.map(d => Math.max(d.requests, d.donations)), 10));
	const yAxisScale = $derived(Math.ceil(maxVal / 10) * 10);
</script>

<div class="grid md:grid-cols-2 gap-6">
	<!-- Card 1: Monthly Requests vs Donations Bar Chart -->
	<div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg relative min-h-80 flex flex-col justify-between">
		<div>
			<h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
				<Icon name="trending-up" class="w-5 h-5 text-red-600" /> Requests vs Donations
			</h3>
		</div>
		
		<div class="relative h-60 w-full flex items-end justify-between pt-6 border-b border-gray-100 pb-2">
			<!-- Y-Axis labels (Dynamic) -->
			<div class="absolute left-0 top-0 text-[10px] text-gray-400 flex flex-col justify-between h-full pointer-events-none z-10">
				<span>{yAxisScale}</span>
				<span>{Math.round(yAxisScale * 2 / 3)}</span>
				<span>{Math.round(yAxisScale / 3)}</span>
				<span>0</span>
			</div>

			<!-- Grid Lines -->
			<div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="w-full"></div>
			</div>

			<!-- Bars / Empty State -->
			{#if monthlyActivity.length === 0}
				<div class="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
					<span class="text-xs text-gray-400 font-semibold">No data available</span>
				</div>
			{:else}
				<div class="flex-1 flex justify-around items-end pl-6 h-full z-10">
					{#each monthlyActivity as item, i}
						<div class="flex flex-col items-center group relative w-12">
							<div class="flex gap-1 items-end h-36 w-full justify-center">
								<!-- Request Bar -->
								<button
									class="w-4 bg-red-700/80 rounded-t-sm hover:bg-red-800 transition-all duration-300"
									style="height: {(item.requests / yAxisScale) * 100}%"
									onmouseenter={() => hoveredBar = { ...item, type: 'Requests', index: i }}
									onmouseleave={() => hoveredBar = null}
									aria-label="Requests bar"
								></button>
								<!-- Donation Bar -->
								<button
									class="w-4 bg-emerald-600/80 rounded-t-sm hover:bg-emerald-700 transition-all duration-300"
									style="height: {(item.donations / yAxisScale) * 100}%"
									onmouseenter={() => hoveredBar = { ...item, type: 'Donations', index: i }}
									onmouseleave={() => hoveredBar = null}
									aria-label="Donations bar"
								></button>
							</div>
							<span class="text-[9px] font-semibold text-gray-400 mt-2 text-center truncate w-full">{item.month}</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Live Tooltip -->
			{#if hoveredBar}
				<div class="absolute bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl -top-2 left-1/2 transform -translate-x-1/2 border border-gray-800 flex flex-col items-center z-35 pointer-events-none">
					<span class="font-bold text-red-400">{hoveredBar.month}</span>
					<span>Requests: <strong class="text-white">{hoveredBar.requests}</strong></span>
					<span>Donations: <strong class="text-emerald-400">{hoveredBar.donations}</strong></span>
				</div>
			{/if}
		</div>

		<!-- Legends -->
		<div class="flex gap-4 justify-center mt-4 text-xs font-semibold">
			<div class="flex items-center gap-1.5 text-gray-600">
				<span class="w-3 h-3 bg-red-700 rounded-sm"></span>
				Requests
			</div>
			<div class="flex items-center gap-1.5 text-gray-600">
				<span class="w-3 h-3 bg-emerald-600 rounded-sm"></span>
				Donations
			</div>
		</div>
	</div>

	<!-- Card 2: Blood Group Distribution Donut Chart -->
	<div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-80">
		<h3 class="text-lg font-bold text-gray-800 mb-2">
			🩸 Blood Group Distribution
		</h3>
		
		<div class="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 flex-1">
			<!-- SVG Donut -->
			<div class="relative w-40 h-40 flex items-center justify-center">
				{#if distribution.length === 0}
					<span class="text-xs text-gray-400 font-semibold">No data available</span>
				{:else}
					<svg viewBox="0 0 42 42" class="w-full h-full transform -rotate-90">
						<!-- Track -->
						<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f3f4f6" stroke-width="5"></circle>
						
						<!-- Slices -->
						{#each donutSlices as slice, i}
							<circle
								cx="21"
								cy="21"
								r="15.915"
								fill="transparent"
								stroke={slice.color}
								stroke-width="5.5"
								stroke-dasharray={slice.dasharray}
								stroke-dashoffset={slice.dashoffset}
								class="transition-all duration-300 hover:stroke-[6.5] cursor-pointer"
								onmouseenter={() => hoveredSlice = slice}
								onmouseleave={() => hoveredSlice = null}
							></circle>
						{/each}
					</svg>

					<!-- Center Text -->
					<div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
						{#if hoveredSlice}
							<span class="text-xs text-gray-400 uppercase tracking-widest font-bold">{hoveredSlice.group}</span>
							<span class="text-xl font-extrabold text-gray-850" style="color: {hoveredSlice.color}">{hoveredSlice.value}%</span>
						{:else}
							<span class="text-xs text-gray-400 uppercase tracking-widest font-bold">Total</span>
							<span class="text-2xl font-extrabold text-gray-800">100%</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Grid Legends -->
			<div class="flex flex-col gap-2 w-full sm:w-auto">
				{#if distribution.length === 0}
					<span class="text-xs text-gray-400 font-semibold">No data available</span>
				{:else}
					{#each distribution as item}
						<div
							class="flex items-center justify-between gap-6 px-3 py-1.5 rounded-xl border border-transparent transition
							{hoveredSlice?.group === item.group ? 'bg-gray-50 border-gray-100' : ''}"
							onmouseenter={() => hoveredSlice = item}
							onmouseleave={() => hoveredSlice = null}
						>
							<div class="flex items-center gap-2 text-sm font-semibold">
								<span class="w-3 h-3 rounded-full" style="background-color: {item.color}"></span>
								<span class="text-gray-700">{item.group}</span>
							</div>
							<span class="text-sm font-extrabold text-gray-900">{item.value}%</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
