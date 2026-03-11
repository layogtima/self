# FERMENT

**A cultural guide to lactic acid fermentation from around the world.**

Browse 30 recipes, read 23 wiki articles, track batches, manage your pantry and equipment, and master the ancient art of fermentation - all in a single-page, offline-capable web app.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Vue 3 (CDN) | `vue.global.prod.js` - no build step |
| **CSS** | Tailwind CSS (CDN) | Config inline in `<script>` block in `index.html` |
| **Fonts** | Instrument Serif, DM Sans, JetBrains Mono | Google Fonts |
| **Storage** | localStorage | Persisted via `FermentStore` helper |
| **PWA** | Service Worker + manifest.json | Offline support |

## Project Structure

```
ferment/
├── index.html                  # App shell, Tailwind config, Vue mount, OG meta tags
├── css/
│   └── app.css                 # Custom styles (vars, animations, wiki, editors)
├── js/
│   ├── app.js                  # Vue 3 app init, state, routing, history, OG meta
│   ├── store.js                # localStorage persistence + import/export
│   ├── recipes.js              # Recipe loader (JSON manifest + fallback)
│   ├── wiki.js                 # Wiki article loader (JSON manifest)
│   ├── utils/
│   │   ├── formatting.js       # FermentFormat - units, scaling, conversion
│   │   ├── search.js           # FermentSearch - full-text fuzzy search
│   │   └── matching.js         # FermentMatching - pantry-to-recipe matching
│   └── components/
│       ├── SearchBar.js        # Search input component
│       ├── FilterPanel.js      # Multi-facet filter UI
│       ├── RecipeCard.js       # Card / list / table row for a recipe
│       ├── RecipePage.js       # Full-page recipe view with inline editing
│       ├── BrowseView.js       # Recipe browsing grid + filters + sort
│       ├── WikiView.js         # Wiki article list, search, collapsible tag filter
│       ├── WikiArticle.js      # Rich wiki article renderer + inline editing
│       ├── PantryManager.js    # Pantry + equipment inventory CRUD
│       ├── JournalManager.js   # Batch tracking / journal entries
│       ├── BrineCalculator.js  # Salt / brine ratio calculator
│       ├── BatchScaler.js      # Scale any recipe up/down
│       ├── TimerManager.js     # Timer management
│       ├── ToolsView.js        # Tools menu (calculator, converter, pH, calendar)
│       ├── SettingsModal.js    # App settings (links to standalone changelog page)
│       ├── ChangelogView.js   # Standalone changelog with Antigravity-style release cards
│       ├── OnboardingModal.js  # First-run onboarding wizard
│       ├── WelcomePage.js      # Welcome / intro page
│       ├── InlineEditor.js     # Edit framework + FermentEdits store
│       └── editors/            # Field-specific inline editors
│           ├── TextEditor.js
│           ├── ListEditor.js
│           ├── MediaPicker.js
│           ├── TagEditor.js
│           └── CitationEditor.js
├── data/
│   ├── recipes/
│   │   ├── manifest.json       # Recipe file index
│   │   ├── tier1-beginner.js   # Fallback recipe data
│   │   └── individual/         # 30 individual recipe JSON files
│   └── wiki/
│       ├── manifest.json       # Wiki article index (23 articles)
│       └── *.json              # Individual wiki article files
├── assets/
│   └── icons/                  # Favicon, PWA icons
├── manifest.json               # PWA manifest
└── sw.js                       # Service worker (cache-first)
```

## Deployment

### Cache Busting

All local JS files include a `?v=YYYYMMDD` query string (e.g. `?v=20260310`). On each deployment, bump this version string across all `<script src="...?v=...">` tags in `index.html` and update the `CACHE_NAME` in `sw.js` to force browsers and the service worker to reload fresh assets.

## Features

### Recipes
- **30 recipes** from cultures worldwide with rich metadata
- Card, list, and table view modes with hero images
- Shelf life display on cards and recipe detail pages
- Difficulty tiers, fermentation time, ingredient counts
- Step-by-step instructions with 3 tips per step
- Cultural context, variations, and dehydrator integration

### Wiki
- **23 articles** covering fermentation science, safety, equipment, and techniques
- Rich content: tables, callouts, images, citations, cross-links
- Collapsible tag filter for easy browsing
- Quick glossary search across all articles

### Pantry & Equipment
- Full inventory management with categories (produce, spices, salt, cultures, equipment)
- Equipment items with product links, images, and descriptions
- Quick-add equipment suggestions (jars, airlocks, weights, scales)
- Recipe matching: see what you can make with what you have

### Sharing & Meta
- URL-based sharing via hash routing (`#/recipe/slug`, `#/wiki/slug`)
- Dynamic Open Graph and Twitter Card meta tags
- SVG-based OG images for wiki articles
- Recipe hero images as OG images

### Tools
- Brine Calculator, Batch Scaler, Timers, Unit Converter, pH Reference, Seasonal Calendar

## Architecture

### Routing & History

No router library. State-driven routing using reactive refs:

- **`currentRoute`**: `'home'` | `'recipe'` | `'wiki-article'` | `'welcome'` | `'changelog'`
- **`currentTab`**: `'browse'` | `'wiki'` | `'pantry'` | `'journal'` | `'tools'`

