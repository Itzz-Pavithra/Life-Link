<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import AnalyticsCharts from '$lib/components/AnalyticsCharts.svelte';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	// Search & Filter State
	let userSearchQuery = $state('');
	let userFilterRole = $state('all');
	let userFilterStatus = $state('all');

	let donorSearchQuery = $state('');
	let donorFilterBloodGroup = $state('all');

	let receiverSearchQuery = $state('');

	let eligSearchQuery = $state('');
	let eligFilterStatus = $state('all');

	let reqSearchQuery = $state('');
	let reqFilterStatus = $state('all');

	let bankSearchQuery = $state('');

	// Modals & Details State
	let selectedEligRequest = $state(null);
	let selectedUserDetail = $state(null);

	// Blood Bank Edit State
	let editingBankId = $state(null);
	let bankName = $state('');
	let bankAddress = $state('');
	let bankPhone = $state('');
	let bankEmail = $state('');
	let bankWorkingHours = $state('9:00 AM - 5:00 PM');
	let bankMapLink = $state('');

	// Pagination variables (10 records per page)
	let userPage = $state(1);
	let eligPage = $state(1);
	let reqPage = $state(1);
	let bankPage = $state(1);
	const PAGE_SIZE = 5;

	// Reset forms helper
	function resetBankForm() {
		editingBankId = null;
		bankName = '';
		bankAddress = '';
		bankPhone = '';
		bankEmail = '';
		bankWorkingHours = '9:00 AM - 5:00 PM';
		bankMapLink = '';
	}

	function startEditBank(bank) {
		editingBankId = bank.id;
		bankName = bank.name;
		bankAddress = bank.address;
		bankPhone = bank.phone;
		bankEmail = bank.email;
		bankWorkingHours = bank.workingHours;
		bankMapLink = bank.mapLink;
		db.addToast(`Editing blood bank details: ${bank.name}`, 'info');
	}



	async function handleUserSuspend(userId, name) {
		try {
			const res = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Successfully toggled account status for ${name}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to update user status.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	async function handleUserDelete(userId, name) {
		if (!confirm(`Are you sure you want to permanently delete the user account for ${name}?`)) return;

		try {
			const res = await fetch('/api/users', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Deleted user account for ${name}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to delete user.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	async function handleReviewEligibility(requestId, status, candidateEmail) {
		try {
			const res = await fetch('/api/eligibility', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requestId, status })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Eligibility request for ${candidateEmail} has been ${status.toUpperCase()}`, 'success');
				selectedEligRequest = null;
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to review request.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	async function handleActionRequest(requestId, status) {
		try {
			const res = await fetch('/api/requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: requestId, status })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Blood Request status updated to: ${status}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to update status.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	async function handleUpdateBankSubmit(e) {
		e.preventDefault();
		if (!bankName || !bankAddress || !bankPhone || !bankEmail) {
			db.addToast('Please complete all required fields.', 'error');
			return;
		}

		try {
			const res = await fetch('/api/blood', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: editingBankId,
					name: bankName,
					address: bankAddress,
					phone: bankPhone,
					email: bankEmail,
					workingHours: bankWorkingHours,
					mapLink: bankMapLink
				})
			});
			const result = await res.json();
			if (result.success) {
				db.addToast('Blood Bank details updated successfully!', 'success');
				resetBankForm();
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to update blood bank.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	async function handleBankDelete(id, name) {
		if (!confirm(`Are you sure you want to delete blood bank: ${name}?`)) return;

		try {
			const res = await fetch('/api/blood', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Deleted blood bank: ${name}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to delete blood bank.', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}

	// CSV Export function
	function exportToCSV(collection, fields, filename) {
		if (!collection || collection.length === 0) {
			db.addToast('No data available to export.', 'error');
			return;
		}

		const header = fields.join(',');
		const rows = collection.map(item => {
			return fields.map(field => {
				const val = item[field];
				if (typeof val === 'object' && val !== null) {
					return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
				}
				return `"${String(val || '').replace(/"/g, '""')}"`;
			}).join(',');
		});

		const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		db.addToast(`Successfully exported ${filename}`, 'success');
	}

	// Filters computations
	const filteredUsers = $derived(
		data.users.filter(u => {
			const matchesSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
								  u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
								  u.phone.includes(userSearchQuery);
			const matchesRole = userFilterRole === 'all' || u.role === userFilterRole;
			const matchesStatus = userFilterStatus === 'all' || u.status === userFilterStatus;
			return matchesSearch && matchesRole && matchesStatus;
		})
	);

	const filteredDonors = $derived(
		data.donors.filter(u => {
			const matchesSearch = u.name.toLowerCase().includes(donorSearchQuery.toLowerCase()) ||
								  u.email.toLowerCase().includes(donorSearchQuery.toLowerCase()) ||
								  u.location.toLowerCase().includes(donorSearchQuery.toLowerCase());
			const matchesBlood = donorFilterBloodGroup === 'all' || u.bloodGroup === donorFilterBloodGroup;
			return matchesSearch && matchesBlood;
		})
	);

	const filteredReceivers = $derived(
		data.receivers.filter(u => {
			return u.name.toLowerCase().includes(receiverSearchQuery.toLowerCase()) ||
				   u.email.toLowerCase().includes(receiverSearchQuery.toLowerCase()) ||
				   u.location.toLowerCase().includes(receiverSearchQuery.toLowerCase());
		})
	);

	const filteredEligibility = $derived(
		data.eligibilityRequests.filter(r => {
			const matchesSearch = r.name.toLowerCase().includes(eligSearchQuery.toLowerCase()) ||
								  r.email.toLowerCase().includes(eligSearchQuery.toLowerCase()) ||
								  r.location.toLowerCase().includes(eligSearchQuery.toLowerCase());
			const matchesStatus = eligFilterStatus === 'all' || r.status === eligFilterStatus;
			return matchesSearch && matchesStatus;
		})
	);

	const filteredRequests = $derived(
		data.requests.filter(r => {
			const matchesSearch = r.patientName.toLowerCase().includes(reqSearchQuery.toLowerCase()) ||
								  r.hospital.toLowerCase().includes(reqSearchQuery.toLowerCase()) ||
								  r.bloodGroup.toLowerCase().includes(reqSearchQuery.toLowerCase());
			const matchesStatus = reqFilterStatus === 'all' || r.status === reqFilterStatus;
			return matchesSearch && matchesStatus;
		})
	);

	const filteredBanks = $derived(
		data.bloodBanks.filter(b => {
			return b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
				   b.address.toLowerCase().includes(bankSearchQuery.toLowerCase());
		})
	);

	// paginated listings
	const paginatedUsers = $derived(filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE));
	const paginatedElig = $derived(filteredEligibility.slice((eligPage - 1) * PAGE_SIZE, eligPage * PAGE_SIZE));
	const paginatedReqs = $derived(filteredRequests.slice((reqPage - 1) * PAGE_SIZE, reqPage * PAGE_SIZE));
	const paginatedBanks = $derived(filteredBanks.slice((bankPage - 1) * PAGE_SIZE, bankPage * PAGE_SIZE));

	// Blood Availability Analytics
	const bloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
	
	const availabilityAnalytics = $derived.by(() => {
		const counts = {};
		bloodGroupsList.forEach(bg => {
			counts[bg] = 0;
		});
		
		(data.donors || []).forEach(d => {
			const isAvail = d.isAvailable !== false && d.status === 'active';
			if (isAvail && d.bloodGroup && counts[d.bloodGroup] !== undefined) {
				counts[d.bloodGroup]++;
			}
		});
		
		return bloodGroupsList.map(bg => {
			const count = counts[bg];
			return {
				bloodGroup: bg,
				count,
				isLow: count < 3
			};
		});
	});

	// Polling for live updates when viewing Reports/Overview dashboard
	onMount(() => {
		const interval = setInterval(() => {
			if (db.activeTab === 'reports' || db.activeTab === 'dashboard') {
				invalidateAll();
			}
		}, 10000); // 10s auto-refresh
		return () => clearInterval(interval);
	});

	// Helper for monthly stats calculations from database collections
	function getLast6MonthsStats(requests, donations) {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const result = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthIndex = d.getMonth();
			const year = d.getFullYear();
			const monthStr = String(monthIndex + 1).padStart(2, '0');
			const yearMonth = `${year}-${monthStr}`;
			
			const monthReqs = (requests || []).filter(r => r.date && r.date.startsWith(yearMonth)).length;
			const monthDons = (donations || []).filter(don => don.date && don.date.startsWith(yearMonth)).length;
			
			result.push({
				month: `${monthNames[monthIndex]} ${year}`,
				requests: monthReqs,
				donations: monthDons
			});
		}
		return result;
	}

	// Derived calculations for all 8 report requirements
	const reportStats = $derived.by(() => {
		const totalRegisteredDonors = (data.users || []).filter(u => u.role === 'donor').length;
		const totalRecipients = (data.users || []).filter(u => u.role === 'recipient').length;
		const totalRequestsCreated = (data.requests || []).length;
		const completedRequests = (data.requests || []).filter(r => r.status === 'Completed').length;
		const pendingRequests = (data.requests || []).filter(r => r.status === 'Pending').length;
		const emergencyRequests = (data.requests || []).filter(r => r.urgency === 'Emergency' || r.urgency === 'Urgent').length;

		// Available donors by blood group
		const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
		const availableDonorsByGroup = {};
		bloodGroups.forEach(bg => {
			availableDonorsByGroup[bg] = 0;
		});
		(data.donors || []).forEach(d => {
			if (d.status === 'active' && d.isAvailable !== false && d.bloodGroup) {
				const bg = d.bloodGroup;
				if (availableDonorsByGroup[bg] !== undefined) {
					availableDonorsByGroup[bg]++;
				}
			}
		});

		// City/location wise donor availability
		const cityAvailability = {};
		(data.donors || []).forEach(d => {
			if (d.status === 'active' && d.isAvailable !== false && d.location) {
				const city = d.location.trim();
				cityAvailability[city] = (cityAvailability[city] || 0) + 1;
			}
		});

		return {
			totalRegisteredDonors,
			totalRecipients,
			totalRequestsCreated,
			completedRequests,
			pendingRequests,
			emergencyRequests,
			availableDonorsByGroup,
			cityAvailability
		};
	});

	const reportAnalytics = $derived.by(() => {
		const donors = (data.users || []).filter(u => u.role === 'donor');
		const totalDonors = donors.length;
		const requests = data.requests || [];
		const donations = data.donations || [];

		// Monthly activity
		const monthlyActivity = getLast6MonthsStats(requests, donations);

		// Blood group distribution among all donors
		const colors = {
			'O+': '#b91c1c', 'A+': '#dc2626', 'B+': '#ef4444', 'AB+': '#f87171',
			'O-': '#fca5a5', 'A-': '#fecaca', 'B-': '#fee2e2', 'AB-': '#fef2f2'
		};
		const distribution = [];
		if (totalDonors > 0) {
			const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
			bloodGroups.forEach(bg => {
				const count = donors.filter(u => u.bloodGroup === bg).length;
				if (count > 0) {
					const pct = Math.round((count / totalDonors) * 100);
					distribution.push({
						group: bg,
						value: pct,
						color: colors[bg] || '#ef4444'
					});
				}
			});
		}

		return {
			monthlyActivity,
			distribution
		};
	});
