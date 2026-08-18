# MATERIAL

A browsable census of the stuff the world is made of, ranked three ways and ticking in real time.

Live: <https://layogtima.com/materials/>

## The three lists

The site keeps three questions apart, because they get conflated constantly:

| List | Question | Kind | Shows | Topped by |
|---|---|---|---|---|
| **EARTH'S RECIPE** | What is everything made of? | stock, ppm | 21 | Oxygen, 46.1% |
| **WE BUILT** | What is still standing? | stock, tonnes | 9 | Concrete, 549 billion tonnes |
| **RIGHT NOW** | What are we making today? | rate, tonnes/year | 47 | Sand & gravel, 50 bn tonnes a year |

A material can top one list and be missing from another, and each list only shows what it
can actually measure. Gold is 21st most common in rock, 9th most built and 47th most made;
concrete is 1st in what we built and has no entry in Earth's recipe at all.

**Why the counts differ.** Earth's recipe is the *elemental* composition of the continental
crust (Rudnick & Gao). Rocks and manufactured things cannot have a parts-per-million share
of the crust — no source publishes one for bauxite, coal or cement, because they are
mixtures, deposits or products rather than elements. That list was briefly called "IN THE
GROUND", which promised anything you can dig up and then had nothing to say about salt or
coal. Materials with no figure for a list are hidden from it, with a line underneath saying
how many and why, rather than shown as rows reading "not on this list" — a real absence
should not look like a broken record.

Doing this properly at the mineral level would mean adding the rock-forming minerals
(feldspar, quartz, pyroxene, mica…) on a separate volume-percent scale. Half the crust is
feldspar and it is not in this dataset, because the minerals here were chosen the way a
mining company chooses them: things we dig up and sell.

Quantities are shown in words — "4.4 billion tonnes a year", not "4.4 Gt/yr". The intent is
that the browsing surface reads at a six-year-old's level while the detail panel keeps every
number, unit, year and citation intact.

## Rules the data follows

- **Every quantity is a number**, not a string: `{ value, unit, year, source_id }` in SI units.
  Nothing in the codebase parses `"30 billion tons"`.
- **Every rendered number has a source**, shown next to it. A quantity whose `source_id`
  does not resolve is dropped at load rather than displayed.
- **Rank is derived at runtime** from the active view. It is never stored, so it cannot
  contradict the data.
- **Estimates are labelled `EST`** and carry a note saying how they were derived. Cement is
  measured; concrete is not, so the concrete tonnage is cement output times an assumption
  and says so.
- **Extraction and manufacture are tagged separately** (`kind`), so iron ore and the steel
  made from it are never added together. The headline counter uses the UNEP IRP global
  figure; the 53 materials here account for ~76% of it, which the page states.

Sources: UNEP IRP, USGS Mineral Commodity Summaries, worldsteel, FAOSTAT, Plastics Europe,
Geyer et al. 2017, Elhacham et al. 2020, Bar-On et al. 2018, Rudnick & Gao 2003, Energy
Institute, IEA, GCCA, World Gold Council, CRC Handbook. Full list in `data/sources.json`
and at the bottom of the page.

## The specimens

Every material has a 3D chunk, **generated procedurally at load time** — no textures, models
or images are downloaded. `src/render/specimens.js` holds fourteen recipes (metal, glass,
stone, wood, carbon weave, crystal, fibre…) built from `MeshPhysicalMaterial`,
noise-displaced icosahedra, and canvas-drawn grain/weave/speckle maps. Lighting is three's
procedural `RoomEnvironment` through a PMREM pass, so there is no HDR file either.

### Why the grid costs no GPU

Fifty-three live WebGL viewports cost a frame of GPU work every frame, forever, and it
showed. The render path is split in two:

- **`render/thumbs.js`** paints each card once into its own small 2D canvas from a 192px
  offscreen renderer, then never touches it again. Because each canvas is a normal DOM
  element it scrolls with its card for free. Pointer-over spins one card at 30fps; that is
  the only per-frame cost the grid ever has.
- **`render/gl.js`** keeps live 3D for exactly two things: the hero cloud (16 curated
  specimens) and the open detail specimen, drawn into scissor rects over their DOM slots so
  they track scrolling exactly. When neither is on screen the loop returns without drawing.

Measured with `renderer.render` instrumented: **0 draw calls per second while scrolling the
list**, one draw per frame with the hero or the detail panel on screen. Transmission was
removed from every recipe (it forces an extra full render pass per material per frame);
polished opacity plus strong reflections is indistinguishable at these sizes. Device pixel
ratio is capped at 1.5, and rendering stops entirely when the tab is hidden.

If WebGL is unavailable the app drops to flat colour swatches and everything else keeps
working.

## Stack

No build step. Vanilla ES modules, one hand-written stylesheet, three.js via a pinned
importmap. Open `index.html` from any static server.

```
index.html          entry, importmap, templates
style.css           tokens + the whole design system
src/main.js         wiring
src/data.js         load, validate, derive ranks and rates
src/format.js       the only place a number becomes a string
src/state.js        state ⇄ URL hash ⇄ localStorage
src/ticker.js       the monotonic clock behind the live counter
src/render/         gl.js (hero + detail), thumbs.js (card stills), specimens.js, noise.js
src/ui/             hero.js, grid.js, detail.js, keys.js
data/               materials.json, sources.json, scales.json
tests/              data.mjs, format.mjs, smoke.mjs
```

## Keyboard

`/` search · `1` `2` `3` switch list · `j` `k` move · `Enter` open · `Esc` close · `c` pause

Pause stops the ticker and all specimen motion, and is on by default if the system asks for
reduced motion. Every view is linkable: `#m=steel`, `#view=made`, `#q=carbon&class=metal`.

## Tests

```sh
# schema, units, source resolution, and whether the tracked flow is honest
node tests/data.mjs

# number formatting — the last place a correct number can become a wrong one
node tests/format.mjs

# end-to-end in a real browser
mkdir -p /tmp/matsmoke && (cd /tmp/matsmoke && npm i puppeteer-core@23)
(cd .. && python3 -m http.server 8642 &)
NODE_PATH=/tmp/matsmoke/node_modules node tests/smoke.mjs
```

`tests/smoke.mjs` checks 29 things including that no list shows a material it cannot
measure, that the tab labels and the About legend cannot drift apart, WebGL initialisation, that card specimens
actually contain rendered pixels, **that scrolling the grid issues zero draw calls**, that
the counter advances, that each list re-ranks correctly, dialog focus handling, and zero
console errors.
