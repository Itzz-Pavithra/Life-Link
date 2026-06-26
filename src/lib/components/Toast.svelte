<script>
	import { db } from '$lib/auth.svelte.js';
</script>

<div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
	{#each db.toasts as toast (toast.id)}
		<div
			class="flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0
			{toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : ''}
			{toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-medium' : ''}
			{toast.type === 'error' ? 'bg-red-500/10 border-red-500/25 text-red-400' : ''}
			{toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' : ''}"
		>
			<span class="text-xl">
				{#if toast.type === 'success'}
					✅
				{:else if toast.type === 'warning'}
					⚠️
				{:else if toast.type === 'error'}
					❌
				{:else}
					ℹ️
				{/if}
			</span>
			<div class="flex-1 text-sm font-semibold">{toast.message}</div>
			<button
				class="text-gray-400 hover:text-white text-xs p-1"
				onclick={() => { db.toasts = db.toasts.filter(t => t.id !== toast.id); }}
			>
				✕
			</button>
		</div>
	{/each}
</div>
