<script>
	import EligibilityQuiz from '$lib/components/EligibilityQuiz.svelte';
</script>

<div class="min-h-screen bg-baby-pink py-12 sm:py-16 px-4 sm:px-6">
	<div class="max-w-2xl mx-auto space-y-8">
		<div class="text-center space-y-3">
			<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900">
				Eligibility Checker
			</h1>
			<p class="text-slate-500 text-sm max-w-md mx-auto">
				Ensure you meet the safety criteria for blood donation before scheduling or registering.
			</p>
		</div>

		<EligibilityQuiz />
	</div>
</div>
