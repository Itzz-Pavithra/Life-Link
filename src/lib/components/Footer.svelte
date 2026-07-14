<script>
	import Icon from '$lib/components/Icon.svelte';
</script>

<footer class="bg-gray-950 text-gray-400 border-t border-gray-900 mt-auto">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
			<!-- Branding -->
			<div class="sm:col-span-2 space-y-4">
				<div class="flex items-center gap-3">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-xl font-bold text-white tracking-tight">LifeLink</span>
				</div>
				<p class="text-sm max-w-sm">
					Smart Blood Donation & Emergency Matching System. Connects donors, recipients, and blood banks to save lives when seconds count.
				</p>
			</div>

			<!-- Quick Links -->
			<div>
				<h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigation</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/" class="hover:text-red-500 focus-visible:outline-2 focus-visible:outline-red-500 rounded px-1 transition">Home</a></li>
					<li><a href="/about" class="hover:text-red-500 focus-visible:outline-2 focus-visible:outline-red-500 rounded px-1 transition">About</a></li>
					<li><a href="/eligibility" class="hover:text-red-500 focus-visible:outline-2 focus-visible:outline-red-500 rounded px-1 transition">Eligibility Checker</a></li>
					<li><a href="/contact" class="hover:text-red-500 focus-visible:outline-2 focus-visible:outline-red-500 rounded px-1 transition">Contact Support</a></li>
				</ul>
			</div>

			<!-- Contacts -->
			<div>
				<h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Emergency Support</h4>
				<ul class="space-y-2 text-sm">
					<li class="flex items-center gap-2">
						<Icon name="phone" class="w-4 h-4 text-red-500" />
						<span class="text-white font-bold">+91 93455 81448</span>
					</li>
					<li class="flex items-center gap-2">
						<Icon name="mail" class="w-4 h-4 text-red-500" />
						<span>lifelinklifelink2@gmail.com</span>
					</li>
					<li class="flex items-center gap-2">
						<Icon name="map-pin" class="w-4 h-4 text-red-500" />
						<span>Salem, Tamil Nadu, India</span>
					</li>
				</ul>
			</div>
		</div>

		<hr class="border-gray-900 my-8" />

		<div class="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
			<span>© 2026 LifeLink. All rights reserved.</span>
			<div class="flex gap-4">
				<a href="/login" class="hover:text-gray-400">Administrator Console</a>
				<a href="/register" class="hover:text-gray-400">Receiver Portal</a>
			</div>
		</div>
	</div>
</footer>