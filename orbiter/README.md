# ORBITER

**Wondervoid** — THE MONOLITH: a brutalist hull grown from Voronoi cells,
light seams tracing every joint, with one porcelain Atrium at its heart —
the Wondergate, and NOVA, the resident infinity. Everything else you grow:
chambers and hallways bloom slot by slot until your station reaches the
sealed observation bays waiting in the hull. Brutalist outside; mushroom-
Orokin porcelain, vines, and starmap floors inside.

Design doc: `docs/DESIGN.md` (v4 at the bottom).

## The Shipyard (multiple ships, one build)

`/` is a **gallery** of every recoverable hull. It's a Vite multi-page app:

- `/` — the SHIPYARD gallery hub (`index.html`)
- `/ships/carrier/` — **The Carrier** (slice 1, the OG amusement-park hull,
  recovered from git commit `205b87e`)
- `/ships/monolith/` — **The Monolith** (slice 6, current — Voronoi hull +
  organic growth + NOVA)

Add a ship: drop `ships/<name>/index.html` + `ships/<name>/src/`, then list it
in `vite.config.js` (`build.rollupOptions.input`) and in the `SHIPS` array in
the root `index.html`. `public/` (HDRI, posters) is shared across all ships.

Slices 2–5 (Hive Carrier, The Blossom, OCTAVE) were overwritten before being
committed and survive only in `docs/DESIGN.md` — reconstructable on request.

## Run

```sh
npm install
npm run dev      # http://localhost:5173  → the gallery; pick a ship
npm run build    # static bundle in dist/ (hub + both ships) — deploy to CF Pages
```

## Controls

| input | action |
|---|---|
| Space / click | skip the opening dive (click also starts the audio) |
| drag / scroll | orbit, pan & zoom the Blossom (management view) |
| **N** | **Nova Console** — powers 1-8 + **9 Grow Chamber · 0 Grow Hall** |
| G | walk — WASD + mouse, **Space = VOID JUMP** |
| B | build palette — blink structures into any cell |
| F | free-fly · M mute · Esc close/cancel/exit |

## The flower (walk it — every wall between cells is a portal)

**The Atrium** (Wondergate, reflecting pool, garden terraces, seed lamps) ·
The Midway · Meadow Cell · Dune Cell · Tundra Cell · Spore Grotto · Tide Cell.
Each biome cell connects to the Atrium AND both ring neighbours — there are
no dead ends anywhere. First entry earns one of NOVA's memories; find all
seven and she asks whether you've counted the cells from outside.

## NOVA

Formless. ~3,200 particles hovering inside the Wondergate, morphing between
shapes she finds amusing. She condenses when she speaks, flares when reality
bends, and a wisp of her follows you in walk mode. Powers: Blink Planet
(gravitational charge → shockwave), Gravity: Optional, Time Warp, Warp Drive,
Disco Nova, Teleport, Scale Shift, Paint the Void, Blink Room. Every void
jump skips the whole ship light-years — watch the stars.

## Pipelines

- **Audio** (`src/audio.js`) — fully synthesized WebAudio: deep-space drone
  ambience + SFX, zero assets; `loadAudio()` slot for real files.
- **Assets** (`src/assets.js`) — GLTF/GLB (meshopt) + HDRI environment
  (a Poly Haven night HDRI ships). CC0 sources: Poly Haven, Kenney,
  Quaternius, ambientCG.
- **Quality** (`src/quality.js`) — 4 tiers + FPS watchdog; potato tier sheds
  shadows/bloom/FX/accent lights. `?quality=0..3`.

## Architecture notes

- `src/config.js` — flower layout (CELLS, PORTAL, PALETTE) + WORLD flags
- `src/orokin.js` — lathe toolkit: ring portal, vase columns, rib vaults,
  seed lamps, solar petals (no boxes allowed)
- `src/cells.js` — shared-wall hex shells: portal arches, oculus crowns,
  clerestories, merged glass/mullions (instancing discipline is load-bearing)
- `src/atrium.js` — the heart + the walk-region graph (hex polys + rotated
  portal rects via `src/regions.js`)
- `src/nova-entity.js` — her
- slice-1 rides live on in `src/park/` behind `WORLD.defaultRides`

## Dev scripts (need `npm run dev` running)

```sh
node scripts/shot.mjs 16 out.png             # cinematic screenshot at t=16s
node scripts/walkshot.mjs x z lx lz out.png  # FPV screenshot anywhere
node scripts/novasmoke.mjs                   # fire all powers headless
node scripts/perf.mjs [tier]                 # fps / draw calls per tier
```
