<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();
	let isAvailable = $state(true);

	async function handleAcceptEmergency(id) {
		const req = data.requests.find(r => r.id === id);
		if (req) {
			const response = await fetch('/api/requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, status: 'Accepted' })
			});
			const res = await response.json();
			if (res.success) {
				db.addToast(`🚨 You have ACCEPTED the emergency request for ${req.patientName}. The coordinate details have been sent to your phone.`, 'success');
				await invalidateAll();
			} else {
				db.addToast(res.error || 'Failed to accept request', 'error');
			}
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
			🩸 Donor Portal
		</h1>
		<span class="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
			Role: Blood Donor
		</span>
	</div>

	<!-- TAB 1: DASHBOARD OVERVIEW -->
	{#if db.activeTab === 'dashboard'}
		<div class="grid md:grid-cols-3 gap-6">
			<!-- Profile Card -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
				<h3 class="font-bold text-slate-900">My Donor Identity</h3>
				<div class="flex items-center gap-4">
					<span class="w-16 h-16 rounded-3xl bg-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-700/20">
						{data.user?.bloodGroup || 'O+'}
					</span>
					<div class="text-left">
						<h4 class="font-bold text-slate-800 text-base">{data.user?.name}</h4>
						<p class="text-[10px] text-gray-500">Voluntary blood donor</p>
					</div>
				</div>
				<hr class="border-slate-50" />
				<div class="space-y-2 text-xs text-slate-500">
					<p><strong>Mobile:</strong> +91 98765 43210</p>
					<p><strong>Region:</strong> Salem, TN</p>
					<p><strong>Last Donation:</strong> 10th March 2026</p>
				</div>
			</div>

			<!-- Availability Status Widget -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
				<div class="space-y-2">
					<h3 class="font-bold text-slate-900">Donation Availability</h3>
					<p class="text-xs text-slate-500">Set if you are active and available for emergency match requests.</p>
				</div>

				<div class="flex items-center justify-between border border-slate-105 bg-slate-50 p-4 rounded-2xl my-4">
					<span class="text-sm font-semibold text-slate-800">Available for matches</span>
					<!-- Styled Toggle Switch -->
					<button
						class="w-12 h-6 rounded-full p-1 transition-colors duration-300 relative cursor-pointer
						{isAvailable ? 'bg-red-700' : 'bg-slate-200'}"
						onclick={() => { isAvailable = !isAvailable; db.addToast(`Availability updated to: ${isAvailable ? 'Available' : 'Unavailable'}`, 'info'); }}
					>
						<span
							class="block w-4 h-4 rounded-full bg-white transition-transform duration-300 transform
							{isAvailable ? 'translate-x-6' : 'translate-x-0'}"
						></span>
					</button>
				</div>

				<p class="text-[10px] text-slate-450 italic">
					{isAvailable ? '✔ Nearby recipients can find and matching requests can auto-route to you.' : '✕ You are currently hidden from query engines.'}
				</p>
			</div>

			<!-- Metrics Summary Card -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
				<h3 class="font-bold text-slate-900">Donor Statistics</h3>
				<div class="grid grid-cols-2 gap-4">
					<div class="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-center">
						<span class="text-2xl block mb-1">🩸</span>
						<h4 class="text-2xl font-black text-red-750 text-red-700">{data.stats.donationsCount}</h4>
						<p class="text-[10px] text-slate-500">Donations Done</p>
					</div>

					<div class="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
						<span class="text-2xl block mb-1">💖</span>
						<h4 class="text-2xl font-black text-emerald-750 text-emerald-700">{data.stats.livesSavedCount}</h4>
						<p class="text-[10px] text-slate-500">Lives Saved</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Active Emergency Requests section on main Dashboard -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-2xl">🚨</span>
				<div>
					<h3 class="font-bold text-lg text-slate-900">Active Emergency Requests</h3>
					<p class="text-xs text-slate-500">These patients require urgent compatibility matches.</p>
				</div>
			</div>

			<div class="grid sm:grid-cols-2 gap-6">
				{#each data.requests.filter(r => r.urgency === 'Critical' || r.urgency === 'Urgent') as req}
					<div class="bg-white border border-slate-150 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:shadow-xl transition flex flex-col justify-between min-h-60">
						<div class="absolute top-4 right-4 bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider animate-pulse">
							{req.urgency}
						</div>

						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<span class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-extrabold flex items-center justify-center text-lg">
									{req.bloodGroup}
								</span>
								<div class="text-left">
									<h4 class="font-bold text-slate-900 text-sm">Patient: {req.patientName}</h4>
									<p class="text-[10px] text-gray-500">🏥 {req.hospital} • {req.city}</p>
								</div>
							</div>

							<div class="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-[10px] text-slate-500 space-y-1">
								<p><strong>Required Units:</strong> {req.units} units</p>
								<p><strong>Current Status:</strong> <span class="font-bold text-red-750 text-red-700">{req.status}</span></p>
							</div>
						</div>

						<div class="mt-4">
							{#if req.status !== 'Accepted'}
								<button
									class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
									onclick={() => handleAcceptEmergency(req.id)}
								>
									Accept Emergency Drive
								</button>
							{:else}
								<span class="w-full block text-center bg-emerald-50 border border-emerald-250 text-emerald-750 text-emerald-700 font-extrabold py-2.5 rounded-xl text-xs">
									Accepted ✓
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

	<!-- TAB 2: DONATION HISTORY -->
	{:else if db.activeTab === 'donation-history'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Historical Donations Log</h3>
			
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
							<th class="py-3 px-4">Donation Date</th>
							<th class="py-3 px-4">Hospital Organization</th>
							<th class="py-3 px-4">Quantity Supplied</th>
							<th class="py-3 px-4">Campaign Drive Type</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50">
						{#each data.history as record}
							<tr class="hover:bg-slate-50/30 transition">
								<td class="py-3 px-4 font-bold text-slate-900">{record.date}</td>
								<td class="py-3 px-4 font-medium text-slate-800">{record.hospital}</td>
								<td class="py-3 px-4 font-semibold text-red-700">{record.units} Bag (Whole Blood)</td>
								<td class="py-3 px-4">
									<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
										{record.type}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>


	<!-- TAB 3: AVAILABILITY -->
	{:else if db.activeTab === 'availability'}
		<div class="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg space-y-6 text-left">
			<h3 class="text-xl font-bold text-slate-900">Manage Availability Toggles</h3>
			<p class="text-sm text-slate-500 leading-relaxed">
				Keep this updated. If you register availability, hospitals can search your compatibility and trigger immediate contact.
			</p>
			
			<div class="flex items-center justify-between border border-slate-100 bg-slate-50 p-4 rounded-2xl">
				<span class="text-sm font-semibold text-slate-800">Whole Blood Availability</span>
				<!-- Toggle Button -->
				<button
					class="w-12 h-6 rounded-full p-1 transition-colors duration-300 relative cursor-pointer
					{isAvailable ? 'bg-red-750 bg-red-700' : 'bg-slate-200'}"
					onclick={() => { isAvailable = !isAvailable; db.addToast(`Availability updated: ${isAvailable ? 'Available' : 'Unavailable'}`, 'info'); }}
				>
					<span
						class="block w-4 h-4 rounded-full bg-white transition-transform duration-300 transform
						{isAvailable ? 'translate-x-6' : 'translate-x-0'}"
					></span>
				</button>
			</div>
		</div>

	<!-- TAB 4: PROFILE -->
	{:else if db.activeTab === 'profile'}
		<div class="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg space-y-6">
			<h3 class="text-xl font-bold text-slate-900">Donor Profile & Settings</h3>
			<form onsubmit={(e) => { e.preventDefault(); db.addToast('Donor details saved.', 'success'); }} class="space-y-4">
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpname">Full Name</label>
						<input id="dpname" type="text" value={data.user?.name} class="border border-slate-200 p-3 rounded-xl text-sm" disabled />
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpemail">Email Address</label>
						<input id="dpemail" type="email" value={data.user?.email} class="border border-slate-200 p-3 rounded-xl text-sm" disabled />
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpbg">Blood Group</label>
					<input id="dpbg" type="text" value={data.user?.bloodGroup} class="border border-slate-200 p-3 rounded-xl text-sm" />
				</div>

				<button type="submit" class="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition cursor-pointer">
					Save Profile Settings
				</button>
			</form>
		</div>
	{/if}
</div>