# 02 — Materials

Branch: `gauntlet/materials` · **Ground-up rebuild.** Largest project in the run.
Budget it explicitly at G0; it will absorb whatever you give it.

> *"Materials needs to be completely rethought and made from the ground up to showcase
> every material on earth, based on how much of it exists + being added every minute
> (as rich as a DK magazine but as easy to browse as orb)."*

---

## What exists now, and why it must go

A 15-card grid with a detail modal. Vue 3 + Tailwind, both from CDN, no build.

**It is broken in production right now.** `index.html:57` loads Vue over `http://`
from cdnjs. Browsers block mixed active content unconditionally. The runtime never
loads, the app never mounts, and the live page renders raw
`{{ material.name.toUpperCase() }}` mustaches. One line. Since the first commit.

Beyond that:

- **15 records.** The brief says *every material on earth*. IMA has ~6,100 approved
  mineral species. Materials Project holds >150,000 computed inorganic compounds.
  USGS tracks 90+ nonfuel commodities. materialflows.net tracks 300+ materials across
  200+ countries. Fifteen is not 0.25% of any of those.
- **No stock data at all.** "How much exists" is a *stock* question. The dataset's only
  quantity is `annualProduction` — an unsourced, undated, unit-inconsistent *flow*
  **string** (14 in "tons", 1 in "cubic meters", no year, no citation).
- **`rank` contradicts its own data.** Aluminium (64 Mt) is `rank: 3`, above plastic
  (380 Mt) at `rank: 4`. Glass (280 Mt) is `rank: 6`, above ceramics (400 Mt) at 7.
  The UI labels this sort "USAGE RANK". It is a vibe.
- **The live counter — the whole concept — is `class="hidden"`.** And when unhidden:
  - `getProductionPerSecond` never converts tons → kg, so every figure is ~1000× low
  - `parseFloat("150,000 tons")` returns **150**, so carbon fibre displays one
    millionth of reality; graphene and gold both render `+0 kg`
  - the `cubic meters` branch is unreachable — `.includes('billion')` is tested first,
    so wood's `"3.8 billion cubic meters"` is treated as 3.8e9 **kg**
  - headline total reads `+70,025 kg/min`; real global material extraction is
    ~100 Gt/yr ≈ **1.9 × 10⁸ kg/min**. Off by ~2,700×.
  - the GLOBAL IMPACT bar maxes at 1e9 kg and fills at ~1,167 kg/s — it needs **9.9
    days on one page load** to reach 100%
- **Zero joinable identifiers.** No CAS, no PubChem CID, no Wikidata QID, no IMA symbol,
  no USGS commodity slug. `"id": "gold"` cannot be joined to anything. **This is the
  reason the current file must be replaced rather than enriched.**
- **Zero images.** The `image: "gold.jpg"` field exists on all 15 records, is referenced
  by no line of code, and no such files exist. Every "image" is a `border-radius: 50%`
  div filled with a flat hex. `#C2C2C2` is not concrete.
- `alt.html` (17 KB) is an orphaned earlier variant that **shares `app.js`** with
  `index.html`. Any edit hits both. Delete it.
- `watch(() => window.innerWidth, …)` never fires — `innerWidth` isn't reactive.
- `style.css:38` puts a 300 ms transition on `*`. Fine at 15 cards. Fatal at 5,000.
- Modal has no `role="dialog"`, no `aria-modal`, no focus trap, no focus restore.
- No search. No URL state. **A material cannot be linked to.**

### Keep from the old build
The visual system — Space Mono, pure black/white, hairline borders, `#rank` superscript
chips, hover-invert cards, the `MAT`+superscript-`ERIAL` wordmark. It's distinctive and
it scales to density better than most. Keep the modal's information architecture as an
editorial spine. Keep the ~45 hand-written `funFacts` as seed copy — *"All the gold ever
mined would fit in a cube 21 m on a side"* is good writing. Keep `style.css:99–144`
(the `prefers-reduced-motion` and `@media print` blocks — the only thoughtful CSS in
the project).

---

## The new thing

**A browsable census of the material world, ranked by mass, ticking in real time.**

Three quantities, three separate ranked views, never conflated:

| View | Question | Unit | Scale |
|---|---|---|---|
| **CRUST** | What exists? | ppm / tonnes | O 46%, Si 28%, Al 8%, Fe 6% … |
| **MADE** | What did we make, and is it still standing? | Gt | ~1.1 Tt anthropogenic mass (2020) |
| **FLOW** | What's being added right now? | kg/s | ~100 Gt/yr ≈ 1.9×10⁸ kg/min |

