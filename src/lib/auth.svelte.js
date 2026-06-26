// Client-side UI state store (Toasts and active dashboard tab only)
class LifeLinkClientState {
	activeTab = $state('dashboard');
	toasts = $state([]);

	addToast(message, type = 'info') {
		const id = Date.now();
		this.toasts = [...this.toasts, { id, message, type }];
		setTimeout(() => {
			this.toasts = this.toasts.filter(t => t.id !== id);
		}, 4000);
	}
}

export const db = new LifeLinkClientState();
