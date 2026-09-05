<script>
	import { onMount, onDestroy } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { db } from '$lib/auth.svelte.js';

	let { chatId, user, onClose = null } = $props();

	let chat = $state(null);
	let messages = $state([]);
	let newMessageText = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let error = $state('');
	let showReportModal = $state(false);
	let reportReason = $state('Spam / Fake Request');
	let customReportReason = $state('');
	let pollInterval;
	let chatContainer;

	onMount(() => {
		fetchChatData();
		// Real-time updates via 3s polling
		pollInterval = setInterval(() => {
			fetchChatData(false);
		}, 3000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	async function fetchChatData(showLoadingIndicator = true) {
		if (showLoadingIndicator && !chat) loading = true;
		try {
			const res = await fetch(`/api/chat/${chatId}`);
			const data = await res.json();
			if (data.success) {
				const prevCount = messages.length;
				chat = data.chat;
				messages = data.messages || [];

				if (messages.length > prevCount) {
					scrollToBottom();
				}
			} else {
				error = data.error || 'Failed to load chat conversation.';
			}
		} catch (err) {
			error = 'Network error loading chat.';
		} finally {
			if (showLoadingIndicator) loading = false;
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	async function handleSendMessage(e) {
		if (e) e.preventDefault();
		if (!newMessageText.trim() || sending) return;
		if (chat?.status === 'archived') {
			db.addToast('This chat session is archived and read-only.', 'error');
			return;
		}

		const textToSend = newMessageText.trim();
		newMessageText = '';
		sending = true;

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chatId, text: textToSend })
			});

			const data = await res.json();
			if (data.success) {
				messages = [...messages, data.message];
				scrollToBottom();
			} else {
				db.addToast(data.error || 'Failed to send message.', 'error');
				newMessageText = textToSend;
			}
		} catch (err) {
			db.addToast('Failed to send message.', 'error');
			newMessageText = textToSend;
		} finally {
			sending = false;
		}
	}

	async function handleReportChat() {
		const finalReason = reportReason === 'Other' ? customReportReason : reportReason;
		if (!finalReason) {
			db.addToast('Please specify a reason for reporting.', 'error');
			return;
		}

		try {
			const res = await fetch(`/api/chat/${chatId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'report', reason: finalReason })
			});
			const data = await res.json();
			if (data.success) {
				db.addToast('Conversation reported to LifeLink safety moderation.', 'success');
				showReportModal = false;
				await fetchChatData(false);
			} else {
				db.addToast(data.error || 'Failed to report conversation.', 'error');
			}
		} catch (err) {
			db.addToast('Error submitting report.', 'error');
		}
	}

	function formatTime(isoStr) {
		if (!isoStr) return '';
		const d = new Date(isoStr);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
	<div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden border border-slate-100">
		
		<!-- Chat Header -->
		<div class="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
			<div class="flex items-center gap-3">
				<button onclick={onClose} class="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
					<Icon name="arrow-left" class="w-5 h-5" />
				</button>
				<div>
					<div class="flex items-center gap-2">
						<span class="w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
							{chat?.bloodGroup || '🩸'}
						</span>
						<h3 class="font-extrabold text-sm text-white">Emergency Request #{chat?.requestId || ''}</h3>
						<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
							{chat?.status === 'archived' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}">
							{chat?.status === 'archived' ? '⚪ Archived' : '🟢 Active Emergency'}
						</span>
					</div>
					<p class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
						<Icon name="hospital" class="w-3 h-3 text-red-400" /> {chat?.hospital || 'Hospital'} • Urgency: <strong class="text-amber-400">{chat?.urgency || 'Normal'}</strong>
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={() => showReportModal = true}
					class="text-slate-400 hover:text-red-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-red-900/50 transition cursor-pointer flex items-center gap-1"
					title="Report Conversation"
				>
					<Icon name="alert-triangle" class="w-3.5 h-3.5 text-amber-500" /> <span class="hidden sm:inline">Report</span>
				</button>
				<button onclick={onClose} class="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
					<Icon name="x" class="w-5 h-5" />
				</button>
			</div>
		</div>

		<!-- Chat Body / Messages Thread -->
		<div bind:this={chatContainer} class="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50/50">
			{#if loading}
				<div class="h-full flex items-center justify-center text-xs text-slate-400 gap-2">
					<Icon name="loader" class="w-4 h-4 animate-spin text-red-600" /> Loading conversation...
				</div>
			{:else if error}
				<div class="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl text-center">
					{error}
				</div>
			{:else if messages.length === 0}
				<div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
					<span class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl">💬</span>
					<h4 class="font-bold text-slate-700 text-sm">Emergency Chat Connected</h4>
					<p class="text-xs max-w-xs text-slate-500">Coordinate donation time, blood bank arrival, and clinical logistics safely without sharing personal phone numbers.</p>
				</div>
			{:else}
				{#each messages as msg}
					{@const isMe = (msg.senderEmail || '').toLowerCase() === (user?.email || '').toLowerCase()}
					<div class="flex flex-col {isMe ? 'items-end' : 'items-start'}">
						<span class="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
							{msg.senderName} ({msg.senderRole}) • {formatTime(msg.timestamp)}
						</span>
						<div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed
							{isMe ? 'bg-primary text-white rounded-br-none font-medium' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}">
							{msg.text}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Archived Notice Banner if Chat is Archived -->
		{#if chat?.status === 'archived'}
			<div class="bg-amber-50 border-t border-b border-amber-200 p-2.5 text-center text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0">
				<Icon name="check-circle" class="w-4 h-4 text-emerald-600" /> Emergency request completed. This conversation is archived and read-only.
			</div>
		{/if}

		<!-- Chat Footer / Input Form -->
		<form onsubmit={handleSendMessage} class="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
			<input
				type="text"
				bind:value={newMessageText}
				placeholder={chat?.status === 'archived' ? 'Conversation is read-only...' : 'Type your emergency message...'}
				disabled={chat?.status === 'archived' || sending}
				class="flex-grow border border-slate-200 p-3 rounded-2xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50/50 disabled:bg-slate-100 disabled:cursor-not-allowed"
			/>
			<button
				type="submit"
				disabled={chat?.status === 'archived' || !newMessageText.trim() || sending}
				class="bg-primary hover:bg-red-700 text-white font-bold px-5 py-3 rounded-2xl text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
			>
				<span>Send</span>
				<Icon name="send" class="w-3.5 h-3.5" />
			</button>
		</form>
	</div>
</div>

{#if showReportModal}
	<!-- Report Safety Modal -->
	<div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
			<div class="flex justify-between items-center border-b border-slate-100 pb-3">
				<h3 class="font-extrabold text-slate-900 text-base flex items-center gap-2 text-red-600">
					<Icon name="alert-triangle" class="w-5 h-5" /> Report Conversation
				</h3>
				<button onclick={() => showReportModal = false} class="text-slate-400 hover:text-slate-600">
					<Icon name="x" class="w-5 h-5" />
				</button>
			</div>

			<p class="text-xs text-slate-500">
				LifeLink prioritizes safety. Reports are sent directly to our moderation team. Select the primary reason:
			</p>

			<div class="space-y-2">
				<label class="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
					<input type="radio" bind:group={reportReason} value="Spam / Fake Request" class="accent-red-600" /> Spam or Fake Emergency
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
					<input type="radio" bind:group={reportReason} value="Harassment / Abusive Language" class="accent-red-600" /> Harassment or Abusive Behavior
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
					<input type="radio" bind:group={reportReason} value="Suspicious Financial Request" class="accent-red-600" /> Demanding Money / Suspicious Behavior
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
					<input type="radio" bind:group={reportReason} value="Other" class="accent-red-600" /> Other Reason
				</label>
			</div>

			{#if reportReason === 'Other'}
				<textarea
					bind:value={customReportReason}
					placeholder="Describe the issue..."
					rows="2"
					class="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
				></textarea>
			{/if}

			<div class="grid grid-cols-2 gap-3 pt-2">
				<button
					type="button"
					onclick={() => showReportModal = false}
					class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleReportChat}
					class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
				>
					Submit Report
				</button>
			</div>
		</div>
	</div>
{/if}
