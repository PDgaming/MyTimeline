<script lang="ts">
	import { events } from '$lib/stores/store.svelte';
	import type { event } from '$lib/types';
	import { encryptWithPassword, decryptWithPassword } from '$lib/crypto';

	let editingEventId: string | null = null;
	let editingDate: string = '';
	let editingTitleId: string | null = null;
	let editingTitle: string = '';
	let editingDescId: string | null = null;
	let editingDesc: string = '';
	let exporting = false;

	function deleteEvent(id: string) {
		events.value = events.value.filter((ev) => ev.id !== id);
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
	}

	function handleDateInputKey(e: KeyboardEvent, ev: event) {
		if (e.key === 'Enter') {
			saveEditDate(ev);
		}
		if (e.key === 'Escape') {
			editingEventId = null;
		}
	}

	function startEditDate(ev: event) {
		editingEventId = ev.id;
		// Convert ms to yyyy-mm-dd
		const d = new Date(ev.date);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		editingDate = `${yyyy}-${mm}-${dd}`;
	}
	function saveEditDate(ev: event) {
		if (!editingDate) return;
		const newDate = new Date(editingDate).getTime();
		events.value = events.value.map((e) => (e.id === ev.id ? { ...e, date: newDate } : e));
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
		editingEventId = null;
	}
	function startEditTitle(ev: event) {
		editingTitleId = ev.id;
		editingTitle = ev.title;
	}
	function saveEditTitle(ev: event) {
		if (!editingTitle) return;
		events.value = events.value.map((e) => (e.id === ev.id ? { ...e, title: editingTitle } : e));
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
		editingTitleId = null;
	}
	function startEditDesc(ev: event) {
		editingDescId = ev.id;
		editingDesc = ev.description || '';
	}
	function saveEditDesc(ev: event) {
		// Allow empty description
		events.value = events.value.map((e) =>
			e.id === ev.id ? { ...e, description: editingDesc } : e
		);
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
		editingDescId = null;
	}

	function handleTitleInputKey(e: KeyboardEvent, ev: event) {
		if (e.key === 'Enter') {
			saveEditTitle(ev);
		}
		if (e.key === 'Escape') {
			editingTitleId = null;
		}
	}
	function handleDescInputKey(e: KeyboardEvent, ev: event) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEditDesc(ev);
		}
		if (e.key === 'Escape') {
			editingDescId = null;
		}
	}

	async function exportEvents() {
		exporting = true;
		try {
			const password = prompt('Enter a password to encrypt your export:');
			if (!password) {
				exporting = false;
				return;
			}
			const json = JSON.stringify(events.value);
			const encrypted = await encryptWithPassword(json, password);
			const blob = new Blob([encrypted], { type: 'application/octet-stream' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'timeline-events.enc.json';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} finally {
			exporting = false;
		}
	}

	async function importEvents() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,.enc,.txt,application/octet-stream';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const password = prompt('Enter the password to decrypt your events:');
			if (!password) return;
			try {
				const text = await file.text();
				const decrypted = await decryptWithPassword(text, password);
				const importedEvents = JSON.parse(decrypted);
				if (!Array.isArray(importedEvents)) throw new Error('Invalid events data');
				// Merge: add only events with unique IDs
				const existingIds = new Set(events.value.map((ev) => ev.id));
				const newEvents = importedEvents.filter((ev: any) => ev.id && !existingIds.has(ev.id));
				if (newEvents.length === 0) {
					alert('No new events to import.');
					return;
				}
				events.value = [...events.value, ...newEvents];
				localStorage.setItem('timelineEvents', JSON.stringify(events.value));
				alert(`Imported ${newEvents.length} new event(s).`);
			} catch (e) {
				alert('Failed to import events: ' + (e instanceof Error ? e.message : e));
			}
		};
		document.body.appendChild(input);
		input.click();
		document.body.removeChild(input);
	}
</script>

