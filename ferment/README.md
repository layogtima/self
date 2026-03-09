# 🫙 FERMENT

**A cultural guide to lactic acid fermentation from around the world.**

Browse recipes, track batches, manage your pantry, and master the ancient art of fermentation — all in a single-page, offline-capable web app.

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
│   └── app.css                 # Custom styles (vars, animations, recipe page, tool cards)
├── js/
│   ├── app.js                  # Vue 3 app init, state management, routing
│   ├── store.js                # localStorage persistence + import/export
│   ├── recipes.js              # Recipe registry (merges tier files)
│   ├── utils/
│   │   ├── formatting.js       # FermentFormat — units, scaling, conversion
│   │   ├── search.js           # FermentSearch — full-text search index
│   │   └── matching.js         # FermentMatching — pantry-to-recipe matching
│   └── components/
│       ├── SearchBar.js        # Search input component
│       ├── FilterPanel.js      # Multi-facet filter UI
│       ├── RecipeCard.js       # Card / list / table row for a recipe
│       ├── RecipePage.js       # Full-page recipe view (2-col desktop, tabbed mobile)
│       ├── BrowseView.js       # Recipe browsing grid + filters + sort
│       ├── PantryManager.js    # Pantry inventory CRUD
│       ├── JournalManager.js   # Batch tracking / journal entries
│       ├── BrineCalculator.js  # Salt / brine ratio calculator
│       ├── BatchScaler.js      # Scale any recipe up/down
│       ├── TimerManager.js     # Timer management
│       └── ToolsView.js        # Tools menu grid + settings + onboarding
├── data/
│   └── recipes/
│       └── tier1-beginner.js   # Beginner-tier recipe data
├── assets/
│   └── icons/                  # Favicon, PWA icons
├── manifest.json               # PWA manifest
└── sw.js                       # Service worker (cache-first)
```

## Architecture

### Routing

No router library. State-driven routing using two reactive refs:

- **`currentRoute`**: `'home'` | `'recipe'` — controls whether to show tab content or a full recipe page
- **`currentTab`**: `'browse'` | `'pantry'` | `'journal'` | `'tools'` — active tab within home view

### Components

All components are registered globally via `app.component()`. They use Vue 3 Options API with `template` string literals (no SFC/.vue files).

### Data Flow

```
index.html (template)
  └─ app.js (setup, state, actions)
       ├─ FermentStore (localStorage read/write)
       ├─ FermentRecipes (recipe registry)
       ├─ FermentSearch (search index)
       └─ FermentMatching (pantry matching)
```

State mutations flow **down** via props, events flow **up** via `$emit`. The root `app.js` owns all state and persists to localStorage on every meaningful change.

### Recipe Page (`RecipePage.js`)

Two layout modes:
- **Desktop (lg+)**: Two-column — left column has story, instructions, variations, notes; right column has a sticky sidebar with ingredients, equipment, safety notes, and "Start Batch" CTA
- **Mobile (<lg)**: Single column with horizontal tab navigation (Story | Recipe | Notes | Dehydrate)

### Tools (`ToolsView.js`)

Tools tab shows a **card grid menu** by default. Each card navigates to the selected tool's full-page view with a back button. The file also contains `SettingsModal` and `OnboardingModal` components.

Available tools: Brine Calculator, Batch Scaler, Timers, Unit Converter, pH Reference, Cultural Glossary, Seasonal Calendar.

## Design Tokens

Colors and fonts are defined in the Tailwind config inside `index.html` and mirrored as CSS custom properties in `css/app.css`. Supports light/dark mode via Tailwind's `dark:` prefix and a `.dark` class on `<html>`.

Key color groups:
- `bg-*` — backgrounds (primary, secondary, card)
- `text-*` — typography (primary, secondary, muted)
- `accent-*` — brine (gold), ferment (red), culture (green), aged (brown)
- `tier-*` — difficulty levels (beginner through master)

## Running Locally

Static files — serve with any HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Open `http://localhost:8000` in your browser.

## Adding Recipes

1. Create a new tier file in `data/recipes/` (e.g., `tier2-seasoned.js`)
2. Follow the schema from `tier1-beginner.js`
3. Register the file via a `<script>` tag in `index.html`
4. Recipes auto-merge into the global registry via `FermentRecipes`

---

*Made with salt, patience, and good bacteria.* 🧂
