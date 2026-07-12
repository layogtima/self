# Fireflies — a game of light in the dark

You wake in a pitch-black cavern with a failing flashlight. Wild **fireflies**
drift in the dark. Sweep your beam across them and they're drawn to you — the
more you gather, the brighter your world becomes and the more they **sync into
harmony**, humming musical chords that turn dread into wonder. Different
fireflies have different gifts; guide the right ones to the right places to open
the way forward.

A crisp, no-build Three.js game. Zero dependencies, zero assets — all light,
sound, and creatures are generated at runtime.

## Play

```bash
cd fireflies
python3 -m http.server 8712
# open http://localhost:8712  → click the ring to descend
```

Wordless by design — there is no UI text. You begin already holding a small
swarm. To advance: gather the right colour of firefly and simply **bring them
close** to the matching glowing node — it drinks them and the way opens. Walk
into the exit ring and you slip seamlessly into the next cavern.

- **WASD / arrows** — move · **Mouse** — look (click to capture the pointer)
- **Hold Left-Click** — shine your beam; sweep it over wild fireflies to gather them
- Nodes activate by **proximity** — no buttons to press
- **Touch**: left half of screen = look + walk, right half = beam

## The fireflies

| Species | Colour | Gift | Musical voice |
|---|---|---|---|
| **Glimmer** | amber | light & warmth | root (A) |
| **Wisp** | cyan | *reveal* hidden light-bridges | fifth (E) |
| **Ember** | rose | *ignite* — burns away gloom barriers | third (C♯) |

Gather ≥3 of one species and they **sync**: they flash in unison, their light
swells, and their pad-voice blooms in. All three synced at once = a full major
triad rising out of the dark.

## Levels

1. **Awakening** — gather Glimmers, feed the pedestal, a gate lifts.
2. **The Broken Span** — Wisps reveal a light-bridge across a chasm.
3. **The Gloom** — Ember burns, Wisp bridges, Glimmer opens the last gate.

## How it's built

Pure ESM via an import map (`three@0.170` from jsdelivr) — no bundler.

```
index.html    importmap + HUD/overlay + boot-error surface
styles.css    vignette, HUD, title cards
src/
  main.js     bootstrap + state machine + game loop
  renderer.js WebGLRenderer + bloom post FX
  input.js    keyboard / pointer-lock / touch
  player.js   first-person movement, collision, headlamp + beam
  firefly.js  living fireflies (body + wings + glow), swarm, pooled lights
  audio.js    procedural synth: per-species pad voices, drone, chords
  world.js    cavern builder (boxes + region floors for chasms/bridges)
  puzzles.js  sockets, gates, light-bridges, gloom barriers, exit portal
  levels.js   the three hand-authored caverns
  ui.js       HUD + narrative cards
  util.js     species table, glow-texture helper, hashing
```

**Design notes**
- Fireflies are living creatures, not orbs: a dark occluding body + an emissive
  abdomen that blooms + soft aura + beating wings, driven by an abs-sine flash
  pulse (3 rad/s over a non-zero floor) and a two-frequency Lissajous wander.
- Lights are budgeted: fireflies glow via emissive + bloom; only a **pool of ~6
  point lights** rides the brightest gathered fireflies, so a big swarm is cheap.
- Falling into a chasm respawns you at the level entrance.

### Dev shortcuts (URL params)
- `?dev` — skip the start ring, begin playing
- `?level=N` — start on level N (0-based)
- `?dev&grab` — instantly gather every firefly (see the lit swarm + formations)
- `?dev&near` — stand on the first node with a full swarm (watch it charge & solve)
- `?dev&solve` — force every node solved (see the mechanisms fire)
