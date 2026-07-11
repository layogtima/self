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
`S` dig down · `K` winch home · **`Ctrl` swaps tool (laser ↔ scanner)** ·
mouse = aim · `E` interact / harvest · **`B` build** · `Q` flick a soil block ·
`H` mark home · `U` upgrade the laser (at the pod) · **`I` hold manifest** ·
`Tab` field journal · `Esc` pause.

You **awaken** beside the pod you came down in, on a bare planet. **Rain rusts
you** - sparks, sluggish treads - so your first job is cover: dig dirt for
regolith, press `B`, and roof yourself in (the pod's tiny awning shelters you
day one). Your **battery** runs the laser and scanner and the **sun refills
it** - tools brown out at low charge but you can always crawl home. **Quests**
guide themselves from what you discover; the HUD (power, depth, satchel,
materials, status, home arrow) boots up around you as you wake.

The topsoil is full of the old world: dig **garbage** (grey glints), feed it to
a **Reclaimer** you build, and watch it wash → shred → extract into pure
materials - it runs on sun or wind, so storms power your machines while you
shelter. **Seven biomes** stretch across the world (tundra, wetland, badlands,
savanna, ash flats, crystal barrens, coast), each with its own flora, grass and
creatures. Deep rock is chewy: upgrade the laser at the pod (`U`) with cave
harvests. Down there, **gas pockets** vent up shafts you dig, and wide ceilings
**cave in** unless you drop a support pillar (`Q`).

Found **bones look like bones** (a spine looks like a spine); clean, compare
against same-bone cousins, stabilize, and mount each into the growing skeleton -
a species is only revealed when its last bone is placed. `E` at the pod runs the
**fold-out field lab** until you build real benches where you want them.
**Scan mode** (Ctrl) highlights exactly what it will catalogue, and known
**glow mushrooms + crystals harvest** with `E`. Dig into a cave and **water
flows** into your shaft; go deep and **lava glows** (and flings you back to the
pod). Creatures come and go with the time, sky and biome (butterflies by day,
fireflies at night, frogs in the rain, one lonely crab on the ash).

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

## The living planet

A day/night cycle (~7 min) and a weather engine (clear ⇄ overcast ⇄ rain → storm,
snow in the tundra) drive the sky, wind-swayed foliage, rain/lightning/thunder,
crickets at night — and the **lighting**: the rover's wall-clipped headlight cone
aims at your mouse and matters on the surface after dark, when the platform's
deck lamps and the glow-mushrooms below become beacons. Surface fauna (grazers,
hoppers, lizards) and cave dwellers (salamanders, spiders, glowworms) flee your
treads. Duplicate bones convert to **genome samples** — at 100% a species turns
*viable* and the incubator pod lights up. Resurrection is coming.

## Roadmap

- **Resurrection**: hatch viable species from the incubator; living dinos on the surface
- Wildlife observation/interaction (the fauna already have brains)
- Real pixel-art fossils (drop-in slots already wired)
- Re-enable **Story Mode** (`poc/game.js` is the reference)
