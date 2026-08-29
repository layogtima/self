# JAR

**A terrarium in a text file.**

One sealed 2D world where matter falls, heat diffuses, water cycles, things grow,
things eat, things die, and death feeds growth. Not a game yet — a *testbed*: the
deepest closed-loop simulation Canvas 2D can carry, instrumented properly, to find
out where the fun and the frame budget actually live before designing a game on top.

Lineage, honestly stated: Noita's falling-sand matter, ONI's thermal/state-change
layer, Dwarf Fortress's "the world keeps happening," Creatures' ambition that life
should be simulated, not scripted.

## Architecture

The sim is **pure and headless**. `sim/` has zero DOM references except
`render.js` (the only file allowed to know what a canvas is):

```
createWorld(seed, config)   sim/world.js    — all state in parallel typed arrays
tick(world)                 sim/tick.js     — fixed pass order, per-pass timings
render(world, canvas, view) sim/render.js   — browser only
hashWorld(world)            sim/world.js    — FNV-1a over every buffer
```

**Tick order (fixed, never reordered casually):**
heat diffusion → state changes → matter movement → life (incl. per-column light
scan) → creatures → bookkeeping.

**Determinism:** one seeded mulberry32 owned by the world (`sim/prng.js`); all
randomness flows through it. Same seed + same inputs = identical world, forever.
`hashWorld` is the regression contract.

## World layers (one index space, 256×384 = 98,304 cells)

| layer | type | purpose |
|---|---|---|
| `material` | Uint8 | what occupies the cell (14 materials) |
| `temp` | Float32 ×2 | heat field, double-buffered, per-material conductivity |
| `nutrient` | Float32 | decay products; percolates down, held by soil & mycelium |
| `energy` | Uint8 | life energy for plant cells |
| `meta` | Uint8 | per-material scratch (age, burn timer, soil-born flag) |

Light is computed per tick, not stored: a per-column scan from the lid down.
Canopy shades itself; phototropism falls out for free.

## The loop (mass conservation is the whole point)

Every conversion is 1 cell ↔ 1 mass unit; energy (from light) is the only thing
that enters the jar, mass never does:

```
seed → plant → (grazed | dies | casts seed)
plant growth: nutrient −1 → plant +1        (roots tap a ball of soil below)
death → deadmatter → mycelium → nutrient +1 (soil-born mycelium reverts to soil)
grazer: eats tips → energy + gut → droppings/carcass → deadmatter → …
burning: plant → fire → smoke → settles out as nutrient ash. Even fire leaks nothing.
```

Two conserved quantities, asserted by the longevity test:
**water mass** (water+ice+steam — drift must be exactly 0) and **organic mass**
(cells + nutrient + agent mass-equivalent — drift beyond float rounding is a bug).

The vertical ambient gradient (warm floor, cool lid) is the weather system:
heat the pond and steam rises, condenses under the lid, and falls back as rain.

## Bench & regression

```
node bench.js                        # 3000-tick perf run, Genesis, seed 1
node bench.js --seed 7 --ticks 9000
node bench.js --preset drought
node bench.js --grid 384x576         # desktop-stretch grid
node bench.js --longevity            # 200k ticks (~2 sim-hours) + PASS/FAIL
```

Prints per-pass ms percentiles and the final `hashWorld`. Any refactor that
changes the hash for a fixed seed is a physics change and must be intentional.

Longevity PASS = grazers alive ∧ plants alive ∧ mycelium alive ∧ water drift 0
∧ organic drift within ε. The jar must not need you.

## Ecosystem tuning notes (collapses observed en route, kept as data)

- Mycelium with unconditional soil-creep ate the entire bed (33k cells by 30k
  ticks). Soil-creep is now gated on active digestion; spores on corpses restart
  decomposition anywhere.
- Grazers that eat whole plants exterminate their food and starve (55 → 0 by
  30k). They now browse canopy tips only; the stalk regrows.
- Cast seeds that can't tumble diagonally sit on their parent stalk forever —
  blocking growth, unable to germinate. Seeds now roll off like sand.
- Plants stall when their root ball (the soil column below) is exhausted;
  lateral nutrient diffusion through soil recharges it.

## Run the lab

Any static server: `python3 -m http.server`, open `index.html`.
Space = pause · `.` = single tick · 1–5 = layer views (normal / ironbow temp /
viridis nutrient / light / material-ID) · brushes paint matter, heat, life ·
presets are seeded one-click scenarios · every tuning constant is a live slider
with JSON export/import · CSV export of the time-series recorder.

Out of scope for v0.1: multiple species, learning creatures, gas pressure, a
moisture field, weather scripting, world saves (seed + config JSON *is* the save
format), WebGL, workers (the sanctioned v0.2 escape hatch — the headless core is
what makes that migration trivial).
