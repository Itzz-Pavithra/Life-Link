// Configurable donation recovery periods (in days)
export const RECOVERY_PERIODS = {
	male: 90,
	female: 120,
	default: 90
};

/**
 * Calculates recovery status and countdown metrics for a donor.
 * @param {Object} user - User record from database
 * @param {Date} [now=new Date()] - Reference date
 * @returns {Object} Recovery calculation metrics
 */
export function calculateDonorRecovery(user, now = new Date()) {
	if (!user) {
		return {
			inRecovery: false,
			lastDonationDate: null,
			nextEligibleDate: null,
			daysRemaining: 0,
			totalDays: 90,
			gender: 'male',
			computedStatus: 'UNAVAILABLE'
		};
	}

	if (user.status === 'suspended') {
		return {
			inRecovery: false,
			lastDonationDate: user.lastDonationDate || null,
			nextEligibleDate: null,
			daysRemaining: 0,
			totalDays: 90,
			gender: user.gender || 'male',
			computedStatus: 'SUSPENDED'
		};
	}

	const genderKey = (user.gender || 'male').toLowerCase();
	const totalDays = RECOVERY_PERIODS[genderKey] || RECOVERY_PERIODS.default;

	if (!user.lastDonationDate) {
		return {
			inRecovery: false,
			lastDonationDate: null,
			nextEligibleDate: null,
			daysRemaining: 0,
			totalDays,
			gender: user.gender || 'male',
			computedStatus: user.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE'
		};
	}

	const lastDate = new Date(user.lastDonationDate);
	if (isNaN(lastDate.getTime())) {
		return {
			inRecovery: false,
			lastDonationDate: null,
			nextEligibleDate: null,
			daysRemaining: 0,
			totalDays,
			gender: user.gender || 'male',
			computedStatus: user.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE'
		};
	}

	const nextEligibleDate = new Date(lastDate);
	nextEligibleDate.setDate(nextEligibleDate.getDate() + totalDays);

	const diffTime = nextEligibleDate.getTime() - now.getTime();
	const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	const inRecovery = daysRemaining > 0;

	let computedStatus = 'UNAVAILABLE';
	if (inRecovery) {
		computedStatus = 'RECOVERY';
	} else if (user.isAvailable !== false) {
		computedStatus = 'AVAILABLE';
	}

	return {
		inRecovery,
		lastDonationDate: lastDate.toISOString().split('T')[0],
		nextEligibleDate: nextEligibleDate.toISOString().split('T')[0],
		daysRemaining: inRecovery ? daysRemaining : 0,
		totalDays,
		gender: user.gender || 'male',
		computedStatus
	};
}
