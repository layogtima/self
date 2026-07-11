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
