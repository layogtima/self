# Diggg v4 roadmap

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
