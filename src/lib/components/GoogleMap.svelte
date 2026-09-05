<script>
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	let {
		donors = [],
		bloodBanks = [],
		userLocation = null,
		onSelectHospital = null,
		height = '500px'
	} = $props();

	let mapContainer;
	let googleMap = $state(null);
	let mapLoaded = $state(false);
	let mapError = $state(false);
	let searchQuery = $state('');
	let selectedMarkerItem = $state(null);

	let currentCenter = $state({
		lat: userLocation?.lat || 11.6643,
		lng: userLocation?.lng || 78.1460,
		name: userLocation?.name || 'Salem, TN'
	});

	// Default city coordinates lookup for quick search fallback
	const CITY_COORDS = {
		salem: { lat: 11.6643, lng: 78.1460, name: 'Salem' },
		chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
		coimbatore: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },
		madurai: { lat: 9.9252, lng: 78.1198, name: 'Madurai' },
		trichy: { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli' },
		bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
		bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' }
	};

	onMount(() => {
		initGoogleMaps();
	});

	function initGoogleMaps() {
		const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

		if (!apiKey || window.googleMapsFailed) {
			mapError = true;
			return;
		}

		if (window.google && window.google.maps) {
			renderMap();
			return;
		}

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
		script.async = true;
		script.defer = true;
		script.onload = () => renderMap();
		script.onerror = () => {
			window.googleMapsFailed = true;
			mapError = true;
		};
		document.head.appendChild(script);
	}

	function renderMap() {
		if (!mapContainer || !window.google || !window.google.maps) return;

		try {
			googleMap = new window.google.maps.Map(mapContainer, {
				center: { lat: currentCenter.lat, lng: currentCenter.lng },
				zoom: 12,
				styles: [
					{
						featureType: 'poi',
						elementType: 'labels',
						stylers: [{ visibility: 'off' }]
					}
				]
			});

			mapLoaded = true;
			addMapMarkers();
		} catch (e) {
			console.error('Error rendering Google Map:', e);
			mapError = true;
		}
	}

	function addMapMarkers() {
		if (!googleMap || !window.google || !window.google.maps) return;

		// Add Blood Bank markers
		bloodBanks.forEach(bank => {
			const coords = getBankCoords(bank);
			const marker = new window.google.maps.Marker({
				position: { lat: coords.lat, lng: coords.lng },
				map: googleMap,
				title: bank.name,
				icon: {
					url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
						<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5">
							<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
						</svg>
					`),
					scaledSize: new window.google.maps.Size(36, 36)
				}
			});

			marker.addListener('click', () => {
				selectedMarkerItem = { type: 'bank', data: bank, coords };
			});
		});

		// Add Available Donor markers (Fuzzed approximate coordinates)
		donors.forEach(donor => {
			if (donor.isAvailable === false) return;
			const coords = getDonorCoords(donor);
			const marker = new window.google.maps.Marker({
				position: { lat: coords.lat, lng: coords.lng },
				map: googleMap,
				title: `Donor ${donor.bloodGroup}`,
				icon: {
					url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
						<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#e11d48" stroke="#ffffff" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<text x="12" y="15" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${donor.bloodGroup}</text>
						</svg>
					`),
					scaledSize: new window.google.maps.Size(30, 30)
				}
			});

			marker.addListener('click', () => {
				selectedMarkerItem = { type: 'donor', data: donor, coords };
			});
		});
	}

	function getBankCoords(bank) {
		const key = (bank.address || bank.name || '').toLowerCase();
		for (const [cKey, coords] of Object.entries(CITY_COORDS)) {
			if (key.includes(cKey)) return coords;
		}
		return { lat: 11.6643 + (Math.random() * 0.04 - 0.02), lng: 78.1460 + (Math.random() * 0.04 - 0.02) };
	}

	function getDonorCoords(donor) {
		const key = (donor.location || donor.city || '').toLowerCase();
		let base = { lat: 11.6643, lng: 78.1460 };
		for (const [cKey, coords] of Object.entries(CITY_COORDS)) {
			if (key.includes(cKey)) {
				base = coords;
				break;
			}
		}
		// Hash fuzzing for donor privacy
		let hash = 0;
		const seed = (donor.id || donor.name || 'donor').toString();
		for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
		return {
			lat: base.lat + (((hash % 15) - 7) * 0.002),
			lng: base.lng + ((((hash >> 2) % 15) - 7) * 0.002)
		};
	}

	function handleUseMyLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					currentCenter = {
						lat: pos.coords.latitude,
						lng: pos.coords.longitude,
						name: 'Current Location'
					};
					if (googleMap && window.google) {
						googleMap.setCenter({ lat: currentCenter.lat, lng: currentCenter.lng });
						googleMap.setZoom(13);
					}
				},
				(err) => {
					console.warn('Geolocation permission denied or failed:', err);
					alert('Geolocation permission denied. Please use manual location search.');
				}
			);
		} else {
			alert('Geolocation is not supported by your browser.');
		}
	}

	function handleSearch() {
		if (!searchQuery.trim()) return;
		const q = searchQuery.toLowerCase().trim();
		for (const [cityKey, coords] of Object.entries(CITY_COORDS)) {
			if (q.includes(cityKey)) {
				currentCenter = coords;
				if (googleMap && window.google) {
					googleMap.setCenter({ lat: coords.lat, lng: coords.lng });
					googleMap.setZoom(13);
				}
				return;
			}
		}
		// Generic center move
		currentCenter = { lat: 11.6643, lng: 78.1460, name: searchQuery };
	}
