// Client-side UI state store (Toasts, active dashboard tab, and user auth state)
class LifeLinkClientState {
	activeTab = $state('dashboard');
	toasts = $state([]);
	
	// Centralized Auth states using Svelte 5 runes
	user = $state(null);
	authLoading = $state(true);

	addToast(message, type = 'info') {
		const id = Date.now();
		this.toasts = [...this.toasts, { id, message, type }];
		setTimeout(() => {
			this.toasts = this.toasts.filter(t => t.id !== id);
		}, 4000);
	}
}

export const db = new LifeLinkClientState();
