# MATERIALS

A browsable census of the stuff the world is made of, biggest first, ticking in real time.

Live: <https://layogtima.com/materials/>

## One list

Everything we dig up or make, biggest first, in tonnes a year. **180 materials.**

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

**Every one of the 180 records carries the full set**, and a test fails the build if any
falls short: at least two sourced facts, a `usedFor` list rendered as **What it is for**,
and `pros`/`cons` rendered as **Good at** and **Not so good**.

Physical properties come with a plain-language gloss, **computed rather than written**, so
it can never drift from the number above it:

| Property | Gloss |
|---|---|
| Heaviness 7,850 kg/m³ | A one-litre carton of it would weigh 7.8 kg. That is 7.8 times a litre of water. |
| Heaviness 240 kg/m³ | A one-litre carton of it would weigh 0.24 kg. It floats on water. |
| Pull strength 400 MPa | A rod of it 1 cm across could hang 46 adults before it snapped. |
| Pull strength 130 GPa | A rod of it 1 cm across could hang 743 cars before it snapped. |
| Heat flow 401 W/(m·K) | Carries heat away faster than steel does. |
| Melts at 3,422 °C | Almost nothing gets hot enough to melt it. |

`propertyNote()` in `src/format.js` does the work, using a rod 1 cm across and the real
area of that circle, and `tests/format.mjs` pins the boundaries so the wording cannot go
nonsensical at the extremes.

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
tests/              data.mjs, format.mjs, devices.mjs, smoke.mjs
tools/              share-image.mjs, regenerates share.png from the real hero
vendor/             three.js and Space Mono, so nothing is fetched from anyone else
```

## What it costs

Every material carries a cradle-to-gate carbon figure, and the panel turns it into something
you can picture: *"A tonne of copper carries about the carbon of driving 23,529 km."* Four of
the sort orders come from it and its neighbours:

| Sort | Top of the list |
|---|---|
| Most carbon per kilo | Platinum, then rhodium and gold |
| Most carbon in total | Meat, then cereal grain and steel |
| Running out soonest | Chromium, then tin and bismuth |
| Most recycled | Bitumen, then slag and cast iron |

**The headline carbon counter is not a sum of those rows.** The per-material figures are
cradle to gate, so steel's already contains the coal it burns and concrete's already
contains its cement. Adding them gave 48 Gt a year, above the real world total, which is how
the double count announced itself. The hero uses published global figures instead, the same
way the mass counter uses the IRP extraction figure rather than summing rows: 41.6 Gt of CO2
a year (Global Carbon Project), of which about half comes from getting materials and making
things out of them (UNEP IRP). A test asserts the summed version is still larger, so if
anyone swaps one for the other it fails loudly.

**Years left** is `reserves / annual production`, derived rather than stored, and it always
appears with the caveat that reserves are what is worth digging at today's price rather than
what exists. Chromium reads as 14 years, which says more about how conservatively USGS
reports reserves than about chromium running out in 2040.

**Where it comes from** lists the top producing countries for 90 materials, which is the
evidence behind the dozen `cons` entries that say supply is concentrated. Gallium: China 98%.

## Carbon dioxide is on the list

It is the third biggest thing we produce, and almost none of it on purpose. The record
carries both flows, because they are different questions:

| Made by accident | 41.6 billion tonnes a year | Global Carbon Project |
| Made on purpose | 230 million tonnes a year | fizzy drinks, dry ice, welding gas |

That is a ratio of about 180 to 1. It needed a fourth `kind`, `byproduct`, alongside
`extraction`, `manufacture` and `withdrawal`. As with water, encoding it in the data rather
than the code means no build can accidentally sum it into the extraction total, and the live
counter reads "released since you got here" rather than "taken" or "made". Fly ash and
blast-furnace slag are byproducts too, and are now labelled as such.

## Will it actually run out

`Left to dig` now carries a verdict as well as a number, derived from three sourced inputs
and always showing them:

> **Genuinely tight.** Only 17 years of reserves at today's rate and 79% comes from one
> country. *(bismuth)*

> **Unlikely to run out.** 36 years of reserves at today's rate and 60% of it comes back
> round. *(nickel)*

The inputs are years left, recycling rate and the largest producer's share. It is a rule
over published numbers, not a score: the version of this site that existed before had
unsourced one-to-ten "sustainability" ratings, and the whole point of replacing them was to
stop inventing numbers. Of the 41 materials with reserves, 2 read tight, 30 worth watching
and 9 comfortable.

## Ways to read it

- **Your share.** One switch divides every figure between the 8.2 billion people alive (UN
  2024). The world takes 50 billion tonnes of sand a year; you take about six. The live
  counter reframes with it, down to grams, because one person's share of one second is not
  measured in tonnes.
- **Nine buckets.** A strip above the list gives the year's tonnage per class, so 180 rows
  can be read as minerals 62, composites 30, fossils 16, biomass 11, and so on, in billions
  of tonnes. Each bucket is also a filter.
- **By country.** 90 materials record their top producers, so the list can be filtered to
  one place. Chile gives copper, boron, molybdenum, lithium, iodine and rhenium, each card
  saying what share of world output comes from there. The filter lives in the URL.
- **Side by side.** Add up to four materials to a compare tray and see them on the numbers
  that matter: made each year, carbon per kilo, how much comes back, how long it lasts, how
  heavy it is. Shareable as `#vs=steel,aluminium,carbon-fiber`.
