<script>
	const groups = [
		'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+',
		'A1+', 'A1-', 'A2+', 'A2-',
		'A1B+', 'A1B-', 'A2B+', 'A2B-'
	];
	
	const compatibility = {
		'O-': { give: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'A1+', 'A1-', 'A2+', 'A2-', 'A1B+', 'A1B-', 'A2B+', 'A2B-'], receive: ['O-'] },
		'O+': { give: ['O+', 'A+', 'B+', 'AB+', 'A1+', 'A2+', 'A1B+', 'A2B+'], receive: ['O-', 'O+'] },
		'A-': { give: ['A-', 'A+', 'AB-', 'AB+', 'A1+', 'A1-', 'A2+', 'A2-', 'A1B+', 'A1B-', 'A2B+', 'A2B-'], receive: ['O-', 'A-', 'A1-', 'A2-'] },
		'A+': { give: ['A+', 'AB+', 'A1+', 'A2+', 'A1B+', 'A2B+'], receive: ['O-', 'O+', 'A-', 'A+', 'A1+', 'A1-', 'A2+', 'A2-'] },
		'B-': { give: ['B-', 'B+', 'AB-', 'AB+', 'A1B+', 'A1B-', 'A2B+', 'A2B-'], receive: ['O-', 'B-'] },
		'B+': { give: ['B+', 'AB+', 'A1B+', 'A2B+'], receive: ['O-', 'O+', 'B-', 'B+'] },
		'AB-': { give: ['AB-', 'AB+', 'A1B+', 'A1B-', 'A2B+', 'A2B-'], receive: ['O-', 'A-', 'B-', 'AB-', 'A1-', 'A2-', 'A1B-', 'A2B-'] },
		'AB+': { give: ['AB+', 'A1B+', 'A2B+'], receive: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'A1+', 'A1-', 'A2+', 'A2-', 'A1B+', 'A1B-', 'A2B+', 'A2B-'] },
		'A1+': { give: ['A1+', 'AB+', 'A1B+'], receive: ['O-', 'O+', 'A-', 'A+', 'A1-', 'A1+', 'A2-', 'A2+'] },
		'A1-': { give: ['A1+', 'A1-', 'AB+', 'AB-', 'A1B+', 'A1B-'], receive: ['O-', 'A-', 'A1-', 'A2-'] },
		'A2+': { give: ['A1+', 'A2+', 'AB+', 'A1B+', 'A2B+'], receive: ['O-', 'O+', 'A-', 'A+', 'A2-', 'A2+'] },
		'A2-': { give: ['A1+', 'A1-', 'A2+', 'A2-', 'AB+', 'AB-', 'A1B+', 'A1B-', 'A2B+', 'A2B-'], receive: ['O-', 'A-', 'A2-'] },
		'A1B+': { give: ['A1B+', 'AB+'], receive: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'A1+', 'A1-', 'A2+', 'A2-', 'A1B+', 'A1B-', 'A2B+', 'A2B-'] },
		'A1B-': { give: ['A1B+', 'A1B-', 'AB+', 'AB-'], receive: ['O-', 'A-', 'B-', 'AB-', 'A1-', 'A2-', 'A1B-', 'A2B-'] },
		'A2B+': { give: ['A1B+', 'A2B+', 'AB+'], receive: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'A2-', 'A2+', 'A2B-', 'A2B+'] },
		'A2B-': { give: ['A1B+', 'A1B-', 'A2B+', 'A2B-', 'AB+', 'AB-'], receive: ['O-', 'A-', 'B-', 'A2-', 'A2B-'] }
	};

	let selectedGroup = $state('O-');
</script>

<div class="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
	<!-- Glowing accent background -->
	<div class="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

	<h3 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
		🩸 Interactive Blood Compatibility Guide
	</h3>
	<p class="text-gray-400 text-sm mb-6">
		Select a blood type to see who they can donate to (Give) and receive from (Receive).
	</p>

	<!-- Blood Type Selector Buttons -->
	<div class="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-8">
		{#each groups as bg}
			<button
				class="py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95
				{selectedGroup === bg 
					? 'bg-red-700 text-white shadow-lg shadow-red-700/50 border border-red-500' 
					: 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'}"
				onclick={() => selectedGroup = bg}
			>
				{bg}
			</button>
		{/each}
	</div>

	<!-- Results Panel -->
	<div class="grid md:grid-cols-2 gap-6">
		<!-- Can Give To -->
		<div class="bg-gray-800/40 border border-gray-800 rounded-2xl p-5">
			<h4 class="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
				🎁 Can Donate To (Give)
			</h4>
			<div class="flex flex-wrap gap-2">
				{#each groups as bg}
					<span
						class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500
						{compatibility[selectedGroup].give.includes(bg)
							? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/45 scale-100 shadow-md shadow-emerald-500/10'
							: 'bg-gray-900/40 text-gray-600 border border-gray-800/50 scale-90'}"
					>
						{bg}
					</span>
				{/each}
			</div>
		</div>

		<!-- Can Receive From -->
		<div class="bg-gray-800/40 border border-gray-800 rounded-2xl p-5">
			<h4 class="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4 flex items-center gap-2">
				📥 Can Receive From (Receive)
			</h4>
			<div class="flex flex-wrap gap-2">
				{#each groups as bg}
					<span
						class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500
						{compatibility[selectedGroup].receive.includes(bg)
							? 'bg-sky-500/20 text-sky-400 border border-sky-500/45 scale-100 shadow-md shadow-sky-500/10'
							: 'bg-gray-900/40 text-gray-600 border border-gray-800/50 scale-90'}"
					>
						{bg}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
