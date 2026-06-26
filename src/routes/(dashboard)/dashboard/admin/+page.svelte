<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import AnalyticsCharts from '$lib/components/AnalyticsCharts.svelte';

	let { data } = $props();

	function handleVerifyUser(name) {
		db.addToast(`User ${name} credentials verified successfully. Security token released.`, 'success');
	}

	async function handleActionRequest(id, newStatus) {
		const req = data.requests.find(r => r.id === id);
		if (req) {
			const response = await fetch('/api/requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, status: newStatus })
			});
			const res = await response.json();
			if (res.success) {
				db.addToast(`Ticket status updated: Request ${id} is now ${newStatus.toUpperCase()}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(res.error || 'Failed to update ticket state', 'error');
			}
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
			👨‍💼 System Administration
		</h1>
		<span class="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
			Role: Administrator
		</span>
	</div>

	<!-- TAB 1: DASHBOARD OVERVIEW -->
	{#if db.activeTab === 'dashboard'}
		<div class="grid md:grid-cols-4 gap-6">
			<!-- Stats Cards -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Registered Donors</span>
				<h4 class="text-3xl font-black text-red-700 mt-2">{data.donors.length} Donors</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Recipients Served</span>
				<h4 class="text-3xl font-black text-blue-600 mt-2">120</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Blood Banks</span>
				<h4 class="text-3xl font-black text-emerald-600 mt-2">{data.bloodBanks.length} Banks</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Emergency Tickets</span>
				<h4 class="text-3xl font-black text-amber-600 mt-2">{data.requests.length} Requests</h4>
			</div>
		</div>

		<!-- Welcome Admin Message -->
		<div class="bg-slate-900 text-white p-8 rounded-[36px] shadow-xl relative overflow-hidden">
			<div class="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
			<h2 class="text-xl font-bold mb-2">Welcome to your System Administration Panel</h2>
			<p class="text-sm text-slate-400 leading-relaxed max-w-xl">
				Monitor active node updates, inspect system logs, verify coordinates, configure threshold values, and compile analytical reports.
			</p>
		</div>

		<!-- Recent Activity Log summary -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Latest System Activities</h3>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
							<th class="py-3 px-4">Log ID</th>
							<th class="py-3 px-4">User Node</th>
							<th class="py-3 px-4">System Activity Summary</th>
							<th class="py-3 px-4">Event Timestamp</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50">
						{#each data.systemLogs.slice(0, 3) as log}
							<tr class="hover:bg-slate-50/30 transition text-xs">
								<td class="py-3 px-4 font-bold text-slate-800">{log.id}</td>
								<td class="py-3 px-4 font-semibold text-slate-900">{log.user}</td>
								<td class="py-3 px-4 text-slate-605 text-slate-600">{log.activity}</td>
								<td class="py-3 px-4 text-gray-500">{log.timestamp}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	<!-- TAB 2: USERS LIST -->
	{:else if db.activeTab === 'users'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Voluntary Donors Directory</h3>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
							<th class="py-3 px-4">Name</th>
							<th class="py-3 px-4">Blood Group</th>
							<th class="py-3 px-4">Distance Offset</th>
							<th class="py-3 px-4">City Location</th>
							<th class="py-3 px-4">Contact Detail</th>
							<th class="py-3 px-4">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50">
						{#each data.donors as donor}
							<tr class="hover:bg-slate-50/30 transition">
								<td class="py-3 px-4 font-bold text-slate-900">{donor.name}</td>
								<td class="py-3 px-4">
									<span class="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-150 text-xs">
										{donor.bloodGroup}
									</span>
								</td>
								<td class="py-3 px-4 font-semibold text-slate-600">{donor.distance} km</td>
								<td class="py-3 px-4 font-medium text-slate-700">{donor.city}</td>
								<td class="py-3 px-4 font-mono text-xs">{donor.phone}</td>
								<td class="py-3 px-4">
									<button
										class="bg-slate-900 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
										onclick={() => handleVerifyUser(donor.name)}
									>
										Verify User
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	<!-- TAB 3: BLOOD BANKS MANAGEMENT -->
	{:else if db.activeTab === 'blood-banks'}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
			{#each data.bloodBanks as bank}
				<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition">
					<div class="space-y-4">
						<span class="text-3xl">🏥</span>
						<div>
							<h3 class="font-extrabold text-slate-900 text-base">{bank.name}</h3>
							<p class="text-[10px] text-gray-500 mt-0.5">📍 {bank.address}</p>
						</div>

						<div class="flex items-center justify-between text-xs border-t border-slate-50 pt-3">
							<span class="text-slate-500">Inventory Assessment</span>
							<span class="font-bold uppercase tracking-wider
								{bank.stockStatus === 'Healthy' ? 'text-emerald-600' : ''}
								{bank.stockStatus === 'Low Stock' ? 'text-amber-600' : ''}
								{bank.stockStatus === 'Critical Stock' ? 'text-red-600' : ''}">
								{bank.stockStatus}
							</span>
						</div>
					</div>

					<button
						class="w-full mt-6 bg-slate-900 hover:bg-black text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
						onclick={() => db.addToast(`Verification request sent for: ${bank.name}.`, 'info')}
					>
						Manage Coordinates
					</button>
				</div>
			{/each}
		</div>

	<!-- TAB 4: BLOOD REQUESTS PIPELINE -->
	{:else if db.activeTab === 'blood-requests'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Emergency Tickets Queue</h3>
			
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
							<th class="py-3 px-4">Request ID</th>
							<th class="py-3 px-4">Patient Name</th>
							<th class="py-3 px-4">Blood Needed</th>
							<th class="py-3 px-4">Units Needed</th>
							<th class="py-3 px-4">Current Queue State</th>
							<th class="py-3 px-4">Administrative Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50">
						{#each data.requests as req}
							<tr class="hover:bg-slate-50/30 transition">
								<td class="py-3 px-4 font-bold text-slate-900">{req.id}</td>
								<td class="py-3 px-4 font-medium text-slate-800">{req.patientName}</td>
								<td class="py-3 px-4">
									<span class="bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded border border-red-150 text-xs">
										{req.bloodGroup}
									</span>
								</td>
								<td class="py-3 px-4 font-semibold text-slate-700">{req.units} units</td>
								<td class="py-3 px-4">
									<span class="px-2.5 py-1 rounded-full text-xs font-bold
										{req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : ''}
										{req.status === 'Matching Donor' ? 'bg-amber-50 text-amber-700' : ''}
										{req.status === 'Submitted' ? 'bg-blue-50 text-blue-700' : ''}
										{req.status === 'Verified' ? 'bg-purple-50 text-purple-700' : ''}
										{req.status === 'Accepted' ? 'bg-indigo-50 text-indigo-750 font-bold' : ''}">
										{req.status}
									</span>
								</td>
								<td class="py-3 px-4">
									{#if req.status === 'Submitted'}
										<button
											class="bg-purple-750 bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
											onclick={() => handleActionRequest(req.id, 'Verified')}
										>
											Verify
										</button>
									{:else if req.status === 'Verified'}
										<button
											class="bg-amber-750 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
											onclick={() => handleActionRequest(req.id, 'Matching Donor')}
										>
											Match Donors
										</button>
									{:else if req.status === 'Matching Donor' || req.status === 'Accepted'}
										<button
											class="bg-emerald-750 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
											onclick={() => handleActionRequest(req.id, 'Completed')}
										>
											Complete
										</button>
									{:else}
										<span class="text-xs text-gray-500 font-bold">Done</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	<!-- TAB 5: REPORTS -->
	{:else if db.activeTab === 'reports'}
		<div class="space-y-6">
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-left">
				<h3 class="text-lg font-bold text-slate-900">System Analytical Reports</h3>
				<p class="text-xs text-slate-500">Live monitoring of voluntary drives versus emergency dispatcher queries.</p>
			</div>

			<AnalyticsCharts chartData={data.analytics} />
		</div>
	{/if}
</div>