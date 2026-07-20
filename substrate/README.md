# SUBSTRATE

**Six toys about a forgotten dimension.**

A single scrolling page of live, touchable Canvas 2D scenes. Each one demonstrates
a mechanic that 2D does better than 3D, is playable within three seconds of arrival,
and ends with a caption pointing at an abandoned genre worth reviving. The page
itself is the argument: the most tactile interactions in games were orphaned during
the 3D migration, and a browser tab is where they live now.

## The scenes

| # | scene | mechanic | sim |
|---|-------|----------|-----|
| 01 | DIG | the substrate is editable | falling-sand CA, ~110k cells @ 30Hz |
| 02 | INK | your drawing is a physical object | verlet balls vs. hand-drawn segments @ 120Hz |
| 03 | WARMTH | the sim is the art | heat diffusion, 160×96 field, ironbow LUT @ 30Hz |
| 04 | SWARM | a hundred thousand dumb things, perfectly readable | physarum agents, 100k+ on desktop @ 60Hz |
| 05 | LENS | two realities, one pixel apart | two vector layers + one `clip()` |
| 06 | WORDS | the interface is the world | letter rigid bodies, mass = font weight @ 120Hz |

## Rules the code lives by

- One file per scene (`scenes/*.js`), one shell (`index.html`). Each scene is a
  self-contained vanilla ES module exporting `{ init, start, stop, resize }`.
- No engine, no bundler, no images, no audio, no WebGL. Canvas 2D only.
- Only the visible scene runs — an IntersectionObserver starts and stops sims,
  never two ticking at once.
- Pointer Events only: touch and mouse are one code path.
- The engineer HUD (`fps · entities · sim Hz · scene KB`) is always on.
- Total payload ~78 KB of hand-written code. Vue + Tailwind arrive via CDN to run
  the page chrome, not the toys.

## Run it

Any static server:

```
cd substrate && python3 -m http.server
```

Everything you just touched is a text file.
