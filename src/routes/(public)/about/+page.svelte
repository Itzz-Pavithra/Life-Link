<script>
	import Icon from '$lib/components/Icon.svelte';
</script>

<div class="min-h-screen bg-baby-pink py-16 px-6">
	<div class="max-w-4xl mx-auto space-y-12">
		<!-- Header -->
		<div class="text-center space-y-4">
			<span class="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 border border-red-200 px-3 py-1 rounded-full">
				ABOUT LIFELINK
			</span>
			<h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
				Bridging the Gap in Emergency Matching
			</h1>
			<p class="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
				LifeLink is a smart blood donation and emergency matching platform connecting donors, recipients, and blood banks.
			</p>
		</div>

		<!-- Team & Vision -->
		<div class="grid md:grid-cols-2 gap-8 pt-6">
			<div class="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-4">
				<div class="text-red-700"><Icon name="target" size={32} /></div>
				<h3 class="text-xl font-bold text-slate-900">Our Mission</h3>
				<p class="text-slate-500 text-sm leading-relaxed">
					To minimize matching latency in critical environments by leveraging algorithmic compatibility grids, real-time availability filters, and automated notification loops.
				</p>
			</div>

			<div class="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-4">
				<div class="text-red-700"><Icon name="rocket" size={32} /></div>
				<h3 class="text-xl font-bold text-slate-900">Emergency Matching</h3>
				<p class="text-slate-500 text-sm leading-relaxed">
					Operating on real-time availability filters, dynamic regional inventory controls, and immediate notification routing to ensure blood reaches patients without latency.
				</p>
			</div>
		</div>

		<!-- Core Values -->
		<div class="bg-slate-900 text-white p-8 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden">
			<div class="absolute top-0 right-0 w-48 h-48 bg-red-700/10 rounded-full blur-2xl"></div>
			
			<h3 class="text-2xl font-bold mb-6">Designed with Passion and Precision</h3>
			
			<div class="grid sm:grid-cols-3 gap-6 text-sm">
				<div class="space-y-2">
					<strong class="text-red-500 text-lg">01.</strong>
					<h4 class="font-bold text-white">Universal Accessibility</h4>
					<p class="text-gray-400 text-xs">Simulates responsive layouts across mobile screens and high-resolution monitors.</p>
				</div>
				<div class="space-y-2">
					<strong class="text-red-500 text-lg">02.</strong>
					<h4 class="font-bold text-white">Real-time Coordination</h4>
					<p class="text-gray-400 text-xs">Instantly syncs donor availability lists, medical needs, and hospital emergency requests.</p>
				</div>
				<div class="space-y-2">
					<strong class="text-red-500 text-lg">03.</strong>
					<h4 class="font-bold text-white">Glassmorphic UI</h4>
					<p class="text-gray-400 text-xs">Features modern, smooth animations, gradient borders, and soft shadows.</p>
				</div>
			</div>
		</div>
	</div>
</div>
