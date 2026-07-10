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
