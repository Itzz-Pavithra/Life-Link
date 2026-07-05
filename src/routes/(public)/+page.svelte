<script>
	import CompatibilityGuide from '$lib/components/CompatibilityGuide.svelte';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	const steps = $derived(data.landing?.steps || []);
	const benefits = $derived(data.landing?.benefits || []);
	const activeRequests = $derived(data.activeRequests || []);

	// Contact form fields state
	let contactName = $state('');
	let contactEmail = $state('');
	let contactSubject = $state('');
	let contactMessage = $state('');

	function handleContactSubmit(e) {
		e.preventDefault();
		if (!contactName || !contactEmail || !contactMessage) {
			db.addToast('Please fill in all required fields.', 'error');
			return;
		}
		db.addToast('Thank you! Your feedback message has been sent successfully.', 'success');
		contactName = '';
		contactEmail = '';
		contactSubject = '';
		contactMessage = '';
	}
</script>

<style>
	.glass-card-light {
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}
	.glass-card-dark {
		background: rgba(15, 23, 42, 0.45);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>

<div class="min-h-screen bg-baby-pink text-slate-900 overflow-x-hidden">
	
	<!-- 1. HERO SECTION (Bounded Banner, Bounded Height, Blurred Image Overlay) -->
	<section class="relative h-[600px] flex items-center justify-center overflow-hidden">
		<!-- Background image container with blur effect (contained inside this section only) -->
		<div class="absolute inset-0 z-0 overflow-hidden">
			<!-- Blurred background image using real img tag for robust rendering -->
			<img 
				src="/blood-donation-bg.png" 
				alt="Blood Donation Background"
				class="w-full h-full object-cover filter blur-[4px] scale-[1.05]" 
			/>
			<!-- Precise dark transparent overlay above the image for readability -->
			<div class="absolute inset-0" style="background-color: rgba(0, 0, 0, 0.45);"></div>
		</div>

		<!-- Hero Centered Content (Sharp text and buttons) -->
		<div class="relative z-10 max-w-7xl mx-auto px-6 w-full text-center text-white space-y-6 flex flex-col items-center">
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider animate-pulse">
				❤️ Emergency Life Saving Network
			</div>
			
			<h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl text-white">
				Donate Blood, <span class="text-red-500 drop-shadow-[0_2px_10px_rgba(239,68,68,0.3)]">Save Lives</span>
			</h1>
			
			<p class="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-medium">
				LifeLink connects donors with people who need blood urgently.
			</p>
			
			<div class="flex flex-wrap gap-4 justify-center pt-2">
				<a
					href="/eligibility"
					class="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
				>
					Become a Donor
				</a>
				<a
					href="/request-blood"
					class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-3.5 rounded-2xl shadow-sm transition transform hover:-translate-y-0.5 text-sm backdrop-blur-md"
				>
					Request Blood
				</a>
			</div>
		</div>
	</section>

	<!-- 2. HOW IT WORKS SECTION -->
	<section id="how-it-works" class="py-24 px-6 bg-slate-950 text-white relative">
		<!-- Background decorations -->
		<div class="absolute top-10 left-10 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute bottom-10 right-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center max-w-xl mx-auto mb-20 space-y-4">
				<span class="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
					PROCESS STEPS
				</span>
				<h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
					How LifeLink Works
				</h2>
				<p class="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
					Our platform coordinates emergency requests and availability with absolute clinical efficiency.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each steps as step}
					<div class="glass-card-dark p-8 rounded-[32px] relative group hover:shadow-xl hover:shadow-red-950/10 hover:border-white/15 transition duration-300 text-left flex flex-col justify-between min-h-64">
						<div>
							<span class="absolute top-6 right-6 text-4xl font-black text-white/5 group-hover:text-red-500/10 transition">
								{step.step}
							</span>
							<div class="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-500/20 flex items-center justify-center text-3xl mb-8">
								{step.icon}
							</div>
							<h4 class="text-lg font-bold text-white mb-3">{step.title}</h4>
							<p class="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 3. WHY DONATE BLOOD SECTION (with Compatibility Guide) -->
	<section id="why-donate" class="py-24 px-6 bg-baby-pink relative text-left">
		<div class="max-w-7xl mx-auto">
			<div class="grid lg:grid-cols-12 gap-16 items-center">
				<div class="lg:col-span-5 space-y-8">
					<div class="space-y-4">
						<span class="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 border border-red-200 px-3 py-1 rounded-full">
							WHY CHOOSE LIFELINK
						</span>
						<h2 class="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
							Hospital-Grade Logistics & Matching
						</h2>
						<p class="text-sm text-slate-600 leading-relaxed">
							LifeLink is engineered to minimize blood coordination latencies. By registering your donation status, you provide immediate lifesaving buffers in critical clinical cases.
						</p>
					</div>

					<div class="grid gap-4">
						{#each benefits as benefit}
							<div class="glass-card-light p-5 rounded-2xl border flex gap-4 items-start shadow-sm">
								<div class="text-2xl bg-red-100 p-2.5 rounded-xl border border-red-200">{benefit.icon}</div>
								<div>
									<h4 class="font-bold text-slate-900 text-sm mb-1">{benefit.title}</h4>
									<p class="text-xs text-slate-550 text-slate-500 leading-relaxed">{benefit.desc}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="lg:col-span-7">
					<CompatibilityGuide />
				</div>
			</div>
		</div>
	</section>

	<!-- 4. EMERGENCY BLOOD REQUEST SECTION -->
	<section id="emergency-requests" class="py-24 px-6 bg-slate-950 text-white relative">
		<!-- Glow overlay -->
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>

		<div class="max-w-7xl mx-auto relative z-10 text-center">
			<div class="max-w-xl mx-auto mb-16 space-y-4">
				<span class="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
					🚨 REAL-TIME MATCHING
				</span>
				<h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
					Emergency Blood Requests
				</h2>
				<p class="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
					Below are the active emergency donation requests registered on the network.
				</p>
			</div>

			<!-- Dynamic Requests List or Empty State -->
			{#if activeRequests.length === 0}
				<div class="max-w-md mx-auto glass-card-dark p-12 rounded-[32px] border text-center space-y-4 shadow-xl">
					<span class="text-5xl block animate-bounce" style="animation-duration: 3s">🩸</span>
					<h3 class="text-lg font-bold text-white">No requests found</h3>
					<p class="text-xs text-slate-400 leading-relaxed">
						There are currently no active emergency blood requests. Register as a donor to receive alerts when new patient drives are logged.
					</p>
					<div class="pt-2">
						<a href="/register" class="inline-block bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition">
							Register to Receive Alerts
						</a>
					</div>
				</div>
			{:else}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each activeRequests as req}
						<div class="glass-card-dark p-6 rounded-[32px] border hover:border-red-500/30 transition duration-300 flex flex-col justify-between text-left min-h-64 shadow-md relative overflow-hidden group">
							<!-- Urgency Tag -->
							<div class="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border
								{req.urgency === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/35 animate-pulse' : ''}
								{req.urgency === 'Urgent' ? 'bg-amber-500/20 text-amber-400 border-amber-500/35' : ''}
								{req.urgency === 'Normal' ? 'bg-slate-500/20 text-slate-400 border-slate-500/35' : ''}">
								{req.urgency}
							</div>

							<div class="space-y-6">
								<div class="flex items-center gap-3">
									<span class="w-12 h-12 bg-red-600 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 border border-red-500/20">
										{req.bloodGroup}
									</span>
									<div>
										<h4 class="font-bold text-white text-sm">Patient: {req.patientName}</h4>
										<p class="text-[10px] text-slate-400">🏥 {req.hospital} • {req.city}</p>
									</div>
								</div>

								<div class="space-y-1 text-xs text-slate-400 bg-white/5 border border-white/5 p-4 rounded-2xl">
									<p>📊 <strong>Required Units:</strong> <span class="font-bold text-white">{req.units} Bags</span></p>
									<p>📅 <strong>Date Published:</strong> {req.date}</p>
								</div>
							</div>

							<div class="mt-6">
								<a
									href="/login"
									class="w-full text-center block bg-white/10 hover:bg-red-600 hover:text-white border border-white/10 text-white font-bold py-3 rounded-2xl transition text-xs"
								>
									Log In to Help Patient
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- 5. CONTACT SECTION -->
	<section id="contact" class="py-24 px-6 bg-baby-pink relative text-left">
		<div class="max-w-7xl mx-auto">
			<div class="text-center max-w-xl mx-auto mb-16 space-y-4">
				<span class="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 border border-red-200 px-3 py-1 rounded-full">
					GET IN TOUCH
				</span>
				<h2 class="text-3xl sm:text-5xl font-extrabold text-slate-900">
					Contact Our Coordinator Team
				</h2>
				<p class="text-slate-550 text-sm max-w-md mx-auto">
					Have questions about eligibility, dashboard features, or local drives? Let us know.
				</p>
			</div>

			<div class="grid md:grid-cols-12 gap-8 items-start">
				<!-- Embedded Contact Form -->
				<div class="md:col-span-7 glass-card-light p-8 rounded-[32px] border shadow-xl space-y-6">
					<h3 class="text-xl font-bold text-slate-900">Send a Message</h3>

					<form onsubmit={handleContactSubmit} class="space-y-4">
						<div class="grid sm:grid-cols-2 gap-4">
							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-bold text-slate-500 uppercase" for="cname">Full Name *</label>
								<input
									id="cname"
									type="text"
									bind:value={contactName}
									placeholder="Enter full name"
									class="border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-sm"
									required
								/>
							</div>

							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-bold text-slate-500 uppercase" for="cemail">Email Address *</label>
								<input
									id="cemail"
									type="email"
									bind:value={contactEmail}
									placeholder="Enter email address"
									class="border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-sm"
									required
								/>
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-bold text-slate-500 uppercase" for="csubject">Subject</label>
							<input
								id="csubject"
								type="text"
								bind:value={contactSubject}
								placeholder="Enter subject"
								class="border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-sm"
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-bold text-slate-500 uppercase" for="cmessage">Message *</label>
							<textarea
								id="cmessage"
								rows="5"
								bind:value={contactMessage}
								placeholder="Type your message..."
								class="border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-sm resize-none"
								required
							></textarea>
						</div>

						<button
							type="submit"
							class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-700/25 transition transform active:scale-95 text-sm cursor-pointer"
						>
							Send Message
						</button>
					</form>
				</div>

				<!-- Quick Coordinator Contacts -->
				<div class="md:col-span-5 space-y-6">
					<!-- Hotline -->
					<div class="bg-slate-900 text-white p-8 rounded-[32px] shadow-lg relative overflow-hidden">
						<div class="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
						<h4 class="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">🚨 EMERGENCY HOTLINE</h4>
						<p class="text-3xl font-extrabold mb-4">+91 93455 81448</p>
						<p class="text-xs text-slate-400 leading-relaxed">
							Call our emergency coordinator directly if you require immediate matching support outside standard response loops.
						</p>
					</div>

					<!-- Coordination Address -->
					<div class="glass-card-light p-8 rounded-[32px] border shadow-sm space-y-6">
						<h4 class="text-base font-bold text-slate-900">Coordination Hub</h4>
						<div class="space-y-4 text-xs text-slate-650 leading-relaxed">
							<div class="flex gap-3">
								<span class="text-lg">📍</span>
								<span>Salem, Tamil Nadu, India.</span>
							</div>
							<div class="flex gap-3">
								<span class="text-lg">✉️</span>
								<span>lifelink@gmail.com</span>
							</div>
							<div class="flex gap-3">
								<span class="text-lg">⏰</span>
								<span>Monday - Friday: 09:00 AM - 05:00 PM</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
