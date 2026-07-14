export function getInitials(name) {
	if (!name) return '?';
	const clean = name.trim().replace(/\s+/g, ' ');
	const parts = clean.split(' ');
	if (parts.length === 1) {
		return parts[0].substring(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name) {
	if (!name) return 'bg-red-100 text-red-700 border-red-200';
	const colors = [
		'bg-red-100 text-red-700 border-red-200',
		'bg-blue-100 text-blue-700 border-blue-200',
		'bg-emerald-100 text-emerald-700 border-emerald-200',
		'bg-amber-100 text-amber-700 border-amber-200',
		'bg-purple-100 text-purple-700 border-purple-200',
		'bg-pink-100 text-pink-700 border-pink-200',
		'bg-indigo-100 text-indigo-700 border-indigo-200',
		'bg-teal-100 text-teal-700 border-teal-200'
	];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % colors.length;
	return colors[index];
}
