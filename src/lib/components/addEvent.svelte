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
		// Save to localStorage
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
		newTitle = '';
		newDescription = '';
		newDate = '';
	}
</script>

<form
	class="add-event-form flex flex-wrap rounded-md bg-gray-300 p-2 shadow-xl"
	on:submit|preventDefault={addEvent}
>
	<input class="rounded-md" type="text" placeholder="Title" bind:value={newTitle} required />
	<input class="rounded-md" type="date" bind:value={newDate} required />
	<input class="rounded-md" type="text" placeholder="Description" bind:value={newDescription} />
	<button class="btn" type="submit">Add Event</button>
</form>

<style>
	.add-event-form {
		display: flex;
		gap: 0.5rem;
	}
	.add-event-form input,
	.add-event-form button {
		padding: 0.5rem;
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
