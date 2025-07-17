<script lang="ts">
	import { events } from '$lib/stores/store.svelte';
	import type { event } from '$lib/types';

	let editingEventId: string | null = null;
	let editingDate: string = '';

	function deleteEvent(id: string) {
		events.value = events.value.filter((ev) => ev.id !== id);
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
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

	function handleDateInputKey(e: KeyboardEvent, ev: event) {
		if (e.key === 'Enter') {
			saveEditDate(ev);
		}
		if (e.key === 'Escape') {
			editingEventId = null;
		}
	}
</script>

<aside class="sidebar h-full">
	<h2>All Events</h2>
	{#if events.value.length === 0}
		<div class="empty">No events yet.</div>
	{:else}
		<ul>
			{#each events.value as ev (ev.id)}
				<li>
					<div class="event-info">
						<span class="event-title">{ev.title}</span>
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
							<span class="event-date" on:click={() => startEditDate(ev)}
								>{new Date(ev.date).toLocaleDateString()}</span
							>
						{/if}
					</div>
					<button class="delete-btn" on:click={() => deleteEvent(ev.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.sidebar {
		width: 220px;
		background: #f1f5f9;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
		padding: 1.5rem 1rem;
		min-height: 200px;
	}
	.sidebar h2 {
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #334155;
	}
	.sidebar ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.sidebar li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e2e8f0;
	}
	.sidebar li:last-child {
		border-bottom: none;
	}
	.event-info {
		display: flex;
		flex-direction: column;
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
		padding: 0.2em 0.4em;
		border-radius: 4px;
		border: 1px solid #cbd5e1;
		color: #334155;
		background: #fff;
		margin-top: 2px;
	}
</style>
