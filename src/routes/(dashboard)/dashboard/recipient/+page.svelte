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

	// Edit Profile States
	let isEditing = $state(false);
	let profileName = $state(data.user?.name || '');
	let profilePhone = $state(data.user?.phone || '');
	let profileLocation = $state(data.user?.location || '');
	let profileAddress = $state(data.user?.address || '');
	let profileBloodGroup = $state(data.user?.bloodGroup || '');
	let profileAvatar = $state(data.user?.avatar || '');

	let imageValidationError = $state('');

	// Keep states in sync when data updates
	$effect(() => {
		if (data.user) {
			if (!isEditing) {
				profileName = data.user.name || '';
				profilePhone = data.user.phone || '';
				profileLocation = data.user.location || '';
				profileAddress = data.user.address || '';
				profileBloodGroup = data.user.bloodGroup || '';
				profileAvatar = data.user.avatar || '';
			}
		}
	});

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (!file) return;

		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		const fileExtension = file.name.split('.').pop().toLowerCase();
		const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

		if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
			imageValidationError = 'Only image files are allowed';
			db.addToast('Only image files are allowed', 'error');
			e.target.value = '';
			return;
		}

		imageValidationError = '';
		const reader = new FileReader();
		reader.onload = (event) => {
			profileAvatar = event.target.result;
		};
		reader.readAsDataURL(file);
	}

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
					bloodGroup: profileBloodGroup,
					avatar: profileAvatar
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
		imageValidationError = '';
		if (data.user) {
			profileName = data.user.name || '';
			profilePhone = data.user.phone || '';
			profileLocation = data.user.location || '';
			profileAddress = data.user.address || '';
			profileBloodGroup = data.user.bloodGroup || '';
			profileAvatar = data.user.avatar || '';
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
	const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
	
	let availabilityAnalytics = $derived.by(() => {
		const counts = {};
		bloodGroups.forEach(bg => {
			counts[bg] = 0;
		});
		
		(data.donors || []).forEach(d => {
			const isAvail = d.isAvailable !== false && d.status === 'active';
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
			<div class="md:col-span-3 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-4">
				<h2 class="text-2xl font-bold text-slate-800">Hello, {data.user?.name}!</h2>
				<p class="text-[10px] text-gray-500 font-semibold">{data.user?.email}</p>
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
		</div>

		<!-- Blood Availability Dashboard -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
				<div>
					<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
						📊 Active Blood Inventory Analytics
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
				<h2 class="text-2xl font-bold text-slate-800">Create Blood Request</h2>
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
							class="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
						>
							🚨 {sendingAlert ? 'Sending Alert...' : 'Send Emergency Alert'}
						</button>
					{/if}
				</div>

				{#if filteredDonors.length === 0}
					<div class="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
						<span class="text-3xl block mb-2">🔍</span>
						<p class="text-slate-550 font-bold text-slate-600">No compatible donors found</p>
						<p class="text-slate-400 text-xs mt-1">Try adjusting the blood group, location search query, or availability toggle parameters.</p>
					</div>
				{:else}
					<div class="grid sm:grid-cols-2 gap-4">
						{#each filteredDonors as donor}
							<div class="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition">
								<div class="flex items-center gap-3">
									{#if donor.avatar}
										<img
											src={donor.avatar}
											alt="Avatar"
											class="w-12 h-12 rounded-full object-cover border border-slate-200"
										/>
									{:else}
										<span class="w-12 h-12 bg-red-100 text-red-700 font-extrabold text-sm rounded-xl flex items-center justify-center border border-red-200">
											{donor.bloodGroup}
										</span>
									{/if}
									<div>
										<h4 class="font-bold text-slate-900 text-sm">{donor.name}</h4>
										<p class="text-[10px] text-gray-500">📍 {donor.location || 'Not Specified'}</p>
									</div>
								</div>

								<div class="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
									<span class="font-bold text-red-700">Group: {donor.bloodGroup}</span>
									<span class="px-2.5 py-1 rounded-full text-[10px] font-bold 
										{donor.isAvailable !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-slate-100 text-slate-500 border border-slate-200'}">
										{donor.isAvailable !== false ? 'Available ✓' : 'Unavailable ✕'}
									</span>
								</div>

								<div class="mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-xs text-slate-700">
									<p class="flex items-center gap-1.5">✉️ Email: <strong>{donor.email}</strong></p>
									{#if donor.phone}
										<p class="flex items-center justify-between gap-1.5">
											<span>📞 Phone: <strong>{donor.phone}</strong></span>
											<a href="tel:{donor.phone}" class="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-0.5 rounded-lg text-[10px] transition">
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
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
					>
						✏️ Edit Profile
					</button>
				{/if}
			</div>

			<form onsubmit={handleSaveProfile} class="space-y-6">
				<!-- Avatar Section -->
				<div class="flex flex-col items-center gap-4 border-b border-slate-50 pb-6">
					<div class="relative group">
						<img
							src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
							alt="Profile Avatar"
							class="w-24 h-24 rounded-full object-cover border-2 border-red-100 shadow-md"
						/>
						{#if isEditing}
							<label
								for="avatar-upload-rec"
								class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer"
							>
								Change Photo
							</label>
							<input
								id="avatar-upload-rec"
								type="file"
								accept="image/*"
								onchange={handleFileChange}
								class="hidden"
							/>
						{/if}
					</div>
					{#if isEditing}
						<div class="text-center">
							<p class="text-[10px] text-slate-400">Allowed formats: JPG, JPEG, PNG, WEBP</p>
							{#if imageValidationError}
								<p class="text-red-700 font-bold text-[10px] mt-1">{imageValidationError}</p>
							{/if}
						</div>
					{/if}
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
						</select>
					</div>
				</div>

				<!-- Action Buttons -->
				{#if isEditing}
					<div class="grid grid-cols-2 gap-4">
						<button
							type="button"
							onclick={cancelEditing}
							class="w-full bg-slate-150 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition cursor-pointer text-sm"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl transition cursor-pointer text-sm"
						>
							Save Changes
						</button>
					</div>
				{/if}
			</form>
		</div>
	{/if}
</div>