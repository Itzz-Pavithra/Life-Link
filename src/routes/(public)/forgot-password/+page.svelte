<script>
	let email = '';
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center px-4">
	<div class="bg-white border border-rose-100 p-8 rounded-3xl shadow-xl w-full max-w-md relative z-10">

		<div class="text-center mb-6">
			<div class="text-5xl animate-bounce">🔑</div>
			<h1 class="text-3xl font-extrabold text-slate-900 mt-2">
				Forgot Password
			</h1>
			<p class="text-slate-500 text-sm mt-2">
				Enter your email to reset your password
			</p>
		</div>

		<form class="space-y-4">

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="email">
					Email Address
				</label>

				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<button
				type="submit"
				class="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-800 shadow-lg shadow-red-700/20 active:scale-95 transition cursor-pointer"
			>
				Send Reset Link
			</button>

		</form>

		<div class="text-center mt-6">
			<a
				href="/login"
				class="text-red-700 font-bold hover:underline"
			>
				← Back to Login
			</a>
		</div>

	</div>
</div>