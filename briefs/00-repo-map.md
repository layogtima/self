# 00 — Repo map

Ground truth as of the clone. 74 project directories, 86 HTML files, 120 MB,
one squashed commit (`f23339b "Opening."`). No root `package.json`, no build, no CI.
`.gitignore` is three lines and does not cover `.DS_Store` (tracked in 6 places).

---

## Top level

| Dir | Title | Size | Status | Disposition |
|---|---|---|---|---|
| `index.html` | AMIT \| Internet Madman | 86 KB / 1844 lines | Live hub | **REBUILD** → `briefs/01` |
| `materials/` | MATERIAL \| Studies | 27+17+11 KB | **Broken in prod** (`http://` Vue) | **REBUILD** → `briefs/02` |
| `drums/` | Drums: Drop a Beat! | 20 KB single file | Works, weak | **REBUILD** → `briefs/04` |
| `eco-brutalism/` | Eco Brutalism | 19 KB + 2 MB img | Works | **PIVOT → `terra/`** → `briefs/05` |
| `observer/` | OBSERVER | 29+31 KB | Works, flat | **OVERHAUL** → `briefs/06` |
| `bipolar/` | Bipolar | 4.6 KB | — | 🔒 FROZEN |
| `cheese/` | Girl Who Wanted the World to Be Cheese | 18 KB | — | 🔒 FROZEN |
| `ferment/` | Ferment | ~1.5 MB, 30 recipes, 24 wiki articles, PWA | The most finished thing in the repo | 🔒 FROZEN |
| `moonfall/` | Moonfall | 5 KB + 13 KB md | — | 🔒 FROZEN |
| `not/` | NOT HERE | 44 KB | — | 🔒 FROZEN |
| `canvas/` | ∞ | 14 KB | Generative paint toy, zero deps, works | **LINK** (there's a literal `<!-- /canvas ADD HERE -->` in the hub at L649) |
| `chips/` | CHIP REALITY INTERFACE v1.0 | 82 KB | 4 unimplemented TODOs; `script.js` isn't even loaded; unversioned three.js | **FIX or CUT** |
| `dig/` | Diggg — Find Fossils | ~450 KB src + 124 KB tests | Real game, has docs/ROADMAP.md, tests, poc/ | **LINK** — most substantial unlinked thing in the repo |
| `diggg/` | diggg — three.js mock | 33 KB | Self-declared "mock", superseded twice | **DELETE** |
| `fireflies/` | Fireflies | 64 KB, 11 modules | Zero deps, zero assets, pinned CDN | **LINK — top tier** |
| `formicarium/` | formicarium — Messor barbarus | 65 KB | Vanilla canvas, no libs, species-accurate | **LINK — top tier** |
| `islands/` | MONOTONE \| ISLANDS | 18 KB | Direct ancestor of `drums`; hotlinked samples | **MERGE into drums** |
| `orbiter/` | — | `MOVED.md` only | Became `wondervoid`, private | **DELETE**, note in root README |
| `process/` | PROCESS - AMIT | 320 KB | Scrollytelling manifesto, finished, voiced | **LINK** |
| `sci-fonts/` | MONO \| Font Preview | 17 KB | Works | **LINK** |
| `sandbox/` | 55 dirs | — | See `briefs/07` | **TRIAGE** |
| `images/`, `videos/` | — | 20 MB videos | **9 videos ≈14 MB referenced by nothing** | **PURGE** |

---

## The coverage problem

The hub links **9 of 74 projects — about 12%.**

- 7 linked by path: `bipolar`, `cheese`, `drums`, `eco-brutalism`, `materials`, `not`, `observer`
- 2 linked via subdomain despite existing in-repo: `ferment` → `ferment.layogtima.com`,
  `moonfall` → `moonfall.layogtima.com` (divergence risk)
- **`grep -c 'sandbox/' index.html` → 0.** Not one of the 55 sandbox dirs is
  referenced by path, even though the nav section is *called* "SANDBOX". Only `aether`
  and `zen` surface at all, both via subdomain.
- 9 top-level dirs unlinked: `canvas`, `chips`, `dig`, `diggg`, `fireflies`,
  `formicarium`, `islands`, `process`, `sci-fonts`

Every one of the 74 dirs has a machine-readable `<title>`. A generated manifest fixes
coverage *and* deletes ~800 lines of duplicated card markup in one pass.

---

## Cross-cutting rot (fix everywhere, not per-project)

| Class | Count | Detail |
|---|---|---|
| Tailwind Play CDN in prod | ~40 pages | Ships the JIT compiler to every visitor |
| Vue/three/Tone from CDN, no SRI | ~35 pages | 3 different Tone.js versions: 15.1.5, 14.8.49, 14.7.77 |
| `http://` script tag | 1 | `materials/index.html:57` — **breaks the live page** |
| Hotlinked third-party assets | 6 projects | drums, islands, eco-brutalism (Druk font), map-of-plants, blrhikes, chips |
| `/api/placeholder/` stubs | 3 files | megastructure, terrarium, palettes/technof |
| Broken local asset refs | 4 projects | treevalley (all photos), mib (2 scripts + 9 pages), palettes/bioflow (`flowmorph.js`), zen (og:image filename) |
| `setInterval` for audio timing | every audio project | `Tone.Transport.scheduleRepeat` / `lookAhead` / `nextNoteTime`: **0 occurrences repo-wide** |
| `requestMIDIAccess` | 0 | Nothing in this repo speaks MIDI |
| `prefers-reduced-motion` | 0 pages | Including two with full-viewport flashes |
| `.DS_Store` tracked | 6 | root, eco-brutalism, cheese, moonfall, orbiter, sandbox |
| Orphaned files (loaded by nothing) | 5 | `chips/script.js`, `spectral/ambient.js`, `spectral/spectre.js`, `repository/hydration.js`, `body/data-amit.js` |

---

## Duplicate clusters worth collapsing

- **dig → diggg → formicarium** — three generations of one idea. `formicarium`'s README
  explicitly calls itself "the resolution of a longer search (see `../dig`, `../diggg`)".
  Keep `dig` + `formicarium`, delete `diggg`.
- **islands → drums** — same island metaphor, same variable names, same four hotlinked
  samples, same `setInterval` sequencer. `islands` has the better audio layer (Tone
  `Sampler`, `Tone.now()`); `drums` has the better visuals. Neither should survive alone.
- **aether ← hand.html** — 53.7% verbatim fork, no audio, two fatal bugs.
- **quantia → quantum** — `quantia` (486 LOC, hardcoded numbers) is the discarded sketch
  of `quantum` (3568 LOC, real state-vector math).
- **4 manifesto pages** — `brutalism`, `eco-brutalism`, `anti-design`, `memphis`. Same
  rhetorical move four times.
- **5 "no goals" ambient toys** — `zen`, `lumi`, `bloom`, `osmotic`, `stellar`.
- **2 motion showcases** — `motion` (Motion.dev) vs `red-thread` (anime.js), same brief.
- **2 font previewers** — `typography` (general) vs `sci-fonts` (sci-fi subset).
- **2 inventory UIs** — `repository` (MONO) vs `book` (fantasy RPG), same component tree.

---

## Target end state

```
/                       hub, generated from /data/projects.json
/data/projects.json     the single source of truth for every card
/shared/                design tokens, audio-core, hands-core   ← briefs/08
/materials/             rebuilt                                  ← briefs/02
/terra/                 new, replaces eco-brutalism              ← briefs/05
/aether/                promoted out of sandbox/, rebuilt        ← briefs/03
/drums/                 rebuilt, islands merged in               ← briefs/04
/observer/              overhauled                               ← briefs/06
/sandbox/               ~35 dirs, each either fixed or deleted   ← briefs/07
/archive/               deleted-but-kept, not linked, not built
```

Every rebuilt project follows the `orb` layout (`CLAUDE.md` §3). Everything else stays
as-is but gets a manifest entry so it stops being invisible.
