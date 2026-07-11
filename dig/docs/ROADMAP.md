# Diggg v4 roadmap

## v5.7 - Aliveness pass (BUILT, uncommitted; 488 behavior + 18 render green)
> The world read as too passive — creatures wandered on random impulses, no food chain, no awareness of each other (flee was PLAYER-only). This round fixes four visual/feel bugs and lays down a needs-driven food chain. Spec: `docs/ECOSYSTEM.md`.
- [x] WHITE BOXES gone: `tools/strip-fauna-bg.mjs` (zero-dep, Node `zlib`) decodes the 4 opaque `assets/gen/fauna/<id>_anim_v001.png` sheets, edge-flood-fills the near-white bg → alpha (interior whites survive), re-encodes true RGBA, overwrites the live `assets/sprites/fauna/{grazer,hopper,wader,lizard}.png`. Re-runnable from gen/. Anim pipeline is out-of-repo so this script is the standing fix; gen prompt kept `remove_bg`
- [x] MUDSKIPPER: dropped from `loadSprites('fauna',...)` in `main.js:94` → clean procedural `FAUNA_ART.mudskipper` (also auto-syncs its card); "perched on mud" removed from `generate-assets.mjs:235`
- [x] JUMP +1 tile: `config.js JUMP_V` 340→408; water swim-stroke `player.js:70` −140→−270
- [x] CODEX CARD SYNC: `codexart.js drawCreature` now draws the real sprite (frame-0 trimmed box via `getFaunaSprite`) when one exists, else procedural; `drawFeatureOrFlora` uses the scenery sprite for ANY id (bush/boulder/flowers too). `sprites.js` trims frame-0 of animated sheets so the thumbnail is tight
- [x] NEEDS-DRIVEN ECOSYSTEM: `hunger`/`energy` floats on every creature (5 spawn sites + serialize/restore); hunger REPLACED the random hunt trigger (`ambient.js`); starvation routes through the age→fade death; breeding gated on fed+rested (`energy>0.4 && hunger<0.6`) → self-balancing
- [x] GENERALIZED PREDATION: the hardcoded firefly/butterfly/prismfly pool is now a generic sweep — any fauna kind in `spec.prey` is huntable; a kill drops hunger + a `sfx.crumble` beat
- [x] PREY AWARENESS (the missing half): prey FLEE a nearby active hunter + herd STARTLE CASCADE (one bolts → kin within 8 tiles scatter, `sfx.flutter`)
- [x] NEW PREDATORS (procedural `FAUNA_ART`, no sprites): `stalker` (surface savanna/badlands, hunts grazer/dustmole/hopper) + `lurker` (deep cave, hunts salamander/gleamback/ashworm) — scarce; codex + lore.json entries (real analogue taxa)
- [x] ALIVENESS POLISH shipped: drinking at ponds (`drink` state, head-dip), grazer head-dip while feeding, dig-startle via `onDig`. New `drink` state synced across `MOOD_GLYPH`/`STATE_LABELS`/`moodOf`/`STILL`
- [ ] DEFERRED to a follow-up (Tier B / lower-impact): carcass + `scavenges` scavenger layer, dawn/dusk activity rhythm, lure-beacon crowds, birds landing in canopy, contextual ambient emitters, threading `particles` into `ambient.update` for kill-bursts/puffs
- [x] WAY MORE FAUNA (v5.7b): world felt empty. Roster cap `MAX.fauna` 16→64; per-zone caps `SURFACE_CAP 38`, `WATER_CAP 10`, cave 14/9; spawn rates ~3-5× (surface 0.0075→0.022, water/cave→0.03); butterflies/fireflies/birds bumped too. Key mechanics: a **far-off-camera cull** (`ambient.js`, band `cam.x−0.5·WIN_W .. +1.5·WIN_W` once roster >50% of cap) so density FOLLOWS the rover instead of pooling behind it, plus **leading-edge spawns** (`camVx`-biased) so driving reveals fresh life. Resurrected releases (`_keep` flag) and mating pairs are spared the cull. Measured: ~16 on-screen stationary, ~8 avg while driving (was a handful); perf 0.027 ms/update. Prey-flee scan hoisted behind an `anyHunting` flag to stay cheap at the bigger roster
- [x] PREDATORS ENGAGE (v5.7c): they were ignoring prey — `satiety` 140/130s meant a predator was almost never hungry, and the hunt trigger was a tiny roll. Now: `satiety` 55, hunt fires at `hunger>0.4` with `0.3·hunger` prob, detection 7→11 tiles, pursuit at full `flee` speed, chase timeout 5→8s. Predators persist while prey get eaten, so a hard **`PREDATOR_CAP = 3` per zone** (surface + cave) keeps it prey-heavy; stalker/lurker rarity dialed to 0.45 so they don't out-weight prey at spawn. Measured in a badlands sim: avg ~1.6 predators / ~33 prey, ~2.3 kills/min — visible hunts, no wipeout, no "predator convention"
- [x] FLORA = FOOD (v5.7c): feeding was flora-blind (grazed on bare rock). New `features.js` helpers — `forageAt(tx,world)` (edible dressing flowers/reeds/bush, or grass tuft, else null), `hasTuft`, `findForage` (nearest food, `findShelter`-style scan). `ambient.js` feed overhauled: hungry grazers only crop WHERE flora grows (surface: forage flora; cave grazers: mushrooms; pond grazers: abstract bank nibble) and AMBLE toward the nearest patch when standing on bare ground. Surface spawn biases ground foragers + their hunters toward forage columns (`findForage` within 16) so life clusters at the green. `diet` field still dormant (M4) — forage keys off `grazes` + flora presence
- [ ] Playtest to tune: water jump feel (−270), predator `satiety`/`PREDATOR_CAP`/rarity, flee ranges, fauna DENSITY (caps/rates/cull band, all at top of `ambient.js`), and forage seek/feed rates if herds over- or under-cluster