</script>

<div class="space-y-6 text-left">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
				🏥 System Administration
			</h1>
			<p class="text-slate-500 text-xs mt-1">Configure parameters, verify questionnaires, manage repositories, and audit logs.</p>
		</div>
		<span class="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full uppercase tracking-wider">
			Admin operator: {data.user.email}
		</span>
	</div>

	<!-- TAB 1: OVERVIEW -->
	{#if db.activeTab === 'dashboard'}
		<div class="grid md:grid-cols-4 gap-6">
			<!-- Dynamic stats from empty start -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Registered Donors</span>
				<h4 class="text-3xl font-black text-red-700 mt-2">{data.donors.length} Donors</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Resolved Requests</span>
				<h4 class="text-3xl font-black text-blue-600 mt-2">{data.requests.filter(r => r.status === 'Completed').length} Tickets</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Active Blood Banks</span>
				<h4 class="text-3xl font-black text-emerald-600 mt-2">{data.bloodBanks.length} Banks</h4>
			</div>

			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
				<span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Pending Requests</span>
				<h4 class="text-3xl font-black text-amber-600 mt-2">{data.requests.filter(r => r.status === 'Pending').length} Pending</h4>
			</div>
		</div>

		<!-- Blood Availability Dashboard -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
				<div>
					<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
						📊 Live Blood Supply Analytics (Available Donors)
					</h3>
					<p class="text-xs text-slate-500">Inventory counts calculated dynamically from active, available donor records.</p>
				</div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
				{#each availabilityAnalytics as item}
					<div class="border rounded-2xl p-4 text-center hover:shadow-sm transition flex flex-col justify-between min-h-28
						{item.isLow ? 'bg-red-50/30 border-red-150' : 'bg-slate-50/30 border-slate-100'}">
						<span class="text-lg font-extrabold text-slate-800 block">{item.bloodGroup}</span>
						<div class="my-2">
							<span class="text-2xl font-black block
								{item.isLow ? 'text-red-700' : 'text-slate-900'}">
								{item.count}
							</span>
							<span class="text-[9px] text-slate-400 block font-semibold uppercase">Donors</span>
						</div>
						{#if item.isLow}
							<span class="inline-block bg-red-100 text-red-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">
								Emergency Low
							</span>
						{:else}
							<span class="inline-block bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
								Normal
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Overview Message -->
		<div class="bg-slate-900 text-white p-8 rounded-[36px] shadow-xl relative overflow-hidden">
			<div class="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
			<h2 class="text-xl font-bold mb-2">Hospital-Grade Administration Center</h2>
			<p class="text-sm text-slate-400 leading-relaxed max-w-xl">
				Welcome back. Inspect eligibility questionnaires, manage blood request tickets, CRUD regional partner blood banks, and download CSV reports.
			</p>
		</div>

		<!-- Latest System Activities -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Latest System Activities</h3>
			{#if data.systemLogs.length === 0}
				<p class="text-slate-400 text-xs">No activity logged in this session yet.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
								<th class="py-3 px-4">Log ID</th>
								<th class="py-3 px-4">Operator Email</th>
								<th class="py-3 px-4">Activity Summary</th>
								<th class="py-3 px-4">Timestamp</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each data.systemLogs.slice(0, 5) as log}
								<tr class="hover:bg-slate-50/30 transition text-xs">
									<td class="py-3 px-4 font-mono font-bold text-slate-500">{log.id}</td>
									<td class="py-3 px-4 font-semibold text-slate-900">{log.user}</td>
									<td class="py-3 px-4 text-slate-600">{log.activity}</td>
									<td class="py-3 px-4 text-gray-400">{log.timestamp}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

	<!-- TAB 2: ALL USERS -->
	{:else if db.activeTab === 'users'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
				<h3 class="text-lg font-bold text-slate-900">System Users Directory</h3>
				<!-- Filters Row -->
				<div class="flex flex-wrap gap-2 w-full sm:w-auto">
					<input
						type="text"
						bind:value={userSearchQuery}
						placeholder="Search by Name, Email..."
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none w-full sm:w-48"
					/>
					<select
						bind:value={userFilterRole}
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Roles</option>
						<option value="admin">Admins</option>
						<option value="donor">Donors</option>
						<option value="recipient">Receivers</option>
					</select>
					<select
						bind:value={userFilterStatus}
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="suspended">Suspended</option>
					</select>
				</div>
			</div>

			{#if filteredUsers.length === 0}
				<p class="text-slate-400 text-xs">No registered users match your search metrics.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
								<th class="py-3 px-4">Profile</th>
								<th class="py-3 px-4">Email</th>
								<th class="py-3 px-4">Role</th>
								<th class="py-3 px-4">Status</th>
								<th class="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each paginatedUsers as user}
								<tr class="hover:bg-slate-50/30 transition text-xs">
									<td class="py-3 px-4">
										<div class="flex items-center gap-2">
											<img src={user.avatar} alt={user.name} class="w-7 h-7 rounded-full border" />
											<div>
												<span class="font-bold text-slate-900 block">{user.name}</span>
												<span class="text-[9px] text-slate-400">{user.phone} • {user.location}</span>
											</div>
										</div>
									</td>
									<td class="py-3 px-4 font-medium text-slate-700">{user.email}</td>
									<td class="py-3 px-4 font-bold uppercase text-[9px] tracking-wider">
										<span class="px-2 py-0.5 rounded
											{user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ''}
											{user.role === 'donor' ? 'bg-red-50 text-red-700 border border-red-150' : ''}
											{user.role === 'recipient' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}">
											{user.role === 'recipient' ? 'Receiver' : user.role}
										</span>
									</td>
									<td class="py-3 px-4">
										<span class="font-bold uppercase text-[9px]
											{user.status === 'active' ? 'text-emerald-600' : 'text-red-600'}">
											{user.status}
										</span>
									</td>
									<td class="py-3 px-4 text-right space-x-2">
										{#if user.role !== 'admin'}
											<button
												class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer text-[10px]"
												onclick={() => handleUserSuspend(user.id, user.name)}
											>
												{user.status === 'active' ? 'Suspend' : 'Unsuspend'}
											</button>
											<button
												class="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer text-[10px]"
												onclick={() => handleUserDelete(user.id, user.name)}
											>
												Delete
											</button>
										{:else}
											<span class="text-[9px] text-gray-400 italic">System Administrator</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				<div class="flex justify-between items-center pt-4 border-t border-slate-50">
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={userPage === 1}
						onclick={() => userPage--}
					>
						Prev
					</button>
					<span class="text-[10px] text-slate-500 font-bold">Page {userPage} of {Math.ceil(filteredUsers.length / PAGE_SIZE)}</span>
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={userPage * PAGE_SIZE >= filteredUsers.length}
						onclick={() => userPage++}
					>
						Next
					</button>
				</div>
			{/if}
		</div>

	<!-- TAB 3: DONORS LIST -->
	{:else if db.activeTab === 'donors'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
				<div>
					<h3 class="text-lg font-bold text-slate-900">Approved Blood Donors</h3>
					<p class="text-[10px] text-slate-500">Only verified users who passed eligibility verification reside here.</p>
				</div>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={donorSearchQuery}
						placeholder="Search by Name or City..."
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
					/>
					<select
						bind:value={donorFilterBloodGroup}
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Groups</option>
						<option value="O+">O+</option>
						<option value="A+">A+</option>
						<option value="B+">B+</option>
						<option value="AB+">AB+</option>
						<option value="O-">O-</option>
						<option value="A-">A-</option>
						<option value="B-">B-</option>
						<option value="AB-">AB-</option>
					</select>
				</div>
			</div>

			{#if filteredDonors.length === 0}
				<p class="text-slate-400 text-xs">No active donors matched your criteria.</p>
			{:else}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredDonors as donor}
						<div class="border border-slate-100 p-5 rounded-3xl shadow-sm bg-white space-y-3">
							<div class="flex items-center gap-3">
								<span class="w-12 h-12 bg-red-700 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center shadow-md shadow-red-700/10">
									{donor.bloodGroup}
								</span>
								<div>
									<h4 class="font-bold text-slate-900 text-sm">{donor.name}</h4>
									<span class="text-[9px] text-slate-400">📍 {donor.location}</span>
								</div>
							</div>
							<div class="text-[10px] space-y-1 text-slate-500 bg-slate-50 p-3 rounded-xl">
								<p>📞 <strong>Phone:</strong> {donor.phone}</p>
								<p>✉️ <strong>Email:</strong> {donor.email}</p>
								<p>🛡️ <strong>Status:</strong> <span class="font-bold uppercase text-emerald-600">{donor.status}</span></p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	<!-- TAB 4: RECEIVERS LIST -->
	{:else if db.activeTab === 'receivers'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
				<div>
					<h3 class="text-lg font-bold text-slate-900">Registered Receivers Directory</h3>
					<p class="text-[10px] text-slate-500">Recipients do not require clinical eligibility audits to submit requests.</p>
				</div>
				<input
					type="text"
					bind:value={receiverSearchQuery}
					placeholder="Search by Name or Email..."
					class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
				/>
			</div>

			{#if filteredReceivers.length === 0}
				<p class="text-slate-400 text-xs">No registered receivers found.</p>
			{:else}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredReceivers as rec}
						<div class="border border-slate-100 p-5 rounded-3xl shadow-sm bg-white space-y-3">
							<div class="flex items-center gap-3">
								<img src={rec.avatar} alt={rec.name} class="w-10 h-10 rounded-full border" />
								<div>
									<h4 class="font-bold text-slate-900 text-sm">{rec.name}</h4>
									<span class="text-[9px] text-slate-400">📍 {rec.location}</span>
								</div>
							</div>
							<div class="text-[10px] space-y-1 text-slate-500 bg-slate-50 p-3 rounded-xl">
								<p>🩸 <strong>Group:</strong> {rec.bloodGroup || 'Not Specified'}</p>
								<p>📞 <strong>Phone:</strong> {rec.phone}</p>
								<p>✉️ <strong>Email:</strong> {rec.email}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	<!-- TAB 5: ELIGIBILITY REQUESTS QUEUE -->
	{:else if db.activeTab === 'eligibility-requests'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
				<div>
					<h3 class="text-lg font-bold text-slate-900">Donor Eligibility Assessment Queue</h3>
					<p class="text-[10px] text-slate-500">Clinical questionnaires submitted by prospective donors.</p>
				</div>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={eligSearchQuery}
						placeholder="Search by Email..."
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
					/>
					<select
						bind:value={eligFilterStatus}
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Submissions</option>
						<option value="Pending">Pending</option>
						<option value="Approved">Approved</option>
						<option value="Rejected">Rejected</option>
					</select>
				</div>
			</div>

			{#if filteredEligibility.length === 0}
				<p class="text-slate-400 text-xs">No eligibility requests logged.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
								<th class="py-3 px-4">Candidate</th>
								<th class="py-3 px-4">Email Address</th>
								<th class="py-3 px-4">Vitals (Age/Weight)</th>
								<th class="py-3 px-4">Status</th>
								<th class="py-3 px-4 text-right">Verification Audits</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each paginatedElig as elig}
								<tr class="hover:bg-slate-50/30 transition text-xs">
									<td class="py-3 px-4">
										<span class="font-bold text-slate-900 block">{elig.name}</span>
										<span class="text-[9px] text-slate-400">📍 {elig.location} • {elig.phone}</span>
									</td>
									<td class="py-3 px-4 font-mono">{elig.email}</td>
									<td class="py-3 px-4 text-slate-650 font-semibold">{elig.answers?.age} yrs • {elig.answers?.weight} kg</td>
									<td class="py-3 px-4">
										<span class="px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase
											{elig.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
											{elig.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : ''}
											{elig.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-150' : ''}">
											{elig.status}
										</span>
									</td>
									<td class="py-3 px-4 text-right space-x-2">
										<button
											class="bg-slate-900 hover:bg-black text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer text-[10px]"
											onclick={() => selectedEligRequest = elig}
										>
											View Questionnaire Answers
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				<div class="flex justify-between items-center pt-4 border-t border-slate-50">
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={eligPage === 1}
						onclick={() => eligPage--}
					>
						Prev
					</button>
					<span class="text-[10px] text-slate-500 font-bold">Page {eligPage} of {Math.ceil(filteredEligibility.length / PAGE_SIZE)}</span>
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={eligPage * PAGE_SIZE >= filteredEligibility.length}
						onclick={() => eligPage++}
					>
						Next
					</button>
				</div>
			{/if}
		</div>

	<!-- TAB 6: BLOOD REQUESTS PIPELINE -->
	{:else if db.activeTab === 'blood-requests'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
				<h3 class="text-lg font-bold text-slate-900">Emergency Tickets Pipeline</h3>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={reqSearchQuery}
						placeholder="Search Patient, Hospital..."
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
					/>
					<select
						bind:value={reqFilterStatus}
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All States</option>
						<option value="Pending">Pending</option>
						<option value="Approved">Approved</option>
						<option value="Rejected">Rejected</option>
						<option value="Completed">Completed</option>
					</select>
				</div>
			</div>

			{#if filteredRequests.length === 0}
				<p class="text-slate-400 text-xs">No blood request tickets logged.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
								<th class="py-3 px-4">Request Details</th>
								<th class="py-3 px-4">Hospital Location</th>
								<th class="py-3 px-4">Urgency</th>
								<th class="py-3 px-4">Status</th>
								<th class="py-3 px-4 text-right">Administrative Updates</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each paginatedReqs as req}
								<tr class="hover:bg-slate-50/30 transition text-xs">
									<td class="py-3 px-4">
										<div class="flex items-center gap-2.5">
											<span class="w-8 h-8 rounded-xl bg-red-50 text-red-700 font-extrabold flex items-center justify-center border text-xs">
												{req.bloodGroup}
											</span>
											<div>
												<span class="font-bold text-slate-900 block">{req.patientName}</span>
												<span class="text-[9px] text-slate-400">Required: {req.units} units • Phone: {req.contact}</span>
											</div>
										</div>
									</td>
									<td class="py-3 px-4 font-semibold text-slate-700">
										<span class="block">{req.hospital}</span>
										<span class="text-[9px] text-slate-400 font-medium">City: {req.city}</span>
									</td>
									<td class="py-3 px-4">
										<span class="font-bold uppercase text-[9px] tracking-wider
											{req.urgency === 'Critical' ? 'text-red-600' : ''}
											{req.urgency === 'Urgent' ? 'text-amber-600' : ''}
											{req.urgency === 'Normal' ? 'text-slate-500' : ''}">
											{req.urgency}
										</span>
									</td>
									<td class="py-3 px-4">
										<span class="px-2 py-0.5 rounded font-bold text-[9px] uppercase
											{req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-250' : ''}
											{req.status === 'Approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
											{req.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-150' : ''}
											{req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : ''}">
											{req.status}
										</span>
									</td>
									<td class="py-3 px-4 text-right space-x-1.5">
										{#if req.status === 'Pending'}
											<button
												class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg text-[9px] transition cursor-pointer"
												onclick={() => handleActionRequest(req.id, 'Approved')}
											>
												Approve
											</button>
											<button
												class="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1 rounded-lg text-[9px] transition cursor-pointer"
												onclick={() => handleActionRequest(req.id, 'Rejected')}
											>
												Reject
											</button>
										{:else if req.status === 'Approved'}
											<button
												class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-[9px] transition cursor-pointer"
												onclick={() => handleActionRequest(req.id, 'Completed')}
											>
												Mark Completed
											</button>
										{:else}
											<span class="text-[9px] text-gray-400 italic">No further actions available</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				<div class="flex justify-between items-center pt-4 border-t border-slate-50">
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={reqPage === 1}
						onclick={() => reqPage--}
					>
						Prev
					</button>
					<span class="text-[10px] text-slate-500 font-bold">Page {reqPage} of {Math.ceil(filteredRequests.length / PAGE_SIZE)}</span>
					<button
						class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
						disabled={reqPage * PAGE_SIZE >= filteredRequests.length}
						onclick={() => reqPage++}
					>
						Next
					</button>
				</div>
			{/if}
		</div>

	<!-- TAB 7: BLOOD BANKS CRUD -->
	{:else if db.activeTab === 'blood-banks'}
		<div class="grid lg:grid-cols-3 gap-6">
			<!-- Bank Details / Directory -->
			<div class="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
				<div class="flex justify-between items-center border-b border-slate-50 pb-4">
					<h3 class="text-lg font-bold text-slate-900">Partner Blood Banks</h3>
					<input
						type="text"
						bind:value={bankSearchQuery}
						placeholder="Search by name..."
						class="border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
					/>
				</div>

				{#if filteredBanks.length === 0}
					<p class="text-slate-400 text-xs">No partner blood banks created yet.</p>
				{:else}
					<div class="grid gap-4">
						{#each paginatedBanks as bank}
							<div class="border border-slate-100 p-5 rounded-3xl bg-white space-y-4 hover:shadow-md transition">
								<div class="flex justify-between items-start">
									<div class="flex items-center gap-3">
										<span class="text-3xl">🏥</span>
										<div>
											<h4 class="font-bold text-slate-900 text-sm">{bank.name}</h4>
											<p class="text-[10px] text-gray-500">📍 {bank.address}</p>
										</div>
									</div>
									<div class="flex gap-2">
										<button
											class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-lg text-xs transition cursor-pointer"
											title="Edit"
											onclick={() => startEditBank(bank)}
										>
											✏️
										</button>
										<button
											class="bg-red-50 hover:bg-red-100 text-red-700 font-bold p-1.5 rounded-lg text-xs transition cursor-pointer"
											title="Delete"
											onclick={() => handleBankDelete(bank.id, bank.name)}
										>
											🗑️
										</button>
									</div>
								</div>

								<div class="text-[10px] grid grid-cols-2 gap-4 text-slate-500 bg-slate-50/50 p-3 border border-slate-100 rounded-xl">
									<p>📞 <strong>Phone:</strong> {bank.phone}</p>
									<p>📧 <strong>Email:</strong> {bank.email}</p>
									<p>🕒 <strong>Hours:</strong> {bank.workingHours}</p>
									{#if bank.mapLink}
										<p>🌐 <a href={bank.mapLink} target="_blank" class="text-red-700 underline font-bold">Directions Map</a></p>
									{/if}
								</div>

								<div>
									<h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Blood Inventory Units</h5>
									<div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
										{#each Object.entries(bank.inventory) as [group, units]}
											<div class="bg-red-50/30 border border-red-100 p-2 rounded-xl text-center">
												<span class="font-extrabold text-xs text-red-700 block">{group}</span>
												<span class="text-[10px] text-slate-500 font-bold">{units} u</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Pagination -->
					<div class="flex justify-between items-center pt-4 border-t border-slate-50">
						<button
							class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
							disabled={bankPage === 1}
							onclick={() => bankPage--}
						>
							Prev
						</button>
						<span class="text-[10px] text-slate-500 font-bold">Page {bankPage} of {Math.ceil(filteredBanks.length / PAGE_SIZE)}</span>
						<button
							class="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10px] rounded-lg disabled:opacity-50"
							disabled={bankPage * PAGE_SIZE >= filteredBanks.length}
							onclick={() => bankPage++}
						>
							Next
						</button>
					</div>
				{/if}
			</div>

			<!-- Add / Edit Form -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
				<h3 class="text-lg font-bold text-slate-900 mb-4">
					{editingBankId ? 'Edit Blood Bank details' : 'Add New Blood Bank'}
				</h3>
				<form
					method="POST"
					action={editingBankId ? '#update' : '?/addBloodBank'}
					onsubmit={editingBankId ? handleUpdateBankSubmit : null}
					class="space-y-4 text-xs"
				>
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Bank Name *</label>
						<input
							name="name"
							type="text"
							bind:value={bankName}
							placeholder="GH Salem Blood Center"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Address *</label>
						<input
							name="address"
							type="text"
							bind:value={bankAddress}
							placeholder="Collectorate Rd, Salem"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
						<input
							name="phone"
							type="text"
							bind:value={bankPhone}
							placeholder="0427-241551"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
						<input
							name="email"
							type="email"
							bind:value={bankEmail}
							placeholder="salem.bank@lifelink.org"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Working Hours</label>
						<input
							name="workingHours"
							type="text"
							bind:value={bankWorkingHours}
							placeholder="24 Hours or 9:00 AM - 5:00 PM"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Map Coordinates Link</label>
						<input
							name="mapLink"
							type="url"
							bind:value={bankMapLink}
							placeholder="https://maps.google.com/..."
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
						/>
					</div>

					<div class="flex gap-2 pt-2">
						<button
							type="submit"
							class="flex-grow bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
						>
							{editingBankId ? 'Save details' : 'Create Blood Bank'}
						</button>
						{#if editingBankId}
							<button
								type="button"
								class="bg-gray-150 text-gray-700 hover:bg-gray-250 font-bold px-3 py-2.5 rounded-xl border transition cursor-pointer bg-gray-200"
								onclick={resetBankForm}
							>
								Cancel
							</button>
						{/if}
					</div>
				</form>
			</div>
		</div>

	<!-- TAB 8: DONATION HISTORY -->
	{:else if db.activeTab === 'donation-history'}
		<div class="grid lg:grid-cols-3 gap-6">
			<!-- History Audit -->
			<div class="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
				<h3 class="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4">Donation Audit History</h3>

				{#if data.donations.length === 0}
					<p class="text-slate-400 text-xs">No donation records registered.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-left text-sm">
							<thead>
								<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
									<th class="py-3 px-4">Ticket ID</th>
									<th class="py-3 px-4">Donor Name</th>
									<th class="py-3 px-4">Blood Group</th>
									<th class="py-3 px-4">Units Logged</th>
									<th class="py-3 px-4">Destination Location</th>
									<th class="py-3 px-4">Date</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-50">
								{#each data.donations as don}
									<tr class="hover:bg-slate-50/30 transition text-xs">
										<td class="py-3 px-4 font-mono font-bold text-slate-500">{don.id}</td>
										<td class="py-3 px-4 font-semibold text-slate-900">{don.donorName}</td>
										<td class="py-3 px-4">
											<span class="bg-red-50 text-red-750 text-red-750 font-bold px-2 py-0.5 rounded border border-red-150 text-[10px]">
												{don.bloodGroup}
											</span>
										</td>
										<td class="py-3 px-4 font-semibold text-slate-700">{don.units} units</td>
										<td class="py-3 px-4 font-medium text-slate-650">{don.hospital}</td>
										<td class="py-3 px-4 text-gray-400">{don.date}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Manual Logging Form -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
				<h3 class="text-lg font-bold text-slate-900 mb-4">Log Manual Donation</h3>
				<p class="text-[10px] text-slate-400 mb-4">Add off-line donor campaign logs to database coordinates.</p>

				<form method="POST" action="?/logDonation" class="space-y-4 text-xs">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Donor Name *</label>
						<input
							name="donorName"
							type="text"
							placeholder="Donor Full Name"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Blood Group *</label>
						<select
							name="bloodGroup"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white font-semibold"
							required
						>
							<option value="O+">O+</option>
							<option value="A+">A+</option>
							<option value="B+">B+</option>
							<option value="AB+">AB+</option>
							<option value="O-">O-</option>
							<option value="A-">A-</option>
							<option value="B-">B-</option>
							<option value="AB-">AB-</option>
						</select>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold text-slate-500 uppercase">Units Logged *</label>
							<input
								name="units"
								type="number"
								min="1"
								placeholder="1"
								class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
								required
							/>
						</div>

						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold text-slate-500 uppercase">Donation Date</label>
							<input
								name="date"
								type="date"
								class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Admitted Hospital Location *</label>
						<input
							name="hospital"
							type="text"
							placeholder="Salem General Hospital"
							class="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
							required
						/>
					</div>

					<button
						type="submit"
						class="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
					>
						Register Donation Drive
					</button>
				</form>
			</div>
		</div>

	<!-- TAB 9: SYSTEM REPORTS -->
	{:else if db.activeTab === 'reports'}
		<div class="space-y-6">
			<!-- Header Block -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h3 class="text-lg font-bold text-slate-900">System Analytical Reports</h3>
					<p class="text-[10px] text-slate-500">Inspect compatible vectors, charts, and export CSV tables.</p>
				</div>
				<!-- Export Row -->
				<div class="flex flex-wrap gap-2">
					<button
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
						onclick={() => exportToCSV(data.users, ['id', 'name', 'email', 'phone', 'location', 'role', 'status', 'bloodGroup', 'createdAt'], 'lifelink_users.csv')}
					>
						📥 Export Users CSV
					</button>
					<button
						class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
						onclick={() => exportToCSV(data.requests, ['id', 'patientName', 'bloodGroup', 'units', 'hospital', 'city', 'urgency', 'status', 'submittedAt'], 'lifelink_requests.csv')}
					>
						📥 Export Requests CSV
					</button>
					<button
						class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
						onclick={() => exportToCSV(data.bloodBanks, ['id', 'name', 'address', 'phone', 'email', 'workingHours'], 'lifelink_bloodbanks.csv')}
					>
						📥 Export Blood Banks CSV
					</button>
				</div>
			</div>

			<!-- 1-5: Grid of Cards (Registered Donors, Recipients, Blood Requests, Completed, Pending, Emergency) -->
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Registered Donors</span>
					{#if reportStats.totalRegisteredDonors > 0}
						<h4 class="text-2xl font-black text-red-700 mt-1">{reportStats.totalRegisteredDonors}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>

				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Recipients</span>
					{#if reportStats.totalRecipients > 0}
						<h4 class="text-2xl font-black text-blue-600 mt-1">{reportStats.totalRecipients}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>

				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Requests Created</span>
					{#if reportStats.totalRequestsCreated > 0}
						<h4 class="text-2xl font-black text-slate-900 mt-1">{reportStats.totalRequestsCreated}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>

				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Completed Requests</span>
					{#if reportStats.completedRequests > 0}
						<h4 class="text-2xl font-black text-emerald-600 mt-1">{reportStats.completedRequests}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>

				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Pending Requests</span>
					{#if reportStats.pendingRequests > 0}
						<h4 class="text-2xl font-black text-amber-600 mt-1">{reportStats.pendingRequests}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>

				<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
					<span class="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Emergency Requests</span>
					{#if reportStats.emergencyRequests > 0}
						<h4 class="text-2xl font-black text-red-650 text-red-600 mt-1">{reportStats.emergencyRequests}</h4>
					{:else}
						<span class="text-xs text-slate-400 block font-semibold mt-2">No data available</span>
					{/if}
				</div>
			</div>

			<!-- Dynamic Visual Charts wrapper -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
				<AnalyticsCharts chartData={reportAnalytics} />
			</div>

			<!-- 6 Available Donors by Blood Group -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
				<h4 class="text-sm font-bold text-slate-900 mb-2">Available Donors by Blood Group</h4>
				<p class="text-[10px] text-slate-500 mb-4">Total number of active available donors for each blood group.</p>
				<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
					{#each Object.entries(reportStats.availableDonorsByGroup) as [bg, count]}
						<div class="border border-slate-100 rounded-2xl p-4 text-center bg-slate-50/50">
							<span class="text-sm font-bold text-slate-800 block">{bg}</span>
							{#if count > 0}
								<span class="text-xl font-black text-red-700 block mt-1">{count}</span>
							{:else}
								<span class="text-[10px] text-slate-400 block mt-2 font-medium">None</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- 7 City/Location Wise Donor Availability -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
				<h4 class="text-sm font-bold text-slate-900 mb-2">City/Location wise Donor Availability</h4>
				<p class="text-[10px] text-slate-500 mb-4">Distribution of active available donors by city.</p>
				{#if Object.keys(reportStats.cityAvailability).length === 0}
					<span class="text-xs text-slate-400 font-semibold block">No data available</span>
				{:else}
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{#each Object.entries(reportStats.cityAvailability) as [city, count]}
							<div class="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
								<span class="text-xs font-bold text-slate-500 block uppercase tracking-wider">{city}</span>
								<span class="text-xl font-black text-red-700 mt-1 block">{count} Donors</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- 8 Recent User Activity -->
			<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
				<h4 class="text-sm font-bold text-slate-900 mb-4">Recent User Activity Logs</h4>
				{#if data.systemLogs.length === 0}
					<span class="text-xs text-slate-400 font-semibold block">No data available</span>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-left text-sm">
							<thead>
								<tr class="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
									<th class="py-3 px-4">Log ID</th>
									<th class="py-3 px-4">User</th>
									<th class="py-3 px-4">Activity</th>
									<th class="py-3 px-4">Timestamp</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-50">
								{#each data.systemLogs.slice(0, 10) as log}
									<tr class="hover:bg-slate-50/30 transition text-xs">
										<td class="py-3 px-4 font-mono font-bold text-slate-500">{log.id}</td>
										<td class="py-3 px-4 font-semibold text-slate-900">{log.user}</td>
										<td class="py-3 px-4 text-slate-600">{log.activity}</td>
										<td class="py-3 px-4 text-slate-400">{log.timestamp}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>

	<!-- TAB 10: SETTINGS -->
	{:else if db.activeTab === 'settings'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
			<h3 class="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4">Operator Settings</h3>

			<div class="bg-purple-50 border border-purple-200 p-5 rounded-3xl text-purple-900 text-xs space-y-2 font-semibold">
				<p>🚨 <strong>Admin account is locked:</strong> There must be ONLY ONE admin account. Creation of secondary administrators is strictly blocked at the database API model layer.</p>
				<p>⚙️ <strong>Configuration Instance ID:</strong> lifelink_system_server_instance_v1</p>
			</div>

			<div class="space-y-4 max-w-md">
				<div>
					<h4 class="font-bold text-slate-800 text-sm">Account Details</h4>
					<div class="mt-2 text-xs space-y-2 bg-slate-50 p-4 rounded-2xl text-slate-650 border border-slate-100">
						<p><strong>Admin Name:</strong> {data.user.name}</p>
						<p><strong>Operator Email:</strong> {data.user.email}</p>
						<p><strong>Assigned Role:</strong> System Administrator (Root)</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal: Eligibility Questionnaire Viewer -->
{#if selectedEligRequest}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
		<div class="bg-white border border-slate-100 p-6 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-6 relative animate-fadeIn text-left">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="text-lg font-bold text-slate-900">Eligibility Questionnaire Assessment</h3>
					<p class="text-[10px] text-gray-500">Applicant: {selectedEligRequest.name} ({selectedEligRequest.email})</p>
				</div>
				<button
					class="p-1 rounded-full hover:bg-gray-150 text-gray-400 hover:text-slate-800 transition text-lg cursor-pointer bg-gray-100"
					onclick={() => selectedEligRequest = null}
				>
					✕
				</button>
			</div>

			<div class="grid sm:grid-cols-2 gap-4 text-xs">
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Age</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.age} years</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Weight</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.weight} kg</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Gender</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.gender}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Last Donation</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.lastDonation === 12 ? 'Never / >12 months' : `${selectedEligRequest.answers?.lastDonation} months ago`}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Blood Pressure</p>
					<p class="font-bold uppercase text-slate-800">{selectedEligRequest.answers?.bloodPressure}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Diabetic under insulin?</p>
					<p class="font-bold uppercase text-slate-800">{selectedEligRequest.answers?.diabetes ? 'Yes' : 'No'}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Chronic Diseases</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.chronicDisease === true ? 'Yes' : (selectedEligRequest.answers?.chronicDisease || 'None')}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Ongoing Prescribed Medications</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.medication === true ? 'Yes' : (selectedEligRequest.answers?.medication || 'None')}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Recent Major Surgeries</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.surgeryHistory === true ? 'Yes' : (selectedEligRequest.answers?.surgeryHistory || 'None')}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Tattoo or Piercings (last 6m)</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.tattoo ? 'Yes' : 'No'}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Pregnancy or Breastfeeding</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.pregnancy === 'na' ? 'Not Applicable' : (selectedEligRequest.answers?.pregnancy === 'yes' ? 'Yes' : 'No')}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Fever, cold, active flu?</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.fever ? 'Yes' : 'No'}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Vaccinations (last 4w)</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.vaccination ? 'Yes' : 'No'}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Est. Hemoglobin level</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.hemoglobin} g/dL</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">COVID-19 symptoms (last 14d)</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.covidHistory ? 'Yes' : 'No'}</p>
				</div>
				<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
					<p class="text-slate-400 font-semibold uppercase text-[9px] mb-1">Medical Notes</p>
					<p class="font-bold text-slate-800">{selectedEligRequest.answers?.medicalHistory || 'None logged'}</p>
				</div>
			</div>

			<div class="flex gap-3 justify-end border-t border-slate-50 pt-4">
				{#if selectedEligRequest.status === 'Pending'}
					<button
						class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl transition cursor-pointer text-xs"
						onclick={() => handleReviewEligibility(selectedEligRequest.id, 'Approved', selectedEligRequest.email)}
					>
						Approve Candidate
					</button>
					<button
						class="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-2 rounded-xl transition cursor-pointer text-xs"
						onclick={() => handleReviewEligibility(selectedEligRequest.id, 'Rejected', selectedEligRequest.email)}
					>
						Reject Candidate
					</button>
				{/if}
				<button
					class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-xl border transition cursor-pointer text-xs"
					onclick={() => selectedEligRequest = null}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}