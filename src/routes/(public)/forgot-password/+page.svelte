<script>
	let email = '';
</script>

<div class="min-h-screen bg-amber-50 flex items-center justify-center px-4">
	<div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

		<div class="text-center mb-6">
			<div class="text-5xl">🔑</div>
			<h1 class="text-3xl font-bold text-red-700 mt-2">
				Forgot Password
			</h1>
			<p class="text-gray-600 mt-2">
				Enter your email to reset your password
			</p>
		</div>

		<form class="space-y-4">

			<div>
				<label class="block mb-2 font-medium">
					Email Address
				</label>

				<input
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
				/>
			</div>

			<button
				type="submit"
				class="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800"
			>
				Send Reset Link
			</button>

		</form>

		<div class="text-center mt-6">
			<a
				href="/login"
				class="text-red-700 font-semibold"
			>
				← Back to Login
			</a>
		</div>

	</div>
</div>