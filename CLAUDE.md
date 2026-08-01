# CLAUDE.md — layogtima/self

Working agreement for every agent touching this repo. Read this **before** the brief
for whatever project you were assigned. Everything here is a hard rule unless
labelled *guideline*.

---

## 0. What this repo is

`layogtima.com` — Amit's personal site and prototype graveyard-slash-showcase.
**86 HTML files, 74 project directories, 120 MB, one squashed commit** (`f23339b "Opening."`).
No build step anywhere. No package.json at the root. No CI. Every page is
hand-authored HTML with CDN script tags.

That is the current state, not the target state. See §3.

**Voice:** the README is the tone document. *"My brain's a delightful buffet of
design, engineering, science, and absurdity."* Punchy, profane-adjacent, specific,
funny. If a page reads like it was written by a competent stranger, it's wrong.

---

## 1. Untouchable list — DO NOT MODIFY

These are frozen for this run. Do not refactor them, do not "fix" them, do not
touch their files even to change a CDN URL. You may **read** them for reference and
you may **link** to them from the hub.

| Path / target | Name |
|---|---|
| `ferment/` | Fermenti |
| `bipolar/` | Bipolar |
| `moonfall/` | Moonfall |
| `cheese/` | Cheese Girl |
| `choice.layogtima.com` (external) | if (choice) |
| `isronaut.com` (external) | ISRONAUT |
| `ascencus.absurd.industries` (external) | ASCENSUS-1 |
| `mono.layogtima.com` (external) | MONO |
| `seeds.layogtima.com` (external) | SEEDVALLEY |
| `sandbox/zen/` | Zen Mote Garden |
| `layogtima.github.io/gearshare` (external) | GEARSHARE |
| `not/` | NOT HERE |

**In scope for rebuild:** `materials/`, `sandbox/aether/`, `drums/`,
`eco-brutalism/`, `observer/`, `index.html`, and the sandbox triage sweep
(see `briefs/07-sandbox-triage.md`).

---

## 2. Branch & PR protocol

One branch per project. Never commit to `main`.

```
gauntlet/materials
gauntlet/aether
gauntlet/drums
gauntlet/terra          # the eco-brutalism pivot
gauntlet/observer
gauntlet/hub            # index.html + manifest
gauntlet/sandbox-sweep
gauntlet/shared-core    # merge FIRST — the others depend on it
```

Merge order: `shared-core` → everything else → `hub` last (it consumes the manifest
every other branch writes into).

Commit format: `<project>: <imperative>`. One logical change per commit. Every
commit must leave the branch in a state where `npm run build` passes.

PR body must contain the filled-in **Gauntlet scorecard** (`GAUNTLET.md` §6).
A PR without a scorecard is not reviewable.

You may delete whole directories inside your project's scope. You may not delete
anything outside it.

---

## 3. The stack standard

The reference implementation for "how a project in this repo should be built" is
**`layogtima/orb`** (public). Match it:

```
TypeScript + Vite. No framework runtime unless the project genuinely needs one.
npm run dev    → vite
npm run build  → tsc --noEmit && vite build
npm run test   → node test/smoke.ts   (headless, exits non-zero on failure)
```

Project layout — one directory per concern, one job per file:

```
<project>/
  index.html          entry, minimal — no inline app code
  package.json        pinned deps, no ^ ranges on anything load-bearing
  tsconfig.json
  vite.config.ts      base: '/<project>/'
  src/
    main.ts           wiring only
    <domain>/         the actual model (sim/, data/, audio/…)
    render/
    ui/
    style.css
  public/             self-hosted assets ONLY
  data/               source data + sources.json
  test/
    smoke.ts          boots headless, asserts no console errors, asserts key DOM
  README.md           what it is, how to run, where the data came from
```

### Hard rules — these fail the gauntlet automatically

1. **No CDN script tags in production output.** No `cdn.tailwindcss.com`, no
   `unpkg.com`, no `cdnjs`, no `cdn.jsdelivr.net`. Install, pin, bundle. The Tailwind
   Play CDN is currently on **7 in-scope pages** and ships a JIT compiler to every
   visitor.
