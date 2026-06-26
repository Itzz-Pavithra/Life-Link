// Server-side memory database for LifeLink MCA Project
export const database = {
	requests: [
		{ id: 'REQ001', patientName: 'Rajesh Kumar', bloodGroup: 'O+', units: 3, hospital: 'GH Salem', city: 'Salem', urgency: 'Critical', status: 'Matching Donor', contact: '9876543210', date: '2026-06-24' },
		{ id: 'REQ002', patientName: 'Priya Sharma', bloodGroup: 'A-', units: 2, hospital: 'Apollo Hospital', city: 'Chennai', urgency: 'Urgent', status: 'Completed', contact: '9876543211', date: '2026-06-22' },
		{ id: 'REQ003', patientName: 'Amit Patel', bloodGroup: 'B+', units: 1, hospital: 'Fortis Clinic', city: 'Mumbai', urgency: 'Normal', status: 'Submitted', contact: '9876543212', date: '2026-06-25' },
		{ id: 'REQ004', patientName: 'Sanjay Dutt', bloodGroup: 'AB+', units: 4, hospital: 'Medanta', city: 'Delhi', urgency: 'Critical', status: 'Verified', contact: '9876543213', date: '2026-06-25' }
	],

	donors: [
		{ name: 'Ravi Kumar', bloodGroup: 'O+', distance: '1.4', available: true, lastDonation: '2026-03-10', matchScore: 98, phone: '9876543210', city: 'Salem' },
		{ name: 'Priya S', bloodGroup: 'O+', distance: '2.8', available: true, lastDonation: '2026-04-15', matchScore: 95, phone: '9876543211', city: 'Salem' },
		{ name: 'John Doe', bloodGroup: 'O+', distance: '4.2', available: true, lastDonation: '2026-03-10', matchScore: 100, phone: '9876543212', city: 'Salem' },
		{ name: 'Jane Smith', bloodGroup: 'B-', distance: '5.1', available: true, lastDonation: '2026-02-28', matchScore: 91, phone: '9876543213', city: 'Salem' },
		{ name: 'Arun Varma', bloodGroup: 'AB+', distance: '3.6', available: true, lastDonation: '2026-01-20', matchScore: 84, phone: '9876543214', city: 'Salem' }
	],

	bloodBanks: [
		{ name: 'GH Salem Blood Bank', distance: '2.5', stockStatus: 'Healthy', phone: '0427-241551', address: 'Collectorate Rd, Salem', inventory: { 'A+': 25, 'B+': 18, 'O+': 30, 'AB+': 12, 'A-': 5, 'B-': 3, 'AB-': 2, 'O-': 8 } },
		{ name: 'Apollo Salem Blood Center', distance: '4.8', stockStatus: 'Low Stock', phone: '0427-234500', address: 'Suramangalam, Salem', inventory: { 'A+': 12, 'B+': 9, 'O+': 15, 'AB+': 6, 'A-': 2, 'B-': 1, 'AB-': 0, 'O-': 3 } },
		{ name: 'Red Cross Salem', distance: '1.2', stockStatus: 'Critical Stock', phone: '0427-222400', address: 'Hasthampatti, Salem', inventory: { 'A+': 4, 'B+': 3, 'O+': 5, 'AB+': 2, 'A-': 0, 'B-': 0, 'AB-': 0, 'O-': 1 } }
	],

	systemLogs: [
		{ id: 'LOG101', user: 'Ravi Kumar', activity: 'Donor Registered', timestamp: '2026-06-25 18:22' },
		{ id: 'LOG102', user: 'GH Salem', activity: 'Inventory Updated (+10 O+ Units)', timestamp: '2026-06-25 19:45' },
		{ id: 'LOG103', user: 'Priya Sharma', activity: 'Emergency Blood Request Match Found', timestamp: '2026-06-25 21:10' },
		{ id: 'LOG104', user: 'System', activity: 'Backup Done', timestamp: '2026-06-25 23:00' }
	],

	// Static Landing Page Content Data
	landingData: {
		stats: [
			{ value: 500, label: 'Registered Donors', icon: '👤', color: 'text-red-650 border-red-105 bg-red-50/50' },
			{ value: 120, label: 'Blood Requests Resolved', icon: '📋', color: 'text-blue-650 border-blue-105 bg-blue-50/50' },
			{ value: 25, label: 'Partner Blood Banks', icon: '🏥', color: 'text-emerald-650 border-emerald-105 bg-emerald-50/50' },
			{ value: 1000, label: 'Lives Saved', icon: '❤️', color: 'text-rose-650 border-rose-105 bg-rose-50/50' }
		],
		steps: [
			{ step: '01', title: 'Register', desc: 'Create a secure profile as a Donor, Recipient, or Admin.', icon: '👤' },
			{ step: '02', title: 'Submit Request', desc: 'Recipients or hospitals submit emergency blood requirements.', icon: '📝' },
			{ step: '03', title: 'Smart Match', desc: 'Our algorithm finds eligible donors within range in real-time.', icon: '🔍' },
			{ step: '04', title: 'Save Lives', desc: 'Blood is matched, dispatched, and reaches patients safely.', icon: '🩸' }
		],
		benefits: [
			{ title: 'Zero Latency Matching', desc: 'Instantly identifies the nearest compatible donors using live matching metrics.', icon: '⚡' },
			{ title: 'Hospital Inventory Alerts', desc: 'Smart progress bars tracking available, low, and critical blood stocks.', icon: '📊' },
			{ title: 'Secure & Anonymous', desc: 'Patient-donor contact details are only shared upon explicit verification.', icon: '🔒' }
		],
		faqs: [
			{ q: 'Who can donate blood on LifeLink?', a: 'Any healthy individual between 18 and 65 years old weighing at least 50 kg can take our Eligibility Checker. If eligible, they can register and receive emergency requests.' },
			{ q: 'How does emergency matching work?', a: 'When a recipient submits a request, LifeLink computes match scores based on blood group compatibility, city coordinates, and donor availability. Compatible matches are notified immediately.' },
			{ q: 'Is there any fee or charge to use LifeLink?', a: 'No. LifeLink is a non-profit, student-developed initiative designed to facilitate free, voluntary blood donation and emergency matching.' }
		],
		testimonials: [
			{ quote: "During my father's surgery, we needed O- negative blood urgently. Through LifeLink, we found two matching donors in under 15 minutes. Truly a lifesaver!", author: "Suresh Kumar", role: "Recipient Family" },
			{ quote: "Registering as a donor was incredibly easy. I get notified when someone nearby needs my blood type. Being able to help save a life is unmatched.", author: "Dr. Anjali Bose", role: "Regular O+ Donor" }
		]
	},

	// Donor specific data for John Doe
	donorHistory: [
		{ date: '2026-03-10', hospital: 'GH Salem', units: 1, type: 'Voluntary Drive' },
		{ date: '2026-01-15', hospital: 'Apollo Salem', units: 1, type: 'Emergency Matching' },
		{ date: '2025-10-05', hospital: 'Red Cross Salem', units: 1, type: 'Voluntary Drive' }
	],

	donorBadges: [
		{ name: 'Bronze Donor', desc: 'Completed 1 whole blood donation drive.', progress: 100, earned: true, icon: '🥉' },
		{ name: 'Silver Donor', desc: 'Completed 3 whole blood donation drives.', progress: 100, earned: true, icon: '🥈' },
		{ name: 'Gold Donor', desc: 'Completed 5 whole blood donation drives.', progress: 60, earned: false, icon: '🥇' },
		{ name: 'Life Saver Badge', desc: 'Successfully matched and accepted emergency tickets.', progress: 100, earned: true, icon: '🏆' }
	],

	// Analytics data for Admin reports
	analyticsData: {
		monthlyActivity: [
			{ month: 'Jan', requests: 45, donations: 60 },
			{ month: 'Feb', requests: 55, donations: 70 },
			{ month: 'Mar', requests: 80, donations: 75 },
			{ month: 'Apr', requests: 65, donations: 90 },
			{ month: 'May', requests: 95, donations: 110 },
			{ month: 'Jun', requests: 120, donations: 135 }
		],
		distribution: [
			{ group: 'O+', value: 35, color: '#b91c1c' },
			{ group: 'A+', value: 25, color: '#dc2626' },
			{ group: 'B+', value: 20, color: '#ef4444' },
			{ group: 'AB+', value: 10, color: '#f87171' },
			{ group: 'Negatives', value: 10, color: '#fca5a5' }
		]
	}
};

