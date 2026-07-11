# Diggg — Living Ecosystem (v5.7 design + handoff)

Status: **BUILT (uncommitted), 488 behavior + 18 render tests green.** This is the reference
for the v5.7 "aliveness pass." Roadmap entry: `docs/ROADMAP.md → v5.7`. Behaviour lives in
`src/game/ambient.js`, specs in `src/content/fauna.js`, art in `src/render/fauna.js`,
tests in the `[ecosystem]` block of `tests/behavior.test.js`. The design below is what
shipped; the "aliveness polish" items marked DEFERRED in the roadmap are not yet built.

## Why

Playtesting v4/v5 surfaced one recurring feeling: **the world is too passive.** Creatures
wander on random impulses, there is no food chain, and — critically — **prey have no
awareness of predators** (flee triggers on `player.cx()` only, never on another creature).
Combined with four visual/feel bugs (white sprite boxes, a mudskipper on a baked-in mud
mound, cramped jump, codex cards that no longer match the world), the world looks alive in
screenshots but feels inert in motion.

The fix is a **needs-driven loop** — `hunger → hunt → flee/scatter → eat → breed-if-fed →
starve-if-not` — decorated with cheap, legible "aliveness" mechanics. **No new sprite art is
required**; new predators use the procedural `FAUNA_ART` vector fallback.

---

## Architecture as it exists today (verified anchors)

- **Specs:** `src/content/fauna.js`. `@typedef FaunaSpec` (~9-37) already has `prey:string[]`,
  `zone`, `activity`, `depth`, `speed{walk,flee}`, `social`, `grazes`, `basks`, `amphibious`,
  `nocturnal`, `aerial`, `intimidates`, `shelters`, `biomes`, `lifespan`. Registry `FAUNA`
  (~40-133). Verified ids: grazer, hopper, lizard, moth, salamander, spider, wader, dustmole,
  cindercrab, prismfly, gleamback, pupfish, mudskipper, ashworm. Only `spider` (prey
  firefly/prismfly) and `wader` (prey butterfly) use `prey` today.
- **Sim loop:** `src/game/ambient.js`. `makeAmbient()` → `update(dt, world, player, cam, depth,
  lightPoly, env, emitters)` (~62). Creatures in the `fauna` array; die of old age
  (`age→1→fade→life=0`), MAX.fauna=16. Per-creature state machine ~261-454. States: walk,
  idle, flee, sleep, roost, seekShelter, feed, hunt, eat, fight, mate, intimidate.
- **Hunt today** (~270-293): random `Math.random()<0.01` impulse, pool HARDCODED to
  fireflies/butterflies/prismfly. On catch, prey is spliced from its array → `eat` (~2s).
- **Mate/breed** (~319-341): two calm same-kind adults → `spawnJuvenile` (~74); per-species
  cap (kin<3) + `mateCd` cooldown. This + old-age fade is the current population system.
- **Flee** (~385-402): triggered by the PLAYER only. `intimidates` kinds display then bolt.
- **Movement** (~405-453): aerial / water (swim in `T_WATER`) / surface (ground-snap to
  `world.surface[tx]`, avoid ponds unless amphibious) / cave.
- **Mood display — three tables that MUST stay in sync for any new state:**
  `MOOD_GLYPH` (`src/render/fauna.js:149`), `STATE_LABELS` (`ambient.js:620`),
  `moodOf` (`ambient.js:627`). Plus the render `moving` set (`fauna.js:165`) if the state
  locomotes, and the `STILL` speed set (`ambient.js:~396`) if it's stationary.
- **Creature objects are created in 5 places** (all need new fields): `release` (~49),
  `spawnJuvenile` (~74), surface spawn (~124), water spawn (~148), cave spawn (~167). Persisted
  via `serialize` (~592) / `restore` (~603).
