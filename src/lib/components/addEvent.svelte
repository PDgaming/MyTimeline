<script lang="ts">
	import { events } from '$lib/stores/store.svelte';
	import type { event } from '$lib/types';

	let newTitle = '';
	let newDescription = '';
	let newDate = ''; // ISO string

	function addEvent() {
		if (!newTitle || !newDate) return;
		const newEvent: event = {
			id: Math.random().toString(36).slice(2), // simple unique id
			title: newTitle,
			description: newDescription,
			date: new Date(newDate).getTime()
		};
		events.value = [...events.value, newEvent];
		newTitle = '';
		newDescription = '';
		newDate = '';
	}
</script>

<form class="add-event-form" on:submit|preventDefault={addEvent}>
	<input type="text" placeholder="Title" bind:value={newTitle} required />
	<input type="date" bind:value={newDate} required />
	<input type="text" placeholder="Description" bind:value={newDescription} />
	<button type="submit">Add Event</button>
</form>

<style>
	.add-event-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.add-event-form input,
	.add-event-form button {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #cbd5e1;
		font-size: 1rem;
	}
	.add-event-form button {
		background: #3b82f6;
		color: white;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
	}
	.add-event-form button:hover {
		background: #2563eb;
	}
</style>
