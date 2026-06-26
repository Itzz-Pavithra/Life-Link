<script>
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Navbar {data} />
<Toast />
<div class="flex flex-col min-h-screen">
	<main class="flex-grow">
		{@render children()}
	</main>
</div>
<Footer />
