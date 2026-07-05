<script>
	let patientName = '';
	let bloodGroup = '';
	let units = '';
	let hospital = '';
	let city = '';
	let contactNumber = '';
	let urgency = '';
</script>

<div class="min-h-screen bg-baby-pink py-16 px-6">
	<div class="max-w-3xl mx-auto bg-white border border-rose-100 rounded-3xl shadow-xl p-8 md:p-10 relative z-10">

		<div class="text-center mb-10">
			<div class="text-6xl animate-bounce" style="animation-duration: 3s">🚨</div>
			<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
				Request Blood
			</h1>
			<p class="text-slate-500 text-sm mt-2">
				Submit an emergency blood matching request to the network
			</p>
		</div>

		<form class="grid sm:grid-cols-2 gap-5 text-left">

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="patientName">
					Patient Name *
				</label>
				<input
					id="patientName"
					type="text"
					bind:value={patientName}
					placeholder="Enter patient name"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="bloodGroup">
					Blood Group Needed *
				</label>
				<select
					id="bloodGroup"
					bind:value={bloodGroup}
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				>
					<option value="">Select Blood Group</option>
					<option value="A+">A+</option>
					<option value="A-">A-</option>
					<option value="B+">B+</option>
					<option value="B-">B-</option>
					<option value="AB+">AB+</option>
					<option value="AB-">AB-</option>
					<option value="O+">O+</option>
					<option value="O-">O-</option>
				</select>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="units">
					Units Required (Bags) *
				</label>
				<input
					id="units"
					type="number"
					min="1"
					bind:value={units}
					placeholder="Enter units"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="hospital">
					Hospital Name *
				</label>
				<input
					id="hospital"
					type="text"
					bind:value={hospital}
					placeholder="Enter hospital name"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="city">
					City *
				</label>
				<input
					id="city"
					type="text"
					bind:value={city}
					placeholder="Enter city"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="contactNumber">
					Contact Number *
				</label>
				<input
					id="contactNumber"
					type="text"
					bind:value={contactNumber}
					placeholder="Enter contact number"
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				/>
			</div>

			<div class="sm:col-span-2 flex flex-col gap-1.5">
				<label class="text-xs font-bold text-slate-500 uppercase" for="urgency">
					Urgency Level *
				</label>
				<select
					id="urgency"
					bind:value={urgency}
					class="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
					required
				>
					<option value="">Select Urgency</option>
					<option value="Normal">Normal</option>
					<option value="Urgent">Urgent</option>
					<option value="Critical">Critical</option>
				</select>
			</div>

			<div class="sm:col-span-2 pt-2">
				<button
					type="submit"
					class="w-full bg-red-700 text-white font-bold py-4 rounded-xl hover:bg-red-800 shadow-lg shadow-red-700/20 active:scale-95 transition cursor-pointer"
				>
					Submit Blood Request
				</button>
			</div>

		</form>

	</div>
</div>