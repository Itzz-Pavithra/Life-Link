<script>
	import { db } from '$lib/auth.svelte.js';
	import Icon from '$lib/components/Icon.svelte';

	let step = $state(0);
	let errorMsg = $state('');
	let successMsg = $state('');

	// Personal Details
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let location = $state('');
	let bloodGroup = $state('O+');

	// Assessment questions
	let age = $state('');
	let weight = $state('');
	let gender = $state('Male');
	let lastDonation = $state('never'); // 'never' or number of months
	let medicalHistory = $state('');
	let diabetes = $state('no'); // 'yes' or 'no'
	let bloodPressure = $state('normal'); // 'normal', 'high', 'low'
	let surgeryHistory = $state('no'); // 'yes' or 'no'
	let surgeryDetails = $state('');
	let pregnancy = $state('na'); // 'yes', 'no', 'na'
	let fever = $state('no');
	let tattoo = $state('no'); // 'yes' (recent 6 months), 'no'
	let smoking = $state('no');
	let alcohol = $state('no'); // 'yes' (recent 24h), 'no'
	let medication = $state('no');
	let medicationDetails = $state('');
	let covidHistory = $state('no'); // 'yes' (recent 14 days), 'no'
	let vaccination = $state('no'); // 'yes' (recent 4 weeks), 'no'
	let hemoglobin = $state('13.5'); // number
	let chronicDisease = $state('no');
	let chronicDetails = $state('');

	let ageError = $derived(
		age !== '' && (parseInt(age) <= 0 || parseInt(age) > 120)
			? 'Please enter a valid age between 1 and 120.'
			: ''
	);
	let weightError = $derived(
		weight !== '' && (parseFloat(weight) <= 0 || parseFloat(weight) > 300)
			? 'Please enter a valid weight between 1 and 300 kg.'
			: ''
	);

	let isStep1Valid = $derived(
		name && email && phone && location && age && weight && !ageError && !weightError
	);

	let isStep2Valid = $derived(medicalHistory && medicalHistory.trim() !== '');

	let eligibilityReasons = $derived.by(() => {
		const reasons = [];
		if (!age || parseInt(age) < 18) {
			reasons.push("Minimum age required is 18 years.");
		}
		if (!weight || parseFloat(weight) < 45) {
			reasons.push("Minimum weight required is 45kg.");
		}
		if (lastDonation !== 'never' && parseInt(lastDonation) < 3) {
			reasons.push("A minimum gap of 3 months is required since your last donation.");
		}
		if (diabetes === 'yes') {
			reasons.push("Diabetic candidates are not eligible to donate.");
		}
		if (bloodPressure !== 'normal') {
			reasons.push("Blood pressure must be within normal levels.");
		}
		if (chronicDisease === 'yes') {
			reasons.push("Candidates with chronic diseases are not eligible to donate.");
		}
		if (surgeryHistory === 'yes') {
			reasons.push("Cannot donate within 6 months of a major surgery.");
		}
		if (pregnancy === 'yes') {
			reasons.push("Cannot donate during pregnancy or breastfeeding.");
		}
		if (fever === 'yes') {
			reasons.push("Cannot donate with active fever, cold, or flu symptoms.");
		}
		if (tattoo === 'yes') {
			reasons.push("Cannot donate within 6 months of getting a tattoo or piercing.");
		}
		if (alcohol === 'yes') {
			reasons.push("Cannot donate if alcohol was consumed in the last 24 hours.");
		}
		if (medication === 'yes') {
			reasons.push("Cannot donate while taking prescribed medications.");
		}
		if (covidHistory === 'yes') {
			reasons.push("Cannot donate within 14 days of COVID-19 symptoms or exposure.");
		}
		if (vaccination === 'yes') {
			reasons.push("Cannot donate within 4 weeks of receiving a vaccine.");
		}
		const hb = parseFloat(hemoglobin);
		if (isNaN(hb) || hb < 12.5 || hb > 18.0) {
			reasons.push("Hemoglobin level must be between 12.5 and 18.0 g/dL.");
		}
		if (!medicalHistory || !medicalHistory.trim()) {
			reasons.push("Medical history information is required.");
		}
		return reasons;
	});

	let isEligible = $derived(eligibilityReasons.length === 0);

	function resetQuiz() {
		step = 0;
		errorMsg = '';
		successMsg = '';
		name = '';
		email = '';
		phone = '';
		location = '';
		age = '';
		weight = '';
		gender = 'Male';
		lastDonation = 'never';
		medicalHistory = '';
		diabetes = 'no';
		bloodPressure = 'normal';
		surgeryHistory = 'no';
		surgeryDetails = '';
		pregnancy = 'na';
		fever = 'no';
		tattoo = 'no';
		smoking = 'no';
		alcohol = 'no';
		medication = 'no';
		medicationDetails = '';
		covidHistory = 'no';
		vaccination = 'no';
		hemoglobin = '13.5';
		chronicDisease = 'no';
		chronicDetails = '';
	}

	async function handleSubmit() {
		errorMsg = '';
		successMsg = '';

		if (!isStep1Valid) {
			errorMsg = 'Please complete all required fields with valid values on the first step.';
			step = 1;
			return;
		}

		if (!isStep2Valid) {
			errorMsg = 'Please provide medical history notes.';
			step = 2;
			return;
		}

		successMsg = 'Questionnaire completed successfully!';
		db.addToast(isEligible ? 'You are eligible to donate blood!' : 'You are currently not eligible to donate.', isEligible ? 'success' : 'warning');
		step = 6;
	}
