# Diggg: Find Fossils

**Year 102,025.** You are PROBE DG-3, sent back to Earth to recover one relic:
the legendary *Tyrannosaurus rex*. Laser down through the strata — **down is back
in time**, starting with the Anthropocene (their phones, their sneakers, them) —
**collate scattered bones** (never whole skeletons), and run each through the lab
to slowly assemble the museum. Zero dependencies, no build step, native ES modules.

![monochrome → pastel](docs/DESIGN.md)

## Run

```bash
npm run serve       # python3 -m http.server 8642
# open http://localhost:8642
```

Any static file server works; there's no build. (ES modules need to be *served*,
not opened as `file://`.)

## Play

`A`/`D` (or arrows) move · `Space` jump · **walk into a wall to laser it** ·
`S` dig down · `K` summon the winch and ride it home (A/D sways, Space lets go) ·
mouse = precise cut · `E` start a lab minigame · `Tab` field journal · `Esc` pause.
(You can't dig under the camp.)

Laser down, pull **bones** from the ground (a species scatters 1–6 bones nearby),
`K` home, then run each bone through the lab: **prep** it (slow strokes — scrub
too fast near the bone and it crumbles, lost forever), **identify** it by
comparative anatomy, **stabilize** it with consolidant, then **mount** it in the
right slot. The museum skeleton assembles bone by bone. Complete the rex.

## Test

```bash
npm test            # node tests/run.js
```

- `tests/behavior.test.js` — logic + **content lint** (fossil/strata/biome schema
  validation; a bad content entry fails the build)
- `tests/render.smoke.js` — every scene boots and renders across all strata

## Structure

```
src/
  config.js      tunables + FLAGS (STORY_MODE off)
  main.js        boot + fixed-timestep scene manager
  core/          rng · input · camera · audio · save
  render/        palette · tileset (pre-baked atlas) · sprites · particles · text
  world/         worldgen (seeded, lore-legal fossils) · world (mutable state)
  game/          player · digging · fossils (satchel) · stations · collection · story (stub)
  scenes/        title · settings · game
  content/       strata · biomes · fossils · stations   ← pure data, edit freely
assets/sprites/fossils/   drop <id>.png here to replace a procedural silhouette
docs/            DESIGN.md (GDD) · CONTENT.md (how to add content + art contract)
poc/             the v2 monochrome "unfurl" prototype, archived
```

## Generated assets (RetroDiffusion)

`tools/generate-assets.mjs` generates pixel art via the RetroDiffusion API
(key in `dig/.env` as `retro=`, git-ignored). Every result is kept —
`assets/gen/<cat>/<id>_vNNN.png` + `manifest.json` — and auto-promoted to the
live path if none exists. `--dry` estimates cost, `--id <id>` forces a new take,
`--promote <id> <n>` swaps which version is live. Missing art always falls back
to procedural rendering; the game never blocks on assets.

## Adding content

See **[docs/CONTENT.md](docs/CONTENT.md)** — add a fossil in ~8 lines of data,
drop in a PNG whenever the art's ready. The procedural silhouettes keep the game
playable until then.

## Roadmap

- Real pixel-art fossils (drop-in slots already wired)
- Per-station excavation minigames (interface already abstracted)
- Rope-over-terrain wrapping for the pulley (v1 is a straight-line constraint)
- Museum layout / visitors
- Re-enable **Story Mode** (`poc/game.js` is the reference)
