# Diggg: Find Fossils — Design

## Pitch

**Year 102,025.** PROBE DG-3 lands on a quiet, overgrown Earth with one mission:
recover the legendary *Tyrannosaurus rex*. Tunnel down through the strata —
**down is back in time**, and the first layer is the Anthropocene (smartphones,
sneakers, *Homo sapiens*: catalogued with the same deadpan care as trilobites) —
excavate era-accurate fossils, run them through the lab, build the museum.

## Core loop

```
LASER DOWN → pull a BONE (species scatter 1–6, buried as separate pockets)
   ↑                                              ↓
MUSEUM assembles ← MOUNT ← STABILIZE ← IDENTIFY ← PREP   (four lab minigames)
```

The satchel cap of 3 forces the trip back up — via **the winch**: press `K`
underground and a rig materialises at the surface above you, reels you up as a
ragdoll (real pendulum: A/D sways, Space lets go), and POPS you out of the hole.
Extraction ignores terrain — it's a winch, not a climb.

Every lab step is a lore-accurate **minigame** (`game/minigames.js`): **prep**
(mechanical prep — slow strokes; fast scrubbing near the bone chips it and can
DESTROY the fragment), **identify** (comparative anatomy — pick from three
same-stratum silhouettes), **stabilize** (consolidant — release inside the zone),
**mount** (place the bone in the correct skeleton slot). You collate whole
skeletons bone by bone; the museum mount ghosts in as you go.

## The world

**Vertical = time.** Ten strata, shallow → deep, from Anthropocene rubble to
Precambrian basement rock. Real relative ordering and honest `mya` labels; the
thicknesses are game-scaled, not km-accurate (a whole planet won't fit on a
canvas). Crossing a boundary shows a banner. Deeper rock isn't harder — just
darker and stranger (the lantern glow carries the mood).

**Horizontal = 3 biomes** — Tundra, Badlands, Coast — blended left→right. A biome
weights which fossils appear: marine giants under the Coast, ice-age megafauna up
top in the Tundra, dino country in the Badlands. A fossil only spawns where its
**period matches the stratum** AND its **environment fits the biome**, so every
find is lore-legal by construction.

## Fossils

32 species at launch, spanning all ten periods (see `content/fossils.js`).
Rarity (common → legendary) sets spawn weight and museum value. Each is a
footprint of special rock; dig any tile of a site and the whole encased specimen
pops into your satchel — unidentified until the lab's Analyzer flips its card.

## The lab

Four stations on the surface camp; `E` opens each station's minigame. A bone
walks: **Prep Bench** → **Comparison Desk** → **Consolidant Rig** → **Mount**.
The camp span is a no-dig zone — homebase stays intact.

## Controls

`A`/`D` or arrows move · `Space`/`W` jump · **walk into a wall to dig it** ·
`S` dig down · `K` reel home on the pulley · mouse: precise dig · `E` operate a
station · `Tab` collection · `Esc` pause. Digging is always 1 hit — the game is
about discovery, not labour.

## Look & feel

**Field journal**: wood-grain frames, parchment, sepia ink, one ocher accent —
and as little text as the experience allows (icon satchel, `E` key-caps, bone
pips, ages always as "X–Y million years", never era names before discovery).
The rover is the real one: black chassis, chain-link treads, yellow/red wires,
cyan OLED eyes with moods (blink/sleepy/drive/squint/happy/dizzy). Terrain: two
masters composited per macro-cell + within-stratum depth shading + accents +
dithered boundaries; carved air shows a darkened back wall. Headlights are a
wall-clipped raycast cone from the rover's base. Ambient life everywhere: birds,
butterflies, critters, swaying grass; drips, dust motes, pebbles, deep bats.
Post-process (scanlines/vignette/grain/breathing) + JP brass audio on top.

## Progression & save

Score = sum of displayed fossils' values; the Collection is a fossil-dex with
per-era completion. Everything persists to `localStorage`: the world seed, your
dig/place deltas (world is re-derived from seed + replayed), the collection, and
in-progress session state (satchel, position). Autosaves every 10s and on
showcase / pause / scene exit.

## Deferred: Story Mode

The v2 prototype's "unfurl" (the dig quietly stops being a normal game — buried
doubles, an inverting palette, a loop through the world's crust) lives behind
`FLAGS.STORY_MODE` (off) with its beat table in `game/story.js` and the full
reference build preserved at `poc/game.js`. It re-enters on top of this loop
later; the core game is the priority now.

## v4 "Awaken" - the survival-crafting reboot

Playtests demanded more planet, less prelude. v4 changes the fantasy: you are
not a delivery mechanism for a museum - you are a small machine surviving on a
bare world and rebuilding paleontology from garbage upward.