- **Particles:** `particles.burst(wx,wy,color,n,speed)` is in scope at the `ambient.update(...)`
  call site (~`src/scenes/game.js:568`) but NOT passed in. Threading it in as a 9th arg (+
  signature at `ambient.js:62`) unlocks kill-bursts, grazing puffs, ambient motes. Every effect
  has a no-signature fallback via the internal `motes` array + `ambient.draw`. **Recommended:
  thread it in.**
- **Hooks available:** `ambient.onDig(wx,wy)` (~56, fires per broken tile), `ambient.setLures`
  (~567 → `lures`, used ~112), `emitters` (lamps/pod/machines/rover), `sfx` keys chirp/birdsong/
  flutter/plink/crumble/land (no kill sound — reuse `crumble`), `features.js findShelter` /
  `sceneryAt` / `dressingAt`, `surfaceIsWater` (`ambient.js:67`), `biomeAtX`.

---

## The design

### 1. Needs-driven hunger/energy (foundation)
- Two `[0,1]` floats on every creature: `hunger` (0 full → 1 starving), `energy` (1 rested →
  0 spent). Add at all 5 creation sites + `spawnJuvenile`; init `hunger: rand*0.3, energy:
  0.7+rand*0.3`. Add to `serialize`; `?? ` defaults in `restore` for old saves.
- Decay per frame after lifecycle (~267): `hunger += dt/(spec.satiety ?? 90)`; `energy`
  refills while `sleep/roost/idle`, drains otherwise. New OPTIONAL spec field `satiety` (default
  90 via `??` so no existing spec needs editing; predators ~140 → hunt in bursts).
- Hunger REPLACES the random hunt trigger (`ambient.js:270`): hunt only when `hunger>0.55 &&
  energy>0.15`, probability scaling with hunger. On catch (~290) `hunger -= 0.7`. Graze entry
  (~297) also hunger-gated; feed-end (~298) `hunger -= 0.5`.
- Starvation death: when `hunger>=1`, small chance/frame to set `age=1` → reuses the existing
  fade/despawn path (no new code). Fed animals essentially never starve.
- Breeding gate: add `energy>0.4 && hunger<0.6` to the mate condition (~320-322). Predation +
  this gate = self-balancing population.

### 2. Generalized predation
- Rewrite the pool builder (`ambient.js:272-279`): keep the firefly/butterfly ambient-array
  pushes, then `for (const o of fauna) if (o!==f && f.spec.prey.includes(o.kind) &&
  o.zone===f.zone && o.age>0.1) pool.push({ref:o, arr:fauna, x:o.x, y:o.y})`. Any fauna kind
  becomes huntable just by listing its id in a predator's `prey` (prismfly keeps working here).
  `o!==f` guards self-targeting.
- On kill: keep splice→`eat`. Optional bounded (~4 max) short-lived carcass marker (parallel to
  `pebbles`, drawn in `ambient.draw`) that `scavenges:true` creatures treat as a `feed` target.
  If particles threaded: `particles.burst(x,y,'#7A3A34',5,90)` + `sfx.crumble?.()` on kill.

### 3. Prey awareness / flee-from-predator (the missing half — biggest win)
- New scan just before the player-flee block (~384): if any `fauna` `o` has `o.state==='hunt'`,
  lists my kind in `o.spec.prey`, and is within `(TILE*5)²` → `state='flee'`, `dir` away from it.
  Reuses the flee state (speed, timeout, `!` glyph, TERRIFIED mood) — zero table changes.
- Herd startle cascade: when a `social:'herd'` prey flees, propagate `flee` (same `dir`,
  staggered `t`) to kin within `TILE*8`; `sfx.flutter?.()`. Optionally cascade off player-flee.
- **Do NOT ship §1/§2 without §3** — prey ignoring predators feels worse than the random baseline.

### 4. New predators (procedural `FAUNA_ART` only)
- `stalker` — surface; `prey:['grazer','dustmole','hopper']`; solitary; `intimidates:true`;
  `rarity:0.5`; `satiety:140`; biomes savanna×3/badlands×2. Art: lean canid (clone grazer
  proportions, darker, add tail).
