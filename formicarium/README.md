# formicarium — a living ant colony you speak to in chemistry

A 2D cross-section of a *Messor barbarus* (harvester ant) nest behind glass — and a
chemical interface for holding a **two-way conversation** with the colony. Accuracy first,
ambience second. No build step: plain ES modules + HTML5 canvas.

This is the resolution of a longer search (see `../dig`, `../diggg`): a real ant farm is
*already* a 2D cross-section behind glass, which is exactly dig's soul — legible data-cells,
depth as revelation — with the digging done by the ants themselves. You go from miner to
**observer of, and interlocutor with, a superorganism.**

## Run

```sh
python3 -m http.server 8644   # from this directory
# open http://localhost:8644
```

## The colony (accuracy-first)

Emergent behavior from local rules — no central control:

- **Founding → growth** — a claustral queen raises the first *nanitic* workers on her reserves,
  then lays continuously; brood develops **egg → larva → pupa → callow worker** on real
  timescales (warmth + feeding speed it up).
- **Castes** — polymorphic **minors** (small, do everything) and **majors** (big-headed, the
  seed-millers), visibly dimorphic.
- **Excavation** — diggers chew soil into pellets and haul them to the surface rim; the nest
  grows itself into galleries + chambers.
- **Foraging + pheromone trails** — foragers leave, find seed **patches**, carry them to the
  granary, and lay **TRAIL** pheromone on the way home — recruiting others. Trails self-organize
  and evaporate.
- **Nursing** — nurses shuttle brood to the warm-humid sweet spot and feed larvae from the seed
  store (thermotaxis + trophallaxis).
- **Undertaking** — dead ants emit a **necromone**; undertakers haul them to the midden
  (necrophoresis — the real oleic-acid behavior).
- **Task by age polyethism** — young nurse, middle-aged dig, old forage; nudged by colony need.

## Talking to them — pheromones as two-way comms

You are DG-3, interfacing with the colony through its native language. The pheromone field is
**shared** — ants and you both write to it, which is what makes it a conversation, not a command:

- **DECODE (read)** — `P` toggles the decode overlay: the live chemical field glows (queen field
  violet, brood-hunger blue, trails amber, alarm red…). You *learn* each channel by watching how
  ants behave when it's active — a **semiochemical codex** fills, unlocking the ability to emit it.
- **EMIT (write)** — arm a decoded channel (`1`–`6`), then click/drag to pipette it into the field.
  Ants respond by their **real** rules: TRAIL suggests a route, ALARM scatters them, RECRUIT
  gathers them, NECRO makes them haul a spot to the graveyard. **Suggestion, not control** — your
  signal competes with their real trails and evaporates; over-emit and it's just noise.

## Above ground — a living garden

The outworld is a warm little garden: soft daylight, a grass lawn, and seed-bearing plant
stalks that shed seeds at their base. That's where harvesters forage — food comes from plants,
not from nowhere.

## Analysis (Oxygen Not Included × the DG-3 visor)

- **Colony vitals** — task-allocation bar (forage / dig / nurse / undertake), brood pipeline
  (eggs / larvae / pupae), seed-store meter, chamber count.
- **`T` task overlay** — colour every ant by its current job.
- **Click an ant** → a **DG-3 field-analysis card**: caste, age + life-stage, task, crop meter,
  carrying, a plain-language **intent** ("hauling a seed to the granary") and a **prediction**
  ("will recruit others with a trail").
- **Macro zoom** (scroll) from whole-tank to a single ant's segmented body, legs, and antennae.

## Controls

| input | action |
|---|---|
| scroll | zoom |
| drag | pan |
| click an ant | inspect |
| `P` | toggle pheromone decode overlay |
| `T` | toggle task-color overlay (colour ants by job) |
| `1`–`6` | arm a decoded pheromone (then click/drag to emit) |
| `Esc` / `0` | disarm |

## URL params (dev)

- `?ff=N` — fast-forward N fixed sim steps before first draw (headless-proof; the browser clock
  drives normally otherwise)
- `?unlock=1` — unlock the whole semiochemical codex immediately
- `?overlay=1` — start with the decode overlay on · `?tasks=1` — task-colour overlay on
- `?sel=1` — preselect an ant (for headless inspector shots)
- `?zoom= &cx= &cy=` — frame the camera (zoom is ×fit)

The world is a committed **cross-section with gravity**: in the open-air garden ants walk the
lawn and **climb plant stalks** to harvest seed heads; inside the soil nest (a slab behind glass)
they crawl freely in 2D. The HUD is a **DG-3 field-station instrument** (DPR-crisp chamfered
chrome, a smooth glowing pheromone-field overlay, glyph-per-channel console, a live analysis card).

## Structure

```
index.html        canvas + CSS vitrine (desk-lamp light, glass sheen, vignette)
src/config.js     grid dims, cell states, channels, palette
src/nest.js       substrate cross-section, entrance + founding chamber, seeds, midden, temp/humidity
src/pheromones.js multi-channel scalar fields — diffuse + evaporate + deposit/sample/gradient
src/colony.js     the superorganism: ants, queen, brood lifecycle, all behaviors, task allocation
src/render.js     substrate, garden, LOD ants (exports drawAnt for the inspector portrait)
src/ui.js         the DG-3 instrument: chamfered panels, glyph console, smooth field overlay,
                  vitals + brood-pipeline flow, inspector card, tweens + emit ripples
src/main.js       DPR canvas, macro camera, input + UI hit-routing, decode-to-learn codex, loop
```

`window.__form` exposes `{nest, pher, colony, cam, codex}`.

## Known rough edges (prototype)

- Surface foraging *highways* form near the nest but read best zoomed in; tighter seed patches +
  stronger out-trail following would make the classic trail more dramatic.
- Food economy is tuned to hold a buffer; long runs may still oscillate.
- Interactive bits (click-inspect, emit) are best felt live — headless can't drive the pointer.

## Next
- Seed-patch trail highways; alarm/recruit/necro emit polish; a proper semiochemical codex panel.
- More castes/behaviors (fungus? no — Messor is granivore); a second nest tube / outworld arena.
- Sound: the near-silence of ants, room tone, the faint tick of mandibles.
