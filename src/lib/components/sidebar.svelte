<script lang="ts">
	import { events } from '$lib/stores/store.svelte';
	import type { event } from '$lib/types';

	function deleteEvent(id: string) {
		events.value = events.value.filter((ev) => ev.id !== id);
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
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
						<span class="event-date">{new Date(ev.date).toLocaleDateString()}</span>
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
</style>
