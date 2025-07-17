import type { event } from "$lib/types";

const timelineMin = new Date(1900, 0, 1).getTime();
const timelineMax = new Date(3000, 0, 1).getTime();
const visibleStart = $state({ value: 0 });
const visibleEnd = $state({ value: 0 });
const events = $state<{ value: event[] }>({
    value: [
        { id: '1', title: 'Apollo 11 Moon Landing', description: 'First humans on the Moon.', date: new Date('1969-07-20T20:17:40Z').getTime() },
        { id: '2', title: 'World Wide Web goes public', description: 'The web is made available to the public.', date: new Date('1993-04-30').getTime() },
        { id: '3', title: 'First iPhone Released', description: 'Apple releases the first iPhone.', date: new Date('2007-06-29').getTime() },
        { id: '4', title: 'Today', description: 'The present day', date: new Date().getTime() }
    ]
});

export { visibleStart, visibleEnd, events, timelineMin, timelineMax };