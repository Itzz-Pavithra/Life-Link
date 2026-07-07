<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';

	let { data } = $props();

	// Availability state
	let isAvailable = $state(data.user?.isAvailable !== false);

	// Edit Mode State
	let isEditing = $state(false);

	// Form inputs state
	let profileName = $state(data.user?.name || '');
	let profilePhone = $state(data.user?.phone || '');
	let profileLocation = $state(data.user?.location || '');
	let profileAddress = $state(data.user?.address || '');
	let profileBloodGroup = $state(data.user?.bloodGroup || '');
	let profileAvatar = $state(data.user?.avatar || '');
	let profileIsAvailable = $state(data.user?.isAvailable !== false);

	let imageValidationError = $state('');

	// Keep states in sync when data updates
	$effect(() => {
		if (data.user) {
			isAvailable = data.user.isAvailable !== false;
			if (!isEditing) {
				profileName = data.user.name || '';
				profilePhone = data.user.phone || '';
				profileLocation = data.user.location || '';
				profileAddress = data.user.address || '';
				profileBloodGroup = data.user.bloodGroup || '';
				profileAvatar = data.user.avatar || '';
				profileIsAvailable = data.user.isAvailable !== false;
			}
		}
	});

	async function toggleAvailability() {
		const newStatus = !isAvailable;
		isAvailable = newStatus;
		profileIsAvailable = newStatus;

		try {
			const res = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isAvailable: newStatus })
			});
			const result = await res.json();
			if (result.success) {
				db.addToast(`Availability updated to: ${newStatus ? 'Available' : 'Unavailable'}`, 'success');
				await invalidateAll();
			} else {
				db.addToast(result.error || 'Failed to update availability status.', 'error');
				isAvailable = !newStatus;
				profileIsAvailable = !newStatus;
			}
		} catch (err) {
			db.addToast('Network error, failed to sync status.', 'error');
			isAvailable = !newStatus;
			profileIsAvailable = !newStatus;
		}
	}

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
					isAvailable: profileIsAvailable,
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
			profileIsAvailable = data.user.isAvailable !== false;
		}
	}

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
					{#if data.user?.avatar}
						<img
							src={data.user.avatar}
							alt="Profile Avatar"
							class="w-16 h-16 rounded-3xl object-cover border border-slate-200 shadow-md"
						/>
					{:else}
						<span class="w-16 h-16 rounded-3xl bg-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-700/20">
							{data.user?.bloodGroup || 'O+'}
						</span>
					{/if}
					<div class="text-left">
						<h4 class="font-bold text-slate-800 text-base">{data.user?.name}</h4>
						<p class="text-[10px] text-gray-550 text-slate-500">{data.user?.email}</p>
						<p class="text-[10px] text-gray-500">Voluntary blood donor</p>
					</div>
				</div>
				<hr class="border-slate-50" />
				<div class="space-y-2 text-xs text-slate-500">
					<p><strong>Mobile:</strong> {data.user?.phone || 'Not Provided'}</p>
					<p><strong>Region:</strong> {data.user?.location || 'Not Provided'}</p>
					<p><strong>Last Donation:</strong> {data.history && data.history.length > 0 ? data.history[0].date : 'No donations logged'}</p>
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
						onclick={toggleAvailability}
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

			{#if data.requests.filter(r => r.urgency === 'Critical' || r.urgency === 'Urgent').length === 0}
				<div class="border border-slate-100 p-8 rounded-3xl text-center bg-slate-50/50">
					<span class="text-3xl block mb-2">📋</span>
					<p class="text-slate-550 font-bold text-slate-600">No emergency requests found</p>
					<p class="text-slate-400 text-xs mt-1">There are no critical or urgent blood requests at this moment.</p>
				</div>
			{:else}
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
									<p><strong>Contact Email:</strong> {req.submittedBy}</p>
									{#if req.contact}
										<p><strong>Contact Phone:</strong> {req.contact}</p>
									{/if}
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
			{/if}
		</div>

	<!-- TAB 2: DONATION HISTORY -->
	{:else if db.activeTab === 'donation-history'}
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
			<h3 class="text-lg font-bold text-slate-900 mb-4">Historical Donations Log</h3>
			
			{#if data.history.length === 0}
				<div class="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
					<span class="text-3xl block mb-2">🩸</span>
					<p class="text-slate-500 font-bold">No donation history logged</p>
					<p class="text-slate-400 text-xs mt-1">Your past donation campaigns will appear here.</p>
				</div>
			{:else}
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
			{/if}
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
					onclick={toggleAvailability}
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
		<div class="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-lg space-y-6 text-left">
			<div class="flex justify-between items-center border-b border-slate-100 pb-4">
				<h3 class="text-xl font-bold text-slate-900">Donor Profile & Settings</h3>
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
								for="avatar-upload"
								class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer"
							>
								Change Photo
							</label>
							<input
								id="avatar-upload"
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
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpname">Full Name *</label>
						<input
							id="dpname"
							type="text"
							bind:value={profileName}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpemail">Email Address</label>
						<input
							id="dpemail"
							type="email"
							value={data.user?.email}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-100 text-slate-500"
							disabled
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpphone">Phone Number *</label>
						<input
							id="dpphone"
							type="tel"
							bind:value={profilePhone}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dploc">City / Location *</label>
						<input
							id="dploc"
							type="text"
							bind:value={profileLocation}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50"
							disabled={!isEditing}
							required
						/>
					</div>

					<div class="flex flex-col gap-1.5 sm:col-span-2">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpaddress">Home Address</label>
						<textarea
							id="dpaddress"
							bind:value={profileAddress}
							rows="2"
							placeholder="Enter address details..."
							class="border border-slate-200 p-3 rounded-xl text-sm bg-slate-50/50 resize-none"
							disabled={!isEditing}
						></textarea>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpbg">Blood Group *</label>
						<select
							id="dpbg"
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

					<div class="flex items-center gap-2.5 sm:col-span-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
						<input
							type="checkbox"
							id="dpavailability"
							bind:checked={profileIsAvailable}
							class="w-4 h-4 text-red-650 accent-red-700"
							disabled={!isEditing}
						/>
						<label for="dpavailability" class="text-xs font-semibold text-slate-800 cursor-pointer">
							Active & Available for urgent emergency requests
						</label>
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