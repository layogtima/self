# Diggg: Find Fossils

**Year 102,025.** Probe DG-3 wakes alone on a post-human Earth. Dig down through
deep time — every metre is a million years back — scan the living, salvage what
the makers left, read the strata, and bring the extinct back to life.

A survival-crafting paleontology game in **vanilla JS + Canvas 2D**. Zero
dependencies, zero build step, native ES modules. The title screen is the real
game engine playing itself: an endless narrated autopilot loop (THE FIELD
RECORD) that doubles as the shippable trailer.

## Run

```bash
npm run serve       # python3 -m http.server 8642
# open http://localhost:8642
```

Any static file server works — there is no build. (ES modules must be *served*,
not opened as `file://`.) Deployment = copy the `dig/` directory to any static
host. `dev.html` is a local-only dev dashboard; exclude it (and `.env`, already
git-ignored) from deploys.

`index.html?trailer` hides all title chrome for clean trailer capture.

## Play

`A`/`D` (or arrows) move · `Space` jump · mouse aims the headlight + laser ·
**click to dig** (click-lock precision) · `Ctrl` swap laser ↔ scanner ·
`X` deconstructor · `B` build · `E` interact / load machines / resurrect ·
`P` machine power switch · `G` rover umbilical (charge a machine by standing there) ·
`Q` soil pillar (cave-in support) · `H` mark home · `K` winch home ·
`U` laser upgrade (at the pod) · `I` manifest · `Tab` field journal · `Esc` pause.

**The loop:** rain rusts you, so roof yourself first. Dig garbage from the
Anthropocene topsoil and feed it to the **Smelter / Pyrolysis Vat / Ash Kiln**
(machines have batteries; sun and wind charge them). Scanning creatures and
flora unlocks blueprints (bio-lamps, lure, planter, terrarium). Fossil finds
grant **genome chunks** by rarity; a complete genome + an **Incubator** =
a living, breeding resurrected species. Deeper strata: water, tar, brine, magma
(lava + water hisses into minable obsidian), gas pockets, cave-ins, geodes,
and fossils that skew rarer with depth.

## Test

```bash
npm test            # node tests/run.js  (run from dig/)
```

- `tests/behavior.test.js` — 420+ logic tests + content lint (bad content data fails the run)
- `tests/render.smoke.js` — every scene boots and renders across all strata

## Structure

```
src/
  config.js      tunables: WORLD_W/H (4x world), tile ids, fluid caps, SAVE_KEY
  main.js        boot + fixed-timestep (1/60) scene manager; endFrame clears input edges
  core/          rng · input (incl. injectPress/userPressed/releaseAll) · camera · audio · music · save · lore
  render/        palette · tileset · backdrop (painted tiling biome art) · hud (visor) ·
                 cards (DG-3 scan cards) · lighting (sun-angled sky pass) · fauna · machines · particles · text
  world/         worldgen (seeded strata/biomes/caves/fluids/bones) · world (mutable state) · fluids (bounded CA + reactions)
  game/          player · digging · build · power · status · quests · entities (machines) ·
                 ambient (fauna lifecycles/mating/behaviors) · collection (genome) · environment (day/weather/sky events) · scan · features · hazards
  scenes/        title (FIELD RECORD) · attract (the autopilot reel) · awaken (boot log) · game · settings · pause
  content/       strata · biomes · fossils · fauna · materials · buildables · quests · lore.json  ← pure data, edit freely
assets/sprites/  live art (backdrops/ = 256×128 seamless tiling paintings)
assets/gen/      every RetroDiffusion take + manifest.json (versioned, promotable)
docs/            DESIGN.md (GDD) · CONTENT.md (add content + art contract) · ROADMAP.md (full change history)
tools/           generate-assets.mjs · fetch-freesound.mjs
```

## THE FIELD RECORD (the opening / trailer)

`scenes/attract.js` runs the game in **demo mode** (`makeGameScene(services,
{demo:true})`): saves are hard-gated off, seed fixed at 777, and a `_rig`
puppet handle drives the rover through six narrated chapters (awaken → dig →
scan → salvage → descend → resurrect) with real systems — a real scan card, a
real machine load, a real resurrection, every loop. The autopilot's key presses
are marked *synthetic* (`core/input.js`); the title starts only on
`userPressed()` human input, and `releaseAll()` guarantees clean handovers.
The awaken chapter strikes the previous loop's sets so nothing accumulates.

## Generated assets (RetroDiffusion)

`tools/generate-assets.mjs` generates pixel art via the RetroDiffusion API —
key lives in `dig/.env` as `retro=` (**git-ignored, never commit**; the file
also holds `freesound_client_id/secret` for the ambient-audio fetcher).
Results are kept forever in `assets/gen/<cat>/<id>_vNNN.png` + `manifest.json`
and auto-promoted to the live path if none exists. `--dry` estimates cost,
`--id <id>` forces a new take, `--promote <id> <n>` swaps the live version.
Missing art always falls back to procedural drawing; the game never blocks on
assets. API balance as of 2026-07: ~$14.

## Saves

`localStorage` key `diggg-save-v3` (settings migrate forward from v2/v1 via a
`SAVE_KEY_PREV` chain). Demo mode never touches it — guarded by test.

## Adding content

See **[docs/CONTENT.md](docs/CONTENT.md)**. All flavor text lives in
`content/lore.json` (probe-voiced, multiple variants per entry); codex entries,
fossils, fauna, biomes, buildables and quests are pure data files.

## Known state / next steps

- Full playtest-round history and current status: **[docs/ROADMAP.md](docs/ROADMAP.md)** (through v4.9d).
- `scenes/game.js` (~2400 lines) is the known housekeeping debt — its render
  helpers want extracting into `render/worldview.js` someday.
- Story Mode flag is off; `poc/` holds the archived v2 prototype.
