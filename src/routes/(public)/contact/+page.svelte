<script>
	import { db } from "$lib/auth.svelte.js";

	let name = $state("");
	let email = $state("");
	let subject = $state("");
	let message = $state("");
	let isSending = $state(false);

	async function handleSubmit(e) {
		e.preventDefault();
		if (isSending) return;

		// Validation
		if (!name.trim()) {
			db.addToast("Name is required.", "error");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email.trim() || !emailRegex.test(email)) {
			db.addToast("Valid email required.", "error");
			return;
		}

		if (!subject.trim()) {
			db.addToast("Subject is required.", "error");
			return;
		}

		if (!message.trim()) {
			db.addToast("Message is required.", "error");
			return;
		}

		isSending = true;

		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					subject: subject.trim(),
					message: message.trim()
				})
			});

			const data = await res.json();

			if (res.ok && data.success) {
				db.addToast("Your message has been sent successfully.", "success");
				// Reset form
				name = "";
				email = "";
				subject = "";
				message = "";
			} else {
				db.addToast(data.error || "Unable to send message. Please try again.", "error");
			}
		} catch (err) {
			console.error("Contact query error:", err);
			db.addToast("Unable to send message. Please try again.", "error");
		} finally {
			isSending = false;
		}
	}
</script>

<div class="min-h-screen bg-baby-pink py-12 sm:py-16 px-4 sm:px-6">
	<div class="max-w-5xl mx-auto space-y-12">
		<!-- Header -->
		<div class="text-center space-y-3">
			<span
				class="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 border border-red-200 px-3 py-1 rounded-full"
			>
				GET IN TOUCH
			</span>
			<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900">
				Contact Our Coordinator Team
			</h1>
			<p class="text-slate-500 text-sm max-w-md mx-auto">
				Have questions about eligibility, dashboard features, or local
				drives? Let us know.
			</p>
		</div>

		<div class="grid md:grid-cols-12 gap-8 items-start">
			<!-- Contact Form -->
			<div
				class="md:col-span-7 bg-white border border-slate-100 p-8 rounded-3xl shadow-xl space-y-6"
			>
				<h3 class="text-xl font-bold text-slate-900">Send a Message</h3>

				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="grid sm:grid-cols-2 gap-4">
						<div class="flex flex-col gap-1.5">
							<label
								class="text-xs font-bold text-slate-500 uppercase"
								for="name">Full Name *</label
							>
							<input
								id="name"
								type="text"
								bind:value={name}
								placeholder="Enter full name"
								class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
								required
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<label
								class="text-xs font-bold text-slate-500 uppercase"
								for="email">Email Address *</label
							>
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="Enter email address"
								class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
								required
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1.5">
						<label
							class="text-xs font-bold text-slate-500 uppercase"
							for="subject">Subject *</label
						>
						<input
							id="subject"
							type="text"
							bind:value={subject}
							placeholder="Enter subject"
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label
							class="text-xs font-bold text-slate-500 uppercase"
							for="message">Message *</label
						>
						<textarea
							id="message"
							rows="5"
							bind:value={message}
							placeholder="Type your message..."
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
							required
						></textarea>
					</div>

					<button
						type="submit"
						disabled={isSending}
						class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer"
					>
						{isSending ? "Sending..." : "Send Message"}
					</button>
				</form>
			</div>

			<!-- Quick Info Cards -->
			<div class="md:col-span-5 space-y-6">
				<!-- Help Hotline Card -->
				<div
					class="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden"
				>
					<div
						class="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-xl"
					></div>
					<h4
						class="text-red-500 text-xs font-bold uppercase tracking-wider mb-2"
					>
						🚨 EMERGENCY HOTLINE
					</h4>
					<p class="text-2xl font-bold mb-3">+91 93455 81448</p>
					<p class="text-xs text-gray-400 leading-relaxed">
						Call our emergency coordinator directly if you require
						immediate matching support outside standard response
						loops.
					</p>
				</div>

				<!-- Office Card -->
				<div
					class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4"
				>
					<h4 class="text-sm font-bold text-slate-900">
						Coordination Hub
					</h4>
					<div
						class="space-y-3 text-xs text-slate-500 leading-relaxed"
					>
						<div class="flex gap-2">
							<span>📍</span>
							<span>Salem, Tamil Nadu, India.</span
							>
						</div>
						<div class="flex gap-2">
							<span>✉️</span>
							<span>lifelinklifelink2@gmail.com</span>
						</div>
						<div class="flex gap-2">
							<span>⏰</span>
							<span>Monday - Friday: 09:00 AM - 05:00 PM</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
