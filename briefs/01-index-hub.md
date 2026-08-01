# 01 — The hub (`index.html`)

Branch: `gauntlet/hub` · **Run this LAST.** It consumes the manifest entries every
other branch writes.

---

## The problem in one line

86 KB of hand-written HTML that surfaces 12% of the repo, 48% of which is 18 copies
of the same card, containing a committed `<!-- /canvas ADD HERE -->` TODO.

---

## Current state, measured

- **1,844 lines.** `#explorations` alone is lines 638–1531 — **894 lines, 48% of the
  file, for 18 cards.** ~50 lines of near-identical markup each.
- **Zero data layer.** `grep 'const |let |function '` returns 5 lines, all in the
  theme toggle and a dead `scrollToSection()`. No array, no JSON, no `data-*`, no
  `<template>`.
- **4 `<style>` blocks**, 3 of them nested inside `<body>` (L620, L1340, L1497).
  `@keyframes glitch` is defined **twice, byte-identical**, the second copy preceded
  by the comment `<!-- Add this CSS to your stylesheet -->`.
- Every grid in the file is `grid-cols-1 md:grid-cols-2`. **No 3-column breakpoint
  anywhere.** 18 cards = 9 tall rows on desktop.
- Dead CSS: `.noisy-bg`, `.asymmetric-border`, `.world-card` defined, never used.
  6 of 9 configured Tailwind animations unused. All 5 custom
  `transitionDuration`/`transitionDelay` values unused.
- Undefined classes referenced: `checkerboard`, `video-frame`, `clip-jagged` (the last
  from an invalid `clipPath` theme key that Tailwind silently ignores).
- `text-md` at L400 is not a Tailwind class. The hero paragraph has no size on mobile.

---

## Card taxonomy — why the rewrite is easy

Only three variations exist across 18 cards:

| Media type | Count | Notes |
|---|---|---|
| Image thumbnail | 7 | 6 hotlinked from external layogtima subdomains |
| Inline bespoke SVG | 10 | gearshare / materials / not / observer are 100–200 lines each |
| FontAwesome icon | 1 | `fa-drum` — the **only** reason the FA kit script loads |

Every card reduces to:

```ts
type Project = {
  slug: string
  title: string
  blurb: string           // one sentence, present tense, no marketing
  href: string            // RELATIVE for in-repo
  cta: 'EXPLORE' | 'PLAY' | 'READ'
  media: { kind: 'img' | 'svg' | 'none', src?: string, alt: string, svg?: string }
  tags: string[]          // 'game' | 'instrument' | 'data' | 'essay' | 'toy' | 'tool'
  tech: string[]
  status: 'live' | 'sandbox' | 'archived'
  external: boolean
  featured?: boolean
  added: string           // ISO date
}
```

The 10 bespoke-SVG cards can keep their SVG as a raw string in the manifest. That is
not elegant and it does not block anything.

---

## Build this

### `/data/projects.json`
The single source of truth. Every project in the repo gets an entry — all 74, not 18.
Generate the first pass from `*/index.html` `<title>` + `<h1>`, then hand-write the
blurbs. A blurb that reads like a category ("a visualization") fails G4.

### `/scripts/build-manifest.mjs`
Walks the repo, finds every `index.html`, extracts title/description/og:image,
cross-checks against `projects.json`, and **fails the build if a directory exists
with no manifest entry or an entry points at a missing directory.** This is the
mechanism that stops the repo going invisible again.

### The page itself
Vite + TS, one `Card` component, three grid layouts driven by `tags`. Target: **86 KB
→ under 20 KB** of layout.

---

## What changes for the visitor

1. **Density.** `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` and shorter cards. The
   orb bar: more on screen than expected, still legible. 74 projects should feel like
   an archive you can sweep, not a scroll you endure.
2. **Filter, no page load.** Tag chips + a text input, filtering client-side against
   the manifest, URL-synced via hash (`#tag=instrument`, `#q=quantum`) so a filtered
   view is linkable. Keyboard: `/` focuses search, `Esc` clears, arrows move selection,
   `Enter` opens. No routing library.
3. **Every project reachable.** Including all 55 sandbox items — under a collapsed
   "sandbox" section if you must, but reachable and searchable.
4. **A work page.** The README's own TODO says *"Create an indepdent page for work"*
   [sic]. `process/` already exists and is finished — link it, or promote it to `/work`.

---

## Fix list — mechanical, all verified

