<script>
	import { goto } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';

	$effect(() => {
		if (!db.authLoading) {
			if (db.user) {
				goto(`/dashboard/${db.user.role}`);
			} else {
				goto('/login');
			}
		}
	});
</script>