## v5.6 - Animated creature sprite sheets
- [x] Walk-cycle ANIMATIONS for the 4 surface walkers (grazer/wader/lizard/hopper) via RetroDiffusion `rd_animation__any_animation` + `return_spritesheet` (256x256 = 4x4 grid of 64px frames, 16-frame walk cycle; ~$0.25 each). They come grounded on a little grass tuft - fitting for surface fauna
- [x] `render/sprites.js getFaunaSprite()` auto-detects sheet type by dimensions: >1 64px frame = animated grid (played in order, frozen at frame 0 when idle, faster when fleeing, desynced per-creature by ph); single frame = static (alpha-trimmed). `drawFauna` branches accordingly; frame sunk ~10% so feet (not the grass) anchor on the ground
- [x] SPIDER kept on its clean static (the animation style baked a dark cave scene); MUDSKIPPER regenerated without the mud mound + `amphibious` fauna no longer bob in water (fixed the "weird bob on a mound" - it perches still at the bank)
- [x] 484 behavior + 18 render green (procedural fallback under stubs; frame-grid math verified). Spend this round ~$1.75, balance ~$12.11. NOTE: in-game animation SIZE/anchor + the baked grass are eyeball-in-playtest; if grass clashes in a biome, regenerate those 4 via `rd_advanced_animation__walking` with the clean static as input_image

