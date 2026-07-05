<script>
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	// Accessibility preferences
	let zoom = $state('md'); // sm, md, lg, xl
	let contrast = $state(false);
	let dark = $state(false);
	let reduceMotion = $state(false);
	let spacing = $state(false);

	// Apply settings to html element
	function updateSettings() {
		if (typeof document === 'undefined') return;
		const html = document.documentElement;

		// Zoom level classes
		html.classList.remove('zoom-sm', 'zoom-md', 'zoom-lg', 'zoom-xl');
		html.classList.add(`zoom-${zoom}`);

		// Boolean classes
		if (contrast) html.classList.add('contrast-high');
		else html.classList.remove('contrast-high');

		if (dark) html.classList.add('dark');
		else html.classList.remove('dark');

		if (reduceMotion) html.classList.add('reduce-motion');
		else html.classList.remove('reduce-motion');

		if (spacing) html.classList.add('readable-spacing');
		else html.classList.remove('readable-spacing');

		// Save state
		localStorage.setItem('lifelink_accessibility', JSON.stringify({
			zoom, contrast, dark, reduceMotion, spacing
		}));
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('lifelink_accessibility');
			if (saved) {
				const parsed = JSON.parse(saved);
				zoom = parsed.zoom || 'md';
				contrast = !!parsed.contrast;
				dark = !!parsed.dark;
				reduceMotion = !!parsed.reduceMotion;
				spacing = !!parsed.spacing;
			}
		} catch (e) {
			console.error('Failed to load accessibility settings', e);
		}
		updateSettings();
	});

	// Trigger settings change reactively when state variables modify
	$effect(() => {
		// Dependencies of effect: Svelte will track these and run when modified
		const _ = { zoom, contrast, dark, reduceMotion, spacing };
		updateSettings();
	});

	function togglePanel() {
		isOpen = !isOpen;
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Accessibility Widget Container -->
<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
	{#if isOpen}
		<!-- Options Panel -->
		<div
			class="bg-white border border-rose-105 rounded-3xl p-6 shadow-2xl w-80 max-w-[calc(100vw-2rem)] border-slate-100 animate-fade-in-up"
			role="dialog"
			aria-label="Accessibility Settings Panel"
			aria-modal="true"
		>
			<div class="flex items-center justify-between pb-4 border-b border-rose-50 border-slate-100 mb-4">
				<div class="flex items-center gap-2">
					<span class="text-xl">♿</span>
					<h3 class="font-extrabold text-sm text-slate-900">Accessibility Controls</h3>
				</div>
				<button
					onclick={togglePanel}
					class="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
					aria-label="Close accessibility controls"
				>
					✕
				</button>
			</div>

			<div class="space-y-4 text-xs font-semibold">
				<!-- Text Size Zoom Control -->
				<div class="space-y-2">
					<span class="text-slate-500 block uppercase tracking-wider text-[10px]">Text Sizing (A+ / A-)</span>
					<div class="grid grid-cols-4 gap-1.5">
						<button
							onclick={() => zoom = 'sm'}
							class="py-2 rounded-xl border text-center transition cursor-pointer font-bold
							{zoom === 'sm' ? 'bg-red-700 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}"
							aria-label="Set text size to small"
						>
							A-
						</button>
						<button
							onclick={() => zoom = 'md'}
							class="py-2 rounded-xl border text-center transition cursor-pointer font-bold
							{zoom === 'md' ? 'bg-red-700 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}"
							aria-label="Set text size to normal"
						>
							Def
						</button>
						<button
							onclick={() => zoom = 'lg'}
							class="py-2 rounded-xl border text-center transition cursor-pointer font-bold
							{zoom === 'lg' ? 'bg-red-700 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}"
							aria-label="Set text size to large"
						>
							A+
						</button>
						<button
							onclick={() => zoom = 'xl'}
							class="py-2 rounded-xl border text-center transition cursor-pointer font-bold
							{zoom === 'xl' ? 'bg-red-700 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}"
							aria-label="Set text size to extra large"
						>
							A++
						</button>
					</div>
				</div>

				<hr class="border-rose-50 border-slate-100" />

				<!-- High Contrast Toggle -->
				<label class="flex items-center justify-between py-1 cursor-pointer">
					<span class="text-slate-700">👁️ High Contrast Mode</span>
					<input
						type="checkbox"
						bind:checked={contrast}
						class="w-9 h-5 bg-slate-250 rounded-full appearance-none relative checked:bg-red-700 transition cursor-pointer
						before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition checked:before:translate-x-4"
						aria-label="Toggle High Contrast Mode"
					/>
				</label>

				<!-- Dark Mode Toggle -->
				<label class="flex items-center justify-between py-1 cursor-pointer">
					<span class="text-slate-700">🌙 Dark / Light Mode</span>
					<input
						type="checkbox"
						bind:checked={dark}
						class="w-9 h-5 bg-slate-250 rounded-full appearance-none relative checked:bg-red-700 transition cursor-pointer
						before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition checked:before:translate-x-4"
						aria-label="Toggle Dark Mode"
					/>
				</label>

				<!-- Reduce Motion Toggle -->
				<label class="flex items-center justify-between py-1 cursor-pointer">
					<span class="text-slate-700">🚫 Reduce Motion</span>
					<input
						type="checkbox"
						bind:checked={reduceMotion}
						class="w-9 h-5 bg-slate-250 rounded-full appearance-none relative checked:bg-red-700 transition cursor-pointer
						before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition checked:before:translate-x-4"
						aria-label="Toggle Reduce Motion"
					/>
				</label>

				<!-- Better Readable Font Spacing Toggle -->
				<label class="flex items-center justify-between py-1 cursor-pointer">
					<span class="text-slate-700">↔️ Enhanced Spacing</span>
					<input
						type="checkbox"
						bind:checked={spacing}
						class="w-9 h-5 bg-slate-250 rounded-full appearance-none relative checked:bg-red-700 transition cursor-pointer
						before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition checked:before:translate-x-4"
						aria-label="Toggle Enhanced Font Spacing"
					/>
				</label>
			</div>
		</div>
	{/if}

	<!-- Floating Button -->
	<button
		onclick={togglePanel}
		class="w-14 h-14 bg-red-700 hover:bg-red-800 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-700/20 hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white/20"
		aria-expanded={isOpen}
		aria-label="Toggle Accessibility Panel"
		title="Accessibility controls"
	>
		<span class="text-2xl">♿</span>
	</button>
</div>