Browser history managed with `history.pushState()` / `popstate`. Hash URLs (`#/recipe/slug`, `#/wiki/slug`, `#/changelog`) are restored on page load for sharing. Back button uses `history.back()` for clean navigation.

### Data Flow

```
index.html (template + OG meta tags)
  └─ app.js (setup, state, actions, meta updates)
       ├─ FermentStore (localStorage read/write)
       ├─ FermentRecipes (recipe loader - JSON manifest)
       ├─ FermentWiki (wiki loader - JSON manifest)
       ├─ FermentSearch (search index)
       ├─ FermentMatching (pantry matching)
       └─ FermentEdits (inline edit overlay store)
```

State mutations flow **down** via props, events flow **up** via `$emit`. The root `app.js` owns all state and persists to localStorage on every meaningful change.

### Error Handling

FERMENT uses a **three-layer error boundary** pattern to guarantee the app never white-screens:

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| **Component** | `errorCaptured(err, _vm, info)` hook | Catches errors in child components, sets a local error state, renders a dismissible error banner |
| **Global** | `app.config.errorHandler` | Catch-all for anything that escapes component boundaries |
| **Async** | `try/catch/finally` in `onMounted` | Ensures `ready.value = true` always fires, even if data loading fails |

**Rules for new components:**

1. Every component that renders dynamic data or has children **must** include an `errorCaptured` hook
2. Add a corresponding `componentError: null` data property
3. Show an error banner with a dismiss button when the error is set: `<div v-if="componentError">...</div>`
4. Wrap the main content in `<template v-if="!componentError">` so a crashed section degrades gracefully
5. Return `false` from `errorCaptured` to stop propagation

**Reference implementation:** See `BrowseView.js` for the canonical pattern.

**Utility functions** (`FermentFormat`, etc.) must guard against invalid inputs - especially `new Date()` which silently returns Invalid Date rather than throwing. Always check `isNaN(d.getTime())` before calling date methods.

### Inline Editing

Recipes and wiki articles support inline editing when enabled in Settings. Edits are stored as localStorage overlays (via `FermentEdits`), merged at render time with the original JSON data. **Disabled by default** - toggle in Settings > Enable Editing.

## Running Locally

Static files - serve with any HTTP server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## Adding Content

### Recipes

1. Create a JSON file in `data/recipes/individual/` following the schema of existing recipes
2. Add the entry to `data/recipes/manifest.json`
3. Update `sw.js` cache list

### Wiki Articles

1. Create a JSON file in `data/wiki/` with sections, citations, and cross-links
2. Add the entry to `data/wiki/manifest.json`
3. Update `sw.js` cache list

---

## Contributing

The README and `ChangelogView.js` are the **source of truth** for this project's roadmap and history. Every meaningful contribution - whether from a human or an AI agent - must keep both up to date.

### For Humans

1. **Fork** the repository and create a branch: `git checkout -b feat/your-feature`
2. Make your changes following the existing patterns (Vue 3 CDN component style, Tailwind classes, no build step)
3. **Update the changelog** - add a new entry or items to the latest entry in `js/components/ChangelogView.js`:
   - `feature` - new capability
   - `enhancement` - improvement to existing feature
   - `fix` - bug fix
4. **Update this README** if you changed the architecture, routing, or project structure
5. Open a pull request with a clear title and description

**PR checklist:**
- [ ] Describe what changed and why (not just what the code does)
- [ ] Add changelog entry to `ChangelogView.js`
- [ ] Update README.md if architecture or routing changed
- [ ] New components include `errorCaptured` hook + error banner (see Error Handling section)
- [ ] Utility functions guard against invalid inputs (null, NaN, Invalid Date)
- [ ] Screenshots or screen recording for visual changes
- [ ] No build step required - test by serving with `python3 -m http.server 8000`

### For AI Agents (Claude, etc.)

When implementing changes in this codebase, follow these requirements before every push:

1. **Update `ChangelogView.js`**: Add items under the latest `version` entry (or create a new entry). Use the correct type: `feature`, `enhancement`, or `fix`. Add a `link` to the relevant app route if applicable.

2. **Update `README.md`**:
   - If `currentRoute` values changed → update the Architecture > Routing section
   - If new components were added → update the Project Structure section
   - If new features were added → update the Features section

3. **Commit message format**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`) with a short imperative summary, followed by a bulleted list of what changed and why.

4. **One commit per logical task** - the user can review, roll back, or cherry-pick individual changes cleanly.

5. **Do not break the no-build-step contract** - all JS must be valid in-browser ES6, loaded via `<script>` tags. No imports, no bundler syntax.

6. **Crash-proof all new components** - add an `errorCaptured` hook, error data property, and error banner to every component that renders dynamic data or has child components. Follow the pattern in `BrowseView.js`. Guard utility functions against null/NaN/Invalid Date inputs.

### Goal

This project uses **documentation-driven development**: the README describes what FERMENT is, the changelog documents what changed and when. Contributors - human or machine - maintain this contract so the project stays readable and navigable over time. 🌟

---

*Made with salt, patience, and good bacteria.*