</script>

<div class="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-left">
	<div class="absolute -top-16 -right-16 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>

	{#if errorMsg}
		<div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
			<Icon name="alert-triangle" class="w-4 h-4" /> {errorMsg}
		</div>
	{/if}

	{#if step === 0}
		<!-- Start View -->
		<div class="text-center py-6">
			<div class="text-5xl mb-4 animate-bounce text-red-600 flex justify-center"><Icon name="clipboard-list" size={48} /></div>
			<h3 class="text-2xl font-bold text-gray-900 mb-2">
				Blood Donor Eligibility Quiz
			</h3>
			<p class="text-gray-500 text-sm max-w-md mx-auto mb-6">
				Take this clinical assessment to check if you are eligible to donate blood. Submissions are reviewed by our medical team.
			</p>
			<button
				class="bg-primary hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer"
				onclick={() => step = 1}
			>
				Start Assessment
			</button>
		</div>

	{:else if step === 1}
		<!-- Step 1: Personal Info & Vitals -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 1 of 5: Candidate Details</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-6">Let's start with your demographics & basic vitals</h3>

			<div class="grid sm:grid-cols-2 gap-4 mb-6">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Full Name *</label>
					<input
						type="text"
						bind:value={name}
						placeholder="John Doe"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
					<input
						type="email"
						bind:value={email}
						placeholder="johndoe@example.com"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
					<input
						type="tel"
						bind:value={phone}
						placeholder="9876543210"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">City / Location *</label>
					<input
						type="text"
						bind:value={location}
						placeholder="Salem"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Blood Group *</label>
					<select
						bind:value={bloodGroup}
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="A+">A+</option>
						<option value="A-">A-</option>
						<option value="B+">B+</option>
						<option value="B-">B-</option>
						<option value="AB+">AB+</option>
						<option value="AB-">AB-</option>
						<option value="O+">O+</option>
						<option value="O-">O-</option>
						<option value="A1+">A1+</option>
						<option value="A1-">A1-</option>
						<option value="A2+">A2+</option>
						<option value="A2-">A2-</option>
						<option value="A1B+">A1B+</option>
						<option value="A1B-">A1B-</option>
						<option value="A2B+">A2B+</option>
						<option value="A2B-">A2B-</option>
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Age (years) *</label>
					<input
						type="number"
						bind:value={age}
						placeholder="Min 18 - Max 65"
						class="border {ageError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500'} p-3 rounded-xl focus:ring-2 focus:outline-none text-sm"
					/>
					{#if ageError}
						<span class="text-xs text-red-650 mt-1 flex items-center gap-1">
							<Icon name="alert-triangle" class="w-3.5 h-3.5" /> {ageError}
						</span>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Weight (kg) *</label>
					<input
						type="number"
						bind:value={weight}
						placeholder="Min 45 kg"
						class="border {weightError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500'} p-3 rounded-xl focus:ring-2 focus:outline-none text-sm"
					/>
					{#if weightError}
						<span class="text-xs text-red-650 mt-1 flex items-center gap-1">
							<Icon name="alert-triangle" class="w-3.5 h-3.5" /> {weightError}
						</span>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Gender *</label>
					<select
						bind:value={gender}
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="Male">Male</option>
						<option value="Female">Female</option>
						<option value="Other">Other</option>
					</select>
				</div>
			</div>

			<div class="flex justify-between">
				<button class="text-secondary font-bold hover:text-primary transition px-4 py-2" onclick={() => step = 0}>Cancel</button>
				<button
					class="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer"
					disabled={!isStep1Valid}
					onclick={() => step = 2}
				>
					Next Step
				</button>
			</div>
		</div>

	{:else if step === 2}
		<!-- Step 2: Critical Health & Donation History -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 2 of 5: Donation & Chronic Vitals</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-6">Medical History & Donation History</h3>

			<div class="space-y-4 mb-6">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Months Since Last Donation</label>
					<select
						bind:value={lastDonation}
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="never">Never donated before (or > 1 year ago)</option>
						<option value="1">1 month ago</option>
						<option value="2">2 months ago</option>
						<option value="3">3 months ago</option>
						<option value="6">6 months ago</option>
						<option value="9">9 months ago</option>
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Are you Diabetic?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="diabetes" value="no" bind:group={diabetes} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="diabetes" value="yes" bind:group={diabetes} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure Level</label>
					<select
						bind:value={bloodPressure}
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="normal">Normal BP</option>
						<option value="high">High Blood Pressure</option>
						<option value="low">Low Blood Pressure</option>
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Do you have any chronic diseases?</label>
					<div class="flex gap-4 mb-2">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="chronic" value="no" bind:group={chronicDisease} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="chronic" value="yes" bind:group={chronicDisease} /> Yes
						</label>
					</div>
					{#if chronicDisease === 'yes'}
						<input
							type="text"
							bind:value={chronicDetails}
							placeholder="Specify condition (e.g. Heart disease, Cancer, Epilepsy)"
							class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						/>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Medical History Notes *</label>
					<textarea
						bind:value={medicalHistory}
						placeholder="List any ongoing medical treatments or allergies"
						rows="2"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					></textarea>
				</div>
			</div>

			<div class="flex justify-between">
				<button class="text-secondary font-bold hover:text-primary transition px-4 py-2" onclick={() => step = 1}>Back</button>
				<button
					class="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
					disabled={!isStep2Valid}
					onclick={() => step = 3}
				>
					Next Step
				</button>
			</div>
		</div>

	{:else if step === 3}
		<!-- Step 3: Life Events, Pregnancy, Tattoo, Surgery -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 3 of 5: Procedures & Exposure</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-6">Recent Procedures & Events</h3>

			<div class="space-y-4 mb-6">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Have you had major surgery in the last 6 months?</label>
					<div class="flex gap-4 mb-2">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="surgery" value="no" bind:group={surgeryHistory} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="surgery" value="yes" bind:group={surgeryHistory} /> Yes
						</label>
					</div>
					{#if surgeryHistory === 'yes'}
						<input
							type="text"
							bind:value={surgeryDetails}
							placeholder="Specify surgery date and type"
							class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						/>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Pregnancy Status (Females)</label>
					<select
						bind:value={pregnancy}
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="na">Not Applicable (Male/Other)</option>
						<option value="no">Not currently pregnant/breastfeeding</option>
						<option value="yes">Currently pregnant or breastfeeding</option>
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Do you currently have a fever, cold, or active flu?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="fever" value="no" bind:group={fever} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="fever" value="yes" bind:group={fever} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Have you gotten a tattoo or piercing in the last 6 months?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="tattoo" value="no" bind:group={tattoo} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="tattoo" value="yes" bind:group={tattoo} /> Yes
						</label>
					</div>
				</div>
			</div>

			<div class="flex justify-between">
				<button class="text-secondary font-bold hover:text-primary transition px-4 py-2" onclick={() => step = 2}>Back</button>
				<button class="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer" onclick={() => step = 4}>
					Next Step
				</button>
			</div>
		</div>

	{:else if step === 4}
		<!-- Step 4: Lifestyle & Medication -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 4 of 5: Lifestyle & Medication</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-6">Lifestyle Habits & Medications</h3>

			<div class="space-y-4 mb-6">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Do you smoke tobacco products?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="smoking" value="no" bind:group={smoking} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="smoking" value="yes" bind:group={smoking} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Have you consumed alcohol in the last 24 hours?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="alcohol" value="no" bind:group={alcohol} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="alcohol" value="yes" bind:group={alcohol} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Are you taking any prescribed medications?</label>
					<div class="flex gap-4 mb-2">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="medication" value="no" bind:group={medication} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="medication" value="yes" bind:group={medication} /> Yes
						</label>
					</div>
					{#if medication === 'yes'}
						<input
							type="text"
							bind:value={medicationDetails}
							placeholder="Specify names of medications (e.g. Antibiotics, blood thinners)"
							class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						/>
					{/if}
				</div>
			</div>

			<div class="flex justify-between">
				<button class="text-secondary font-bold hover:text-primary transition px-4 py-2" onclick={() => step = 3}>Back</button>
				<button class="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer" onclick={() => step = 5}>
					Next Step
				</button>
			</div>
		</div>

	{:else if step === 5}
		<!-- Step 5: COVID, Vaccine & Hemoglobin -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 5 of 5: Infection & Chemistry</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-6">COVID History, Vaccines & Hemoglobin</h3>

			<div class="space-y-4 mb-6">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Have you had COVID-19 or symptoms in the last 14 days?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="covid" value="no" bind:group={covidHistory} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="covid" value="yes" bind:group={covidHistory} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Have you received any vaccinations in the last 4 weeks?</label>
					<div class="flex gap-4">
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="vaccine" value="no" bind:group={vaccination} /> No
						</label>
						<label class="inline-flex items-center gap-2 text-sm text-slate-800 font-semibold">
							<input type="radio" name="vaccine" value="yes" bind:group={vaccination} /> Yes
						</label>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Est. Hemoglobin Level (g/dL) - Standard is 12-18</label>
					<input
						type="number"
						step="0.1"
						bind:value={hemoglobin}
						placeholder="Enter Hb level (e.g. 13.5)"
						class="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					/>
				</div>
			</div>

			<div class="flex justify-between">
				<button class="text-secondary font-bold hover:text-primary transition px-4 py-2" onclick={() => step = 4}>Back</button>
				<button
					class="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer"
					onclick={handleSubmit}
				>
					Submit Assessment
				</button>
			</div>
		</div>

	{:else if step === 6}
		<!-- Results Pending View -->
		<div class="text-center py-6 space-y-4">
			{#if isEligible}
				<div class="text-6xl mb-4 animate-bounce text-red-600 flex justify-center"><Icon name="heart" size={64} /></div>
				<h3 class="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
					You are eligible to donate blood <Icon name="heart" class="w-7 h-7 text-primary" />
				</h3>
				<p class="text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-sm font-semibold max-w-md mx-auto">
					You meet all safety and clinical criteria for whole blood donation.
				</p>
				
				<div class="pt-4 flex justify-center gap-3">
					<a href="/" class="bg-white border border-slate-200 text-secondary hover:bg-baby-pink hover:text-primary font-bold px-6 py-3 rounded-xl transition text-sm">
						Return Home
					</a>
					<a
						href="/register?role=donor&name={encodeURIComponent(name)}&email={encodeURIComponent(email)}&phone={encodeURIComponent(phone)}&location={encodeURIComponent(location)}&bloodGroup={encodeURIComponent(bloodGroup)}"
						class="bg-primary hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition transform active:scale-95 text-sm cursor-pointer"
					>
						Continue Registration
					</a>
				</div>
			{:else}
				<div class="text-6xl mb-4 animate-bounce text-red-600 flex justify-center"><Icon name="x-circle" size={64} /></div>
				<h3 class="text-3xl font-extrabold text-slate-900">
					Sorry, you are currently not eligible to donate blood
				</h3>
				<div class="bg-red-50 border border-red-200 p-4 rounded-2xl text-sm font-semibold max-w-md mx-auto text-red-700 space-y-2">
					{#each eligibilityReasons as reason}
						<p class="flex items-center gap-1.5 justify-center">
							<Icon name="alert-triangle" class="w-4 h-4 text-red-700" /> {reason}
						</p>
					{/each}
				</div>
				<p class="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
					Unfortunately, you do not meet the safety criteria for blood donation at this time.
				</p>

				<div class="pt-4 flex justify-center gap-3">
					<a href="/" class="bg-white border border-slate-200 text-secondary hover:bg-baby-pink hover:text-primary font-bold px-6 py-3 rounded-xl transition text-sm">
						Return Home
					</a>
					<button
						class="bg-white border border-red-200 text-primary font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition text-sm cursor-pointer"
						onclick={resetQuiz}
					>
						Retake Assessment
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
