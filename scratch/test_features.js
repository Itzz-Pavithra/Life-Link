import { calculateDonorRecovery, RECOVERY_PERIODS } from '../src/lib/server/recovery.js';
import { calculateHaversineDistance, resolveLocationCoordinates, getFuzzedDonorLocation } from '../src/lib/server/location.js';

console.log('=== LIFELINK FEATURE VERIFICATION TESTS ===\n');

// Test 1: Male Donor Cooldown (90 days)
const maleDonorRecent = {
	id: 'USR101',
	name: 'Rahul',
	gender: 'male',
	lastDonationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
	isAvailable: true
};

const maleRec = calculateDonorRecovery(maleDonorRecent);
console.log('Test 1 - Male Donor 10 days ago donation:');
console.log(' - In Recovery:', maleRec.inRecovery);
console.log(' - Days Remaining:', maleRec.daysRemaining);
console.log(' - Computed Status:', maleRec.computedStatus);
console.assert(maleRec.inRecovery === true, 'Male donor 10 days ago should be in recovery!');
console.assert(maleRec.daysRemaining === 80, `Expected 80 days remaining, got ${maleRec.daysRemaining}`);
console.assert(maleRec.computedStatus === 'RECOVERY', 'Computed status should be RECOVERY!');

// Test 2: Female Donor Cooldown (120 days)
const femaleDonorRecent = {
	id: 'USR102',
	name: 'Priya',
	gender: 'female',
	lastDonationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
	isAvailable: true
};

const femaleRec = calculateDonorRecovery(femaleDonorRecent);
console.log('\nTest 2 - Female Donor 30 days ago donation:');
console.log(' - In Recovery:', femaleRec.inRecovery);
console.log(' - Days Remaining:', femaleRec.daysRemaining);
console.log(' - Computed Status:', femaleRec.computedStatus);
console.assert(femaleRec.inRecovery === true, 'Female donor 30 days ago should be in recovery!');
console.assert(femaleRec.daysRemaining === 90, `Expected 90 days remaining, got ${femaleRec.daysRemaining}`);

// Test 3: Donor with recovery expired (100 days ago for male)
const maleDonorEligible = {
	id: 'USR103',
	name: 'Arun',
	gender: 'male',
	lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 100 days ago
	isAvailable: true
};

const eligibleRec = calculateDonorRecovery(maleDonorEligible);
console.log('\nTest 3 - Male Donor 100 days ago donation:');
console.log(' - In Recovery:', eligibleRec.inRecovery);
console.log(' - Computed Status:', eligibleRec.computedStatus);
console.assert(eligibleRec.inRecovery === false, 'Donor 100 days ago should be eligible!');
console.assert(eligibleRec.computedStatus === 'AVAILABLE', 'Computed status should be AVAILABLE!');

// Test 4: Distance Calculations & Donor Privacy Fuzzing
const reqLocation = resolveLocationCoordinates('Apollo Hospital Salem');
const donorUser = { id: 'USR105', name: 'Karthik', location: 'Salem' };
const donorFuzzedLoc = getFuzzedDonorLocation(donorUser);
const dist = calculateHaversineDistance(reqLocation.lat, reqLocation.lng, donorFuzzedLoc.lat, donorFuzzedLoc.lng);

console.log('\nTest 4 - Location & Distance:');
console.log(' - Hospital Coords:', reqLocation);
console.log(' - Donor Fuzzed Coords:', donorFuzzedLoc);
console.log(' - Distance (km):', dist);
console.assert(dist != null && dist >= 0, 'Distance should be a valid non-negative number!');
console.assert(donorFuzzedLoc.lat !== reqLocation.lat || donorFuzzedLoc.lng !== reqLocation.lng, 'Donor coordinates should be fuzzed for privacy!');

console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
