<script>
	import CompatibilityGuide from '$lib/components/CompatibilityGuide.svelte';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	const stats = data.landing?.stats || [];
	const steps = data.landing?.steps || [];
	const benefits = data.landing?.benefits || [];
	const faqs = data.landing?.faqs || [];
	const testimonials = data.landing?.testimonials || [];

	let activeFaq = $state(null);
</script>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-10px) rotate(3deg); }
	}
	@keyframes pulse-gaze {
		0%, 100% { transform: scale(1); opacity: 0.2; }
		50% { transform: scale(1.1); opacity: 0.4; }
	}
	.float-drop {
		animation: float 6s ease-in-out infinite;
	}
	.pulse-glow {
		animation: pulse-gaze 4s ease-in-out infinite;
	}
</style>

<div class="min-h-screen bg-baby-pink text-slate-800 overflow-x-hidden">
	<!-- Hero Section -->
	<section class="relative bg-gradient-to-b from-red-100/30 via-baby-pink to-baby-pink pt-24 pb-20 px-6">
		<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<div class="absolute top-10 left-10 w-96 h-96 bg-red-400/5 rounded-full blur-3xl pulse-glow"></div>
			<div class="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pulse-glow" style="animation-delay: 2s"></div>
		</div>

		<div class="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
			<div class="lg:col-span-7 space-y-6 text-left">
				<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100/50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider animate-pulse">
					❤️ EMERGENCY LIFE SAVING PORTAL
				</div>
				<h1 class="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
					Connecting Blood <span class="text-red-700">Donors</span> & <span class="text-red-600">Recipients</span> Instantly
				</h1>
				<p class="text-lg text-slate-600 max-w-xl leading-relaxed">
					LifeLink is a premium, real-time matching network built to eliminate blood inventory latency. Find donors, register availability, and coordinate deliveries securely.
				</p>
				<div class="flex flex-wrap gap-4 pt-2">
					<a
						href="/register"
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-red-700/25 transition transform hover:-translate-y-0.5 active:scale-95"
					>
						Register as Donor
					</a>
					<a
						href="/eligibility"
						class="bg-white border border-slate-200 text-slate-700 hover:text-red-700 hover:border-red-200 font-bold px-8 py-3.5 rounded-2xl shadow-sm transition transform hover:-translate-y-0.5"
					>
						Check Eligibility
					</a>
				</div>
			</div>

			<!-- Dynamic Visual Widget (Lightbox 3D effect) -->
			<div class="lg:col-span-5 flex justify-center relative">
				<div class="relative w-80 h-80 sm:w-96 sm:h-96 bg-white border border-slate-100 rounded-[40px] shadow-2xl p-8 flex flex-col justify-center items-center overflow-hidden group hover:shadow-red-150 transition-all duration-500">
					<!-- Floating Background circles -->
					<div class="absolute -top-10 -right-10 w-28 h-28 bg-red-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
					<div class="absolute -bottom-10 -left-10 w-28 h-28 bg-red-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
					
					<!-- LifeLink logo display -->
					<div class="float-drop flex flex-col items-center">
						<img src="/logo.png" alt="LifeLink Branding" class="w-48 h-48 object-contain mb-4 filter drop-shadow-2xl" />
						<div class="text-center">
							<span class="text-2xl font-extrabold text-slate-900">LifeLink</span>
							<div class="w-16 h-1 bg-red-600 mx-auto mt-2 rounded-full"></div>
						</div>
					</div>

					<!-- Heartbeat Monitor simulation widget -->
					<div class="absolute bottom-6 left-6 right-6 border border-red-100 bg-red-50/50 rounded-2xl p-3 flex items-center justify-between shadow-sm">
						<div class="flex items-center gap-2">
							<span class="text-xl animate-pulse">💓</span>
							<div class="text-left">
								<p class="text-xs font-extrabold text-slate-950">Matching Engine</p>
								<p class="text-[10px] text-gray-500">Active and listening...</p>
							</div>
						</div>
						<span class="text-xs font-bold text-red-700 bg-red-100/50 px-2.5 py-1 rounded-full">Online</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Animated Statistics Counters -->
	<section class="max-w-7xl mx-auto px-6 py-12">
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
			{#each stats as stat}
				<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-md text-center transition hover:shadow-xl hover:-translate-y-1 duration-300">
					<span class="text-4xl mb-2 block">{stat.icon}</span>
					<h3 class="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}+</h3>
					<p class="text-sm font-semibold text-slate-500">{stat.label}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- How LifeLink Works -->
	<section class="bg-red-50/10 border-y border-red-100/30 py-20 px-6">
		<div class="max-w-7xl mx-auto">
			<div class="text-center max-w-xl mx-auto mb-16 space-y-3">
				<h2 class="text-3xl sm:text-4xl font-bold text-slate-900">
					How LifeLink Works
				</h2>
				<p class="text-slate-500 text-sm">
					Our platform coordinates emergency requests and availability with absolute efficiency.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each steps as step}
					<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative group hover:shadow-md transition">
						<span class="absolute top-4 right-4 text-4xl font-black text-slate-100 group-hover:text-red-50/50 transition">
							{step.step}
						</span>
						<div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl mb-6">
							{step.icon}
						</div>
						<h4 class="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
						<p class="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Interactive Compatibility Section -->
	<section class="max-w-7xl mx-auto px-6 py-20">
		<div class="grid lg:grid-cols-12 gap-12 items-center">
			<div class="lg:col-span-5 space-y-6">
				<h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
					Understand Your Blood Group Compatibility
				</h2>
				<p class="text-slate-600 leading-relaxed">
					Blood compatibility is crucial for emergency matchings. Different blood groups have distinct antigens and antibodies that determine who can safely give or receive blood.
				</p>
				
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<span class="text-emerald-500 text-lg">✔</span>
						<div>
							<strong class="text-slate-900 block text-sm">Universal Donor</strong>
							<span class="text-xs text-slate-500">O Negative (O-) blood can be transfused to patients of any blood group.</span>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-sky-500 text-lg">✔</span>
						<div>
							<strong class="text-slate-900 block text-sm">Universal Recipient</strong>
							<span class="text-xs text-slate-500">AB Positive (AB+) individuals can safely receive blood of any blood group.</span>
						</div>
					</div>
				</div>
			</div>

			<div class="lg:col-span-7">
				<CompatibilityGuide />
			</div>
		</div>
	</section>

	<!-- Why Choose LifeLink -->
	<section class="bg-slate-900 text-white py-20 px-6 relative">
		<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<div class="absolute top-1/2 left-10 w-96 h-96 bg-red-700/5 rounded-full blur-3xl"></div>
		</div>

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center max-w-xl mx-auto mb-16 space-y-3">
				<span class="text-xs font-bold text-red-500 uppercase tracking-widest">WHY LIFELINK</span>
				<h2 class="text-3xl sm:text-4xl font-bold">A Premium Health Network</h2>
				<p class="text-gray-400 text-sm">
					Engineered with the care and responsiveness that critical environments demand.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				{#each benefits as benefit}
					<div class="bg-gray-800/40 border border-gray-800 p-8 rounded-3xl shadow-xl backdrop-blur">
						<div class="text-4xl mb-6">{benefit.icon}</div>
						<h3 class="text-xl font-bold mb-3">{benefit.title}</h3>
						<p class="text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Testimonial Section -->
	<section class="max-w-7xl mx-auto px-6 py-20">
		<div class="text-center max-w-xl mx-auto mb-12 space-y-2">
			<h2 class="text-3xl font-bold text-slate-900">What People Say</h2>
			<p class="text-sm text-slate-500">Stories of matches made and lives saved through the LifeLink network.</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			{#each testimonials as t}
				<div class="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col justify-between">
					<p class="italic text-slate-600 mb-6 text-lg">
						" {t.quote} "
					</p>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700">
							{t.author.charAt(0)}
						</div>
						<div>
							<h4 class="font-bold text-slate-900 text-sm">{t.author}</h4>
							<span class="text-xs text-slate-500">{t.role}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ Collapse Section -->
	<section class="bg-red-50/10 py-20 px-6 border-t border-red-100/30">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-slate-900 mb-12">
				Frequently Asked Questions
			</h2>

			<div class="space-y-4">
				{#each faqs as faq, index}
					<div class="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm transition">
						<button
							class="w-full p-5 text-left font-bold text-slate-800 flex justify-between items-center hover:bg-slate-50 transition"
							onclick={() => activeFaq = activeFaq === index ? null : index}
						>
							<span>{faq.q}</span>
							<span class="text-xl transition-transform duration-300 {activeFaq === index ? 'rotate-185 text-red-700' : ''}">
								▼
							</span>
						</button>
						{#if activeFaq === index}
							<div class="p-5 border-t border-slate-100 text-sm text-slate-500 leading-relaxed bg-slate-50/50">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Call To Action -->
	<section class="bg-red-700 text-white py-20 px-6 text-center relative overflow-hidden">
		<!-- Glowing shapes -->
		<div class="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
		<div class="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

		<div class="max-w-3xl mx-auto space-y-6 relative z-10">
			<h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
				Ready to Make an Impact?
			</h2>
			<p class="text-red-100 text-lg leading-relaxed max-w-xl mx-auto">
				Join hundreds of volunteers and healthcare personnel today. Help us match blood requests in your region.
			</p>
			<div class="flex flex-wrap gap-4 justify-center pt-4">
				<a
					href="/register"
					class="bg-white text-red-700 font-bold px-8 py-3.5 rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:scale-95"
				>
					Sign Up Today
				</a>
				<a
					href="/login"
					class="bg-transparent border border-red-300 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-2xl transition"
				>
					Access Account
				</a>
			</div>
		</div>
	</section>
</div>
