<script>
	let patientName = '';
	let bloodGroup = '';
	let units = '';
	let hospital = '';
	let city = '';
	let contactNumber = '';
	let urgency = '';
</script>

<div class="min-h-screen bg-baby-pink py-10 px-4">
	<div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">

		<div class="text-center mb-8">
			<div class="text-6xl">🚨</div>
			<h1 class="text-4xl font-bold text-red-700">
				Request Blood
			</h1>
			<p class="text-gray-600 mt-2">
				Submit an emergency blood request
			</p>
		</div>

		<form class="grid md:grid-cols-2 gap-6">

			<div>
				<label class="block mb-2 font-medium">
					Patient Name
				</label>
				<input
					type="text"
					bind:value={patientName}
					placeholder="Enter patient name"
					class="w-full border rounded-lg p-3"
				/>
			</div>

			<div>
				<label class="block mb-2 font-medium">
					Blood Group Needed
				</label>
				<select
					bind:value={bloodGroup}
					class="w-full border rounded-lg p-3"
				>
					<option value="">Select Blood Group</option>
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

			<div>
				<label class="block mb-2 font-medium">
					Units Required
				</label>
				<input
					type="number"
					bind:value={units}
					placeholder="Enter units"
					class="w-full border rounded-lg p-3"
				/>
			</div>

			<div>
				<label class="block mb-2 font-medium">
					Hospital Name
				</label>
				<input
					type="text"
					bind:value={hospital}
					placeholder="Enter hospital"
					class="w-full border rounded-lg p-3"
				/>
			</div>

			<div>
				<label class="block mb-2 font-medium">
					City
				</label>
				<input
					type="text"
					bind:value={city}
					placeholder="Enter city"
					class="w-full border rounded-lg p-3"
				/>
			</div>

			<div>
				<label class="block mb-2 font-medium">
					Contact Number
				</label>
				<input
					type="text"
					bind:value={contactNumber}
					placeholder="Enter contact number"
					class="w-full border rounded-lg p-3"
				/>
			</div>

			<div class="md:col-span-2">
				<label class="block mb-2 font-medium">
					Urgency Level
				</label>

				<select
					bind:value={urgency}
					class="w-full border rounded-lg p-3"
				>
					<option value="">Select Urgency</option>
					<option>Normal</option>
					<option>Urgent</option>
					<option>Critical</option>
				</select>
			</div>

			<div class="md:col-span-2">
				<button
					type="submit"
					class="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800"
				>
					Submit Blood Request
				</button>
			</div>

		</form>

	</div>
</div>