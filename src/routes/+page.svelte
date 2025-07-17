<script lang="ts">
	import { onMount } from 'svelte';
	// --- Store Integration ---
	// The component now assumes these stores are imported from your actual store file.
	import {
		timelineMin,
		timelineMax,
		visibleStart,
		visibleEnd,
		events
	} from '$lib/stores/store.svelte';
	import type { event } from '$lib/types';
	import AddEvent from '$lib/components/addEvent.svelte';
	import EventTooltip from '$lib/components/event.svelte';
	import Sidebar from '$lib/components/sidebar.svelte';

	const TIMELINE_PADDING = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

	// --- Component State ---
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartVisibleStart: number;
	let timelineMarkers = $state<
		{ time: number; type: 'large' | 'small'; label: string; position: 'top' | 'bottom' }[]
	>([]);
	let headerLabel = $state(''); // For the new hierarchical label
	let hoveredEvent: event | null = $state(null);
	let hoveredEventId: string | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	// --- Event Drag State ---
	let draggingEventId: string | null = null;
	let dragEventStartX = 0;
	let dragEventStartDate = 0;

	// --- Derived State for UI ---
	let displayZoom = $derived.by(() => {
		const minSpan = 24 * 60 * 60 * 1000; // 1 day (or whatever your true min is)
		const maxSpan = 150 * 365.25 * 24 * 60 * 60 * 1000; // 150 years
		const currentSpan = visibleEnd.value - visibleStart.value;

		const logMin = Math.log(minSpan);
		const logMax = Math.log(maxSpan);
		const logCurrent = Math.log(currentSpan);

		const zoomRatio = 1 - (logCurrent - logMin) / (logMax - logMin);
		return Math.round(Math.max(0, Math.min(100, zoomRatio * 100)));
	});

	// --- Initialization ---
	function initializeVisibleRange() {
		const initialSpan = 50 * 365.25 * 24 * 60 * 60 * 1000; // 50 years
		const center = new Date(1995, 0, 1).getTime();
		visibleStart.value = center - initialSpan / 2;
		visibleEnd.value = center + initialSpan / 2;
	}
	onMount(() => {
		if (visibleStart.value === 0 && visibleEnd.value === 0) {
			initializeVisibleRange();
		}
	});

	// --- Core Interaction Logic (Panning & Zooming) ---
	function onMouseDown(event: MouseEvent) {
		isDragging = true;
		dragStartX = event.clientX;
		dragStartVisibleStart = visibleStart.value;
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}
	function onMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		event.preventDefault();

		const dx = event.clientX - dragStartX;
		const timelineWidth = event.view?.innerWidth || window.innerWidth;
		const timeSpan = visibleEnd.value - visibleStart.value;
		const msPerPixel = timeSpan / timelineWidth;
		const msShift = dx * msPerPixel;

		let newStart = dragStartVisibleStart - msShift;
		let newEnd = newStart + timeSpan;

		if (newStart < timelineMin) {
			newStart = timelineMin;
			newEnd = newStart + timeSpan;
		}
		if (newEnd > timelineMax + TIMELINE_PADDING) {
			newEnd = timelineMax + TIMELINE_PADDING;
			newStart = newEnd - timeSpan;
		}

		visibleStart.value = newStart;
		visibleEnd.value = newEnd;
	}
	function onMouseUp() {
		if (!isDragging) return;
		isDragging = false;
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
	}
	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const timelineElem = event.currentTarget as HTMLElement;
		const rect = timelineElem.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const timeAtMouse =
			visibleStart.value + (mouseX / rect.width) * (visibleEnd.value - visibleStart.value);

		const zoomFactor = 1.25;
		const currentSpan = visibleEnd.value - visibleStart.value;
		let newSpan = event.deltaY < 0 ? currentSpan / zoomFactor : currentSpan * zoomFactor;

		const minSpan = 24 * 60 * 60 * 1000; // 1 day
		const maxSpan = 150 * 365.25 * 24 * 60 * 60 * 1000; // 150 years
		newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));

		let newStart = timeAtMouse - (mouseX / rect.width) * newSpan;
		let newEnd = newStart + newSpan;

		if (newStart < timelineMin) {
			newStart = timelineMin;
		}
		if (newEnd > timelineMax + TIMELINE_PADDING) {
			newEnd = timelineMax + TIMELINE_PADDING;
		}

		visibleStart.value = newStart;
		visibleEnd.value = newEnd;
	}

	// --- Marker and Label Calculation Logic ---
	$effect(() => {
		const span = visibleEnd.value - visibleStart.value;
		const newMarkers = [];
		const DAY = 24 * 60 * 60 * 1000;
		const YEAR = 365.25 * DAY;

		const startDate = new Date(visibleStart.value);
		const endDate = new Date(visibleEnd.value);
		const centerDate = new Date(visibleStart.value + span / 2);

		// Level 1: Decade / Year markers
		if (span > 15 * YEAR) {
			headerLabel = `${Math.floor(centerDate.getFullYear() / 10) * 10}s`;

			// Find the first year >= visibleStart
			let year = startDate.getFullYear();
			if (new Date(year, 0, 1).getTime() < visibleStart.value) year++;
			const endYear = endDate.getFullYear();

			for (; year <= endYear; year++) {
				const time = new Date(year, 0, 1).getTime();
				if (year % 10 === 0) {
					newMarkers.push({
						time,
						type: 'large' as const,
						label: year.toString(),
						position: 'top' as const
					});
				} else {
					newMarkers.push({
						time,
						type: 'small' as const,
						label: year.toString(),
						position: 'bottom' as const
					});
				}
			}
		}
		// Level 2: Year / Month markers
		else if (span > 1.5 * YEAR) {
			headerLabel = centerDate.getFullYear().toString();

			let year = startDate.getFullYear();
			let month = startDate.getMonth();
			let date = new Date(year, month, 1);
			// Move to the first visible month
			while (date.getTime() < visibleStart.value) {
				month++;
				if (month > 11) {
					month = 0;
					year++;
				}
				date = new Date(year, month, 1);
			}
			while (date.getTime() <= visibleEnd.value) {
				const time = date.getTime();
				if (month === 0) {
					newMarkers.push({ time, type: 'large', label: year.toString(), position: 'top' });
				} else {
					const monthName = date.toLocaleString('default', { month: 'short' });
					newMarkers.push({ time, type: 'small', label: monthName, position: 'bottom' });
				}
				month++;
				if (month > 11) {
					month = 0;
					year++;
				}
				date = new Date(year, month, 1);
			}
		}
		// Level 3: Month / Day markers
		else if (span > 3 * DAY) {
			headerLabel = centerDate.toLocaleString('default', { month: 'long', year: 'numeric' });

			let current = new Date(startDate);
			current.setHours(0, 0, 0, 0);
			// Move to the first visible day
			if (current.getTime() < visibleStart.value) {
				current = new Date(visibleStart.value);
				current.setHours(0, 0, 0, 0);
			}
			while (current.getTime() <= visibleEnd.value) {
				const time = current.getTime();
				if (current.getDate() === 1) {
					const label = current.toLocaleString('default', { month: 'short' });
					newMarkers.push({ time, type: 'large', label, position: 'top' });
				} else if (span < 45 * DAY) {
					newMarkers.push({
						time,
						type: 'small',
						label: current.getDate().toString(),
						position: 'bottom'
					});
				}
				current.setDate(current.getDate() + 1);
			}
		}
		// Level 4: Day / Hour markers
		else {
			headerLabel = centerDate.toLocaleString('default', { dateStyle: 'full' });

			let current = new Date(startDate);
			current.setMinutes(0, 0, 0);
			// Move to the first visible hour
			if (current.getTime() < visibleStart.value) {
				current = new Date(visibleStart.value);
				current.setMinutes(0, 0, 0);
			}
			while (current.getTime() <= visibleEnd.value) {
				const time = current.getTime();
				if (current.getHours() % 6 === 0) {
					const label = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
					newMarkers.push({ time, type: 'large', label, position: 'top' });
				} else {
					newMarkers.push({ time, type: 'small', label: '', position: 'bottom' });
				}
				current.setHours(current.getHours() + 1);
			}
		}
		// @ts-expect-error
		timelineMarkers = newMarkers;
	});

	function showTooltip(e: MouseEvent, ev: event) {
		hoveredEventId = ev.id;
		hoveredEvent = ev;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}
	function hideTooltip() {
		hoveredEventId = null;
		hoveredEvent = null;
	}

	function onEventMouseDown(e: MouseEvent, ev: event) {
		e.stopPropagation(); // Prevent timeline pan
		draggingEventId = ev.id;
		dragEventStartX = e.clientX;
		dragEventStartDate = ev.date;
		window.addEventListener('mousemove', onEventMouseMove);
		window.addEventListener('mouseup', onEventMouseUp);
	}

	function onEventMouseMove(e: MouseEvent) {
		if (!draggingEventId) return;
		const dx = e.clientX - dragEventStartX;
		const timelineElem = document.querySelector('.timeline-container') as HTMLElement;
		if (!timelineElem) return;
		const rect = timelineElem.getBoundingClientRect();
		const timelineWidth = rect.width;
		const timeSpan = visibleEnd.value - visibleStart.value;
		const msPerPixel = timeSpan / timelineWidth;
		const msShift = dx * msPerPixel;
		const newDate = Math.round(dragEventStartDate + msShift);
		// Clamp to timeline min/max
		const clampedDate = Math.max(timelineMin, Math.min(timelineMax, newDate));
		// Update event visually (optimistic update)
		events.value = events.value.map((ev) =>
			ev.id === draggingEventId ? { ...ev, date: clampedDate } : ev
		);
	}

	function onEventMouseUp() {
		if (!draggingEventId) return;
		// Persist to localStorage
		localStorage.setItem('timelineEvents', JSON.stringify(events.value));
		draggingEventId = null;
		window.removeEventListener('mousemove', onEventMouseMove);
		window.removeEventListener('mouseup', onEventMouseUp);
	}
