# FERMENT

**A cultural guide to lactic acid fermentation from around the world.**

Browse 30 recipes, read wiki articles, track batches, manage your pantry, and master the ancient art of fermentation — all in a single-page, offline-capable web app.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Vue 3 (CDN) | `vue.global.prod.js` — no build step |
| **CSS** | Tailwind CSS (CDN) | Config inline in `<script>` block in `index.html` |
| **Fonts** | Instrument Serif, DM Sans, JetBrains Mono | Google Fonts |
| **Storage** | localStorage | Persisted via `FermentStore` helper |
| **PWA** | Service Worker + manifest.json | Offline support |

## Project Structure

```
ferment/
├── index.html                  # App shell, Tailwind config, Vue mount
├── css/
│   └── app.css                 # Custom styles (vars, animations, wiki, editors)
├── js/
│   ├── app.js                  # Vue 3 app init, state, routing, history management
│   ├── store.js                # localStorage persistence + import/export
│   ├── recipes.js              # Recipe loader (JSON manifest + fallback)
│   ├── wiki.js                 # Wiki article loader (JSON manifest)
│   ├── utils/
│   │   ├── formatting.js       # FermentFormat — units, scaling, conversion
│   │   ├── search.js           # FermentSearch — full-text fuzzy search
│   │   └── matching.js         # FermentMatching — pantry-to-recipe matching
│   └── components/
│       ├── SearchBar.js        # Search input component
│       ├── FilterPanel.js      # Multi-facet filter UI
│       ├── RecipeCard.js       # Card / list row for a recipe
│       ├── RecipePage.js       # Full-page recipe view with inline editing
│       ├── BrowseView.js       # Recipe browsing grid + filters + sort
│       ├── WikiView.js         # Wiki article list, search, tag filter
│       ├── WikiArticle.js      # Rich wiki article renderer + inline editing
│       ├── PantryManager.js    # Pantry inventory CRUD
│       ├── JournalManager.js   # Batch tracking / journal entries
│       ├── BrineCalculator.js  # Salt / brine ratio calculator
│       ├── BatchScaler.js      # Scale any recipe up/down
│       ├── TimerManager.js     # Timer management
│       ├── ToolsView.js        # Tools menu grid (calculator, converter, pH, etc.)
│       ├── SettingsModal.js    # App settings (region, units, theme, editing)
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
│       ├── manifest.json       # Wiki article index
│       └── *.json              # Individual wiki article files
├── assets/
│   └── icons/                  # Favicon, PWA icons
├── manifest.json               # PWA manifest
└── sw.js                       # Service worker (cache-first)
```

## Architecture

### Routing & History

No router library. State-driven routing using reactive refs:

- **`currentRoute`**: `'home'` | `'recipe'` | `'wiki-article'` | `'welcome'` — controls the current view
- **`currentTab`**: `'browse'` | `'wiki'` | `'pantry'` | `'journal'` | `'tools'` — active tab within home view

Browser history is managed with `history.pushState()` / `popstate`. Tab changes, recipe opens, and wiki article navigation all push descriptive hash URLs (`#/recipe/slug`, `#/wiki/slug`, `#/pantry`, etc.), so the browser back/forward buttons navigate naturally.

### Components

All components are registered globally via `app.component()`. They use Vue 3 Options API with `template` string literals (no SFC/.vue files, no build step).

### Data Flow

```
index.html (template)
  └─ app.js (setup, state, actions)
       ├─ FermentStore (localStorage read/write)
       ├─ FermentRecipes (recipe loader — JSON manifest)
       ├─ FermentWiki (wiki loader — JSON manifest)
       ├─ FermentSearch (search index)
       ├─ FermentMatching (pantry matching)
       └─ FermentEdits (inline edit overlay store)
```

State mutations flow **down** via props, events flow **up** via `$emit`. The root `app.js` owns all state and persists to localStorage on every meaningful change.

### Recipe System

30 recipes stored as individual JSON files in `data/recipes/individual/`. The loader (`recipes.js`) fetches a manifest and loads each file in parallel, with a fallback to `tier1-beginner.js` for offline/legacy support.

**Recipe Page** — Two layout modes:
- **Desktop (lg+)**: Two-column — left has story/instructions/variations/notes; right has sticky sidebar with ingredients, equipment, safety notes
- **Mobile (<lg)**: Single column with horizontal tab navigation

### Wiki System

Wiki articles are stored as JSON files in `data/wiki/`. Each article supports rich content blocks: paragraphs, headings, tables, callouts (info/warning/tip), ordered/unordered lists, images, galleries, videos, and an infobox sidebar. Content supports inline citations (`[cite:c1]`), cross-links to other articles (`[[article:slug]]`), and recipe links (`[[recipe:slug]]`).

### Inline Editing

Recipes and wiki articles support inline editing when enabled in Settings. Edits are stored as localStorage overlays (via `FermentEdits`), merged at render time with the original JSON data. Each edited field shows a visual indicator and can be individually reset to the original.

**Editing is disabled by default** and must be toggled on in Settings > Enable Editing.

### Settings

Settings are managed via `SettingsModal.js` and persisted in localStorage:
- Region, Units (metric/imperial), Theme (light/dark/auto)
- Expert Mode, Enable Editing, Default View (cards/list)
- Data management: export/import JSON backups, clear all data

### Tools

Brine Calculator, Batch Scaler, Timers, Unit Converter, pH Reference, Glossary (redirects to Wiki), Seasonal Calendar.

## Design Tokens

Colors and fonts defined in Tailwind config (`index.html`) and CSS custom properties (`app.css`). Light/dark mode via `.dark` class on `<html>`.

Key color groups:
- `bg-*` — backgrounds (primary, secondary, card)
- `text-*` — typography (primary, secondary, muted)
- `accent-*` — brine (gold), ferment (red), culture (green), aged (brown)
- `tier-*` — difficulty levels

## Running Locally

Static files — serve with any HTTP server:

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

*Made with salt, patience, and good bacteria.*