2. **No hotlinked assets.** Current offenders, all of which must die:
   - `drums/` and `islands/` pull WAV samples from
     `raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/…`
   - `eco-brutalism/` hotlinks **Druk Wide Bold** (a commercial Commercial Type face)
     from `cdn.jsdelivr.net/gh/corearts/fonts/` — licensing exposure, delete on sight
   - `chips/` imports `https://threejs.org/build/three.module.js` **unversioned**
   - `sandbox/map-of-plants/` pulls images from britannica, guim.co.uk, squarespace
   - `sandbox/blrhikes/` pulls photos from the blrhikes.com CDN
   - 6 homepage card thumbnails are hotlinked from other layogtima subdomains
3. **No `http://`.** `materials/index.html` loads Vue over plain `http://` from
   cdnjs — mixed active content, blocked by every browser, **which is why the live
   materials page renders raw `{{ mustaches }}` today**. Grep for `http://` before
   every commit.
4. **No `/api/placeholder/…` paths.** These are leftover Claude-artifact stubs and
   they 404 everywhere. Present in `sandbox/megastructure`, `sandbox/terrarium`,
   `sandbox/palettes/technof.html`.
5. **No `setInterval` for anything audio-timed.** See §5.
6. **Every number on a page has a source.** See §4.
7. **`.DS_Store` is not a source file.** Add it to `.gitignore` (currently only
   `.vscode`, `*/.vscode`, `.env`) and `git rm --cached` the tracked ones in
   `eco-brutalism/`, `cheese/`, `moonfall/`, `orbiter/`, `sandbox/`, and repo root.

### Fonts
Self-host as `.woff2` in `public/fonts/` with `font-display: swap` and a `<link
rel="preload">`. No `@import` inside `<style>` — that's what `index.html:179` does
today and it serialises the font behind the stylesheet, defeating the two
`preconnect` hints three lines above it.

---

## 4. Truth rules

Non-negotiable for `materials/` and `terra/`, and applies everywhere a number appears.

- Every quantitative claim lives in `data/sources.json` keyed by a stable id, with
  `{ value, unit, year, source_name, source_url, accessed, note }`.
- **No un-sourced number renders.** If a value has no source entry, the UI shows
  `—`, not a guess.
- Quantities are stored as **numbers with an explicit unit field**, never as
  formatted strings. `material-data.json` currently stores `"30 billion tons"` and
  `"150,000 tons"` as strings — `parseFloat("150,000 tons")` returns `150`, which is
  why carbon fibre's production is displayed one-millionth of actual.
- Distinguish four quantities that are not the same thing and are currently
  conflated: **crustal abundance** (what exists), **anthropogenic stock** (what we
  made and is still standing), **annual flow** (what's added), **reserves** (what's
  economically extractable). Separate fields, separate sources.
- Cite the primary source, not an aggregator, when the primary is machine-readable.
- Freedom of panorama differs by country — check before using a Commons photo of a
  modern building in France, Italy, or Greece.

---

## 5. Audio rules

Applies to `aether`, `drums`, and the shared audio core.

- **Never schedule audio from `setInterval`, `setTimeout`, or a rAF/webcam callback.**
  Use the lookahead pattern: a 25 ms timer that inspects `AudioContext.currentTime`
  and schedules every event at an absolute future time ≥100 ms out. Repo-wide today,
  `Tone.Transport.scheduleRepeat`, `lookAhead`, `scheduleAheadTime` and `nextNoteTime`
  appear **zero times**; every timed thing is `setInterval`.
- Changing tempo must **preserve playhead phase**. `drums/index.html:361-370` does
  `clearInterval` + fresh `setInterval`, which resets the beat.
- One `AudioContext` per page, created on a user gesture. Currently 13 files each
  do their own `new (window.AudioContext || window.webkitAudioContext)()`.
- Per-voice `GainNode`s. `HTMLAudioElement` + `cloneNode()` (what `drums` does) gives
  you no gain, no filter, no choke, no envelope, and leaks orphaned elements.