</script>

<div class="space-y-4">
	<!-- Location Control Bar -->
	<div class="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
		<div class="flex items-center gap-2 w-full sm:w-auto">
			<button
				type="button"
				onclick={handleUseMyLocation}
				class="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
			>
				<Icon name="navigation" class="w-4 h-4" /> Use My Current Location
			</button>
			<span class="text-xs font-semibold text-slate-500 hidden sm:inline">📍 {currentCenter.name}</span>
		</div>

		<!-- Location Search Bar -->
		<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex items-center gap-2 w-full sm:w-auto">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search city, area, or hospital..."
				class="w-full sm:w-64 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50/50"
			/>
			<button
				type="submit"
				class="bg-primary hover:bg-red-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer shrink-0"
			>
				Search
			</button>
		</form>
	</div>

	<!-- Interactive Map Container -->
	<div class="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900" style="height: {height};">
		{#if !mapError}
			<div bind:this={mapContainer} class="w-full h-full"></div>
		{:else}
			<!-- High quality Interactive Map Visualizer Fallback when Google Maps API key is not present -->
			<div class="relative w-full h-full bg-slate-900 p-6 flex flex-col justify-between overflow-hidden">
				<!-- Map Background Grid Animation -->
				<div class="absolute inset-0 opacity-20 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

				<!-- Map Header Info -->
				<div class="relative z-10 flex justify-between items-start">
					<div class="bg-slate-800/90 backdrop-blur-md border border-slate-700 text-white p-3 rounded-2xl shadow-lg">
						<h4 class="font-bold text-xs flex items-center gap-1.5 text-red-400">
							<Icon name="map-pin" class="w-4 h-4" /> Interactive Network Map
						</h4>
						<p class="text-[10px] text-slate-400">Showing {donors.filter(d=>d.isAvailable !== false).length} Available Donors & {bloodBanks.length} Blood Banks</p>
					</div>

					<div class="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl text-[10px] text-slate-300 flex items-center gap-3">
						<span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Available Donor</span>
						<span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Blood Bank</span>
					</div>
				</div>

				<!-- Fallback Pins Grid -->
				<div class="relative z-10 grid sm:grid-cols-2 md:grid-cols-3 gap-4 my-auto max-h-[70%] overflow-y-auto pr-1">
					{#each bloodBanks as bank}
						<div
							class="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-2xl text-left cursor-pointer transition transform hover:scale-[1.02] shadow-md"
							onclick={() => selectedMarkerItem = { type: 'bank', data: bank, coords: getBankCoords(bank) }}
						>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-emerald-400 flex items-center gap-1"><Icon name="hospital" class="w-3.5 h-3.5" /> {bank.name}</span>
								<span class="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-800">Blood Bank</span>
							</div>
							<p class="text-[10px] text-slate-400 mt-1 truncate">{bank.address}</p>
							<div class="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-300">
								<span>Hours: {bank.workingHours || '24/7'}</span>
								<span class="text-red-400 font-bold">Directions ➔</span>
							</div>
						</div>
					{/each}

					{#each donors.filter(d => d.isAvailable !== false) as donor}
						<div
							class="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-2xl text-left cursor-pointer transition transform hover:scale-[1.02] shadow-md"
							onclick={() => selectedMarkerItem = { type: 'donor', data: donor, coords: getDonorCoords(donor) }}
						>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-white flex items-center gap-1.5">
									<span class="w-5 h-5 rounded-full bg-red-600 text-white font-extrabold text-[9px] flex items-center justify-center">{donor.bloodGroup}</span>
									Available Donor
								</span>
								<span class="text-[9px] bg-red-950 text-red-300 px-2 py-0.5 rounded-md border border-red-800">Verified</span>
							</div>
							<p class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Icon name="map-pin" class="w-3 h-3 text-slate-500" /> Approx: {donor.location || 'Anna Nagar'}</p>
							<div class="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-300">
								<span>Status: <strong class="text-emerald-400">Available</strong></span>
								<span class="text-red-400 font-bold">View ➔</span>
							</div>
						</div>
					{/each}
				</div>

				<div class="relative z-10 text-center text-[10px] text-slate-500">
					📍 Live LifeLink Coordinates Engine • Donor residential addresses are protected via location privacy fuzzing.
				</div>
			</div>
		{/if}

		<!-- Selected Marker Card Modal Overlay -->
		{#if selectedMarkerItem}
			<div class="absolute bottom-4 left-4 right-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-2xl animate-fade-in-up">
				<div class="flex justify-between items-start">
					{#if selectedMarkerItem.type === 'bank'}
						<div class="space-y-1 text-left">
							<div class="flex items-center gap-2">
								<span class="w-3 h-3 rounded-full bg-emerald-500"></span>
								<h4 class="font-extrabold text-slate-900 text-base">{selectedMarkerItem.data.name}</h4>
							</div>
							<p class="text-xs text-slate-500 flex items-center gap-1"><Icon name="map-pin" class="w-3.5 h-3.5" /> {selectedMarkerItem.data.address}</p>
							<p class="text-xs text-slate-500 flex items-center gap-1"><Icon name="phone" class="w-3.5 h-3.5" /> {selectedMarkerItem.data.phone}</p>
							<p class="text-[10px] text-slate-400">Working Hours: {selectedMarkerItem.data.workingHours || '9:00 AM - 5:00 PM'}</p>
						</div>
						<div class="flex items-center gap-2">
							<a
								href="https://www.google.com/maps/dir/?api=1&destination={encodeURIComponent(selectedMarkerItem.data.address || selectedMarkerItem.data.name)}"
								target="_blank"
								rel="noreferrer"
								class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
							>
								<Icon name="navigation" class="w-3.5 h-3.5" /> Get Directions
							</a>
							<button onclick={() => selectedMarkerItem = null} class="text-slate-400 hover:text-slate-600 p-1">
								<Icon name="x" class="w-5 h-5" />
							</button>
						</div>
					{:else if selectedMarkerItem.type === 'donor'}
						<div class="space-y-1 text-left">
							<div class="flex items-center gap-2">
								<span class="w-7 h-7 rounded-full bg-red-700 text-white font-black text-xs flex items-center justify-center">{selectedMarkerItem.data.bloodGroup}</span>
								<div>
									<h4 class="font-extrabold text-slate-900 text-sm">Available Donor</h4>
									<p class="text-[10px] text-slate-500">Approximate Area: {selectedMarkerItem.data.location || 'Anna Nagar'}</p>
								</div>
							</div>
							<p class="text-xs text-emerald-700 font-bold flex items-center gap-1"><Icon name="check-circle" class="w-3.5 h-3.5" /> Active & Eligible for Matching</p>
						</div>
						<button onclick={() => selectedMarkerItem = null} class="text-slate-400 hover:text-slate-600 p-1">
							<Icon name="x" class="w-5 h-5" />
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
