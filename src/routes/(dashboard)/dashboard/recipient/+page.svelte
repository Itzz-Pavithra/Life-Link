<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import Icon from '$lib/components/Icon.svelte';
	import { getInitials, getAvatarColor } from '$lib/avatar.js';

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
			db.addToast(`Emergency Blood Request submitted for ${patientName}! Matching donors are being calculated.`, 'success');
			
			// Reset inputs
			patientName = '';
			hospital = '';
			city = '';
			contact = '';
			urgency = 'Normal';
			
			// Force loader reload
			await invalidateAll();
			db.activeTab = 'dashboard';
		} else {
			db.addToast(res.error || 'Failed to submit request', 'error');
		}
	}

	// Edit Profile States
	let isEditing = $state(false);
	let profileName = $state(data.user?.name || '');
	let profilePhone = $state(data.user?.phone || '');
	let profileLocation = $state(data.user?.location || '');
	let profileAddress = $state(data.user?.address || '');
	let profileBloodGroup = $state(data.user?.bloodGroup || '');

	// Keep states in sync when data updates
	$effect(() => {
		if (data.user) {
			if (!isEditing) {
				profileName = data.user.name || '';
				profilePhone = data.user.phone || '';
				profileLocation = data.user.location || '';
				profileAddress = data.user.address || '';
				profileBloodGroup = data.user.bloodGroup || '';
			}
		}
	});

	async function handleSaveProfile(e) {
		if (e) e.preventDefault();
		if (!profileName || !profilePhone || !profileLocation) {
			db.addToast('Please fill in Name, Phone, and City.', 'error');
			return;
		}

		try {
			const res = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: profileName,
					phone: profilePhone,
					location: profileLocation,
					address: profileAddress,
					bloodGroup: profileBloodGroup
				})
			});
			const result = await res.json();
			if (result.success) {
				db.addToast('Profile changes saved successfully.', 'success');
				isEditing = false;
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to save changes.', 'error');
			}
		} catch (err) {
			db.addToast('Network error, failed to save profile.', 'error');
		}
	}

	function cancelEditing() {
		isEditing = false;
		if (data.user) {
			profileName = data.user.name || '';
			profilePhone = data.user.phone || '';
			profileLocation = data.user.location || '';
			profileAddress = data.user.address || '';
			profileBloodGroup = data.user.bloodGroup || '';
		}
	}

	// Search Donors Filter States
	let searchBloodGroup = $state('all');
	let searchCity = $state('');
	let searchAvailability = $state('all');

	// Filtered Donors List
	let filteredDonors = $derived.by(() => {
		const donors = data.donors || [];
		return donors.filter(d => {
			if (searchBloodGroup !== 'all' && d.bloodGroup !== searchBloodGroup) return false;
			if (searchCity) {
				const donorCity = (d.location || '').toLowerCase();
				if (!donorCity.includes(searchCity.toLowerCase())) return false;
			}
			const isAvail = d.isAvailable !== false;
			if (searchAvailability === 'available' && !isAvail) return false;
			if (searchAvailability === 'unavailable' && isAvail) return false;
			return true;
		});
	});

	// Blood Availability Analytics
	const bloodGroups = [
		'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
		'A1+', 'A1-', 'A2+', 'A2-',
		'A1B+', 'A1B-', 'A2B+', 'A2B-'
	];
	
	const availabilityAnalytics = $derived.by(() => {
		let counts = {
			'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
			'A1+': 0, 'A1-': 0, 'A2+': 0, 'A2-': 0,
			'A1B+': 0, 'A1B-': 0, 'A2B+': 0, 'A2B-': 0
		};
		(data.donors || []).forEach(d => {
			let isAvail = d.isAvailable !== false && d.status === 'active';
			if (isAvail && d.bloodGroup && counts[d.bloodGroup] !== undefined) {
				counts[d.bloodGroup]++;
			}
		});
		
		return bloodGroups.map(bg => {
			const count = counts[bg];
			return {
				bloodGroup: bg,
				count,
				isLow: count < 3
			};
		});
	});

	let sendingAlert = $state(false);

	async function sendEmergencyAlert() {
		if (filteredDonors.length === 0) return;
		if (searchBloodGroup === 'all') {
			db.addToast('Please select a specific blood type filter before dispatching alerts.', 'error');
			return;
		}
		sendingAlert = true;
		try {
			const res = await fetch('/api/requests/alert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bloodGroup: searchBloodGroup,
					city: searchCity,
					recipientName: data.user?.name,
					contactPhone: data.user?.phone
				})
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(result.message || `Emergency alert processed successfully.`, 'success');
			} else {
				db.addToast(result.error || 'Failed to send alert.', 'error');
			}
		} catch (err) {
			db.addToast('Error sending emergency alert.', 'error');
		} finally {
			sendingAlert = false;
		}
	}

	// Delete account state
	let showDeleteConfirm = $state(false);
	let deletingAccount = $state(false);

	async function handleDeleteAccount() {
		deletingAccount = true;
		try {
			const res = await fetch('/api/user/delete', { method: 'DELETE' });
			const result = await res.json();
			if (result.success) {
				db.user = null;
				db.addToast('Your account has been permanently deleted.', 'success');
				try {
					const { auth: firebaseAuth } = await import('$lib/firebase.client.js');
					const { signOut } = await import('firebase/auth');
					await signOut(firebaseAuth);
				} catch (e) { /* ignore */ }
				const consent = localStorage.getItem('lifelink_cookie_consent');
				localStorage.clear();
				if (consent !== null) {
					localStorage.setItem('lifelink_cookie_consent', consent);
				}
				sessionStorage.clear();
				window.location.href = '/';
			} else {
				db.addToast(result.error || 'Failed to delete account.', 'error');
				deletingAccount = false;
				showDeleteConfirm = false;
			}
		} catch (err) {
			db.addToast('Network error. Please try again.', 'error');
			deletingAccount = false;
			showDeleteConfirm = false;
		}
	}

	// Polling and notifications for donor responses
	let notifiedResponses = new Map();
	let isFirstLoad = true;

	$effect(() => {
		// Periodically invalidate data to fetch updates (polling every 5 seconds)
		const interval = setInterval(() => {
			invalidateAll();
		}, 5000);

		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!data.myRequests) return;

		data.myRequests.forEach(req => {
			req.donorResponses.forEach(dr => {
				if (dr.status !== 'Waiting') {
					const key = `${req.id}_${dr.donorId}`;
					if (!notifiedResponses.has(key)) {
						notifiedResponses.set(key, dr.status);
						// Don't show toast on initial page load to avoid spamming existing responses
						if (!isFirstLoad) {
							if (dr.status === 'Accepted') {
								db.addToast(`Accepted by ${dr.donorName}`, 'success');
							} else if (dr.status === 'Rejected') {
								db.addToast(`Rejected by ${dr.donorName}`, 'error');
							}
						}
					}
				}
			});
		});

		if (isFirstLoad && data.myRequests.length > 0) {
			isFirstLoad = false;
		}
	});

	async function handleCompleteRequest(requestId) {
		if (!confirm("Are you sure you have successfully received the required blood?")) return;

		try {
			const response = await fetch('/api/requests/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requestId })
			});
			const res = await response.json();
			if (res.success) {
				db.addToast('Blood request marked as successfully completed!', 'success');
				await invalidateAll();
			} else {
				db.addToast(res.error || 'Failed to complete request', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
			<Icon name="clipboard-list" class="w-7 h-7 text-red-600" /> Recipient Services
		</h1>
		<span class="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
			Role: Recipient
		</span>
	</div>

	<!-- TAB 1: DASHBOARD OVERVIEW -->
	{#if db.activeTab === 'dashboard'}
		<div class="grid md:grid-cols-3 gap-6">
			<!-- Welcome Info -->
			<div class="md:col-span-3 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-4">
				<h2 class="text-2xl font-bold text-slate-800">Hello, {data.user?.name}!</h2>
				<p class="text-[10px] text-gray-500 font-semibold">{data.user?.email}</p>
				<p class="text-slate-500 text-sm leading-relaxed">
					From your Recipient panel, you can view blood inventory analytics, search compatible active donors, and dispatch emergency alerts.
				</p>
			</div>
		</div>

		<!-- Blood Availability Dashboard -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
				<div>
					<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
						<Icon name="bar-chart" class="w-5 h-5 text-red-600" /> Active Blood Inventory Analytics
					</h3>
					<p class="text-xs text-slate-500">Live compatible donor supply counts based on real network availability.</p>
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
							<span class="text-[9px] text-slate-400 block font-semibold uppercase">Available</span>
						</div>
						{#if item.isLow}
							<span class="inline-block bg-red-100 text-red-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">
								Emergency Low
							</span>
						{:else}
							<span class="inline-block bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
								Normal Supply
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Track Donor Responses Dashboard Section -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center gap-3 mb-4 border-b border-slate-50 pb-2">
				<Icon name="clipboard-list" class="w-6 h-6 text-red-600" />
				<div>
					<h3 class="text-lg font-bold text-slate-900">Track Donor Responses</h3>
					<p class="text-xs text-slate-500">Real-time status of responses from compatible matched donors.</p>
				</div>
			</div>

			{#if !data.myRequests || data.myRequests.length === 0}
				<div class="border border-slate-100 p-8 rounded-3xl text-center bg-slate-50/50">
					<span class="text-3xl block mb-2 text-slate-400 flex justify-center"><Icon name="megaphone" size={32} /></span>
					<p class="text-slate-550 font-bold text-slate-600">No blood requests published yet</p>
					<p class="text-slate-400 text-xs mt-1">Submit a request under "Request Blood" to start matching with donors.</p>
				</div>
			{:else}
				<div class="space-y-6">
					{#each data.myRequests as req}
						<div class="bg-slate-50/30 border border-slate-100 rounded-2xl p-6 space-y-4">
							<div class="flex justify-between items-start border-b border-slate-100 pb-3 flex-wrap gap-2">
								<div>
									<h4 class="font-extrabold text-slate-800 text-sm">
										Patient: {req.patientName} ({req.bloodGroup})
									</h4>
									<p class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
										<Icon name="hospital" class="w-3.5 h-3.5" /> {req.hospital} • {req.city} • Required Units: {req.units}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
										{req.urgency === 'Critical' ? 'bg-red-50 text-red-700 border border-red-150 animate-pulse' : ''}
										{req.urgency === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
										{req.urgency === 'Normal' ? 'bg-slate-150 text-slate-655 text-slate-600' : ''}">
										{req.urgency}
									</span>
									<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
										{req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-250' : ''}
										{req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : ''}
										{req.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-150' : ''}
										{req.status === 'Completed' ? 'bg-emerald-50 text-emerald-750 text-emerald-700' : ''}">
										{req.status}
									</span>
								</div>
							</div>

							{#if req.status === 'Completed'}
								<div class="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center flex items-center justify-center gap-2">
									<span class="font-extrabold text-emerald-700 text-sm flex items-center gap-1.5"><Icon name="check-circle" class="w-4 h-4" /> Blood Successfully Received</span>
									<p class="text-[10px] text-emerald-650 mt-1">This request has been successfully resolved.</p>
								</div>
							{:else}
								<!-- Donor Responses List -->
								<div class="space-y-3">
									<div class="flex justify-between items-center flex-wrap gap-2">
										<h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donor Responses ({req.donorResponses.length} compatible matched)</h5>
										
										<!-- Blood Received Button -->
										{#if req.donorResponses.some(dr => dr.status === 'Accepted')}
											<button
												onclick={() => handleCompleteRequest(req.id)}
												class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition cursor-pointer flex items-center gap-1"
											>
												<Icon name="check-circle" class="w-3.5 h-3.5" /> Blood Received / Mark as Completed
											</button>
										{/if}
									</div>
									
									{#if req.donorResponses.length === 0}
										<p class="text-xs text-slate-400 italic">No compatible active and available donors found for this blood group.</p>
									{:else}
										<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
											{#each req.donorResponses as dr}
												<div class="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition">
													<div class="flex justify-between items-start">
														<div>
															<h6 class="font-bold text-slate-800 text-xs">{dr.donorName}</h6>
															<span class="text-[9px] uppercase font-bold tracking-widest mt-1 flex items-center gap-1
																{dr.status === 'Accepted' ? 'text-emerald-700' : ''}
																{dr.status === 'Rejected' ? 'text-red-700' : ''}
																{dr.status === 'Waiting' ? 'text-slate-400' : ''}">
																{dr.status === 'Accepted' ? 'Accepted' : dr.status === 'Rejected' ? 'Rejected by donor' : 'Waiting for donor response...'}
																{#if dr.status === 'Accepted'}<Icon name="check" class="w-3 h-3" />{/if}
															</span>
														</div>
													</div>

													{#if dr.status === 'Accepted' && dr.donorDetails}
														<div class="mt-3 pt-2.5 border-t border-slate-50 text-[10px] text-slate-500 space-y-1 bg-slate-50/50 p-2 rounded-lg">
															<p><strong>Blood Group:</strong> {dr.donorDetails.bloodGroup}</p>
															<p><strong>City:</strong> {dr.donorDetails.location || 'Not Specified'}</p>
															<p><strong>Phone:</strong> {dr.donorDetails.phone || 'Not Provided'}</p>
															<p><strong>Email:</strong> {dr.donorDetails.email}</p>
															{#if dr.donorDetails.phone}
																<a href="tel:{dr.donorDetails.phone}" class="mt-2 block w-full text-center bg-primary hover:bg-red-700 text-white font-bold py-1 rounded-md text-[9px] transition">
																	Call Donor
																</a>
															{/if}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

	<!-- TAB 2: REQUEST BLOOD -->
	{:else if db.activeTab === 'request-blood'}
		<div class="max-w-3xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg">
			<div class="text-center mb-6">
				<span class="text-4xl block mb-2 text-red-600 flex justify-center"><Icon name="alert-octagon" size={40} /></span>
				<h2 class="text-2xl font-bold text-slate-800">Create Blood Request</h2>
				<p class="text-slate-400 text-xs mt-1">This matches you automatically with registered nearby donors.</p>
			</div>

			<form onsubmit={handleAddRequest} class="grid md:grid-cols-2 gap-6 text-left">
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
						<option>A1+</option>
						<option>A1-</option>
						<option>A2+</option>
						<option>A2-</option>
						<option>A1B+</option>
						<option>A1B-</option>
						<option>A2B+</option>
						<option>A2B-</option>
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
					class="md:col-span-2 bg-primary hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition cursor-pointer"
				>
					Publish Blood Request
				</button>
			</form>
		</div>

	<!-- TAB: SEARCH DONORS -->
	{:else if db.activeTab === 'search-donors'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 text-left">
			<div class="border-b border-slate-100 pb-4">
				<h2 class="text-xl font-bold text-slate-900">Search Compatibility Matches</h2>
				<p class="text-xs text-slate-500 mt-1">Locate active blood donors by blood group, city, or availability parameters.</p>
			</div>

			<!-- Filters Form -->
			<div class="grid sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
				<div class="flex flex-col gap-1.5">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Blood Group</label>
					<select
						bind:value={searchBloodGroup}
						class="border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Blood Groups</option>
						<option>A+</option>
						<option>A-</option>
						<option>B+</option>
						<option>B-</option>
						<option>AB+</option>
						<option>AB-</option>
						<option>O+</option>
						<option>O-</option>
						<option>A1+</option>
						<option>A1-</option>
						<option>A2+</option>
						<option>A2-</option>
						<option>A1B+</option>
						<option>A1B-</option>
						<option>A2B+</option>
						<option>A2B-</option>
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-[10px] font-bold text-slate-500 uppercase">City / Location</label>
					<input
						type="text"
						bind:value={searchCity}
						placeholder="Search city e.g. Salem"
						class="border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Availability Status</label>
					<select
						bind:value={searchAvailability}
						class="border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none"
					>
						<option value="all">All Donors</option>
						<option value="available">Available Donors</option>
						<option value="unavailable">Unavailable Donors</option>
					</select>
				</div>
			</div>

			<!-- Donors Results List -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-bold text-slate-800 text-sm">Matching Donors ({filteredDonors.length})</h3>
					{#if filteredDonors.length > 0}
						<button
							onclick={sendEmergencyAlert}
							disabled={sendingAlert}
							class="bg-primary hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
						>
							<Icon name="alert-octagon" class="w-3.5 h-3.5" /> {sendingAlert ? 'Sending Alert...' : 'Send Emergency Alert'}
						</button>
					{/if}
				</div>

				{#if filteredDonors.length === 0}
					<div class="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
						<span class="text-3xl block mb-2 text-slate-400 flex justify-center"><Icon name="search" size={32} /></span>
						<p class="text-slate-550 font-bold text-slate-600">No compatible donors found</p>
						<p class="text-slate-400 text-xs mt-1">Try adjusting the blood group, location search query, or availability toggle parameters.</p>
					</div>
				{:else}
					<div class="grid sm:grid-cols-2 gap-4">
						{#each filteredDonors as donor}
							<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition">
								<div class="flex items-center gap-3">
									<div class="w-12 h-12 rounded-full border flex items-center justify-center font-bold text-sm uppercase shrink-0 {getAvatarColor(donor.name)}">
										{getInitials(donor.name)}
									</div>
									<div>
										<h4 class="font-bold text-slate-900 text-sm">{donor.name}</h4>
										<p class="text-[10px] text-gray-550 flex items-center gap-1"><Icon name="map-pin" class="w-3 h-3 text-gray-400" /> {donor.location || 'Not Specified'}</p>
									</div>
								</div>

								<div class="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
									<span class="font-bold text-red-700">Group: {donor.bloodGroup}</span>
									<span class="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1
										{donor.isAvailable !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-slate-100 text-slate-500 border border-slate-200'}">
										<Icon name={donor.isAvailable !== false ? 'check' : 'x'} class="w-3 h-3" />
										{donor.isAvailable !== false ? 'Available' : 'Unavailable'}
									</span>
								</div>

								<div class="mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-xs text-slate-700">
									<p class="flex items-center gap-1.5"><Icon name="mail" class="w-3.5 h-3.5 text-gray-400" /> Email: <strong>{donor.email}</strong></p>
									{#if donor.phone}
										<p class="flex items-center justify-between gap-1.5">
											<span class="flex items-center gap-1.5"><Icon name="phone" class="w-3.5 h-3.5 text-gray-400" /> Phone: <strong>{donor.phone}</strong></span>
											<a href="tel:{donor.phone}" class="bg-primary hover:bg-red-700 text-white font-bold px-3 py-0.5 rounded-lg text-[10px] transition">
												Call
											</a>
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

	<!-- TAB 4: PROFILE -->
	{:else if db.activeTab === 'profile'}
		<div class="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg space-y-6 text-left">
			<div class="flex justify-between items-center border-b border-slate-100 pb-4">
				<h3 class="text-xl font-bold text-slate-900">Personal & Medical Details</h3>
				{#if !isEditing}
					<button
						onclick={() => isEditing = true}
						class="bg-primary hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
					>
						<Icon name="edit" class="w-3.5 h-3.5" /> Edit Profile
					</button>
				{/if}
			</div>

			<form onsubmit={handleSaveProfile} class="space-y-6">
				<!-- Initials Avatar Section -->
				<div class="flex items-center gap-5 border-b border-slate-50 pb-6 w-full">
					<div class="w-20 h-20 rounded-full border-2 shadow-md flex items-center justify-center text-2xl font-black uppercase tracking-wider shrink-0 {getAvatarColor(profileName)}">
						{getInitials(profileName)}
					</div>
					<div class="space-y-1 text-left">
						<h3 class="text-lg font-bold text-slate-850">{profileName}</h3>
						<span class="inline-block bg-red-100 text-primary border border-red-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
							{data.user?.role}
						</span>
					</div>
				</div>

				<!-- Form Inputs Grid -->
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pname">Full Name *</label>
						<input
							id="pname"
							type="text"
							bind:value={profileName}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pemail">Email Address</label>
						<input
							id="pemail"
							type="email"
							value={data.user?.email}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-100 text-slate-500"
							disabled
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pphone">Phone Number *</label>
						<input
							id="pphone"
							type="tel"
							bind:value={profilePhone}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="ploc">City / Location *</label>
						<input
							id="ploc"
							type="text"
							bind:value={profileLocation}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5 sm:col-span-2">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="paddress">Address</label>
						<textarea
							id="paddress"
							bind:value={profileAddress}
							rows="2"
							placeholder="Enter address details..."
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50 resize-none"
							disabled={!isEditing}
						></textarea>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="pbg">Blood Group *</label>
						<select
							id="pbg"
							bind:value={profileBloodGroup}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-white"
							disabled={!isEditing}
							required
						>
							<option>A+</option>
							<option>A-</option>
							<option>B+</option>
							<option>B-</option>
							<option>AB+</option>
							<option>AB-</option>
							<option>O+</option>
							<option>O-</option>
							<option>A1+</option>
							<option>A1-</option>
							<option>A2+</option>
							<option>A2-</option>
							<option>A1B+</option>
							<option>A1B-</option>
							<option>A2B+</option>
							<option>A2B-</option>
						</select>
					</div>
				</div>

				<!-- Action Buttons -->
				{#if isEditing}
					<div class="grid grid-cols-2 gap-4">
						<button
							type="button"
							onclick={cancelEditing}
							class="w-full bg-white border border-slate-200 text-secondary hover:bg-baby-pink font-bold py-3 rounded-xl transition cursor-pointer text-sm"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 rounded-xl transition cursor-pointer text-sm"
						>
							Save Changes
						</button>
					</div>
				{/if}
			</form>
		</div>
	{/if}

	<!-- Danger Zone: Delete Account -->
	<div class="bg-white border border-red-100 rounded-3xl p-6 shadow-sm">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h3 class="text-base font-bold text-red-700 flex items-center gap-2"><Icon name="alert-triangle" class="w-5 h-5" /> Danger Zone</h3>
				<p class="text-xs text-slate-500 mt-1">Permanently delete your LifeLink account and all associated data.</p>
			</div>
			<button
				onclick={() => showDeleteConfirm = true}
				class="bg-white border border-red-250 text-primary font-bold px-5 py-2.5 rounded-xl hover:bg-red-50 transition text-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
			>
				<Icon name="trash" class="w-4 h-4" /> Delete My Account
			</button>
		</div>
	</div>
</div>

{#if showDeleteConfirm}
	<!-- Delete Account Confirmation Modal -->
	<div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
			<div class="text-center">
				<span class="text-5xl block mb-4 text-amber-500 flex justify-center"><Icon name="alert-triangle" size={48} /></span>
				<h3 class="text-xl font-extrabold text-slate-900 mb-2">Delete Account</h3>
				<p class="text-sm text-slate-500 leading-relaxed">
					Are you sure you want to permanently delete your LifeLink account? All your data will be removed. This action <strong>cannot be undone</strong>.
				</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<button
					onclick={() => showDeleteConfirm = false}
					disabled={deletingAccount}
					class="w-full bg-white border border-slate-200 text-secondary hover:bg-baby-pink font-bold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onclick={handleDeleteAccount}
					disabled={deletingAccount}
					class="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 rounded-xl transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{deletingAccount ? 'Deleting...' : 'Delete Permanently'}
				</button>
			</div>
		</div>
	</div>
{/if}