<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import Timeline from '$lib/components/Timeline.svelte';

	let { data } = $props();

	// Request Blood form states
	let patientName = $state('');
	let bloodGroup = $state('O+');
	let units = $state(1);
	let hospital = $state('');
	let city = $state('');
	let contact = $state('');
	let urgency = $state('Normal');

	async function handleAddRequest(e) {
		e.preventDefault();
		if (!patientName || !hospital || !city || !contact) {
			db.addToast('Please fill in all blood request fields.', 'error');
			return;
		}

		const response = await fetch('/api/requests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				patientName,
				bloodGroup,
				units,
				hospital,
				city,
				contact,
				urgency
			})
		});

		const res = await response.json();
		if (res.success) {
			db.addToast(`🚨 Emergency Blood Request submitted for ${patientName}! Matching donors are being calculated.`, 'success');
			
			// Reset inputs
			patientName = '';
			hospital = '';
			city = '';
			contact = '';
			urgency = 'Normal';
			
			// Force loader reload
			await invalidateAll();
			db.activeTab = 'my-requests';
		} else {
			db.addToast(res.error || 'Failed to submit request', 'error');
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
			📋 Recipient Services
		</h1>
		<span class="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
			Role: Recipient
		</span>
	</div>

	<!-- TAB 1: DASHBOARD OVERVIEW -->
	{#if db.activeTab === 'dashboard'}
		<div class="grid md:grid-cols-3 gap-6">
			<!-- Welcome Info -->
			<div class="md:col-span-2 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-4">
				<h2 class="text-2xl font-bold text-slate-800">Hello, {data.user?.name}!</h2>
				<p class="text-slate-500 text-sm leading-relaxed">
					From your Recipient panel, you can submit emergency requests, track donor matching parameters, and locate nearby blood bank inventory stocks.
				</p>
				<div class="flex gap-3">
					<button
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-700/10 text-xs transition cursor-pointer"
						onclick={() => db.activeTab = 'request-blood'}
					>
						Request Blood Now
					</button>
				</div>
			</div>

			<!-- Profile Completion Card -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
				<h3 class="font-bold text-slate-850">Profile Completion</h3>
				<div class="flex items-center justify-between text-xs font-bold text-slate-600">
					<span>Verification Strength</span>
					<span class="text-red-700">{data.user?.profileCompletion}%</span>
				</div>
				<!-- Progress bar -->
				<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
					<div class="bg-red-700 h-full rounded-full transition-all duration-505" style="width: {data.user?.profileCompletion}%"></div>
				</div>
				<ul class="text-[10px] text-gray-500 space-y-1 bg-slate-50/50 p-3 border border-slate-100 rounded-xl">
					<li class="flex items-center gap-1.5 text-emerald-600">✓ Phone Verified</li>
					<li class="flex items-center gap-1.5 text-emerald-600">✓ Email Registered</li>
					<li class="flex items-center gap-1.5 text-red-650">✕ Missing Hospital Admittance Code</li>
				</ul>
				<button
					class="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
					onclick={() => db.activeTab = 'profile'}
				>
					Complete Medical Profile
				</button>
			</div>
		</div>

		<!-- Latest Requests summary -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Your Recent Requests</h3>
			{#if data.requests.length === 0}
				<p class="text-slate-400 text-sm">No requests found. Create one to get started.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
								<th class="py-3 px-4">ID</th>
								<th class="py-3 px-4">Patient</th>
								<th class="py-3 px-4">Blood Group</th>
								<th class="py-3 px-4">Required Units</th>
								<th class="py-3 px-4">Hospital / City</th>
								<th class="py-3 px-4">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each data.requests.slice(0, 3) as req}
								<tr class="hover:bg-slate-50/30 transition">
									<td class="py-3 px-4 font-bold text-slate-900">{req.id}</td>
									<td class="py-3 px-4 font-medium text-slate-800">{req.patientName}</td>
									<td class="py-3 px-4">
										<span class="bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-lg border border-red-100 text-xs">
											{req.bloodGroup}
										</span>
									</td>
									<td class="py-3 px-4 font-semibold text-slate-700">{req.units} Units</td>
									<td class="py-3 px-4">
										<p class="font-bold text-xs text-slate-850 leading-none">{req.hospital}</p>
										<span class="text-[10px] text-gray-500">{req.city}</span>
									</td>
									<td class="py-3 px-4">
										<span class="px-2.5 py-1 rounded-full text-xs font-bold
											{req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : ''}
											{req.status === 'Matching Donor' ? 'bg-amber-50 text-amber-700 border border-amber-250' : ''}
											{req.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-250' : ''}
											{req.status === 'Verified' ? 'bg-purple-50 text-purple-700 border border-purple-250' : ''}">
											{req.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

	<!-- TAB 2: REQUEST BLOOD -->
	{:else if db.activeTab === 'request-blood'}
		<div class="max-w-3xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg">
			<div class="text-center mb-6">
				<span class="text-4xl block mb-2">🚨</span>
				<h2 class="text-2xl font-bold text-slate-800">Create Emergency Blood Request</h2>
				<p class="text-slate-400 text-xs mt-1">This matches you automatically with registered nearby donors.</p>
			</div>

			<form onsubmit={handleAddRequest} class="grid md:grid-cols-2 gap-6">
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase" for="patname">Patient Full Name *</label>
					<input
						id="patname"
						type="text"
						bind:value={patientName}
						placeholder="Enter patient name"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase">Blood Group Required *</label>
					<select
						bind:value={bloodGroup}
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option>A+</option>
						<option>A-</option>
						<option>B+</option>
						<option>B-</option>
						<option>AB+</option>
						<option>AB-</option>
						<option>O+</option>
						<option>O-</option>
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase" for="runits">Required Units (in bags) *</label>
					<input
						id="runits"
						type="number"
						min="1"
						max="10"
						bind:value={units}
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase" for="rhosp">Hospital Name *</label>
					<input
						id="rhosp"
						type="text"
						bind:value={hospital}
						placeholder="e.g. Apollo Hospital"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase" for="rcity">City *</label>
					<input
						id="rcity"
						type="text"
						bind:value={city}
						placeholder="e.g. Salem"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase" for="rcont">Contact Number *</label>
					<input
						id="rcont"
						type="tel"
						bind:value={contact}
						placeholder="e.g. 9876543210"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="md:col-span-2 flex flex-col gap-1.5">
					<label class="text-xs font-bold text-slate-500 uppercase">Urgency Level</label>
					<select
						bind:value={urgency}
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option>Normal</option>
						<option>Urgent</option>
						<option>Critical</option>
					</select>
				</div>

				<button
					type="submit"
					class="md:col-span-2 bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition cursor-pointer"
				>
					Publish Blood Request
				</button>
			</form>
		</div>

	<!-- TAB 3: MY REQUESTS (TIMELINE) -->
	{:else if db.activeTab === 'my-requests'}
		<div class="space-y-6">
			{#if data.requests.length === 0}
				<div class="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
					<span class="text-4xl block mb-2">📋</span>
					<h3 class="text-slate-500 font-bold text-slate-700">No requests found</h3>
					<p class="text-slate-400 text-xs mt-1">You have not submitted any blood requests yet.</p>
				</div>
			{:else}
				{#each data.requests as req}
					<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
						<div class="flex flex-wrap justify-between items-center gap-4">
							<div>
								<h3 class="text-lg font-bold text-slate-800">Request for {req.patientName}</h3>
								<p class="text-xs text-gray-500">ID: {req.id} • Date: {req.date}</p>
							</div>

							<div class="flex items-center gap-3">
								<span class="bg-red-50 border border-red-150 text-red-700 px-3 py-1 rounded-xl text-xs font-bold">
									Blood Needed: {req.bloodGroup}
								</span>
								<span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-semibold">
									{req.units} Units
								</span>
							</div>
						</div>

						<!-- Animated timeline widget -->
						<Timeline currentStatus={req.status} />
					</div>
				{/each}
			{/if}
		</div>
	<!-- TAB 4: PROFILE -->
	{:else if db.activeTab === 'profile'}
		<div class="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg space-y-6">
			<h3 class="text-xl font-bold text-slate-900">Personal & Medical Details</h3>
			<form onsubmit={(e) => { e.preventDefault(); db.addToast('Medical details updated successfully.', 'success'); }} class="space-y-4">
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pname">Full Name</label>
						<input id="pname" type="text" value={data.user?.name} class="border border-slate-200 p-3 rounded-xl text-sm" disabled />
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pemail">Email Address</label>
						<input id="pemail" type="email" value={data.user?.email} class="border border-slate-200 p-3 rounded-xl text-sm" disabled />
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="pbg">Default Blood Group</label>
					<input id="pbg" type="text" value={data.user?.bloodGroup} class="border border-slate-200 p-3 rounded-xl text-sm" />
				</div>

				<button type="submit" class="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition cursor-pointer">
					Save Profile Settings
				</button>
			</form>
		</div>
	{/if}
</div>