<aside class="sidebar flex h-full flex-col gap-2 bg-gray-100 p-2">
	<h2 class="underline">All Events</h2>
	<div class="mb-1 flex items-center justify-between gap-2">
		<button
			class="export-btn btn rounded-md p-2"
			on:click={exportEvents}
			disabled={exporting}
			title="Export all events"
		>
			{exporting ? 'Exporting...' : 'Export Events'}
		</button>
		<button
			class="import-btn btn rounded-md p-2"
			on:click={importEvents}
			title="Import events from file"
		>
			Import Events
		</button>
	</div>
	{#if events.value.length === 0}
		<div class="empty">No events yet.</div>
	{:else}
		<ul class="flex flex-col gap-2 overflow-y-scroll">
			{#each events.value as ev (ev.id)}
				<li>
					<div class="content flex gap-2 rounded-md bg-gray-300 p-2">
						<div class="event-info flex w-full flex-col gap-2">
							{#if editingTitleId === ev.id}
								<input
									type="text"
									bind:value={editingTitle}
									on:blur={() => saveEditTitle(ev)}
									on:keydown={(e) => handleTitleInputKey(e, ev)}
									autofocus
									class="event-title-input"
								/>
							{:else}
								<button class="event-title" on:click={() => startEditTitle(ev)}>{ev.title}</button>
							{/if}
							{#if editingDescId === ev.id}
								<textarea
									bind:value={editingDesc}
									on:blur={() => saveEditDesc(ev)}
									on:keydown={(e) => handleDescInputKey(e, ev)}
									autofocus
									class="event-desc-input"
									rows="2"
								></textarea>
							{:else}
								<button class="event-desc" on:click={() => startEditDesc(ev)}
									>{ev.description || 'No description'}</button
								>
							{/if}
							{#if editingEventId === ev.id}
								<input
									type="date"
									bind:value={editingDate}
									on:blur={() => saveEditDate(ev)}
									on:keydown={(e) => handleDateInputKey(e, ev)}
									autofocus
									class="event-date-input"
								/>
							{:else}
								<button class="event-date" on:click={() => startEditDate(ev)}
									>{new Date(ev.date).toLocaleDateString()}</button
								>
							{/if}
						</div>
						<button class="delete-btn" on:click={() => deleteEvent(ev.id)}>Delete</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.sidebar {
		width: 250px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
		min-height: 200px;
	}
	.sidebar h2 {
		font-size: 1.3rem;
		font-weight: 700;
		color: #334155;
	}
	.sidebar ul {
		list-style: none;
	}
	.sidebar .content {
		align-items: center;
		justify-content: space-between;
	}
	.sidebar li:last-child {
		border-bottom: none;
	}
	.event-info {
		flex-direction: column;
		width: 100%;
		min-width: 0;
		min-height: fit-content;
		height: 90px;
	}
	.event-title {
		font-weight: 600;
		color: #1e293b;
	}
	.event-date {
		font-size: 0.95em;
		color: #64748b;
	}
	.delete-btn {
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.3rem 0.8rem;
		font-size: 0.95em;
		cursor: pointer;
		transition: background 0.2s;
	}
	.delete-btn:hover {
		background: #b91c1c;
	}
	.empty {
		color: #64748b;
		font-style: italic;
		padding: 1rem 0;
		text-align: center;
	}
	.event-date-input {
		font-size: 0.95em;
		color: #334155;
		margin-top: 2px;
	}
	.event-title-input {
		font-size: 1em;
		color: #1e293b;
		margin-bottom: 2px;
		font-weight: 600;
	}
	.event-date-input,
	.event-title-input {
		padding: 0.2em 0.4em;
		border-radius: 4px;
		border: 1px solid #cbd5e1;
		background: #fff;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		word-break: break-word;
		white-space: pre-wrap;
	}
	.event-desc {
		font-size: 0.95em;
		color: #64748b;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		width: 100%;
		max-width: 100%;
		cursor: pointer;
		margin-bottom: 2px;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.event-desc-input {
		font-size: 0.95em;
		color: #64748b;
		background: #fff;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		resize: vertical;
		margin-bottom: 2px;
		padding: 0.2em 0.4em;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.export-btn {
		background: #3b82f6;
		color: white;
		border: none;
		font-size: 0.9em;
		cursor: pointer;
		transition: background 0.2s;
	}
	.export-btn:disabled {
		background: #93c5fd;
		cursor: not-allowed;
	}
	.import-btn {
		background: #10b981;
		color: white;
		border: none;
		font-size: 0.9em;
		cursor: pointer;
		transition: background 0.2s;
	}
	.import-btn:disabled {
		background: #6ee7b7;
		cursor: not-allowed;
	}
</style>