The **FLOW** view is the hero. It's the original idea, and it has never worked.

### Data model

```ts
type Material = {
  id: string                 // slug
  ids: {                     // THE JOIN KEYS — do these first
    wikidata?: string        // Q897
    cas?: string
    pubchem?: number
    ima?: string             // mineral symbol
    usgs?: string            // commodity slug
    hs?: string              // trade code
  }
  name: string
  aka: string[]
  class: 'element' | 'mineral' | 'alloy' | 'polymer' | 'ceramic' | 'composite'
       | 'biomass' | 'engineered'
  formula?: string

  quantities: {
    crustalAbundance?: Q     // ppm, Rudnick & Gao
    anthropogenicStock?: Q   // t, Elhacham / Krausmann
    annualProduction?: Q     // t/yr, USGS / BGS / FAOSTAT
    reserves?: Q             // t, USGS
    biomass?: Q              // t C, Bar-On
  }

  properties: Record<string, Q>   // density, tensile, thermal — NUMBERS + units
  discovered?: { year: number | null, era?: string, source_id: string }
  media: { hero?: Img, micrograph?: Img, section?: Img, sample?: Img }
  facts: { text: string, source_id: string }[]
  relations: { uses: string[], madeFrom: string[], replaces: string[], recycledInto: string[] }
}

type Q = {
  value: number
  unit: string           // SI, canonical
  year?: number
  uncertainty?: [number, number]
  source_id: string      // REQUIRED. No source_id → renders as "—"
}
```

**Rules:** `rank` is derived, never stored. Every `Q` carries a `source_id`. No
formatted-string quantities anywhere. No 1-10 "sustainability score" — the old ones
were unsourced, uncalibrated, and internally inconsistent (higher = better for two,
worse for the third, with nothing in the data saying so).

### Ingest order

Identifiers first. Everything else joins to them.

1. **Wikidata SPARQL + PubChem PUG REST** → QID, CAS, CID, labels, images, licences.
   CC0 / public domain. *Do this before touching any other source.*
2. **Crustal abundance** — Rudnick & Gao, *Composition of the Continental Crust*
   (Treatise on Geochemistry 3.01); Hu & Gao 2008 for the upper crust. Tables live in
   PDFs, not an API — transcribe ~80 rows once into `data/crust.json` and cite.
3. **Anthropogenic stock** — Elhacham et al. 2020, *Nature*, "Global human-made mass
   exceeds all living biomass". Data free on GitHub at `milo-lab/anthropogenic_mass`:
   1900–2020 by category (concrete, aggregates, bricks, asphalt, metals, plastics,
   other). Krausmann/Wiedenhofer stocks at `boku.ac.at/wiso/sec/data-download`.
4. **Biomass** — Bar-On, Phillips & Milo 2018, *PNAS*, "The biomass distribution on
   Earth". ~550 Gt C by kingdom. SI spreadsheets free.
5. **Annual flow** —
   - **USGS Mineral Commodity Summaries 2026** — production, reserves, price, recycling
     rate for ~90 commodities. Structured ScienceBase data release, public domain.
     **The backbone.**
   - **USGS Data Series 140** — historical production back to ~1900, one XLSX per
     commodity. The only way to compute cumulative stock from flows.
   - **BGS World Mineral Statistics** — 70+ commodities back to 1913, and a genuinely
     queryable **OGC API** at `ogcapi.bgs.ac.uk`. Check IPR before redistributing.
   - **FAOSTAT** — roundwood, sawnwood, pulp, paper, cotton, natural rubber. Bulk CSV
     + REST, **CC BY 4.0**. Best-in-class. The biomass/renewables backbone.
   - **UNEP IRP Global Material Flows** — 300+ materials, 200+ countries, 1970–2024.
     Note 2022–2024 are *estimated from economic proxies* — label them.
   - **OECD Global Plastics Outlook** — or the OWID grapher mirror (append `.csv` to
     any grapher URL for clean CSV).
   - **worldsteel** — crude steel **monthly by country**. The closest thing to a real
     "added this minute" feed for a major material. PDF/press-release, scrapeable.
6. **Properties** — **Materials Project** API (free key, `mp-api` Python client, full
   dumps on AWS Open Data) and **Mindat / OpenMindat** (free REST key) for the ~6,100
   IMA species.
7. **Optional map layer** — gridded steel/aluminium/cement in-use stocks at **500 m
   resolution, 2000–2019** (Nature *Scientific Data* 2025, figshare
   `10.6084/m9.figshare.19959362.v3`). 60 GeoTIFFs.

