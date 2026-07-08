# Content Guide — adding to Diggg

All game content is **pure data** in `src/content/`. No logic lives there, so you
can add species, strata, biomes, and lab stations without touching engine code.
`node tests/run.js` validates every change and will fail loudly on a mistake — it
is your contributor lint.

---

## Add a fossil

Edit `src/content/fossils.js` and append one object to the `FOSSILS` array:

```js
{
  id: 'plesiosaur',          // unique, kebab-case. THIS is the sprite filename.
  name: 'Plesiosaur',        // shown once identified
  latin: 'Plesiosaurus dolichodeirus',
  period: 'jurassic',        // MUST match a stratum id in strata.js
  environment: 'marine',     // marine | terrestrial | freshwater | any
  rarity: 'rare',            // common | uncommon | rare | legendary
  footprint: [5, 2],         // tiles wide × tall it occupies in the rock (1..5)
  lengthM: 3.5,              // real length in metres — shown on the dossier card
  value: 68,                 // museum points when displayed
  blurb: 'Long-necked marine reptile that rowed with four flippers.',
}
```

Rules the tests enforce:

- `id` unique and kebab-case
- `period` exists in `strata.js` (keeps the game lore-accurate — a Jurassic animal
  only spawns in the Jurassic layer)
- `environment` and `rarity` from the allowed sets above
- `footprint` values within `1..5`
- `lengthM` a positive number (the dossier card's scale line)

**Biome fit** is automatic: `environment` is weighted by the biome the column sits
in (see `biomes.js`). A `marine` fossil is common under the Coast, rare under the
Tundra. You don't wire this up — it falls out of the data.

### Pixel art (drop-in, optional)

The game ships fully playable with **procedural bone silhouettes** generated from
each fossil's footprint + id hash. To replace one with real art:

1. Make a PNG sized **`footprint.w × 16` by `footprint.h × 16`** pixels
   (e.g. a `[5,2]` fossil → **80×32 px**), transparent background, pastel bone
   tones to match the palette.
2. Save it as `assets/sprites/fossils/<id>.png` (exact `id`).
3. Reload. `src/render/sprites.js` auto-loads it; no code change. If the file is
   missing or fails to load, the procedural silhouette is used forever — the game
   never blocks on art.

**Stratum textures** follow the same pattern: `assets/tiles/<stratumId>.png`
(64×64, seamless) and the terrain renders from it; otherwise the procedural
atlas (banding + speckle + era motifs) is used.

To generate art: `node tools/generate-assets.mjs` (see README — versioned saves,
nothing wasted, `--promote` to choose takes).

---

## Add / retune a stratum

Edit `src/content/strata.js`. Strata are ordered shallow → deep and their `depth`
ranges must stay **contiguous** (each entry's `to` equals the next entry's `from`;
the last is `Infinity`). Fields: `id`, `era`, `mya` (display), `depth` (tiles), `hp`
(shovel hits per tile), `colors` (four pastel tokens), `texture` (`banding`,
`speckle` strengths, 0..1, feed the procedural tileset).

The tileset atlas (`src/render/tileset.js`) is **pre-rendered at boot** from these
colours + texture params — change a colour, the rock re-bakes automatically.

---

## Add a biome

Edit `src/content/biomes.js`. Biomes tile the world horizontally by `range`
(fractions of world width, left→right). `envWeights` multiplies fossil spawn
chance per environment. `foliage` + `surfaceTint` drive surface look.

---

## Add a lab station / pipeline step

Edit `src/content/stations.js`. A station advances a specimen from `input` state
to `output` state on a hold-E timer. To insert a step, add a state to
`SPECIMEN_STATES` (order = pipeline progress) and a station whose `input`/`output`
bracket it. `game/stations.js` needs no change — it reads this data. Replacing the
hold-to-fill bar with a real minigame is a per-station job for later; the data
contract stays.

---

## Where logic lives (don't put content here)

- `src/world/` — generation + mutable world state
- `src/game/` — player, digging, satchel/specimen, stations, collection
- `src/render/` — palette, tileset, sprites, particles, text
- `src/scenes/` — title, settings, game
- `src/core/` — rng, input, camera, audio, save
