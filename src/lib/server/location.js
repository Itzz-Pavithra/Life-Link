// City coordinates registry fallback (India cities centered)
export const CITY_COORDINATES = {
	'salem': { lat: 11.6643, lng: 78.1460, area: 'Salem Central' },
	'chennai': { lat: 13.0827, lng: 80.2707, area: 'Anna Nagar' },
	'coimbatore': { lat: 11.0168, lng: 76.9558, area: 'RS Puram' },
	'madurai': { lat: 9.9252, lng: 78.1198, area: 'Anna Nagar' },
	'tiruchirappalli': { lat: 10.7905, lng: 78.7047, area: 'Thillai Nagar' },
	'trichy': { lat: 10.7905, lng: 78.7047, area: 'Thillai Nagar' },
	'bengaluru': { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
	'bangalore': { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
	'hyderabad': { lat: 17.3850, lng: 78.4867, area: 'Banjara Hills' },
	'mumbai': { lat: 19.0760, lng: 72.8777, area: 'Andheri West' },
	'delhi': { lat: 28.6139, lng: 77.2090, area: 'Connaught Place' }
};

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
	if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

	const R = 6371; // Earth radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;

	return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Resolves location coordinates for a city or address string.
 */
export function resolveLocationCoordinates(locationStr) {
	if (!locationStr) {
		return { lat: 11.6643, lng: 78.1460, area: 'Salem' }; // Default fallback
	}

	const normalized = locationStr.toLowerCase().trim();
	for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
		if (normalized.includes(key)) {
			return coords;
		}
	}

	// Pseudo-deterministic hash-based offset coordinates generator if city not in dictionary
	let hash = 0;
	for (let i = 0; i < normalized.length; i++) {
		hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
	}
	const baseLat = 11.6643 + ((hash % 100) / 1000);
	const baseLng = 78.1460 + (((hash >> 2) % 100) / 1000);

	return {
		lat: baseLat,
		lng: baseLng,
		area: locationStr
	};
}

/**
 * Applies donor location privacy fuzzing so exact private coordinates/addresses are never exposed.
 */
export function getFuzzedDonorLocation(user) {
	const coords = resolveLocationCoordinates(user.location || user.city || user.address);

	// Deterministically fuzz donor offset slightly (~500m to 1km) based on donor ID
	let hash = 0;
	const seed = (user.id || user.email || 'donor').toString();
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	const latOffset = ((hash % 15) - 7) * 0.002;
	const lngOffset = (((hash >> 3) % 15) - 7) * 0.002;

	return {
		lat: coords.lat + latOffset,
		lng: coords.lng + lngOffset,
		area: user.location || coords.area || 'Approximate Area'
	};
}