**Caveat to encode in the UI:** cement is measured, concrete is not. The old file's
"30 billion tons" of concrete is a derived estimate, not a statistic. Say so.

### Scale target
**Phase 1: 300 records** covering everything with a USGS/BGS/FAOSTAT flow number plus
every element. **Phase 2: ~6,100** via Mindat. Design for 6,100 from day one —
virtualised list, indexed search (MiniSearch or FlexSearch, or SQLite-WASM if the
joins get heavy), URL-synced facets. The current architecture has a hard ceiling in
the low hundreds.

---

## Browse UX — the orb standard

`layogtima/orb` is the reference. Read `orb/src/style.css` — the comment
*"Floating UI — no grouping boxes. Legibility comes from drop-shadows."* is the thesis.
Transferable rules:

- **One screen. No page loads. No routing chrome.** The grid is the app; everything
  else floats in a corner.
- **No panels or grouping boxes.** Legibility from `drop-shadow`, not from borders
  around clusters of controls.
- **Dots, not numbers,** for at-a-glance state — orb shows oxygen and biodiversity as
  dot meters. Materials' analogue: a mass bar per row that is readable without reading.
- **URL hash as state**, exactly like orb's `#demo`, `#sky=0.5`, `#ev=eclipse`.
  Materials: `#m=steel`, `#view=flow`, `#q=carbon`, `#sort=stock`. Every state linkable.
- **`localStorage` autosave** of view state and a "collection" of pinned materials.
- **Keyboard everything.** orb has `Space` / `F` / `Z`. Materials: `/` search,
  `1/2/3` view switch, `j/k` navigate, `Enter` open, `Esc` close, `p` pin.
- **Touch first-class**, `touch-action: none` where you're handling gestures.
- **A stats dashboard that is "a nerd's paradise a six-year-old can still read."**
  That phrase is from orb's own README. It is the DK-magazine requirement, stated
  correctly.
- **Calm mode** — orb ships a settings toggle that reduces motion. Do the same;
  a live-ticking counter needs an off switch.

### Density spec
Default view is a **virtualised table-grid**: ~40 rows visible at 1440×900. Each row:
name · class chip · mass bar (log scale, the ranking made visual) · live flow ticker ·
a 24 px material swatch that is a **real photograph or micrograph**, not a hex circle.
Hover expands in place. `Enter` opens a detail panel over the grid — never a new page.

### The DK-magazine layer
Richness is not decoration; it's cross-reference and scale comparison.

- **Scale objects** — every mass renders against something bodily. "All gold ever
  mined = a 21 m cube." "Annual cement = X Great Pyramids."
- **Real imagery** — hero photo, micrograph, cross-section, raw sample. Wikidata gives
  you the image URLs and the licences in the same query. Credit every one.
- **Cutaways and diagrams** where a photo can't carry it (crustal shells, a blast
  furnace, a polymer chain).
- **Relations as navigation** — `madeFrom`, `replaces`, `recycledInto`. Clicking
  "bauxite" from "aluminium" is the DK spread's cross-reference arrow.
- **Time** — a scrubber over USGS DS-140. Watch aluminium's flow go from nothing to
  64 Mt/yr across the 20th century.

### The live counter, done right
- One `requestAnimationFrame` loop reading a monotonic clock, not a `setInterval`
  accumulator. The current one is never cleared.
- Rates derived from `annualProduction.value / 31_556_952` (tropical year seconds),
  in **kilograms**, with the source and year visible next to the number.
- The headline total must be within an order of magnitude of the IRP figure. If it
  isn't, the data is wrong — surface that, don't hide it.
- Show a "since you opened this page" figure **and** the per-second rate. The former
  is the hook; the latter is the honesty.

---

## Gauntlet notes

- **G1 TRUTH is the gate this project exists for.** CRITIC verifies 10 random records
  against their cited URLs. Any mismatch → the dataset is re-derived, not patched.
  The old About section's entire citation apparatus is the sentence *"Data compiled
  from various scientific and industry sources."* That is the bar being cleared.
- **G3** blocks on: any string-encoded quantity, any rendered value without a
  `source_id`, non-virtualised rendering at 300+ rows, `* { transition }`.
- **G4** — the move must be nameable. Candidate: *the moment the FLOW ticker makes
  the scale of extraction physically uncomfortable.* If a visitor can look at it and
  feel nothing, DELIGHT is a 2.
- Perf: TTI ≤ 2 s with 300 records; 60 fps scroll at 6,100; search ≤ 50 ms.
- Delete `alt.html` in the first commit. Fix the `http://` in the first commit too,
  on `main`, as a separate hotfix — the live page is broken today and the rebuild
  will take a while.