- **Awaken, don't land.** `scenes/awaken.js` is a 3s boot log; the game HUD then
  powers on element by element (`opts.boot`). No pre-built base: only the tipped
  crash pod (entity #1, `game/entities.js`) with a 4-tile awning of real T_ROOF
  tiles. The pod is default home and a fold-out field lab until stations are
  buildable (M3).
- **Power** (`game/power.js`): laser/scan spend battery, the sun refills it.
  Low = sluggish tools; reserve = tools offline, speed x0.7, charge floors at
  2%. Traversal and the winch are always free - pressure, never death.
- **Wetness** (`game/status.js`): rain on an uncovered probe soaks it (sparks,
  slow); cover = any solid tile above (caves, overhangs, built roofs all count
  via one column scan). Sun dries. Soaked will drop items in M2.
- **Building** (`game/build.js` + `content/buildables.js`): B toggles build
  mode; soil + roof cost regolith (every 3rd dug tile pays 1) so shelter never
  depends on machines. Machines are entities; tiles go through world.place
  (now typed: T_PLACED | T_ROOF). Right-click refunds machines fully.
- **Quests** (`game/quests.js` + `content/quests.js`): data-driven, triggered by
  events (`rain-soon`, `power-low`, `bone-first`, `built:<id>`...), chains, or
  predicates. The old tutorial is the `boot` quest verbatim. Rain is gated off
  until calibration + 90s, and telegraphs ~15s ahead via the weather crossfade.
- **Scan truth** (`game/features.js`): one module decides where cave features
  exist; render, scanner, and highlight all consult it. Known mushrooms and
  crystals harvest with E into the material inventory (`game/inventory.js`).
- **Save v2**: world width changed (364) and the world contract with it; v1
  saves reset, settings carry over (`core/save.js` peeks the old key).

The road ahead (docs/ROADMAP.md): M2 garbage economy with a watchable, sun/wind
powered Reclaimer; M3 seven biomes, stratum hardness + laser tiers, gas pockets
and cave-ins answered by support pillars; M4 capture/raise fauna and true
resurrection - released species joining the living world.

## v4 M2+M3 - garbage economy + a deep, dangerous world

- **Garbage economy** (M2): ~90 junk deposits in the anthropocene band (grey
  glints). Digging one fills the raw-junk hold; the **Reclaimer** (buildable)
  runs a watchable wash → shred → extract cycle per item into a visible output
  tray, with a peek panel (queue, stage bar, powered lamp). It runs on **sun or
  wind** - `env.wind01()` peaks in the storms that drive you indoors - or an
  adjacent Solar Panel / Wind Vane. Soaked now drops a satchel bone as a
  recoverable ground pickup.
- **Seven biomes** (M3): tundra · wetland · badlands · savanna · ash flats ·
  crystal barrens · coast. Biome data now owns grass colours, scenery types and
  densities (shared with the scanner via features.js - still no phantom flora),
  snow, and fauna weights. Six new creatures (stilt wader, dust mole, cinder
  crab, prismfly, gleamback, ashworm) ride the fauna registry; crystals grow
  shallow under the barrens.
- **Depth resists** (M3): stratum hp curve 1→8; the laser upgrades at the pod
  (U) - mk2 (6 crystal + 4 glow caps) and mk3 (14 crystal + 6 regolith) cut
  2x/4x. Damaged rock shows cracks.
- **Hazards** (M3, `game/hazards.js`): trapped **gas** (olive speckle) releases
  buoyant clouds that stun after 2s exposure and vent up shafts you dig;
  **cave-ins** drop wide unsupported ceilings as rubble (paying out regolith) -
  a 1-tile pillar (Q = flick a soil block) splits the span. Creaks telegraph.
  No weapons, only engineering.

## v4.2 - precision, real liquids, real science

- **Click-lock digging**: a mouse press latches ONE tile; the beam stays on it
  until it breaks (game/digging.js). An amber outline (peekTarget) always shows
  the next cut. Wall auto-dig unchanged - tunnels are 1-tall, stairs are yours.
- **Liquids**: FLUID_SPECS viscosity gates the flow CA per fluid. Water pours,
  brine (deep hypersaline aquifers - you float) sloshes, lava creeps, tar
  (natural asphalt seeps) barely moves and grips the treads. The basement below
  ~depth 380 is stamped with magma chambers.
- **Science pass**: internal ids stay, names went real - Saiga, Purple Frog,
  Olm, Fire-chaser Beetle, Motyxia, Pompeii Worm, Mycena luxaeterna, selenite
  (Gypsum Barrens), PET/mild steel/vulcanized rubber/PCB salvage. Codex stats
  carry true facts; the journal grid is now an illustrated bestiary
  (render/codexart.js draws every entry from in-world primitives).
- **HUD v3** (render/hud.js): four fixed regions - STATUS (TL), QUEST (TC,
  measure()-sized banner + centred checklist), CARGO (TR), TOOL + BUILD bar
  (bottom). Build bar uses procedural icons + material-glyph costs. I opens the
  hold manifest (materials with uses, junk with reclaim yields, satchel states).
- **Bootstrap fix**: scrap-metal and bottle deposits hand-salvage +1 crude unit
  on dig, so the first Reclaimer is always reachable; the scanner reads deposit
  types through rock.
