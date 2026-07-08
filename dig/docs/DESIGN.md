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
