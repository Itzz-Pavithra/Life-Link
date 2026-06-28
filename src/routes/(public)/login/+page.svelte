<script>
	let { data, form } = $props();

	let email = $state('');
	let selectedRole = $state('recipient'); // Default to receiver
	let setupName = $state('');
	let setupEmail = $state('');
	let setupPhone = $state('');
	let setupLocation = $state('');
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center p-6 relative">
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-450/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl w-full max-w-lg space-y-8 relative z-10">
		
		{#if !data.hasAdminAccount}
			<!-- System Initialization Setup Screen (renders only if no admin is registered) -->
			<div class="text-center space-y-2">
				<div class="inline-flex items-center gap-2.5 mb-2">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
				</div>
				<h2 class="text-xl font-bold text-red-700">Initialize Admin Account</h2>
				<p class="text-slate-500 text-xs">No system administrator account detected. Setup the primary admin profile.</p>
			</div>

			{#if form?.error}
				<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
					⚠️ {form.error}
				</div>
			{/if}

			<form method="POST" action="?/createAdmin" class="space-y-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Admin Name *</label>
					<input
						name="name"
						type="text"
						bind:value={setupName}
						placeholder="Administrator Name"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Admin Email *</label>
					<input
						name="email"
						type="email"
						bind:value={setupEmail}
						placeholder="admin@lifelink.org"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Phone *</label>
						<input
							name="phone"
							type="tel"
							bind:value={setupPhone}
							placeholder="9876543210"
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-bold text-slate-500 uppercase">Location *</label>
						<input
							name="location"
							type="text"
							bind:value={setupLocation}
							placeholder="Salem"
							class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Choose Password *</label>
					<input
						name="password"
						type="password"
						placeholder="••••••••"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
				>
					Initialize System Node
				</button>
			</form>
		{:else}
			<!-- Standard Login Screen -->
			<div class="text-center space-y-2">
				<a href="/" class="inline-flex items-center gap-2.5 mb-2">
					<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
					<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
				</a>
				<h2 class="text-xl font-bold text-slate-800">Welcome Back</h2>
				<p class="text-slate-400 text-xs">Enter your details to sign in to your dashboard.</p>
			</div>

			{#if form?.error}
				<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
					⚠️ {form.error}
				</div>
			{/if}

			<form method="POST" action="?/login" class="space-y-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="email">Email Address</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="name@example.com"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-[10px] font-bold text-slate-500 uppercase">Dashboard Role</label>
					<select
						name="role"
						bind:value={selectedRole}
						class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm bg-white"
					>
						<option value="recipient">Recipient / Patient / Receiver</option>
						<option value="donor">Blood Donor</option>
						<option value="admin">System Admin</option>
					</select>
				</div>

				<button
					type="submit"
					class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
				>
					Sign In
				</button>
			</form>

			<div class="text-center text-xs text-slate-400">
				Don't have an account?
				<a href="/register" class="text-red-700 font-bold hover:underline ml-1">Create Account</a>
			</div>
		{/if}
	</div>
</div>