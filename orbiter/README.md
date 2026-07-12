# ORBITER

**Wondervoid** — an interplanetary amusement park aboard a kilometer-scale orbital
carrier. Sim Theme Park in space: cold vacuum outside, churros and artificial
gravity inside.

Slice 1: one scene. Trailer-style opening flythrough that dives through the
viewport glass, a holographic concierge (Auntie Nova), and your first buildable
ride. The rest of the campaign lives in the GDD.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/ — deploy to Cloudflare Pages
```

## Controls

| input | action |
|---|---|
| Space / click | skip the opening cinematic |
| drag / scroll | orbit & zoom the park (management view) |
| B | build mode — place a Gravity Whirl (⬡ 6,000) |
| G | walk mode — first-person, WASD + mouse look, Shift run |
| F | free-fly: drag to look, WASD + Q/E, Shift boost |
| Esc | cancel build mode / exit walk mode |

In walk mode you can roam the park at ground level among the guests, then
head through the fore/aft doorways into the (currently empty) ship concourses.

## Dev scripts

Headless checks (need the dev server running):

```sh
node scripts/shot.mjs 16 /tmp/shot.png   # screenshot the cinematic at t=16s
node scripts/interact.mjs                # end-to-end flow: advisor → build → fly
node scripts/perf.mjs                    # fps / draw calls / triangles
```

## How it's put together

Vanilla JS + three.js + Vite, no assets — everything is procedural geometry,
canvas textures, and seeded RNG (`src/rng.js`, seed 42 shapes the hull).

- `src/ship.js` — carrier hull: merged box massing (3 draw calls), instanced
  greeble pools, ~2.6k emissive window strips, blinking nav lights
- `src/glass.js` — habitat block, chamfered-octagon viewport, fresnel glass,
  interior haze, marquee + balcony back wall
- `src/park/` — deck, ferris wheel, coaster (CatmullRom track, speed swings
  with height), carousel, drop tower & props, 300 instanced guests
- `src/space.js` — starfield shells, ringed gas giant, moon, traffic, dust
- `src/cinematic.js` / `controls.js` / `build.js` / `advisor.js` — the game
- `src/lights.js` / `post.js` — cold sun vs warm interior; bloom, grade, grain
