<script>
	let { imageSrc, onCrop, onCancel } = $props();

	let zoom = $state(1.5);
	let posX = $state(0);
	let posY = $state(0);

	let imgElement = $state(null);
	let isDragging = $state(false);
	let startX = $state(0);
	let startY = $state(0);

	function onMouseDown(e) {
		isDragging = true;
		startX = e.clientX - posX;
		startY = e.clientY - posY;
	}

	function onMouseMove(e) {
		if (!isDragging) return;
		posX = e.clientX - startX;
		posY = e.clientY - startY;
	}

	function onMouseUp() {
		isDragging = false;
	}

	function onTouchStart(e) {
		isDragging = true;
		startX = e.touches[0].clientX - posX;
		startY = e.touches[0].clientY - posY;
	}

	function onTouchMove(e) {
		if (!isDragging) return;
		posX = e.touches[0].clientX - startX;
		posY = e.touches[0].clientY - startY;
	}

	function handleApply() {
		if (!imgElement) return;

		const canvas = document.createElement('canvas');
		canvas.width = 300;
		canvas.height = 300;
		const ctx = canvas.getContext('2d');

		// The display crop window is 200x200, centered in a 300x300 container.
		// Crop box top-left inside 300x300 container is at (50, 50).
		// Scale is the ratio of natural image width to display width.
		const displayScale = imgElement.naturalWidth / imgElement.width;

		// Calculate exact crop offsets
		const cropBoxX = 50;
		const cropBoxY = 50;
		const cropSize = 200;

		const sourceX = (cropBoxX - posX) * displayScale;
		const sourceY = (cropBoxY - posY) * displayScale;
		const sourceWidth = cropSize * displayScale;
		const sourceHeight = cropSize * displayScale;

		try {
			ctx.drawImage(
				imgElement,
				sourceX,
				sourceY,
				sourceWidth,
				sourceHeight,
				0,
				0,
				300,
				300
			);

			const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
			if (onCrop) onCrop(croppedUrl);
		} catch (err) {
			console.error('Failed to crop image:', err);
		}
	}
</script>

<div class="fixed inset-0 bg-slate-955/70 backdrop-blur-md flex items-center justify-center p-6 z-[99999]" role="dialog" aria-modal="true">
	<div class="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 text-center hover-card-premium">
		<div>
			<h3 class="text-lg font-bold text-slate-800">Crop Profile Photo</h3>
			<p class="text-xs text-slate-500 mt-1">Drag the image to adjust position and use the slider to zoom.</p>
		</div>

		<!-- Crop Viewport Container -->
		<div 
			class="relative w-[300px] h-[300px] bg-slate-100 rounded-2xl overflow-hidden mx-auto border border-slate-200 select-none cursor-move"
			onmousedown={onMouseDown}
			onmousemove={onMouseMove}
			onmouseup={onMouseUp}
			onmouseleave={onMouseUp}
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onMouseUp}
		>
			<!-- Image Element -->
			{#if imageSrc}
				<img
					bind:this={imgElement}
					src={imageSrc}
					alt="Crop Preview"
					class="absolute origin-center max-w-none pointer-events-none"
					style="
						transform: translate({posX}px, {posY}px) scale({zoom});
						width: 200px;
						height: auto;
						left: 50px;
						top: 50px;
					"
				/>
			{/if}

			<!-- Crop Mask Overlay (Circular mask) -->
			<div class="absolute inset-0 pointer-events-none ring-opacity-60 ring-[999px] ring-slate-900/60 flex items-center justify-center">
				<div class="w-[200px] h-[200px] rounded-full border-2 border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"></div>
			</div>
		</div>

		<!-- Zoom Slider Control -->
		<div class="space-y-1.5 px-4 text-left">
			<label class="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
				<span>Zoom Level</span>
				<span>{Math.round(zoom * 100)}%</span>
			</label>
			<input
				type="range"
				min="1"
				max="3"
				step="0.1"
				bind:value={zoom}
				class="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-700 focus:outline-none"
			/>
		</div>

		<!-- Actions -->
		<div class="flex gap-4">
			<button
				type="button"
				onclick={onCancel}
				class="flex-1 py-3 border border-slate-200 text-secondary font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer transition"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleApply}
				class="flex-1 py-3 bg-primary hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
			>
				Apply Crop
			</button>
		</div>
	</div>
</div>
