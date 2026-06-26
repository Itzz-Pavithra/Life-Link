<script>
	let step = $state(0);
	
	let age = $state('');
	let weight = $state('');
	let hasCondition = $state(false);
	let lastDonationMonths = $state('');
	let hasRecentSurgery = $state(false);

	let answers = $state({
		age: '',
		weight: '',
		condition: false,
		lastDonation: '',
		surgery: false
	});

	function resetQuiz() {
		step = 0;
		age = '';
		weight = '';
		hasCondition = false;
		lastDonationMonths = '';
		hasRecentSurgery = false;
	}

	// Computes eligibility based on standard donor rules
	const eligibilityResult = $derived.by(() => {
		const parsedAge = parseInt(age);
		const parsedWeight = parseFloat(weight);
		const parsedDonation = parseInt(lastDonationMonths);

		if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
			return { eligible: false, reason: 'Age must be between 18 and 65 years old.' };
		}
		if (isNaN(parsedWeight) || parsedWeight < 50) {
			return { eligible: false, reason: 'Weight must be at least 50 kg (110 lbs).' };
		}
		if (hasCondition) {
			return { eligible: false, reason: 'Chronic illnesses, infectious diseases, or high blood pressure make you temporarily ineligible.' };
		}
		if (!isNaN(parsedDonation) && parsedDonation < 3) {
			return { eligible: false, reason: 'Must wait at least 3 months (90 days) between whole blood donations.' };
		}
		if (hasRecentSurgery) {
			return { eligible: false, reason: 'Major surgeries within the last 6 months require full recovery before donating.' };
		}

		return { eligible: true, reason: 'You meet all the basic criteria for blood donation! Thank you for your support.' };
	});
</script>

<div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
	<div class="absolute -top-16 -right-16 w-32 h-32 bg-red-100 rounded-full blur-2xl pointer-events-none"></div>

	{#if step === 0}
		<!-- Start View -->
		<div class="text-center py-6">
			<div class="text-5xl mb-4 animate-bounce">📋</div>
			<h3 class="text-2xl font-bold text-gray-900 mb-2">
				Blood Donation Eligibility Quiz
			</h3>
			<p class="text-gray-500 text-sm max-w-md mx-auto mb-6">
				Take this simple 5-step test to check if you are eligible to donate blood. It only takes a minute.
			</p>
			<button
				class="bg-red-700 hover:bg-red-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform transform active:scale-95"
				onclick={() => step = 1}
			>
				Start Assessment
			</button>
		</div>

	{:else if step === 1}
		<!-- Step 1: Age -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 1 of 5</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-4">What is your age?</h3>
			<input
				type="number"
				bind:value={age}
				placeholder="Enter age (e.g. 25)"
				class="w-full border border-gray-200 p-3 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
			/>
			<div class="flex justify-between">
				<button class="text-gray-500 font-semibold px-4 py-2" onclick={() => step = 0}>Cancel</button>
				<button
					class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
					disabled={!age}
					onclick={() => step = 2}
				>
					Next
				</button>
			</div>
		</div>

	{:else if step === 2}
		<!-- Step 2: Weight -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 2 of 5</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-4">What is your weight (in kg)?</h3>
			<input
				type="number"
				bind:value={weight}
				placeholder="Enter weight in kg (e.g. 68)"
				class="w-full border border-gray-200 p-3 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
			/>
			<div class="flex justify-between">
				<button class="text-gray-500 font-semibold px-4 py-2" onclick={() => step = 1}>Back</button>
				<button
					class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
					disabled={!weight}
					onclick={() => step = 3}
				>
					Next
				</button>
			</div>
		</div>

	{:else if step === 3}
		<!-- Step 3: Health Conditions -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 3 of 5</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-4">Do you suffer from any chronic health conditions or infections?</h3>
			<p class="text-gray-500 text-sm mb-4">
				(e.g., active cold/flu, diabetes under insulin, hepatitis, HIV, cancer, or heart conditions)
			</p>
			<div class="grid grid-cols-2 gap-4 mb-6">
				<button
					class="p-4 rounded-xl border font-bold text-center transition {hasCondition ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}"
					onclick={() => hasCondition = true}
				>
					Yes, I do
				</button>
				<button
					class="p-4 rounded-xl border font-bold text-center transition {!hasCondition ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}"
					onclick={() => hasCondition = false}
				>
					No, I do not
				</button>
			</div>
			<div class="flex justify-between">
				<button class="text-gray-500 font-semibold px-4 py-2" onclick={() => step = 2}>Back</button>
				<button class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl" onclick={() => step = 4}>
					Next
				</button>
			</div>
		</div>

	{:else if step === 4}
		<!-- Step 4: Last Blood Donation -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 4 of 5</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-4">How many months ago was your last blood donation?</h3>
			<p class="text-gray-500 text-sm mb-4">
				Enter 12 if you have never donated blood before.
			</p>
			<input
				type="number"
				bind:value={lastDonationMonths}
				placeholder="Months (e.g. 4)"
				class="w-full border border-gray-200 p-3 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
			/>
			<div class="flex justify-between">
				<button class="text-gray-500 font-semibold px-4 py-2" onclick={() => step = 3}>Back</button>
				<button
					class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
					disabled={!lastDonationMonths}
					onclick={() => step = 5}
				>
					Next
				</button>
			</div>
		</div>

	{:else if step === 5}
		<!-- Step 5: Recent Surgery -->
		<div>
			<span class="text-xs font-bold text-red-600 uppercase tracking-widest">Step 5 of 5</span>
			<h3 class="text-xl font-bold text-gray-900 mt-1 mb-4">Have you had any major surgery or tattoos/piercings in the last 6 months?</h3>
			<div class="grid grid-cols-2 gap-4 mb-6">
				<button
					class="p-4 rounded-xl border font-bold text-center transition {hasRecentSurgery ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}"
					onclick={() => hasRecentSurgery = true}
				>
					Yes, within 6 months
				</button>
				<button
					class="p-4 rounded-xl border font-bold text-center transition {!hasRecentSurgery ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}"
					onclick={() => hasRecentSurgery = false}
				>
					No surgeries or tattoos
				</button>
			</div>
			<div class="flex justify-between">
				<button class="text-gray-500 font-semibold px-4 py-2" onclick={() => step = 4}>Back</button>
				<button class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl" onclick={() => step = 6}>
					View Result
				</button>
			</div>
		</div>

	{:else if step === 6}
		<!-- Results View -->
		<div class="text-center py-6">
			{#if eligibilityResult.eligible}
				<div class="text-6xl mb-4 animate-bounce">🎉</div>
				<h3 class="text-3xl font-extrabold text-emerald-600 mb-2">
					You are Eligible!
				</h3>
				<p class="text-gray-600 text-sm max-w-md mx-auto mb-6">
					{eligibilityResult.reason}
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<a
						href="/register"
						class="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
					>
						Register as Donor
					</a>
					<button
						class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition"
						onclick={resetQuiz}
					>
						Retake Quiz
					</button>
				</div>
			{:else}
				<div class="text-6xl mb-4">🛑</div>
				<h3 class="text-3xl font-extrabold text-red-600 mb-2">
					Not Eligible Right Now
				</h3>
				<p class="text-gray-600 text-sm max-w-md mx-auto mb-6">
					{eligibilityResult.reason}
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<a
						href="/contact"
						class="bg-gray-850 hover:bg-gray-900 text-white font-bold px-6 py-3 rounded-xl shadow transition bg-gray-800"
					>
						Contact Medical Team
					</a>
					<button
						class="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-3 rounded-xl transition"
						onclick={resetQuiz}
					>
						Retake Quiz
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