- One note-frequency function for the whole repo: `440 * 2**((semitone - 9)/12 + (octave - 4))`.
  The hardcoded 29-entry C2→C6 table is currently **triplicated verbatim** across
  `aether/script.js:73-103`, `aether/hand.js:50-80`, and `sandbox/sound/script.js`.
- `navigator.requestMIDIAccess` appears **zero times** in this repo. That's the
  single highest-leverage missing feature in `drums`.

---

## 6. Design system

The repo has a real aesthetic. Don't invent a new one per project.

**MONO** — the house style, defined at `mono.layogtima.com`:

- Monochrome. Black `#000` / white `#fff`, greys via `bg-gray-800/900`. Colour is an
  event, not a default. Current violations to remove from `index.html`:
  `bg-yellow-400` (L674, Moonfall card), `text-pink-500` (L1452, NOT HERE card),
  and a stray `rgba(0,255,0,0.1)` green glow in `.text-backdrop`.
- **Ubuntu Sans Mono** everywhere, `* { font-family: … }`. Space Mono is the
  secondary, used in `materials/` and much of `sandbox/`.
- 1–2px hairline borders. `border-2 border-black dark:border-white`.
- Corner brackets: `absolute -top-2 -left-2 w-12 h-12 border-l-2 border-t-2`.
- The wordmark idiom: `AMIT<span class="text-xs align-text-top">` — a word plus a
  superscript fragment. Used 9× on the hub, and as `MAT`+`ERIAL` in materials.
- Hover: `hover:-translate-y-1 hover:shadow-lg` + a 1px underline that sweeps
  `group-hover:w-full`.
- Ambient motion is **imperceptible** — SMIL `<animate>` at 90 s–240 s durations.
  Nothing should visibly move unless the user did something.
- `darkMode: "class"`, `localStorage` key **`color-theme`**. **Apply the theme in a
  blocking `<head>` script, not in `DOMContentLoaded`** — today dark-mode users get a
  white flash on every load, made worse by `transition-colors` on `<body>` turning
  the flash into a visible fade.

Convert Tailwind utilities to **CSS custom properties** in the rebuild. The repo has
literally zero `--var` declarations today; every colour is a utility class or one of
eight raw hex literals.

### Density is the house preference
The reference for "how much information per screen" is `orb`: floating UI at screen
corners, **no grouping boxes**, legibility from `drop-shadow`, state shown as **dots
not numbers**, everything on one screen, no page loads. Read `/tmp/orb/src/style.css`
— the comment `/* Floating UI — no grouping boxes. Legibility comes from drop-shadows. */`
is the whole design thesis in one line.

Corollary: the current hub uses `grid-cols-1 md:grid-cols-2` in **all four** of its
grids. 18 cards become 9 tall rows on a desktop. That's the opposite of the house
preference.

---

## 7. Quality floors

Every page, every gate, no exceptions.

**Performance**
- First-load JS ≤ 100 KB gzipped for a page, ≤ 250 KB for a simulation/game.
- Total image payload ≤ 600 KB above the fold. Every raster asset ships AVIF or
  WebP with a JPEG fallback and explicit `width`/`height`.
- `loading="lazy"` on every below-fold image. Repo-wide today: **zero** `loading=`
  attributes in `index.html`.
- No autoplaying video over 1 MB without a `preload="none"` + poster + click-to-play
  path. The hub currently autoplays a **3.7 MB** webm.
- `videos/` contains **~14 MB of files referenced by nothing**. Delete or move to
  a release asset.

**Accessibility**
- Remove `maximum-scale=1.0, user-scalable=no` from the viewport meta. It's on the
  hub today and it's a WCAG 1.4.4 failure.
- `prefers-reduced-motion` guard on every animation. Currently **zero** pages have one.
- Real `alt` text. The hub has copy-paste bugs: an eco-brutalism image labelled
  `alt="ÆTHERWAVES"` (L899), an arcade thumbnail labelled `alt="SEEDVALLEY Screenshot"`
  (L1099). `eco-brutalism` uses `alt="Background"` for six different buildings.
- `aria-hidden="true"` on decorative SVG. The hub has 60+ decorative SVGs and **four**
  `aria-*` attributes total.
