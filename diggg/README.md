# diggg — smooth-voxel landscape (three.js)

A first-person, **smooth-voxel** landscape — the Oort Online / Boundless look: a blocky
material grid reconstructed with **Surface Nets** into flowing, rounded terrain and caves.
Science-accurate underneath (real strata, karst caves, mineral veins), bright and lush on
top. No build step — plain ES modules + a CDN import map (three.js + post-processing addons
from jsdelivr).

## Run

```sh
python3 -m http.server 8643   # from this directory (or: npm run serve)
# open http://localhost:8643, then CLICK to capture the mouse
```

## What's in it

- **Smooth voxels (Surface Nets)** — the terrain is a cubic material grid, but it's meshed
  into one smooth, vertex-coloured surface (shared verts → smooth normals), so hills roll and
  caves curve instead of stair-stepping. The grid is padded with an air border so the world
  meshes as a closed, self-shadowing island.
- **First person** — click to capture the mouse, fly with WASD + Space/C, Shift to boost.
  Crosshair in the centre; no vehicle.
- **Rolling hills → real caves** — a heightmap for the hills, then a 3D ridged-worm +
  blobby-cavern carve leaving a solid crust. Dig into a hillside and open a **karst grotto**
  with **mineral veins** glinting on the walls (they bloom like a geode at night).
- **Science-accurate strata** — grass meadow → humus **soil** → limestone **stone** → cool
  **bedrock**, with real minerals in the veins (quartz, amethyst, pyrite, malachite). Vivid,
  bright colours — the mood is luminous, not dreary.
- **Baked ambient occlusion** — each surface vertex darkens by the solid fraction of its 3³
  neighbourhood, reading as soft contact shadow in crevices and caverns (free at runtime).
- **Bright lighting + balanced post** — a warm sun with soft shadows, a bright cool→warm
  hemisphere bounce, a gradient skydome, light `FogExp2`, a bloomed sun disc, and an
  `EffectComposer` → **UnrealBloom** → ACES `OutputPass` stack. Bloom is threshold-based so
  only emitters glow (mineral cores, fireflies) — the hills stay crisp. Plus a soft CSS vignette.
- **Fireflies** at night; **dig puffs** on every cut.

## Controls

| input | action |
|---|---|
| click | capture mouse (pointer lock) |
| mouse | look |
| `W A S D` | fly horizontally / strafe |
| `SPACE` / `C` | fly up / down |
| `SHIFT` | boost |
| left-click (hold) | dig |
| right-click | place soil |
| `N` | flip day ↔ night |

## URL params

- `?t=0..1` — start time of day (`0.5` = noon, `0` = midnight; default `0.5`)
- `?crater=1` — dev: carve a bowl to reveal the strata / caves / mineral veins in cross-section

## Structure

```
index.html        import map (three + addons) + crosshair + CSS vignette + error overlay
src/world.js      cubic material grid, strata + cave + mineral generation, SURFACE NETS mesher
                  (padded closed island, per-vertex material colour + AO, smooth normals), dig/place
src/main.js       first-person fly camera, skydome, bright sun/shadows, EffectComposer bloom,
                  sun disc, mineral glow cores, trees, crosshair raycast dig/place, loop
src/fireflies.js  night swarm + two glow lights
```

`window.__diggg` exposes `{scene, world, camera}`; `world._debugCarve(pred)` cuts a cross-section.

## Known mock-cuts (deliberate)

- Whole-world remesh per dig — fine at 56×30×56; would need chunked Surface Nets to scale up
- Trees aren't tied to the grid (dig under one and it floats); no fly collision (you can pass
  through terrain — handy for entering caves you dig)
- Some gentle terracing remains where the heightmap steps by >1 (Surface Nets rounds it into
  ledges); smooth the heightmap or Laplacian-relax the mesh if you want it glassier
- No save, no audio, no fauna beyond the fireflies — this is a feel test

## Next-step ideas

- Chunked Surface Nets for a bigger world; light mesh relaxation for glassier hills
- Biome palettes across the map; water table / lava at depth
- Port dig's needs-driven fauna brains (`dig/src/game/ambient.js`) onto the surface