## v5.5 R4 - Generated creature sprites + flying-critter lifecycles
- [x] LIFECYCLE PARITY (the "Glasswing/bats/etc don't have lifecycles?" fix): spiders were already registry fauna (age/breed/flee/persist). The ad-hoc FLIERS now get real lifecycles too - glasswing butterflies + fireflies age over a full lifespan (not a 12s timer), pair off + breed, and fade of old age; bats age + wheel off cave walls. All three carry a scan `ref` now (live card art). Firefly light-pollution + amber-safe behavior preserved
- [x] HERO SPRITES: generated bespoke pixel-art creatures via RetroDiffusion (grazer=deer, wader=stilt heron, lizard, hopper=frog, spider=whip spider, mudskipper) - `tools/generate-assets.mjs` fauna job (64px, game_asset style, remove_bg, in-palette; $0.10 total, balance ~$13.88). assets/sprites/fauna/*.png
- [x] `render/sprites.js getFaunaSprite()` alpha-trims the padded frame (cached) so feet anchor on the ground; `drawFauna` prefers the sprite (sized to the creature bbox, dir-flipped, age-scaled, gentle bob) and falls back to the procedural blob when the PNG is missing - the emoji mood layer rides on top either way. `main.js` loads the 6
- [x] 484 behavior + 18 render green (procedural fallback under stubs); demo night sim draws all species + moth, no throw. NOTE: in-game sprite SIZE/anchor (dh = size[1]*1.7) is a first pass - eyeball in playtest and tune the multiplier

## v5.4 R3 - Living, sheltering, persistent fauna (+ intimidate + moths)
- [x] Creatures stopped blinking out: the arbitrary 40-70s `life` timer is gone (LIFE=1e9); they now live their full `spec.lifespan` and die only of old age (age→1→fade). MAX.fauna 6→16, surface per-zone cap 3→8 - a real RESIDENT roster
- [x] Home ranges: each creature carries a `home` (spawn x) and drifts back when it strays past ~22 tiles - coherent territories instead of a conveyor of edge-spawns
- [x] DAY/NIGHT SHELTERING (the migration you can see): `features.js findShelter()` + `dressingAt()` (one source of truth for render/scanner/fauna); at dusk or in a storm a diurnal creature walks to the nearest tree/bush/rock (`seekShelter`) and SLEEPS under it, waking at dawn to forage; nocturnal fliers roost by day
- [x] INTIMIDATE before flee: `spec.intimidates` (lizard, wader, cindercrab) stand and DISPLAY (~1.5s, facing the rover) when it enters the outer band, only bolting if it keeps closing; timid kinds flee at once
- [x] MOTHS are a real species now (`content/fauna.js`: nocturnal + aerial): they live near canopy at night WITH OR WITHOUT a lamp - the ad-hoc emitter-keyed `moths[]` array is retired; a light merely LURES them (aerial-locomotion bias toward the nearest emitter). Real `FAUNA_ART.moth` + a `ref` for the scan card
- [x] Reaction emojis (code-drawn, no assets): a mood glyph floats over each creature by state (! flee/intimidate, ♥ mate, z sleep/roost, ♪ feed)
- [x] PERSISTENCE: `ambient.serialize()`/`restore()` save the resident roster + glow patches into the save (`game.js persist`); on load specs rebuild from the id (unknown kinds dropped). Residents survive a reload
- [x] 483 behavior + 18 render green (new [living-fauna] block: shelter→sleep→wake, intimidate→flee, moth aerial, persistence round-trip); full night game-scene sim runs 40s with moths+emojis, no throw

## v5.3 R2 - Memory savings (~200MB → target ~325MB)
- [x] AUDIO was the lever: 7 Freesound loops were decoded to ~77MB of raw PCM up front. Now they decode LAZILY on first audible use (`audio.js loop.set` triggers `ensureSample`), with LRU eviction of silent loops beyond MAX_DECODED=4 - a session pays only for the beds it actually hears (~15-40MB). Removed the boot `loadSamples([...])` in main.js
- [x] Dropped the tileset `back[]` composites (10 × 256×256×4 = 2.5MB): the back wall is now the `front` composite + a ~0.54 dark overlay at draw time (drawBack)
- [x] Reel teardown: `attract.dispose()` frees the title's ~4MB demo world/ambient/lighting deterministically on DIG (title.start), instead of waiting for GC
- [x] Fluid CA no longer allocates `new Set()` + `[...active].filter().sort()` every step - reuses a swapped scratch Set + a persistent cell array (mobile GC relief on big pools)
- [x] Deleted dead `render/postfx.js` (imported nowhere) + its smoke ref
- [x] 474 behavior + 18 render green; sims: fluid still flows with the reused scratch, reel dispose is clean + post-dispose update/render safe. (Optional follow-up: trim crickets/water loops to ~15s mono for another ~30MB)

## v5.3 R1 - Scan rework: tap-to-lock + overlap cycling
- [x] Killed the cramped 1s hold: in scan mode a single click/tap LOCKS the target and it auto-charges (~0.8s) on its own - no continuous hold; look away freely. `game.js updateScan` keys off `pressed('MouseLeft')`, not held `mouse.left`
- [x] Overlapping/stacked targets are reachable: `scan.js resolveScanCandidates()` returns an ordered list (creatures nearest-first, then the tile/flora/fluid/rock beneath as the final candidate); re-pressing the same spot cycles `idx` (wrapping), a press elsewhere re-locks nearest. `resolveScan` still returns candidates[0] (back-compat)
- [x] Desktop MouseRight (previously unread) cycles candidates in place; reticle shows a "▸ 2/3 · Name" chip + fill ring anchored on the locked target (not the drifting cursor). Same model drives the phone tap
- [x] Demo `_rig` gains `codex` + `scanState()` test hooks. 472 behavior + 19 render green; new [scan-cycle] block + live sim (tap-not-hold catalogues 0.78s, re-tap grazer→lizard, MouseRight cycles)

Playtest verdict: two testers would not hand the game back. v4 is the survival-crafting
reboot: awaken on a bare planet, shelter from rusting rain, process anthropocene garbage
into materials, build machines, dig deep for fossils, resurrect species, release them.

## M0 - Fixes
- [x] One-tile-tall probe (PLAYER_H 15, JUMP_V 340, sprite retune, BEAM_Y)
- [x] Scan ground truth (game/features.js shared by render + scanner - no phantom mushrooms)
- [x] Scan highlight: brackets + name chip on the actual resolved target
- [x] Harvestable mushrooms + crystals (E with scanner) + material inventory + HUD chip
- [x] /dev dashboard (this page)
- [x] Fauna registry refactor (content/fauna.js + render/fauna.js, behavior-identical)

## M1 - Awaken (reboot core)
- [x] Awaken scene (boot log) + HUD boot sequence, replaces the landing intro
- [x] Bare planet: camp -> crash pod with a 4-tile awning; pod fold-out field lab
- [x] Quest system (content/quests.js) replaces the T-rex mission + tutorial
- [x] Power: battery, solar recharge, dig/scan costs, low/reserve states (never a hard death)
- [x] Wet/rust status: rain soaks, sparks, slows; cover check; sun dries
- [x] Build mode (B): soil + roof panels costed in regolith
- [x] Home marker (H) + HUD edge arrow
- [x] HUD v2: power bar, materials, status icons, quest chip
- [x] Save v2 (old saves reset, settings carry over) + WORLD_W 364

## M2 - Garbage economy
- [x] Garbage seeding in the anthropocene band
- [x] Reclaimer: powered (sun/wind), watchable wash->shred->extract pipeline, peek panel
- [x] Solar panel + wind vane buildables (storm wind = peak machine power)
- [x] Storage crate, home beacon; soaked drops items (recoverable, never deleted)
- [x] Quest chain: scavenge -> processing -> power-up

## M3 - Deep world
- [x] 7 biomes: tundra, wetland, badlands, savanna, ashflats, crystal, coast
- [x] Stratum hp curve + laser mk1-3 (U at the pod; crystal/mushroom/regolith)
- [x] Gas pockets + cave-ins with support pillars (Q flicks a soil block)
- [x] Buildable lab stations (pod lab defers to built benches)
- [x] RetroDiffusion flora batch (mangrove/acacia/deadsnag/shardspire/reeds/shard) + spritesheet player groundwork

## M4 - Life
- [ ] Capture / study / raise fauna (lure, habitat, trust, genome bonus)
- [ ] Incubator resurrection: released species join the living world
- [ ] Genesis capstone quest
- [ ] Animated fauna sheets via rd_animation styles (top up balance ~$10 first)

## v4.2 - playtest feedback round 2
- [x] Click-locked mouse digging (one click = one tile; amber next-cut outline; stairs sculptable)
- [x] Four real liquids with viscosity: water, hypersaline brine, natural asphalt (tar), lava; molten basement below ~380
- [x] Science-accurate codex: every creature/flora/fluid/salvage entry is a real taxon or substance with true facts
- [x] Codex cards + journal grid carry illustrations drawn from in-world art
- [x] HUD v3 (render/hud.js): status / quest / cargo regions that cannot collide; build bar with icons + glyph costs; I = hold manifest
- [x] Hand-salvage: scrap -> metal, bottles -> plastic on dig (Reclaimer stays the efficient path); per-type deposit glints; deposits scannable through rock

## v4.3 - the visor
- [x] Machines grounded (draw anchor fix) + ghost snap-to-ground
- [x] Visor chrome: top/bottom bars, corner brackets, lens vignette; quest = one-line ticker; context line replaces ALL floating world text; toasts bottom-right; era banner rides the bottom bar; find LED; left-edge depth ruler with era bands
- [x] Liquids in strict geological order: tar 4-40, water 45-140, brine 300-400, lava 380+ basement
- [x] Build menu v3: icon-only cells, unaffordable silhouettes, hover tooltip, clicking the bar selects (never places)
- [x] Sunlight + shadows: sky-light pass (god-ray shafts, cave-mouth spill, overhang shade, dusk/storm dimming)
- [x] Shallow grottoes (depth 5-25) with skylight wells; spiders/olms move in early; shallow mushrooms
- [x] Dark walnut work surface under the minigame bones ($0.03); visible power cables with travelling sparks

## v4.4 - visor corners + the living anthropocene
- [x] Real caves: chamber-and-corridor grottoes; skylight wells capped at 2/world (grass lip intact)
- [x] Visor corners: chamfered top-left notch (power + home chevron + quest ticker), top-bar cargo summary, right-edge depth ruler, bottom-left mode toggles (Esc always exits to laser), skulls + world home-arrow removed
- [x] Artifacts left the museum; the Reclaimer split into Smelter / Pyrolysis Vat / Ash Kiln with accepts-routing
- [x] 12 storied junk types (ghost nets, the 1997 Lego spill, the toilet-shard index fossil, the pocket shrine)
- [x] Creature lifecycles: age + growth, grazing, hunting (spider→firefly, wader→butterfly), territorial face-offs, old-age fades
- [x] Scan-to-blueprint bio-lamps in the organism's colour; tinted night pools; luna moths orbit lamps; fireflies avoid harsh light until the amber Dark-sky Lamp
- [x] Quest web: furnace→vat→kiln chain, bio-optics, dark-sky, field notes (genome reward), ghost nets, the Anthropocene Codex (+20% machine speed)

## v4.5 - lore.json, the horizon, the Deconstructor, machine power
- [x] All flavor text -> content/lore.json (2-3 variants per entry, translation-shaped); core/lore.js store; codex slimmed to structure with lore getters; buildable blurbs under `build.<id>`
- [x] Probe-voice rewrite: every blurb re-written as DG-3's far-future archive (Three Robots tone) - no present-day framing; science stays in the stat rows
- [x] Night grid artifact fixed: sky-light + overhang-shade passes render via one smoothed 1px-per-tile blit (no overlapping rect seams)
- [x] Built tiles are laser-proof: T_PLACED/T_ROOF only come down via the DECONSTRUCTOR (X, 4th visor mode, red brackets, full refund); cave-in debris is new T_RUBBLE (diggable); right-click-decon removed from Constructor
- [x] Machine batteries: charge from sun/wind/generators (2/s), drain while cycling (1/s), stage freezes flat; P = per-machine power switch; G = rover umbilical (4/s from your own bar, stops at 10%, snaps on walk-away); battery pips + status lamp on the chassis
- [x] Bespoke machine bodies: brick Smelter (chimney + breathing ember mouth), Pyrolysis Vat (tank on legs, bubbling sight-glass, condensate drip), Ash Kiln (brick dome, ash puffs, silica slot) - each echoes its build-menu icon
- [x] NO living things in any recipe: lamps cost metal/silicon/crystal, laser mk2 is mineral-only, mushrooms are scan targets (not harvestable), material registry is organic-free (lint-tested)
- [x] Rich scan cards: DG-3 FIELD ANALYSIS plate (chamfered chrome, corner brackets, scanline sweep) with LIVE TELEMETRY - age gauge (juvenile/adult/elder), state, derived mood - plus readout-grid science and the archive's flavor line
- [x] Biome parallax backdrops: 7 generated horizon paintings ($0.21, balance $14.13) crossfading at borders, sky-fade mask keeps the day/night sky, vertical parallax carries them away underground, procedural ridge fallback (underground variants skipped on purpose: caves draw full back walls, a painting would never show)

## v4.6 - audit, atmosphere, living water, richer underground
- [x] Code audit + perf: builtCount reads world.placedTileCount (no per-frame exportDeltas), cached codex category tallies, single-pass lampsBuilt; recommend a v4.7 housekeeping round to split game.js render fns into render/worldview.js
- [x] Card contrast: light text tiers (own palette, not sepia-on-dark), de-italicised brighter blurb, content-sized plate that flows the quote under the science (no dead middle)
- [x] Clouds v2: persistent world-anchored puff field drifting on the wind (no more zooming), far-layer parallax, density eases with weather
- [x] Fog: a real weather state (dawn-weighted), visibility banks hugging the surface, kills god-rays + hazes the backdrop, no rain/wetness
- [x] Deeper = darker: piecewise depth curve to 0.96 by ~depth 244, mask cap 0.97
- [x] Sun-angled god-rays: computeSky shears the sky-openness scan along the sun's azimuth (Bresenham per-row) - morning light leans east, evening west; a giant space flashlight
- [x] Rare sky events: solar eclipse (noon night: stars out, fauna beds down, fireflies emerge, via effectiveNight01), aurora ribbons, meteor showers; toasts + quest events
- [x] Surface ponds (wetland/coast-weighted) + aquatic fauna: Devils Hole Pupfish (water-bound) + Atlantic Mudskipper (amphibious); swim brain checks fluidAt, no trees in ponds
- [x] Richer underground: Feral Pothos vines in the shallows, fauna-rich shallow grottoes (spawn from depth 5, cap 3), glowworms from depth 18, hollow crystal geodes, per-stratum mineral vein seams, depth-toothier stalactites

## v4.7 - bigger world, living ecology, scanner journal
- [x] Removed fog weather entirely (annoying); reverted CHAIN/render/backdrop terms
- [x] Backdrops rebuilt procedural: 2-3 seamless rolling silhouette layers in the biome's OWN palette (no more seamy paintings), and moved BELOW the sun/moon (drawSky split into gradient+stars / sun+moon)
- [x] World 4x bigger both axes (WORLD_W 1456, WORLD_H 1920): strata bands, fluid bands, cave/gas/geode/pond depths + counts all scaled; SAVE_KEY v3 (settings carry). Worldgen ~180ms
- [x] All four liquids reachable: brine spread across the marine section (depth ~960+), magma chambers through the deep third (~1500+, below brine), pool counts up
- [x] Ground creatures stay out of ponds: surface fauna don't spawn on water columns + turn at a water bank (amphibious mudskippers may skim the edge)
- [x] Universal lifecycles + MATING: two same-species adults pair up and bear a juvenile (per-species cap + cooldown bounded); fireflies/butterflies age too (juveniles smaller)
- [x] Species behaviours: grazers/dustmoles herd, lizards bask in clear sun, mudskippers amphibious
- [x] Field journal re-themed as the DG-3 scanner readout (dark chrome + cyan), SCANS tab first + Fossils second, both wheel-scrollable with a scrollbar

## v4.8 - flowing water, living lights, the resurrection loop, richer flora
- [x] Water: pond count cut from 96 (×AREA) to ~16 (×LAT); fluid CA active-cap raised to 24000 + evicts farthest-from-camera, so pools flow instead of freezing
- [x] Get wet when submerged (status.exposed01 fed from player.inWater/inBrine)
- [x] Liquid reactions: lava + water → obsidian (new T_OBSIDIAN, diggable, yields crystal/silicon) + steam FX; codex + probe lore
- [x] Overhead tube lights (ceiling bar + downward cone) instead of floor lamps; emitter-aware moths orbit any light (lamps, pod, machines, rover-at-night) and DISPERSE (not vanish) when the light is gone
- [x] Build-menu icons redrawn to match the placed objects (smelter/vat/kiln/lamp-tube/incubator + new buildables)
- [x] Fossils rethought → RESURRECTION: excavating a specimen tops up genome directly (no bone-mount grind; ~3 finds = common species), genome-only viability, the Incubator revives a species into the living ambient world where it ages + breeds (revenant fauna art, genesis quest)
- [x] Deep caves worth it: fossils scale by width + skew deeper (the resurrection genome lives in the true deep strata); geodes/veins already depth-rich
- [x] More to build from scans: Lure Beacon (draws fauna near), Flora Planter, Terrarium - all scan-unlocked
- [x] Painted backdrops back but SIMPLE + seamlessly tiling (regenerated tile_x, image-mode with sky-fade + procedural fallback, below sun/moon)
- [x] Far more flora: per-instance tree/dressing scale (0.7-1.4x), vines drape shallow AND deep caves, denser ground flora

## v4.9 - THE MEMORY REEL: the opening is the trailer
- [x] Demo mode in the game scene (opts.demo): persist() hard-gated (the reel can NEVER touch the real save), fresh deterministic seed 777, _rig puppet handle (demo only); core/input injectPress
- [x] scenes/attract.js: the real engine replays DG-3's corrupted mission archive - six scripted-autopilot vignettes (awaken / dig / scan-with-live-card / storm salvage line / deep quench-to-obsidian / aurora resurrection), memory-seek glitch wipes, probe-voiced lower-third caption cards, loops like an arcade attract mode
- [x] Title = the reel: wordmark + buttons + a flickering "MEMORY REPLAY - 2 SECTORS CORRUPTED" chip over the live simulation; `?trailer` URL param hides all chrome for clean capture (the reel IS the shippable trailer)
- [x] awaken.js = the corruption cut: pressing DIG freezes the reel (overlay snapshot), corruption bars eat the frame to black while the boot log types `replay ... [TERMINATED] / objective ... [NOT FOUND]`, then the game boots - play begins where the memory fails. Returning saves skip straight in

## v4.9b - THE FIELD RECORD (reel refinements)
- [x] Corruption framing dropped: the reel is an endless narrated FIELD RECORD, not a broken memory - soft fade-through-black cuts (no glitch), storybook captions with chapter numerals ("it woke alone." ... "and it brought them back.")
- [x] Rover always moving/interacting: drive-ins to every set piece, auto-hop over steps, position-based approaches, a REAL E-load at the smelter and a REAL E-resurrection at the incubator each loop (revived set cleared per pass), pacing/ambling between actions
- [x] Beat stages flattened (stagecraft) so walks and machine lines read cleanly; title chip now a quiet "FIELD RECORD · DG-3" light; awaken = the record gently dimming out under the boot log

## v4.9c - Reel handoff fix (input provenance)
- [x] BUG: the reel's injected presses (card-dismiss Space, auto-hop) tripped the title's own start check - the game launched itself mid-loop with the autopilot's D still held (rover ran right forever). core/input now tracks a `synthetic` set; the title starts only on `userPressed` (human input, checked BEFORE reel.update)
- [x] `releaseAll()` drops every held key/button/pending press - called on title start, settings, and non-demo game-scene creation, so no scene ever inherits the autopilot's hands
- [x] Livelier, less marchy beats: awaken drives home then STOPS for a slow wondering headlight sweep (+ a headlamp flick), scan approaches the saiga from the right and creeps in close instead of pacing
- [x] Regression tests: injected press is never userPressed; releaseAll clears everything; the full title runs 35s of reel (injected presses and all) without self-starting. 418 behavior + 10 render green

## v4.9d - Reel polish + handoff
- [x] Hop spam killed: the scan beat injected Space EVERY FRAME for 1.4s (~84 presses); one-shot flag now. autoHop needs a genuine 0.55s stall (with cooldown) instead of firing on every walk start (~12 jumps/loop, all intentional)
- [x] EMOTE vocabulary (two keys + a headlight, used with intent): wonder / watch / startle / hop / fidget - startled double-take + pleased hop at the scan card, machine-by-machine supervision on the salvage line, two "it's ALIVE" hops + rapt following after resurrection. releaseInputs() every frame before beats run - no key can ever stick
- [x] Title DIG/settings buttons ride just below the reel's ground line (reel._groundY), clear of the storybook caption
- [x] The awaken beat strikes yesterday's sets (all non-pod entities + staged fauna) - loops never stack machines on machines
- [x] flatten() takes a target level; awaken levels the approach TO the pod's ground row - the pod never hovers over its own excavation
- [x] README.md rewritten as the handoff doc. 420+10 green; 3-loop sim: beats 0-5, pod row untouched, revenant walks

## v5.0 - MOBILE: dynamic stage + touch cockpit
- [x] Dynamic stage width: config VIEW_W is a live `let` + setView() clamped 720-1280 (VIEW_H stays 540); main.js fitCanvas() reads visualViewport, applies at frame start only; portrait pauses under a "rotate your device" card; lighting buffer + scratch arrays lazily follow resizes; title/settings re-center per frame; index.html gets viewport-fit=cover/dvh/touch-action:none/user-select:none + gesturestart block + safe-area inset CSS vars
- [x] core/touch.js - the touch cockpit: 'direct' dialect (finger = cursor; taps commit coords + a REAL MouseLeft press at touchEND so the attract reel's per-frame coordinate stomps can't misdirect them; drags hold the cursor live for sliders/scrubbing; journal drags scroll via fractional wheel ticks) and 'game' dialect (LEFT floating joystick with re-anchor for quick reversals; RIGHT hybrid aim - tap = absolute click, drag = relative twin-stick aim clamped INSIDE dig reach with the laser held; build/decon force an absolute ghost 40px above the finger, tap = exactly one placement pulse)
- [x] On-canvas buttons: JUMP (holds Space - variable jumps + pulley release), E, K winch, contextual pill (P power / G umbilical / U upgrade by proximity), pause chip (HOLDS Escape - boot skip is hold-to-skip) + journal chip; buttons register as UI hot zones (never dig under a thumb); mode toggles gain thumb slop without moving
- [x] input.js humanPress()/hold(): touch is HUMAN input (userPressed accepts it; the autopilot's injectPress stays synthetic); touchcancel releases only touch-owned inputs; scene contract scene.touchMode() reports dialect/anchor/idle-aim/cursor/context per frame
- [x] Inventory manifest closes on tap (was KeyI/Escape only - a touch trap)
- [x] Phone perf: computeSky + blitSkyGrid reuse zero-filled scratch buffers (Float32Array/Uint8Array/ImageData) - was the main per-frame GC churn, up to 2 allocs/frame
- [x] Tests: 32 new [mobile] behavior tests (tap-vs-drag, stick, cancel-releases-only-ours, ghost mode, wheel scroll, humanPress, setView/camera, stale-light-bleed) + render smoke at 720/1170/1280. 452 behavior + 19 render green. Touch-only sim: stick+JUMP traverses, aim-drag digs, journal chip opens/scrolls/closes, title tap-DIG starts the game

## v5.1 - Camera zoom + bigger controls + fullscreen
- [x] CAMERA ZOOM 2.5x (config VIEW_ZOOM): the world renders into a WIN_W x WIN_H window (stage / zoom) that cam.apply() scales up - the rover is now 2.5x on screen. Camera clamps/cull, ambient spawn ranges, lighting buffers, backdrop and rain all think in WIN dims; sky gradient + sun/moon stay screen-space (celestial = infinitely far); HUD/cards/menus untouched
- [x] cam.sx/sy/wx/wy world<->stage converters; every mouse consumer (digging click-latch, build ghost, scan, deconstruct, quick-soil, headlight aim) maps through cam.wx/wy; the attract rig's aimAt + title _groundY ride cam.sx/sy; touch anchor/idle in stage px; touch aim clamp = DIG_REACH x zoom
- [x] All touch icons 2x: JUMP r74, E r56, K r48, context pill r50, chips r38; joystick ring 62; visor mode toggles 52px under touch (uiHotRects cluster + label track the size); stick zone excludes the bigger toggle corner
- [x] Fullscreen: top-right chip in the touch layer (both dialects incl. title; hides itself where the API is missing - iPhone Safari) + a corner-bracket glyph button on the title for mouse users; toggleFullscreen() with webkit fallbacks
- [x] 455 behavior + 19 render green; reel sim under zoom (beats 0-5, smelter loads, revenant walks 917 frames, no self-start over 115s); touch sim under zoom (walk+hop traverses, aim-drag digs, anchor centered, clean key state)

## v5.2 - Adjustable zoom (wheel + pinch)
- [x] config VIEW_ZOOM/WIN_W/WIN_H now mutable + setZoom() clamped to ZOOM_MIN 1.5 (old 1:1 view + 50%) .. ZOOM_MAX 2.5 (v5.1 frame); opens at the wide end (1.5) since 2.5 read as too close
- [x] DESKTOP: mouse wheel zooms (scroll up = closer), 0.15/notch; guarded by !build.active so build mode keeps the wheel for cycling the bar; journal/overlays return before the play path so their wheel-scroll is untouched
- [x] TOUCH: pinch to zoom - a second finger in the play area (not the left joystick zone) converts both touches to a 'pinch' pair; separation vs the pinch-start distance drives setZoom, laser suppressed during the gesture; stick+aim stays twin-stick (never pinches); lifting either finger ends it
- [x] 464 behavior + 19 render green (9 new: clamp both ends, window tracks zoom, pinch in/out, pinch≠laser, stick+aim≠pinch); live sims: wheel in/out + clamps, build-mode wheel inert, reel beats 0-5 under zoom, live-scene pinch 2.0->2.5 with clean key state
