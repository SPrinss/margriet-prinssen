# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Theater journalist website for Margriet Prinssen. Built with Astro + Lit components, Firebase backend, and Algolia search.

**Deployed 2026-07-23**: the live site (https://margrietprinssen.nl) is the static Astro build. Push to `master` → GitHub Actions builds (reads Firestore at build time) and deploys to Firebase Hosting. Firestore/Storage rules and Cloud Functions are deployed via `firebase deploy` with `GOOGLE_APPLICATION_CREDENTIALS` (see root CLAUDE.md for the key location).

### Publishing model

The site is static: article pages are generated at build time from Firestore. Content changes reach the live site via:
1. **On-change (needs `GH_DISPATCH_TOKEN`)**: every write to `reviews`/`interviews`/`settings` marks `meta/rebuild` pending (v2 triggers in europe-west1 — the eur3 Firestore DB doesn't allow new gen1 triggers); the scheduled `dispatchSiteRebuild` (every 10 min, us-central1) dispatches ONE GitHub Actions deploy after 5+ quiet minutes. **Not active until** a fine-grained GitHub PAT (Actions: read/write on SPrinss/margriet-prinssen) is set as `GH_DISPATCH_TOKEN` in `functions/.env` and functions are redeployed.
2. **Daily cron fallback (active)**: the deploy workflow also runs daily at 04:00 UTC.
3. **Manual**: `gh workflow run deploy.yml -R SPrinss/margriet-prinssen`, or push to master.

**Loop-safety invariant: no Cloud Function may ever write to a collection that has a Firestore trigger.** The only function-written doc is `meta/rebuild`, and nothing listens on `meta/*`. Keep it that way.

### Admin pages (authenticated, excluded from sitemap + robots)

- `/add` — single-article entry form
- `/import` — bulk .docx import wizard (mammoth + `src/lib/import-parser.mjs` heuristics; validate parser changes with `node tools/test-import-parser.mjs` against the real corpus in `../margriet-prinssen-files/read_from_files/new_fioles/`)
- `/curate` — homepage selection (writes `settings/homepage`; `useLatest: true` = default most-recent behavior), image upload to Storage, missing-image warnings

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

## Local Test Environment (emulators)

Never develop against production. Use the Firebase emulators, seeded with a copy of production data:

```bash
npm run emulators        # Start emulators with saved data snapshot (.emulator-data/), auto-saves on exit
npm run emulators:fresh  # Start empty (re-seed with tools/seed-emulator.js from the workspace root)
```

- Emulator UI: http://localhost:4000 — Firestore :8080, Auth :9099, Functions :5001
- Requires JDK 21 (`/opt/homebrew/opt/openjdk@21`, baked into the npm scripts)
- Production data dump/seed scripts live in `tools/` (in this repo): `dump-firestore.js` (read-only export of all collections incl. subcollections), `seed-emulator.js` (refuses to run without `FIRESTORE_EMULATOR_HOST`) and `test-import-parser.mjs` (validates parser changes against the real corpus in `../../margriet-prinssen-files/`). Data dumps land in `tools/firestore-export/` — gitignored: production content incl. personal data, regenerable
- **Algolia safety**: emulated functions write to `reviews_test`/`interviews_test` indices, never production. Two layers: `functions/.env.local` (gitignored) sets the index names, and `functions/index.js` defaults to `*_test` whenever `FUNCTIONS_EMULATOR=true`
- Functions were modernized (Node 22, firebase-functions v6, env-based config instead of the removed `functions.config()`). Production deploy needs `ALGOLIA_APP_ID`/`ALGOLIA_ADMIN_KEY` provided via functions env (e.g. `functions/.env` or secrets) — not yet configured for deploys

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