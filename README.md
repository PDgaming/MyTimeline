# MyTimeline

An interactive timeline web application built with SvelteKit, TypeScript, and Tailwind CSS.  
Easily add, view, and manage events on a zoomable, pannable timeline.

## Features

- **Interactive Timeline:** Pan and zoom across decades, years, months, and days.
- **Event Management:** Add events with a title, date, and description.
- **Sidebar:** View and delete all events in a convenient sidebar.
- **Persistent Storage:** Events are saved in your browser's localStorage.
- **Modern UI:** Styled with Tailwind CSS and DaisyUI for a clean, responsive look.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (or use npm/yarn with adjustments)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

- `src/routes/+page.svelte` — Main timeline page and logic
- `src/lib/components/` — UI components:
  - `addEvent.svelte` — Form to add new events
  - `sidebar.svelte` — Sidebar listing all events
  - `event.svelte` — Tooltip/details for events
- `src/lib/stores/store.svelte.ts` — Svelte stores for timeline and events
- `src/lib/types.ts` — Type definitions
- `src/app.css` — Tailwind and DaisyUI setup

## Data Model

Events are objects with the following structure:

```ts
type event = {
	id: string;
	title: string;
	description: string;
	date: number; // Unix timestamp (ms)
};
```

## Customization

- **Styling:** Modify `src/app.css` to adjust Tailwind/DaisyUI themes.
- **Timeline Range:** Change `timelineMin` and `timelineMax` in `src/lib/stores/store.svelte.ts`.
- **Persistence:** Events are stored in localStorage by default.

## Dependencies

- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Vite](https://vitejs.dev/)
