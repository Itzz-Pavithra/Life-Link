<script>
	import { invalidateAll } from '$app/navigation';
	import { db } from '$lib/auth.svelte.js';
	import Icon from '$lib/components/Icon.svelte';
	import { getInitials, getAvatarColor } from '$lib/avatar.js';
	import EmergencyChat from '$lib/components/EmergencyChat.svelte';

	let { data } = $props();

	// Availability state
	let isAvailable = $state(data.user?.isAvailable !== false);
	let activeChatId = $state(null);

	// Edit Mode State
	let isEditing = $state(false);

	// Form inputs state
	let profileName = $state(data.user?.name || '');
	let profilePhone = $state(data.user?.phone || '');
	let profileLocation = $state(data.user?.location || '');
	let profileAddress = $state(data.user?.address || '');
	let profileGender = $state(data.user?.gender || 'male');
	let profileBloodGroup = $state(data.user?.bloodGroup || '');
	let profileIsAvailable = $state(data.user?.isAvailable !== false);

	// Keep states in sync when data updates
	$effect(() => {
		if (data.user) {
			isAvailable = data.user.isAvailable !== false;
			if (!isEditing) {
				profileName = data.user.name || '';
				profilePhone = data.user.phone || '';
				profileLocation = data.user.location || '';
				profileAddress = data.user.address || '';
				profileGender = data.user.gender || 'male';
				profileBloodGroup = data.user.bloodGroup || '';
				profileIsAvailable = data.user.isAvailable !== false;
			}
		}
	});

	async function toggleAvailability() {
		if (data.recovery?.inRecovery) {
			db.addToast(`You are currently in donation recovery (${data.recovery.daysRemaining} days remaining). Availability cannot be enabled during recovery.`, 'error');
			return;
		}

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
					gender: profileGender,
					bloodGroup: profileBloodGroup,
					isAvailable: profileIsAvailable
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
			profileGender = data.user.gender || 'male';
			profileBloodGroup = data.user.bloodGroup || '';
			profileIsAvailable = data.user.isAvailable !== false;
		}
	}

	async function handleDonorResponse(requestId, status) {
		try {
			const response = await fetch('/api/requests/respond', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requestId, status })
			});
			const res = await response.json();
			if (res.success) {
				if (status === 'Accepted') {
					db.addToast(`Emergency request ACCEPTED! Private Emergency Chat is now open.`, 'success');
					activeChatId = `${requestId}_${data.user.id}`;
				} else {
					db.addToast(`You have rejected the request.`, 'info');
				}
				await invalidateAll();
			} else {
				db.addToast(res.error || 'Failed to submit response', 'error');
			}
		} catch (err) {
			db.addToast('Error communicating with server.', 'error');
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
			<!-- 🩸 DONATION RECOVERY CARD -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 text-left border-l-4 border-l-red-600">
				<div class="flex items-center justify-between">
					<h3 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
						🩸 DONATION RECOVERY
					</h3>
					{#if data.recovery?.inRecovery}
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 uppercase tracking-wider animate-pulse">
							Recovery Active
						</span>
					{:else}
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
							Eligible to Donate
						</span>
					{/if}
				</div>

				<div class="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
					<div>
						<span class="text-[9px] text-slate-400 font-bold uppercase block">Last Donation</span>
						<span class="text-xs font-extrabold text-slate-800 block mt-0.5">{data.recovery?.lastDonationDate || 'None'}</span>
					</div>
					<div>
						<span class="text-[9px] text-slate-400 font-bold uppercase block">Recovery Period</span>
						<span class="text-xs font-extrabold text-red-700 block mt-0.5">{data.recovery?.totalDays || 90} Days</span>
					</div>
					<div>
						<span class="text-[9px] text-slate-400 font-bold uppercase block">Eligible Again</span>
						<span class="text-xs font-extrabold text-emerald-700 block mt-0.5">{data.recovery?.nextEligibleDate || 'Today'}</span>
					</div>
				</div>

				{#if data.recovery?.inRecovery}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-[10px] font-bold text-slate-600">
							<span>Recovery in progress</span>
							<span class="text-red-700 font-black">{data.recovery.daysRemaining} days remaining</span>
						</div>
						<div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
							<div
								class="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-500"
								style="width: {Math.min(100, Math.max(5, Math.round(((data.recovery.totalDays - data.recovery.daysRemaining) / data.recovery.totalDays) * 100)))}%"
							></div>
						</div>
						<p class="text-[10px] text-slate-500 italic mt-1">
							You can donate again in <strong>{data.recovery.daysRemaining} days</strong>. You are temporarily unavailable for new blood donation requests.
						</p>
					</div>
				{:else}
					<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
						<span class="text-xs font-extrabold text-emerald-800 block">🟢 You are eligible to donate again.</span>
						<p class="text-[10px] text-emerald-700">You can now manually select Available or Unavailable below.</p>
					</div>
				{/if}
			</div>

			<!-- Availability Status Widget -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
				<div class="space-y-2">
					<h3 class="font-bold text-slate-900">Donation Availability</h3>
					<p class="text-xs text-slate-500">Set if you are active and available for emergency match requests.</p>
				</div>

				<div class="flex items-center justify-between border border-slate-105 bg-slate-50 p-4 rounded-2xl my-4">
					<span class="text-sm font-semibold text-slate-800">
						{data.recovery?.inRecovery ? 'Temporarily Locked (Recovery)' : 'Available for matches'}
					</span>
					<!-- Styled Toggle Switch -->
					<button
						class="w-12 h-6 rounded-full p-1 transition-colors duration-300 relative cursor-pointer
						{isAvailable && !data.recovery?.inRecovery ? 'bg-red-700' : 'bg-slate-300 opacity-60'}"
						onclick={toggleAvailability}
						disabled={data.recovery?.inRecovery}
					>
						<span
							class="block w-4 h-4 rounded-full bg-white transition-transform duration-300 transform
							{isAvailable && !data.recovery?.inRecovery ? 'translate-x-6' : 'translate-x-0'}"
						></span>
					</button>
				</div>

				<p class="text-[10px] text-slate-450 italic">
					{#if data.recovery?.inRecovery}
						<span class="inline-flex items-center gap-1 text-red-600 font-semibold"><Icon name="clock" class="w-3 h-3" /> Recovery mode takes priority over availability.</span>
					{:else if isAvailable}
						<span class="inline-flex items-center gap-1 text-emerald-600"><Icon name="check" class="w-3 h-3" /> Nearby recipients can find and matching requests can auto-route to you.</span>
					{:else}
						<span class="inline-flex items-center gap-1 text-slate-400"><Icon name="x" class="w-3 h-3" /> You are currently hidden from query engines.</span>
					{/if}
				</p>
			</div>

			<!-- Metrics Summary Card -->
			<div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
				<h3 class="font-bold text-slate-900">Donor Statistics</h3>
				<div class="grid grid-cols-2 gap-4">
					<div class="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-center">
						<span class="text-2xl block mb-1 text-red-600 flex justify-center"><Icon name="droplet" size={24} /></span>
						<h4 class="text-2xl font-black text-red-750 text-red-700">{data.stats.donationsCount}</h4>
						<p class="text-[10px] text-slate-500">Donations Done</p>
					</div>

					<div class="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
						<span class="text-2xl block mb-1 text-red-500 flex justify-center"><Icon name="heart" size={24} /></span>
						<h4 class="text-2xl font-black text-emerald-750 text-emerald-700">{data.stats.livesSavedCount}</h4>
						<p class="text-[10px] text-slate-500">Lives Saved</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Active Emergency Chats Banner Section -->
		{#if data.chats && data.chats.length > 0}
			<div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md mt-6 text-left space-y-4 border border-slate-800">
				<div class="flex items-center justify-between">
					<h3 class="font-extrabold text-base flex items-center gap-2">
						💬 Active Emergency Conversations ({data.chats.length})
					</h3>
					<span class="text-[9px] bg-red-950 text-red-300 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-red-800">
						In-App Emergency Chat Active
					</span>
				</div>
				<div class="grid sm:grid-cols-2 gap-4">
					{#each data.chats as chat}
						<div class="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition">
							<div>
								<h4 class="font-extrabold text-white text-xs">Request #{chat.requestId} • {chat.bloodGroup}</h4>
								<p class="text-[10px] text-slate-400">Patient: {chat.patientName} • {chat.hospital}</p>
								<p class="text-[10px] text-slate-400 italic truncate max-w-48 mt-1">"{chat.lastMessage}"</p>
							</div>
							<button
								onclick={() => activeChatId = chat.id}
								class="bg-primary hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
							>
								<Icon name="message-square" class="w-3.5 h-3.5" /> Open Chat
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Incoming Blood Requests section on main Dashboard -->
		<div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 text-left">
			<div class="flex items-center gap-3 mb-4 border-b border-slate-50 pb-2">
				<Icon name="alert-octagon" class="w-6 h-6 text-red-600 animate-pulse" />
				<div>
					<h3 class="font-bold text-lg text-slate-900">Incoming Blood Requests</h3>
					<p class="text-xs text-slate-500">Matching blood requests for your blood type.</p>
				</div>
			</div>

			{#if data.requests.length === 0}
				<div class="border border-slate-100 p-8 rounded-3xl text-center bg-slate-50/50">
					<span class="text-3xl block mb-2 text-slate-400 flex justify-center"><Icon name="clipboard-list" size={32} /></span>
					<p class="text-slate-550 font-bold text-slate-600">No emergency requests found</p>
					<p class="text-slate-400 text-xs mt-1">There are no pending blood requests for your blood type at this moment.</p>
				</div>
			{:else}
				<div class="grid sm:grid-cols-2 gap-6">
					{#each data.requests as req}
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
										<p class="text-[10px] text-gray-550 flex items-center gap-1"><Icon name="hospital" class="w-3.5 h-3.5" /> {req.hospital} • {req.city}</p>
									</div>
								</div>

								<div class="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-[10px] text-slate-500 space-y-1">
									<p><strong>Patient Name:</strong> {req.patientName}</p>
									<p><strong>Blood Group:</strong> {req.bloodGroup}</p>
									<p><strong>Units Required:</strong> {req.units} units</p>
									<p><strong>Hospital:</strong> {req.hospital}</p>
									<p><strong>City:</strong> {req.city}</p>
									<p><strong>Urgency Level:</strong> <span class="font-bold uppercase tracking-wider text-[9px]
										{req.urgency === 'Critical' ? 'text-red-700' : ''}
										{req.urgency === 'Urgent' ? 'text-amber-700' : ''}
										{req.urgency === 'Normal' ? 'text-slate-500' : ''}">{req.urgency}</span></p>
									<p><strong>Request Time:</strong> {req.createdAt || req.date}</p>
									<p><strong>Current Status:</strong> <span class="font-bold text-red-750 text-red-700">{req.status}</span></p>
								</div>
							</div>

							<div class="mt-4 flex flex-col gap-2">
								{#if req.status === 'Completed'}
									<span class="w-full block text-center bg-emerald-50 border border-emerald-250 text-emerald-700 font-extrabold py-2.5 rounded-xl text-xs">
										<span class="flex items-center justify-center gap-1.5"><Icon name="check-circle" class="w-4 h-4" /> Blood Donation Completed</span>
									</span>
								{:else if !req.donorResponse}
									<div class="grid grid-cols-2 gap-2">
										<button
											class="bg-primary hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
											onclick={() => handleDonorResponse(req.id, 'Accepted')}
										>
											Accept Request
										</button>
										<button
											class="bg-white border border-red-250 text-primary hover:bg-red-50 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
											onclick={() => handleDonorResponse(req.id, 'Rejected')}
										>
											Reject Request
										</button>
									</div>
								{:else if req.donorResponse.status === 'Accepted'}
									<button
										onclick={() => activeChatId = `${req.id}_${data.user.id}`}
										class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
									>
										<Icon name="message-square" class="w-4 h-4" /> 💬 Open Emergency Chat
									</button>
								{:else if req.donorResponse.status === 'Rejected'}
									<span class="w-full flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-700 font-extrabold py-2.5 rounded-xl text-xs">
										<Icon name="x-circle" class="w-3.5 h-3.5" /> Rejected
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
						<label class="text-[10px] font-bold text-slate-500 uppercase" for="dpgender">Gender * (Sets Cooldown Rules)</label>
						<select
							id="dpgender"
							bind:value={profileGender}
							class="border border-slate-200 p-3 rounded-xl text-sm bg-white"
							disabled={!isEditing}
						>
							<option value="male">Male (90 days cooldown)</option>
							<option value="female">Female (120 days cooldown)</option>
						</select>
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

					<div class="flex items-center gap-2.5 sm:col-span-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
						<input
							type="checkbox"
							id="dpavailability"
							bind:checked={profileIsAvailable}
							class="w-4 h-4 text-red-650 accent-red-700 disabled:opacity-50"
							disabled={!isEditing || data.recovery?.inRecovery}
						/>
						<label for="dpavailability" class="text-xs font-semibold text-slate-800 cursor-pointer">
							{data.recovery?.inRecovery ? 'Temporarily Locked (Donation Recovery Active)' : 'Active & Available for urgent emergency requests'}
						</label>
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

{#if activeChatId}
	<EmergencyChat chatId={activeChatId} user={data.user} onClose={() => activeChatId = null} />
{/if}