- `lurker` — deep cave; `prey:['salamander','gleamback','ashworm']`; solitary; `scavenges:true`;
  `rarity:0.6`. Art: many-legged crawler (reuse the spider leg-loop, longer body, pale eye).
- Scarcity (rarity ≤ 0.6, solitary) + existing caps ≈ ~1 predator per biome-load; starvation
  removes those spawned where prey is absent. Add codex entries if the codex enforces them.

### 5. Aliveness polish — ranked (impact ÷ effort)
Tier A (cheap, high payoff): drinking at ponds (new `drink` state — sync the 3 tables + STILL
set) · grazing head-dip on `feed` + pollen puff · dig-startle via `onDig` (throttle, it fires
per-tile) · dawn/dusk rhythm (pre-bed drift + dawn `sfx.birdsong`) · lure-beacon crowds ·
birds landing in canopy · contextual emitters (meadow pollen / pond bubbles / badlands dust).
Tier B (after A): carcass+scavenger economy · predator territory/patrol.

### Ship order
§1 fields+decay → §2 predation → **§3 flee/cascade** → §4 stalker+lurker → Tier-A polish →
tune (`satiety`/`rarity`/flee ranges) → optional Tier B. Keep `npm test`
(`tests/behavior.test.js`, `tests/render.smoke.js`) green throughout.

---

## v5.7c refinements — engagement + forage (shipped)

**Predators actually engage.** They were ignoring prey because `satiety` (140s) kept them
un-hungry and the hunt trigger was a tiny roll. Now: predator `satiety` 55, hunt fires at
`hunger>0.4` with prob `0.3·hunger`, detection radius `(TILE*11)²`, pursuit at full `flee`
speed, chase timeout 8s. Because predators persist while prey are eaten, a hard
`PREDATOR_CAP = 3` per zone (surface + cave) rejects predator spawns past the cap — without
it the roster fills with hunters. stalker/lurker rarity 0.45 so they don't out-weight prey.
Balance (badlands sim): ~1.6 predators / ~33 prey, ~2.3 kills/min.

**Flora = food.** Feeding used to be flora-blind. `src/game/features.js` now exports
`forageAt(tx, world)` (edible dressing — flowers/reeds/bush — or a grass tuft, else null;
`FORAGE` set + `hasTuft`) and `findForage(world, fromX, range)` (nearest food, `findShelter`
-style scan). In `ambient.js`, a hungry grazer only enters `feed` where flora actually grows
(surface forage; cave grazers → mushrooms via `caveFeaturesAt`; pond grazers → abstract bank
nibble) and ambles toward the nearest patch when on bare ground. The surface spawner biases
ground foragers **and their hunters** toward forage columns (`findForage`, range 16) so life
clusters at the green. `diet` stays dormant (M4); forage keys off `grazes` + flora presence —
a future refinement is per-species `diet → flora` mapping.

## Related visual/feel fixes shipping in the same pass (see plan + ROADMAP v5.7)
- **Transparent sheets:** `tools/strip-fauna-bg.mjs` edge-flood-fills the opaque white bg out of
  the 4 animated sheets (zero-dep, Node `zlib`) and rewrites RGBA PNGs; fix the anim pipeline to
  pass `remove_bg` so it can't regress. This is why the white boxes appear — NOT a renderer bug.
- **Mudskipper:** drop it from `loadSprites('fauna',...)` (`main.js:94`) → procedural fish; fix
  the "perched on mud" prompt (`generate-assets.mjs:235`).
- **Jump:** `JUMP_V` 340→408 (`config.js`); water stroke −140→~−270 (`player.js:70`).
- **Codex card sync:** `codexart.js drawCreature` should draw the real sprite when present (it
  currently always draws procedural `FAUNA_ART`); extend `drawFeatureOrFlora` to all scenery ids.
