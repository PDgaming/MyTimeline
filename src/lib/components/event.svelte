<script lang="ts">
	import type { event } from '$lib/types';
	import { events } from '$lib/stores/store.svelte';
	export let thisEvent: event;
</script>

<div class="event-tooltip">
	<strong>{thisEvent.title}</strong>
	<div>{new Date(thisEvent.date).toLocaleDateString()}</div>
	{#if thisEvent.description}
		<div class="desc">{thisEvent.description}</div>
	{/if}
</div>

<style>
	.event-tooltip {
		background: white;
		color: #334155;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		padding: 0.5rem 1rem;
		font-size: 0.95rem;
		pointer-events: none;
		z-index: 100;
		min-width: 180px;
		max-width: 260px;
		position: absolute;
		top: 0;
		left: 0;
		transform: translate(-50%, -110%);
		white-space: normal;
	}
	.event-tooltip .desc {
		margin-top: 0.25rem;
		font-size: 0.9em;
		color: #64748b;
	}
</style>
