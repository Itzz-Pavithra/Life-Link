<script>
	let { chartData } = $props();

	// Data sets
	const monthlyActivity = chartData?.monthlyActivity || [
		{ month: 'Jan', requests: 45, donations: 60 },
		{ month: 'Feb', requests: 55, donations: 70 },
		{ month: 'Mar', requests: 80, donations: 75 },
		{ month: 'Apr', requests: 65, donations: 90 },
		{ month: 'May', requests: 95, donations: 110 },
		{ month: 'Jun', requests: 120, donations: 135 }
	];

	const distribution = chartData?.distribution || [
		{ group: 'O+', value: 35, color: '#b91c1c' }, // Red-700
		{ group: 'A+', value: 25, color: '#dc2626' }, // Red-600
		{ group: 'B+', value: 20, color: '#ef4444' }, // Red-500
		{ group: 'AB+', value: 10, color: '#f87171' }, // Red-400
		{ group: 'Negatives', value: 10, color: '#fca5a5' } // Red-300
	];


	// Runes to track active items for tooltip hover states
	let hoveredBar = $state(null);
	let hoveredSlice = $state(null);
	let hoveredLinePoint = $state(null);

	// Helpers for Donut chart calculations
	const totalValue = distribution.reduce((sum, item) => sum + item.value, 0);
	
	// Create accumulated starting angles
	let accumulatedPercent = 0;
	const donutSlices = distribution.map(slice => {
		const percent = slice.value / totalValue;
		const startPercent = accumulatedPercent;
		accumulatedPercent += percent;
		
		// Return slice geometry parameters
		return {
			...slice,
			startPercent,
			endPercent: accumulatedPercent,
			// For dasharray/dashoffset rendering
			dasharray: `${percent * 100} ${100 - (percent * 100)}`,
			dashoffset: `${-startPercent * 100}`
		};
	});
</script>

<div class="grid md:grid-cols-2 gap-6">
	<!-- Card 1: Monthly Requests vs Donations Bar Chart -->
	<div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg relative">
		<h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
			📈 Requests vs Donations
		</h3>
		
		<div class="relative h-60 w-full flex items-end justify-between pt-6 border-b border-gray-100 pb-2">
			<!-- Y-Axis labels (Simulated) -->
			<div class="absolute left-0 top-0 text-[10px] text-gray-400 flex flex-col justify-between h-full pointer-events-none">
				<span>150</span>
				<span>100</span>
				<span>50</span>
				<span>0</span>
			</div>

			<!-- Grid Lines -->
			<div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="border-t border-dashed border-gray-100 w-full"></div>
				<div class="w-full"></div>
			</div>

			<!-- Bars -->
			<div class="flex-1 flex justify-around items-end pl-6 h-full z-10">
				{#each monthlyActivity as item, i}
					<div class="flex flex-col items-center group relative w-12">
						<div class="flex gap-1 items-end h-36">
							<!-- Request Bar -->
							<button
								class="w-4 bg-red-700/80 rounded-t-sm hover:bg-red-800 transition-all duration-300"
								style="height: {(item.requests / 150) * 100}%"
								onmouseenter={() => hoveredBar = { ...item, type: 'Requests', index: i }}
								onmouseleave={() => hoveredBar = null}
							></button>
							<!-- Donation Bar -->
							<button
								class="w-4 bg-emerald-600/80 rounded-t-sm hover:bg-emerald-700 transition-all duration-300"
								style="height: {(item.donations / 150) * 100}%"
								onmouseenter={() => hoveredBar = { ...item, type: 'Donations', index: i }}
								onmouseleave={() => hoveredBar = null}
							></button>
						</div>
						<span class="text-xs text-gray-400 mt-2">{item.month}</span>
					</div>
				{/each}
			</div>

			<!-- Live Tooltip -->
			{#if hoveredBar}
				<div class="absolute bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl -top-2 left-1/2 transform -translate-x-1/2 border border-gray-800 flex flex-col items-center z-20 pointer-events-none">
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
	<div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
		<h3 class="text-lg font-bold text-gray-800 mb-2">
			🩸 Blood Group Distribution
		</h3>
		
		<div class="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 flex-1">
			<!-- SVG Donut -->
			<div class="relative w-40 h-40">
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
			</div>

			<!-- Grid Legends -->
			<div class="flex flex-col gap-2 w-full sm:w-auto">
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
			</div>
		</div>
	</div>
</div>
