# MATERIALS

A browsable census of the stuff the world is made of, biggest first, ticking in real time.

Live: <https://layogtima.com/materials/>

## One list

Everything we dig up or make, biggest first, in tonnes a year. **179 materials.**

It used to be three lists, crustal composition, built stock, annual production, which
split the census three ways and left most rows saying "not on this list". Now there is one
list ranked by what we make, and the other two questions survive where they are useful:

- as **sort orders**. `Most made`, `Most still standing`, `Most common in rock`
- as **extra facts on the card**, steel reads `alloy · 33 billion t built`, iron reads
  `element · 5.6% of rock`

Cards carry no magnitude bar. The list spans eleven orders of magnitude, from 4 trillion
tonnes of water to 55 tonnes of rhenium, so any bar has to be log-scaled, and a log bar
sitting next to a figure whose unit changes from row to row invites exactly the comparison
it cannot support. The number, its unit and the rank do that job honestly instead.

**Water is first, by a factor of eighty.** Humans withdraw about 4 trillion tonnes of fresh
water a year, more than every solid material put together several times over. It carries
`excludedFromTotal`, because the 106 Gt headline counts solid materials only and adding the
two would be comparing two different censuses. The card says "counted separately" and the
panel explains why. Rows also say **Taken each year** rather than **Made each year** when
the flow is extraction: nobody manufactures water, coal or iron ore.

Materials that are part of a bigger entry (wheat inside cereal grain, sawnwood inside
roundwood, PVC inside plastics) carry `subsetOf`, say so on the card, and are **never added
to their parent** when totalling extraction. Six element records, oxygen, calcium, sodium,
potassium, carbon, phosphorus, were retired: nobody produces them as elements, so they had
no figure for a list of what we make. Their industrial forms are here instead as lime, soda
ash, potash and carbon compounds.

The roster covers the elements and commodities USGS and FAOSTAT track, the big bulk
chemicals, the polymer family, engineered wood and insulation, the alloys people actually
name (bronze, brass, stainless, solder), the industrial byproducts that are quietly enormous
(fly ash, blast-furnace slag), and the crops and fibres that feed and clothe everyone. Known
gap: the rock-forming minerals. Half the crust is feldspar, quartz, pyroxene and mica, and
only feldspar and mica are here, because the minerals in this list were chosen the way a
mining company chooses them, as things we dig up and sell.

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
Institute, IEA, GCCA, World Gold Council, World Nuclear Association, CRC Handbook. Full list
in `data/sources.json` and at the bottom of the page.

Where a material has a genuine trade-off it also carries `pros` and `cons`, rendered in the
panel as **Good at** and **Not so good**. Eighty-five have them; the rest do not, because
not every mineral has an interesting argument for and against it.

Some commodities, bulk chemicals, a few polymers, have no free official statistic. Those
carry the `wikipedia` source, are marked `derived`, and render with an `EST` badge and a
note saying so. That is deliberately uglier than quietly citing "industry sources".
New records also ship **without Wikidata QIDs**: an identifier written from memory is worse
than no identifier, so those are left for a pass that can verify them.

## The specimens

Every material has a 3D specimen, **generated procedurally at load time**, no textures, models
or images are downloaded. `src/render/specimens.js` holds fourteen surface recipes (metal, glass,
stone, wood, carbon weave, crystal, fibre…) and **33 shapes**, built from
`MeshPhysicalMaterial`, noise-displaced icosahedra, and canvas-drawn grain/weave/speckle
maps. Nothing is a generic blob: grain is a heap of grains, plastics are nurdles, cement is
a powder pile, salt is a cube, eggs are eggs, gases are clusters of bubbles, gravel is
gravel. Every geometry is normalised to the same bounding radius so each specimen fills its
frame consistently. Lighting is three's
procedural `RoomEnvironment` through a PMREM pass, so there is no HDR file either.

### Why the grid costs no GPU

Fifty-three live WebGL viewports cost a frame of GPU work every frame, forever, and it
showed. The render path is split in two:

- **`render/thumbs.js`** paints each card once into its own small 2D canvas from a 192px
  offscreen renderer, then never touches it again. Because each canvas is a normal DOM
  element it scrolls with its card for free. Pointer-over spins one card at 30fps; that is
  the only per-frame cost the grid ever has.
- **`render/gl.js`** keeps live 3D for exactly two things: the hero cloud (20 curated
  specimens, each on its own inclined orbit, clickable) and the open detail specimen, drawn
  into scissor rects over their DOM slots so they track scrolling exactly. When neither is on
  screen the loop clears once and then returns without drawing.

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

## Light and dark

Two palettes, switched by `data-theme` on `<html>`. It starts on whatever the OS asks for
and keeps following it, including if the OS flips mid-session, until the reader presses the
toggle or `t`; from then on the choice is theirs and is remembered. An inline script in the
`<head>` sets the attribute before first paint, so a light-mode reader never sees a dark
flash. Every colour is a token defined in both palettes, with a test that fails if either
palette leaves one undefined. Light mode also turns on a faint ground shadow under card
specimens, because a pale specimen on a pale page has nothing to sit on.

## Caching

`style.css` and `src/main.js` carry a `?v=` stamp, and `loadData` versions its three JSON
fetches with `DATA_VERSION`. Bump both when data or styling changes.

The subtler protection is in the data itself. Water's flow is `kind: "withdrawal"`, not
`"extraction"`, so a build that has never heard of it skips it rather than adding 4 trillion
tonnes to a 106 Gt total and reporting a double-count that is not there. A stale cached
script paired with fresh JSON did exactly that once; encoding the exclusion in the data
rather than only in the code makes it structurally impossible. There is a test asserting
that neither the current logic, nor logic without `excludedFromTotal`, nor logic without
subset handling, can exceed the global figure.

## Dates

Every material carries an approximate **first human use** date, not a geological one, and
the ones that are estimates render as "about 9500 BCE". Iron ore reading as older than wood
under `Oldest first` was the giveaway that forty records were undated and all tying on one
sentinel value.

## Keyboard

`/` search · `j` `k` move · `Enter` open · `Esc` close · `c` pause · `t` light or dark

Clicking a floating specimen in the hero opens that material.

Pause stops the ticker and all specimen motion, and is on by default if the system asks for
reduced motion. Every view is linkable: `#m=steel`, `#sort=crust`, `#q=carbon&class=metal`.
Old three-list links (`#view=made`) still resolve, to the matching sort.

## Tests

```sh
# schema, units, source resolution, and whether the tracked flow is honest
node tests/data.mjs

# number formatting, the last place a correct number can become a wrong one
node tests/format.mjs

# end-to-end in a real browser
mkdir -p /tmp/matsmoke && (cd /tmp/matsmoke && npm i puppeteer-core@23)
(cd .. && python3 -m http.server 8642 &)
NODE_PATH=/tmp/matsmoke/node_modules node tests/smoke.mjs
```

`tests/smoke.mjs` checks 42 things including that no list shows a material it cannot
measure, that the tab labels and the About legend cannot drift apart, WebGL initialisation, that card specimens
actually contain rendered pixels, **that scrolling the grid issues zero draw calls**, that
no em dash survives anywhere in the rendered page, that the phone layout puts the bar at the
bottom, that the counter advances, dialog focus handling, and zero console errors.
