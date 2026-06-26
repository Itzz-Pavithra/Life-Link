<script>
	let { form } = $props();

	let email = $state('');
	let selectedRole = $state('admin');
</script>

<div class="min-h-screen bg-baby-pink flex items-center justify-center p-6 relative">
	<!-- Ambient Background glows -->
	<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-450/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl w-full max-w-lg space-y-8 relative z-10 transition-all duration-300">
		<!-- Header -->
		<div class="text-center space-y-2">
			<a href="/" class="inline-flex items-center gap-2.5 mb-2">
				<img src="/logo.png" alt="LifeLink Logo" class="h-10 w-10 object-contain" />
				<span class="text-2xl font-black text-slate-900 tracking-tight">LifeLink</span>
			</a>
			<h2 class="text-xl font-bold text-slate-800">Welcome Back</h2>
			<p class="text-slate-400 text-xs">Enter your details to sign in to your dashboard.</p>
		</div>

		{#if form?.error}
			<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl animate-shake">
				⚠️ {form.error}
			</div>
		{/if}

		<!-- Login Form -->
		<form method="POST" action="?/login" class="space-y-4">
			<div class="flex flex-col gap-1">
				<label class="text-[10px] font-bold text-slate-505 text-slate-500 uppercase" for="email">Email Address</label>
				<input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					placeholder="name@lifelink.org"
					class="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
					required
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] font-bold text-slate-550 text-slate-500 uppercase" for="password">Password</label>
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
					<option value="admin">System Admin</option>
					<option value="donor">Blood Donor</option>
					<option value="recipient">Recipient / Patient</option>
				</select>
			</div>

			<button
				type="submit"
				class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-700/25 transition transform active:scale-95 cursor-pointer"
			>
				Sign In
			</button>
		</form>

		<!-- Divider -->
		<div class="relative flex items-center justify-center">
			<div class="border-t border-slate-100 w-full"></div>
			<span class="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
				Or Quick Select Role
			</span>
		</div>

		<!-- Mock Roles Grid -->
		<div class="grid grid-cols-3 gap-2">
			<form method="POST" action="?/login" class="w-full">
				<input type="hidden" name="email" value="admin@lifelink.org" />
				<input type="hidden" name="role" value="admin" />
				<button
					type="submit"
					class="p-2 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 text-left rounded-xl transition text-[10px] flex items-center gap-1.5 cursor-pointer w-full"
				>
					<span>👨‍💼</span>
					<div>
						<strong class="block text-slate-800 font-bold">Admin</strong>
						<span class="text-[8px] text-slate-400">Control</span>
					</div>
				</button>
			</form>

			<form method="POST" action="?/login" class="w-full">
				<input type="hidden" name="email" value="donor@lifelink.org" />
				<input type="hidden" name="role" value="donor" />
				<button
					type="submit"
					class="p-2 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 text-left rounded-xl transition text-[10px] flex items-center gap-1.5 cursor-pointer w-full"
				>
					<span>🩸</span>
					<div>
						<strong class="block text-slate-800 font-bold">Donor</strong>
						<span class="text-[8px] text-slate-400">Give</span>
					</div>
				</button>
			</form>

			<form method="POST" action="?/login" class="w-full">
				<input type="hidden" name="email" value="recipient@lifelink.org" />
				<input type="hidden" name="role" value="recipient" />
				<button
					type="submit"
					class="p-2 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 text-left rounded-xl transition text-[10px] flex items-center gap-1.5 cursor-pointer w-full"
				>
					<span>📋</span>
					<div>
						<strong class="block text-slate-800 font-bold">Patient</strong>
						<span class="text-[8px] text-slate-400">Request</span>
					</div>
				</button>
			</form>
		</div>

		<div class="text-center text-xs text-slate-405 text-slate-400">
			Don't have an account?
			<a href="/register" class="text-red-700 font-bold hover:underline ml-1">Create Account</a>
		</div>
	</div>
</div>