export function addRequest(req, user) {
	const newId = `REQ${String(database.requests.length + 1).padStart(3, '0')}`;
	const newReq = {
		id: newId,
		patientName: req.patientName,
		bloodGroup: req.bloodGroup,
		units: Number(req.units),
		hospital: req.hospital,
		city: req.city,
		urgency: req.urgency || 'Normal',
		status: 'Submitted',
		contact: req.contact || '9999999999',
		date: new Date().toISOString().split('T')[0]
	};

	database.requests.unshift(newReq);

	// Add log
	database.systemLogs.unshift({
		id: `LOG${Date.now()}`,
		user: user || 'Guest',
		activity: `Blood Request Submitted for ${req.patientName}`,
		timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
	});

	return newReq;
}

export function updateInventory(bloodGroup, units, user) {
	const bank = database.bloodBanks[0]; // GH Salem Blood Bank
	if (bank && bank.inventory[bloodGroup] !== undefined) {
		bank.inventory[bloodGroup] = Number(units);

		// Recompute overall stock status
		const totalUnits = Object.values(bank.inventory).reduce((a, b) => a + b, 0);
		if (totalUnits >= 100) bank.stockStatus = 'Healthy';
		else if (totalUnits >= 50) bank.stockStatus = 'Low Stock';
		else bank.stockStatus = 'Critical Stock';

		database.systemLogs.unshift({
			id: `LOG${Date.now()}`,
			user: user || 'Staff',
			activity: `Inventory Updated (${bloodGroup} = ${units} Units)`,
			timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
		});
		return true;
	}
	return false;
}