| # | Fix | Location |
|---|---|---|
| 1 | Move theme init into a **blocking `<head>` script**. Today it's in `DOMContentLoaded`, so dark-mode users get a white flash, and `transition-colors` on `<body>` turns the flash into a visible fade. | L146 |
| 2 | Remove `maximum-scale=1.0, user-scalable=no` from viewport meta. WCAG 1.4.4 failure. | L6 |
| 3 | Fix `alt` copy-paste bugs: eco-brutalism image labelled `alt="ÆTHERWAVES"`; arcade thumbnail labelled `alt="SEEDVALLEY Screenshot"`. Both strings appear twice. | L899, L1099 |
| 4 | `aria-hidden="true"` on all 60+ decorative SVGs. Currently 4 `aria-*` attributes total, zero `role=`. | throughout |
| 5 | Internal links → **relative**. 6 of 7 are hardcoded `https://layogtima.com/…`, breaking local preview. Trailing slashes inconsistent (`/materials/`, `/observer/` vs `/not`, `/drums`). | cards |
| 6 | Every external link gets `target="_blank" rel="noopener noreferrer"`. Today 17 have neither; both footer links have `target` without `rel`. | throughout |
| 7 | `http://arcade.sm0l.dev/` → `https://`. Only insecure link in the file. | card |
| 8 | Logo `href="#"` → `href="/"`. | L344 |
| 9 | Delete `scrollToSection()` — defined, `grep -c onclick` = 0. | L173 |
| 10 | Delete the duplicated `@keyframes glitch` block and the two other in-body `<style>` tags. | L620, L1340, L1497 |
| 11 | Remove the 6 unused animations, 5 unused transition values, 3 unused classes, 3 undefined classes. | config + style |
| 12 | Add `@media (prefers-reduced-motion)`. ~15 perpetual animations, zero guards. | style |
| 13 | `loading="lazy"` + explicit `width`/`height` on all 10 `<img>`. Currently zero of each → guaranteed CLS. | throughout |
| 14 | Hero video: `preload="none"` + poster + click-to-play. Currently autoplays a **3.7 MB** webm with no pause control and no reduced-motion guard. | L416+ |
| 15 | Delete the 9 unreferenced videos (~14 MB): `abandoned-houses`, `building-store`, `deutron`, `moon-rail`, `mushrooms-walking`, `space-amusement-park`, `space-moonbase`, `space-station`, `yarn-mouse-pie-cutting`. | `videos/` |
| 16 | Convert card images to AVIF/WebP with srcset. Worst: `ferment/assets/images/shelf-of-fermented-foods.jpeg` at **896 KB**. | assets |
| 17 | Self-host the 6 hotlinked card thumbnails. Any subdomain going down currently leaves broken images with wrong alt text on the homepage. | cards |
| 18 | Drop the FontAwesome kit script entirely — it loads for one `fa-drum` glyph. Inline SVG. | L52 |
| 19 | Self-host Ubuntu Sans Mono as woff2. Currently `@import` inside `<style>`, which serialises behind the stylesheet and defeats the two `preconnect` hints above it. | L179 |
| 20 | Unify the title across `<title>` / `meta name=title` / `og:title` / `twitter:title` — currently **three different names** (`AMIT \| Internet Madman`, `LAYOGTIMA - Internet Madman`, `AMIT - Internet Madman`, `LAYOGTIMA \| Internet Madman`). | head |
| 21 | `og:url` and `twitter:url` disagree on the trailing slash. Add `og:site_name`, `og:locale`, `og:image:width/height/alt`, canonical, `robots`, JSON-LD. | head |
| 22 | **Regenerate `og:image`.** The current one still shows *"I also spin a mean Dapostar!"* — a line no longer in the hero — and predates the WONDERVOID section entirely. | `images/screenshot.png` |
| 23 | Replace the hardcoded `?M24613` cache-buster (in 3 favicon links + 2 OG URLs, inconsistently applied) with a build-time hash. | head |
| 24 | Footer year `Copyleft 2025` → computed. | footer |
| 25 | Typo: *"Being biploar for me is a feature"*. | Bipolar card |
| 26 | Monochrome violations: `bg-yellow-400` / `group-hover:bg-yellow-500` (Moonfall), `text-pink-500` (NOT HERE), `rgba(0,255,0,0.1)` green glow in `.text-backdrop`. | L674, L1452, style |
| 27 | Nav has 3 links + toggle always inline, **no mobile menu**. Add one or commit to the constraint deliberately. | L342 |
| 28 | The "Abstract Thought" marquee (L620–637) is a bare `<div>` with no heading, breaking the h2 outline between `#featured` and `#explorations`. | L620 |
| 29 | Add a `<noscript>`. | head |
| 30 | Redirect stub at `/orbiter` → `wondervoid.space`, then delete `orbiter/`. | new |

---

## Gauntlet notes

- **G1 TRUTH** applies: every card blurb must describe what the project actually does.
  CRITIC opens 10 random projects and checks the blurb against reality. "A study of the
  fundamental building blocks of our world" for a 15-item list fails.
- **G3** blocks on: any manifest entry pointing at a missing dir, any dir with no entry,
  any absolute internal link, any image without dimensions.
- **G4 DENSITY** is the axis this project lives or dies on. Two columns fails.
- Perf target: **first load ≤ 60 KB gzipped**, LCP ≤ 1.5 s on 4G, zero CLS.