</script>

<div class="flex h-screen flex-col gap-3 bg-gray-100 font-sans">
	<div class="title">
		<h1 class="w-full text-center text-4xl font-bold text-gray-800">MyTimeline</h1>
	</div>

	<AddEvent />
	<div class="main-content flex h-full flex-row gap-2 rounded-md bg-gray-300 p-2">
		<Sidebar />
		<div class="timeline flex flex-1 flex-col gap-1 rounded-lg bg-gray-300 shadow-inner">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="timeline-container relative h-full rounded-md bg-white shadow-md"
				onmousedown={onMouseDown}
				onwheel={onWheel}
			>
				<div class="header-label">{headerLabel}</div>

				<div class="timeline-axis"></div>

				<div class="timeline-markers-container">
					{#each timelineMarkers as marker}
						<div
							class="marker-wrapper"
							style="left: {((marker.time - visibleStart.value) /
								(visibleEnd.value - visibleStart.value)) *
								100}%"
						>
							<div class="timeline-marker" class:large={marker.type === 'large'}></div>
							{#if marker.label}
								<div
									class="timeline-label"
									class:top={marker.position === 'top'}
									class:bottom={marker.position === 'bottom'}
								>
									{marker.label}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<div class="timeline-events-container">
					{#each events.value as event (event.id)}
						<div
							class="timeline-event"
							style="left: {((event.date - visibleStart.value) /
								(visibleEnd.value - visibleStart.value)) *
								100}%"
						>
							<div
								class="event-pin"
								title="{event.title} - {new Date(event.date).toLocaleDateString()}"
								onmouseenter={(e) => showTooltip(e, event)}
								onmousemove={(e) => {
									tooltipX = e.clientX;
									tooltipY = e.clientY;
								}}
								onmouseleave={hideTooltip}
								onmousedown={(e) => onEventMouseDown(e, event)}
							></div>
						</div>
					{/each}
				</div>

				<div class="zoom-indicator">
					Zoom: {displayZoom}%
				</div>
			</div>
			{#if hoveredEventId}
				{#each events.value as ev (ev.id)}
					{#if ev.id === hoveredEventId}
						<div
							style="position: fixed; left: {tooltipX + 12}px; top: {tooltipY -
								12}px; pointer-events: none; z-index: 1000;"
						>
							<EventTooltip thisEvent={ev} />
						</div>
					{/if}
				{/each}
			{/if}
			<!-- <div
				style="
					position: absolute;
					top: 10px;
					right: 10px;
					background: rgba(0,0,0,0.5);
					color: white;
					padding: 4px 8px;
					border-radius: 6px;
					font-size: 0.8rem;
					z-index: 1001;
					pointer-events: none;
				"
			>
				Markers: {timelineMarkers.length}<br />
				Labels: {timelineMarkers.filter((m) => m.label).length}
			</div> -->
		</div>
	</div>
</div>

<style>
	:root {
		font-family: 'Inter', sans-serif;
	}
	.timeline-container {
		display: flex;
		align-items: center;
		overflow: hidden;
		cursor: grab;
		user-select: none;
	}
	.timeline-container:active {
		cursor: grabbing;
	}

	.header-label {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(15, 23, 42, 0.75); /* slate-900 with transparency */
		color: white;
		padding: 4px 12px;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		z-index: 10;
		pointer-events: none;
		white-space: nowrap;
	}

	.timeline-axis {
		position: absolute;
		width: 100%;
		height: 4px;
		background-color: #cbd5e1; /* gray-300 */
		border-radius: 2px;
	}

	.timeline-markers-container,
	.timeline-events-container {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.marker-wrapper {
		position: absolute;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.timeline-marker {
		position: absolute;
		background-color: #94a3b8; /* gray-400 */
		width: 1px;
		height: 12px;
		top: 50%;
		transform: translateY(-50%);
	}
	.timeline-marker.large {
		width: 2px;
		height: 100%;
		max-height: 30px;
		background-color: #475569; /* gray-600 */
	}

	.timeline-label {
		position: absolute;
		font-size: 0.75rem;
		color: #334155; /* gray-700 */
		background: rgba(227, 230, 233, 0.85);
		backdrop-filter: blur(2px);
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
		font-weight: 500;
	}
	.timeline-label.top {
		bottom: 50%;
		transform: translateY(-15px);
	}
	.timeline-label.bottom {
		top: 50%;
		transform: translateY(20px);
	}

	.timeline-event {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: all;
		height: 24px;
		width: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.event-pin {
		width: 16px;
		height: 16px;
		background: #3b82f6; /* blue-500 */
		border-radius: 50%;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		cursor: pointer;
		transition: transform 0.2s ease;
	}
	.event-pin:hover {
		transform: scale(1.3);
	}

	.zoom-indicator {
		position: absolute;
		bottom: 10px;
		right: 10px;
		background-color: rgba(15, 23, 42, 0.6);
		color: white;
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		pointer-events: none;
	}
	.main-content {
		align-items: flex-start;
		height: 100%;
	}
	.timeline {
		height: 100%;
	}
</style>
