<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data?.user) {
			goto(`/dashboard/${data.user.role}`);
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex items-center justify-center min-h-[60vh]">
	<div class="flex flex-col items-center gap-4 text-center">
		<div class="w-10 h-10 border-4 border-red-200 border-t-red-700 rounded-full animate-spin"></div>
		<p class="text-sm font-semibold text-slate-500">Routing to dashboard node...</p>
	</div>
</div>