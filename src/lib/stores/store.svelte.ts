import type { event } from "$lib/types";

const timelineMin = new Date(1900, 0, 1).getTime();
const timelineMax = new Date(3000, 0, 1).getTime();
const visibleStart = $state({ value: 0 });
const visibleEnd = $state({ value: 0 });
const eventsFromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('timelineEvents') : null;
const initialEvents: event[] = eventsFromStorage ? JSON.parse(eventsFromStorage) : [];
const events = $state<{ value: event[] }>({ value: initialEvents });

export { visibleStart, visibleEnd, events, timelineMin, timelineMax };