- Never `cursor: none` without a working replacement that survives touch and scroll.
- `:focus-visible` styles must exist. Body text ≥ 4.5:1 contrast.
- `<noscript>` fallback on any 100%-client-rendered page. With JS off, `eco-brutalism`
  is a black screen and `observer` shows literal `{{ mustaches }}`.

**Links & meta**
- Internal links are **relative**. Six of the hub's seven internal project links are
  hardcoded `https://layogtima.com/…` absolute URLs, which break local preview.
- External links: `target="_blank"` **and** `rel="noopener noreferrer"`, consistently.
  Today 17 external links have neither and both footer links have `target` without `rel`.
- Every page: `<title>`, `<meta name="description">`, canonical, OG + Twitter card with
  matching titles and a current image, favicon. `observer/` has **none** of these.
- Trailing slashes consistent. `sandbox/base64/` has an `index.htm`, not `.html` —
  it will 404 as a directory index.

---

## 8. Known landmines

Things that will waste your time if you don't know them going in.

- `sandbox/aether/script.js:899` throws a guaranteed `ReferenceError` — `minFreq`/
  `maxFreq` are `const`s scoped inside the left-hand branch at 838-839, and line 899
  only runs in `right-only` mode where that branch is skipped. **Pressing `3` kills
  the audio loop.**
- `sandbox/aether/hand.js` is a **53.7% verbatim fork** of `script.js` with no audio,
  a fatal pitch-mapping bug at `:587` (divides a 0..1 normalised coord by
  `window.innerWidth`), and a `TypeError` on the `D` key at `:887`.
- `observer/`'s subliminal flash — the most transgressive thing on the page — renders
  at an effective alpha of **0.005** (`color: rgba(255,51,51,0.1)` × `opacity: 0.05`)
  for 50 ms. It has never been visible to anyone.
- `observer/`'s notification audio is a base64 data URI whose length is **≡ 1 (mod 4)**
  — structurally invalid, silently swallowed by a `.catch(e => {})`. It also decodes
  to pure silence. 2.8 KB of nothing.
- `observer/`'s 24 `.text-node` spans carry `data-meaning` but **zero** carry
  `data-hover-text`, so all 48 mouseenter/mouseleave handlers are dead code.
- `eco-brutalism/images/hero.webp` is **not a WebP**. It's a 1.28 MB single-frame
  GIF89a with an 8-bit palette and a lying extension. 65% of that project's payload.
- `sandbox/treevalley/treeData.js` references `images/trees/gulmohar-1327.jpg`; the
  actual file is `images/gulmohur.jpg` (flat dir, different spelling). **Every photo
  404s.** 1.4 MB of unreferenced jpgs sit alongside.
- `sandbox/mib/incident.html` loads `GeoSpy.js` / `OSMEnvironment.js` from the project
  root; they live in `js/`. Guaranteed 404 + console errors.
- `sandbox/body/data.js` and `data-amit.js` are **byte-identical** (22,490 bytes each).
  Only `data.js` is loaded.
- Orphaned files loaded by nothing: `chips/script.js` (which is also the only file
  containing the project's four `// TODO: Implement …` comments),
  `sandbox/spectral/ambient.js`, `sandbox/spectral/spectre.js`,
  `sandbox/repository/hydration.js`.
- `sandbox/repository/README.md` describes a Vue 3 + Pinia + Hono + IndexedDB +
  Cloudflare Workers stack. `index.html` loads Tailwind and nothing else. The README
  is fiction.
- `orbiter/` contains only `MOVED.md`. The project became `wondervoid` and went private.

---

## 9. Definition of done

A project is done when all of the following are true and a `JUDGE` has said so:

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `npm run test` exits 0
- [ ] Zero console errors and zero failed network requests on a cold load
- [ ] Zero CDN dependencies, zero hotlinked assets, zero `http://`
- [ ] Every rendered number traces to `data/sources.json`
- [ ] Perf + a11y floors in §7 met, verified not asserted
- [ ] `README.md` says what it is, how to run it, and where the data came from
- [ ] An entry exists in `/data/projects.json` (the hub manifest) with a real
      description, a real `og:image`, and correct tags
- [ ] The page has a voice. Read it out loud. If you're bored, it fails.