- **Shuffle**, or press `r`, opens something at random. It is the best way to find the
  materials nobody goes looking for.

## Saying what is being shown

Filtering used to change every number on the page silently. A line above the list now names
each active filter as a chip with an off switch: **Showing · My share × · Made in Chile ×
· Clear all**. Per-person mode also reframes the bucket strip, so it cannot say "billions of
tonnes" while the cards below say kilograms.

## Icons, sparingly

Icons went in everywhere first and it was too much: a glyph on all 180 cards, another on all
twelve panel headings. Cards already carry a rendered specimen, which does that job better,
and headings are read once. They now appear only where nine categories repeat as a set: the
bucket strip and the settings tabs. There is a test that fails if they creep back onto cards
or headings.

The three controls in the top bar are inline SVG rather than emoji, so they take the ink
colour, stay crisp in both palettes and look the same everywhere: shuffle, light or dark,
and settings. Theme sits outside the settings panel because it is the one people reach for
most.

## Choosing how much detail

The settings button opens a tabbed panel, or press `s`, in the shape the `body` project in
this repo uses: a fixed nav down the side, one pane at a time, a quiet footer.

| Look | Theme, movement, little pictures |
| Numbers | The world's figures or your own share, what sizes are compared against |
| Detail | How much each material shows |
| About | Where the two headline numbers come from, and the keyboard shortcuts |

That last tab is also where the provenance for the counter went. It used to sit under the
headline as a paragraph of citations, which buried the number it was supporting; it now
lives in the About tab and in the page's own About section. A slider runs from *Just the basics* to *Everything*, and each of the twelve sections has a threshold on it, so the slider is one
number rather than five hand-maintained lists that can drift apart. Ticking an individual
section takes over from the slider and the hint changes to *(your own set)*. Both persist.

## Nothing is fetched from anyone else

three.js and Space Mono are vendored into `vendor/`. The page previously pulled 1.4 MB of
JavaScript from jsdelivr and its typeface from Google Fonts, which meant it lost its 3D and
its type on a blocked network or offline, and announced every visitor to Google. A smoke
check now fails if any request leaves the origin. Only the latin subset of each weight is
shipped, 19 KB in total, and the 700 face is not preloaded because after the heading fix
nothing renders bold Space Mono.

There are also `og:` and `twitter:` tags and a `share.png`, which there were not before, so
links stop previewing as a blank rectangle.

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

`/` search · `j` `k` move · `Enter` open · `Esc` close · `c` pause · `t` light or dark · `s` settings · `r` shuffle

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

# layout across phone, tablet and desktop
NODE_PATH=/tmp/matsmoke/node_modules node tests/devices.mjs

# end-to-end in a real browser
mkdir -p /tmp/matsmoke && (cd /tmp/matsmoke && npm i puppeteer-core@23)
(cd .. && python3 -m http.server 8642 &)
NODE_PATH=/tmp/matsmoke/node_modules node tests/smoke.mjs
```

`tests/devices.mjs` walks the layout across five screen shapes, including the Android
Chrome "Desktop site" case that reports 980px.

`tests/smoke.mjs` checks 84 things including that no list shows a material it cannot
measure, that the tab labels and the About legend cannot drift apart, WebGL initialisation, that card specimens
actually contain rendered pixels, **that scrolling the grid issues zero draw calls**, that
no em dash survives anywhere in the rendered page, that the phone layout puts the bar at the
bottom, that the counter advances, dialog focus handling, and zero console errors.
