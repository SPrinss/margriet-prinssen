# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Theater journalist website for Margriet Prinssen. Built with Astro + Lit components, Firebase backend, and Algolia search.

## Development Commands

```bash
# Start development (Astro dev server)
npm start             # or npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and format
npm run lint          # Check ESLint + Prettier
npm run format        # Auto-fix ESLint + Prettier

# Style compilation (Stylus → CSS.js modules)
npm run build:styles  # Build all styles
npm run watch:styles  # Watch mode

# Legacy commands (old Web Components SPA)
npm run start:legacy  # Old es-dev-server + style watcher
npm run build:legacy  # Old Rollup build
```

### Firebase Cloud Functions

```bash
cd functions/
npm run serve         # Local emulator
npm run deploy        # Deploy functions
```

## Architecture

### Frontend (Astro + Lit)

- **Framework:** Astro with Lit integration for interactive components
- **Entry:** `src/pages/index.astro`
- **Layouts:** `src/layouts/PageLayout.astro` - shared page structure
- **Components:** `src/components/lit/` - Lit components for interactive features

### Page Structure

Pages are in `src/pages/`:
- `index.astro` - Home page
- `recensies/index.astro` - Reviews list
- `recensies/[id].astro` - Individual review
- `interviews/index.astro` - Interviews list
- `interviews/[id].astro` - Individual interview
- `over.astro` - About page
- `add.astro` - Add content (requires authentication)

### Lit Components

Located in `src/components/lit/`:
- `MpAddContent.ts` - Content management form with Firebase auth

### Legacy Web Components (src/mp-*)

The old SPA structure still exists for reference:
- **Base Class:** `MPElement` (`src/mp-element/`) - extends HTMLElement with lit-html rendering
- **Routing:** Client-side via `pwa-helpers/router.js` with dynamic imports

### Backend (Firebase)

- **Firestore:** Database for reviews and interviews
- **Cloud Functions (`functions/`):** Firestore triggers for Algolia indexing + email endpoint
- **Algolia:** Search indices for `reviews` and `interviews` collections

### Styling

- **Preprocessor:** Stylus (`.styl` files)
- **Build:** Gulp compiles to CSS-in-JS modules (`.css.js`)
- **Design Tokens:** CSS custom properties in `style.css`:
  - Sizes: `--mp-size--1` through `--mp-size--22` (4px-1920px)
  - Colors: `--mp-color--main-*` (blue) and `--mp-color--secondary-*` (yellow) with opacity scales

## Tech Stack

- **Framework:** Astro
- **Components:** Lit
- **Build:** Astro build (Vite-based)
- **Dev Server:** Astro dev (Vite-based)
- **Backend:** Firebase (Firestore, Functions, Hosting)
- **Search:** Algolia

## Routes

- `/` → Home page
- `/recensies` → Reviews list
- `/recensies/[id]` → Individual review
- `/interviews` → Interviews list
- `/interviews/[id]` → Individual interview
- `/over` → About page
- `/add` → Add content (authenticated)



Write temporary files to .tmp