<script>
	import CompatibilityGuide from '$lib/components/CompatibilityGuide.svelte';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	const stats = $derived(data.landing?.stats || []);
	const steps = $derived(data.landing?.steps || []);
	const benefits = $derived(data.landing?.benefits || []);
	const faqs = $derived(data.landing?.faqs || []);
	const testimonials = $derived(data.landing?.testimonials || []);

	let activeFaq = $state(null);
</script>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-12px) rotate(2deg); }
	}
	@keyframes pulse-glow-slow {
		0%, 100% { transform: scale(1); opacity: 0.15; }
		50% { transform: scale(1.08); opacity: 0.3; }
	}
	.float-drop {
		animation: float 5s ease-in-out infinite;
	}
	.pulse-glow {
		animation: pulse-glow-slow 6s ease-in-out infinite;
	}
</style>

<div class="min-h-screen bg-baby-pink text-slate-800 overflow-x-hidden">
	<!-- Hero Section -->
	<section class="relative bg-gradient-to-b from-red-55/20 via-baby-pink to-baby-pink pt-28 pb-24 px-6">
		<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<div class="absolute top-10 left-10 w-96 h-96 bg-red-400/5 rounded-full blur-3xl pulse-glow"></div>
			<div class="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pulse-glow" style="animation-delay: 2s"></div>
		</div>

		<div class="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center relative z-10">
			<!-- Hero Text -->
			<div class="lg:col-span-7 space-y-8 text-left">
				<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100/50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider animate-pulse">
					❤️ Emergency Life Saving Network
				</div>
				<h1 class="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
					Connecting Blood <span class="text-red-700">Donors</span> & <span class="text-red-650 text-red-650">Recipients</span> Instantly
				</h1>
				<p class="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
					LifeLink is a premium, real-time matching network built to eliminate blood inventory latency. Check your eligibility, register your availability, and coordinate deliveries securely.
				</p>
				<div class="flex flex-wrap gap-4 pt-2">
					<!-- Flow logic redirection: Donor must go to Eligibility check first -->
					<a
						href="/eligibility"
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-red-700/25 transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
					>
						Donate Blood (Check Eligibility)
					</a>
					<a
						href="/register"
						class="bg-white border border-slate-200 text-slate-700 hover:text-red-700 hover:border-red-200 font-bold px-8 py-4 rounded-2xl shadow-sm transition transform hover:-translate-y-0.5 text-sm"
					>
						Request Blood (Register)
					</a>
				</div>
			</div>

			<!-- Visual Widget -->
			<div class="lg:col-span-5 flex justify-center relative">
				<div class="relative w-80 h-80 sm:w-96 sm:h-96 bg-white border border-slate-100 rounded-[40px] shadow-2xl p-8 flex flex-col justify-center items-center overflow-hidden group hover:shadow-red-150 transition-all duration-500">
					<!-- Floating Background circles -->
					<div class="absolute -top-10 -right-10 w-28 h-28 bg-red-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
					<div class="absolute -bottom-10 -left-10 w-28 h-28 bg-red-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
					
					<!-- LifeLink logo display -->
					<div class="float-drop flex flex-col items-center">
						<img src="/logo.png" alt="LifeLink Branding" class="w-44 h-44 object-contain mb-4 filter drop-shadow-2xl" />
						<div class="text-center">
							<span class="text-2xl font-black text-slate-900">LifeLink Node</span>
							<div class="w-16 h-1 bg-red-650 bg-red-600 mx-auto mt-2 rounded-full"></div>
						</div>
					</div>

					<!-- Heartbeat Monitor simulation widget -->
					<div class="absolute bottom-6 left-6 right-6 border border-red-105 bg-red-50/50 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
						<div class="flex items-center gap-2.5">
							<span class="text-xl animate-pulse">💓</span>
							<div class="text-left">
								<p class="text-xs font-black text-slate-950">Matching Engine</p>
								<p class="text-[10px] text-gray-500">Listening to active nodes...</p>
							</div>
						</div>
						<span class="text-[10px] font-bold text-red-700 bg-red-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider">Online</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Dynamic Statistics Counters -->
	<section class="max-w-7xl mx-auto px-6 py-12">
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
			{#each stats as stat}
				<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center transition hover:shadow-xl hover:-translate-y-1 duration-300">
					<span class="text-4xl mb-2 block">{stat.icon}</span>
					<h3 class="text-3xl font-black text-slate-900 mb-1">{stat.value}</h3>
					<p class="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- How LifeLink Works -->
	<section class="bg-red-50/10 border-y border-red-100/30 py-24 px-6">
		<div class="max-w-7xl mx-auto">
			<div class="text-center max-w-xl mx-auto mb-16 space-y-3">
				<h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
					How LifeLink Works
				</h2>
				<p class="text-slate-550 text-sm max-w-md mx-auto">
					Our platform coordinates emergency requests and availability with absolute clinical efficiency.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each steps as step}
					<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative group hover:shadow-md transition text-left">
						<span class="absolute top-4 right-4 text-4xl font-black text-slate-100 group-hover:text-red-50/50 transition">
							{step.step}
						</span>
						<div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl mb-6">
							{step.icon}
						</div>
						<h4 class="text-base font-bold text-slate-900 mb-2">{step.title}</h4>
						<p class="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Compatibility Chart -->
	<section class="max-w-7xl mx-auto px-6 py-24">
		<div class="grid lg:grid-cols-12 gap-16 items-center">
			<div class="lg:col-span-5 space-y-6 text-left">
				<h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
					Understand Your Blood Group Compatibility
				</h2>
				<p class="text-sm text-slate-650 leading-relaxed">
					Blood compatibility is crucial for emergency matchings. Different blood groups have distinct antigens and antibodies that determine who can safely give or receive blood.
				</p>
				
				<div class="space-y-4 pt-2">
					<div class="flex items-start gap-3">
						<span class="text-emerald-500 text-lg font-bold">✔</span>
						<div>
							<strong class="text-slate-900 block text-sm">Universal Donor</strong>
							<span class="text-xs text-slate-500">O Negative (O-) blood can be transfused to patients of any blood group.</span>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-sky-500 text-lg font-bold">✔</span>
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
	<section class="bg-slate-900 text-white py-24 px-6 relative text-left">
		<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<div class="absolute top-1/2 left-10 w-96 h-96 bg-red-700/5 rounded-full blur-3xl"></div>
		</div>

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center max-w-xl mx-auto mb-16 space-y-3">
				<span class="text-xs font-bold text-red-500 uppercase tracking-widest block">WHY LIFELINK</span>
				<h2 class="text-3xl sm:text-4xl font-bold">Hospital-Grade Logistics</h2>
				<p class="text-gray-400 text-sm">
					Engineered with the care and responsiveness that critical environments demand.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				{#each benefits as benefit}
					<div class="bg-gray-800/40 border border-gray-805 border-gray-800 p-8 rounded-3xl shadow-xl backdrop-blur">
						<div class="text-4xl mb-6">{benefit.icon}</div>
						<h3 class="text-lg font-bold mb-3">{benefit.title}</h3>
						<p class="text-xs text-gray-400 leading-relaxed">{benefit.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Testimonials -->
	<section class="max-w-7xl mx-auto px-6 py-24">
		<div class="text-center max-w-xl mx-auto mb-16 space-y-2">
			<h2 class="text-3xl font-extrabold text-slate-900">What Health Professionals Say</h2>
			<p class="text-xs text-slate-500">Stories of matches made and lives saved through the LifeLink network.</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			{#each testimonials as t}
				<div class="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col justify-between text-left">
					<p class="italic text-slate-600 mb-6 text-base leading-relaxed">
						" {t.quote} "
					</p>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700">
							{t.author.charAt(0)}
						</div>
						<div>
							<h4 class="font-bold text-slate-900 text-sm leading-none">{t.author}</h4>
							<span class="text-xs text-slate-550 text-slate-500 mt-1 block">{t.role}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ -->
	<section class="bg-red-55/10 py-24 px-6 border-t border-red-100/30">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-slate-900 mb-16">
				Frequently Asked Questions
			</h2>

			<div class="space-y-4 text-left">
				{#each faqs as faq, index}
					<div class="bg-white border border-slate-205 border-slate-200/60 rounded-2xl overflow-hidden shadow-sm transition">
						<button
							class="w-full p-5 text-left font-bold text-slate-800 flex justify-between items-center hover:bg-slate-50 transition text-sm cursor-pointer"
							onclick={() => activeFaq = activeFaq === index ? null : index}
						>
							<span>{faq.q}</span>
							<span class="text-xs transition-transform duration-300 {activeFaq === index ? 'rotate-180 text-red-700' : 'text-slate-400'}">
								▼
							</span>
						</button>
						{#if activeFaq === index}
							<div class="p-5 border-t border-slate-100 text-xs text-slate-500 leading-relaxed bg-slate-50/50">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="bg-red-700 text-white py-24 px-6 text-center relative overflow-hidden">
		<!-- Glowing shapes -->
		<div class="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
		<div class="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

		<div class="max-w-3xl mx-auto space-y-6 relative z-10">
			<h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
				Ready to Make an Impact?
			</h2>
			<p class="text-red-100 text-base leading-relaxed max-w-xl mx-auto">
				Join hundreds of voluntary medical professionals. Register request tickets or check donation eligibility.
			</p>
			<div class="flex flex-wrap gap-4 justify-center pt-4">
				<a
					href="/eligibility"
					class="bg-white text-red-700 font-bold px-8 py-3.5 rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
				>
					Start Eligibility Test
				</a>
				<a
					href="/login"
					class="bg-transparent border border-red-300 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-2xl transition text-sm"
				>
					Access Account
				</a>
			</div>
		</div>
	</section>
</div>
