# WONDERVOID — The Hive Carrier (Slice 3 design)

## The idea in one line

The Wondervoid is not a box with a park in it — it is a **hive**: a kilometer-long
greebled spine (the classic carrier silhouette) with **hexagonal terrarium
cells** growing off it in honeycomb rows, each cell a sealed biome that Auntie
Nova has… collected. Over previous Directors' lives. She doesn't elaborate.

## Topology (the connection plan — trunk and leaves)

```
                 [decorative hive cells — sealed, glowing, unreachable]
   ENGINE ══╦═══════════ GRAND CONCOURSE (spine, walkable) ═══════════╦══ PROW
            ║      │         │         │         │        │          ║
          stem   stem      stem      stem      stem     stem     (stems: rich
            │      │         │         │         │        │       hallways)
         [GROTTO][MIDWAY] [MEADOW]  [DESERT] [TUNDRA]  [OCEAN]   (terrarium
          south    south    north     south    north    south     cells, hex)
```

- **Grand Concourse** — a rich interior boulevard running the spine's full
  length: carpet, warm lamps, paneled walls, rib arches, and *window bands*
  (the spine's glass bits) looking out at the hive. Everything connects here.
- **Stems** — short rich hallways from the concourse to each cell's airlock.
  One topology, zero orphaned spaces: cell → stem → concourse → anywhere.
- **Cells** — hex prisms (R≈80m, 60m tall). Outward faces are glass with
  structural mullions; inward faces are hull. One biome each.
- **Decorative hive** — dozens of smaller sealed cells clustered above/below
  the walkable row (instanced, window-glow only). They sell MASSIVE scale and
  imply the collection is far larger than what's open… yet.

## The biomes (Nova's terrarium collection)

| cell | biome | ground | props | light | Nova's memory |
|---|---|---|---|---|---|
| Midway | carnival deck | painted plaza | build-mode structures live here | warm amber | "Director #4 built this. Adorable." |
| Meadow | grass + trees | green canvas | instanced trees | golden hour | "#12 loved it here. Briefly." |
| Desert | dunes | sand ripples | cacti, rocks | hot amber | "#7 called it 'too sandy'. #7 is sand now." |
| Tundra | snow | blue-white | ice spires | cold cyan | "#19 lasted forty minutes." |
| Grotto | fungal cave | dark loam | glowing mushrooms | bioluminescent teal/violet | "don't lick anything." |
| Ocean | shallow sea | animated water | reef spires | deep teal | "#23 is technically still here." |

Discovery: first entry into each cell triggers a Nova memory line. Visiting
all six teases a hidden console power — Nova has more powers than she lets on.

## Answers to the specific gripes

1. **OG ship back** — the spine reuses the slice-1 segmented chain generator
   (stacked plates, necks, sponsons) around the concourse; every segment gets a
   glass window band. Engine block + prow unchanged.
2. **Too much glass / biome variety** — glass is now rationed: cells have 2-3
   glass faces (rest hull), the concourse has window bands, stems are windowless
   rich hallways. GLTF props drop into biome `props` slots (pipeline ready).
3. **Glass from inside** — v2 shader: much lower base opacity, gentler fresnel,
   animated specular sheen band, faint star-sparkle; plus physical mullion bars
   so the pane reads as glass, not fog.
4. **Connection** — see topology. Nothing exists off the trunk.
5. **Powers** — *Void Jump*: every walk-mode jump skips the whole ship through
   deep space (star lurch + chromatic blip at apex + sub-bass thrum; palette
   hue drifts — "we moved four light-years, don't tell the passengers").
   *Blink Planet*: 1.2s gravitational charge-up (bass swell, vignette pinch)
   → shockwave ring → shake; planets draw from 8 palettes, random band scales,
   ring tints, sizes 150–2200, moon chance 40%.
6/7. **Beehive + massive scale** — honeycomb rows + decorative cell clusters +
   2km spine. Cells are discovered, not listed.
8. **Audio pipeline** — `src/audio.js`: WebAudio synth ambience (deep-space
   drone: detuned subs + filtered noise + sporadic shimmer) and synthesized
   SFX (blink, build, jump, land, planet-drama, UI) — zero assets required,
   `loadAudio(url)` slot for real files (public/assets/audio/) when curated.
   M mutes. Starts on first gesture (autoplay policy).

## Walkable-region model

Regions become typed: `{type:'rect'}` or `{type:'poly', points:[…]}` (convex).
Hex cells contribute polygons; concourse/stems contribute rects. Build-mode
validity = inside a cell's inradius (Midway and any biome — parks welcome
everywhere), minus placed-structure overlaps.

## Performance posture

Same budget discipline: cells are 6 wall panels + frame each; biome props are
InstancedMesh pools; decorative hive is 2 instanced meshes total; per-cell
lights = 1 key + 1 accent (only walkable cells), quality tiers unchanged.

---

# v2 — THE BLOSSOM (slice 4)

Slice 3's spine-and-cells hive was rebuilt after feedback: corpo interiors,
fake volume, dead-end topology, box-built shapes, wrong Nova.

**The 7-hex flower**: one Atrium + six biome cells packed as a honeycomb
flower. Adjacent cells share full walls; every shared wall carries a portal
arch. Three exits per biome cell, six for the Atrium — no dead ends, by
construction. The ship IS the seven cells; nothing visible is fake.

**Orokin-without-gold** (src/orokin.js): LatheGeometry ring portal
(the Wondergate), vase columns, tube-rib vaults, teardrop seed lamps, solar
petals. Porcelain + celadon + verdigris + cyan glow.

**Solarpunk**: oculus skylight crowns pour sunbeams into every cell; garden
terraces, reflecting pool + bridges, organic floor inlays, hanging lamps.
Solar petal corollas crown every roof outside.

**NOVA, formless** (src/nova-entity.js): ~3200 particles morphing between
sphere/knot/ribbon/cloud inside the Wondergate; pulses when she speaks or a
power fires; a wisp follows the walking Director. Voice: serene, amused,
infinite. "I am the space between the exhibits."

---

# v3 — OCTAVE (slice 5)

Octagons + the truncated-square tiling: Atrium center, four cardinal biome
octagons sharing its edges, Grotto/Tundra at two corners, and four SQUARE
VAULTS at the diagonal junctions (3-4 ring-doors each — artefact chambers).
Loops everywhere, still zero dead ends.

Ring language everywhere: every doorway is a sunk circular ring portal (the
Wondergate motif); floors carry glowing ring-path inlays.

LITERAL biomes: analytic heightAt(x,z) per biome sculpts a dense ground mesh
AND answers walk queries — you climb the meadow hills and dunes for real.

Windows v3: huge capsule openings with thick organic rims, one unbroken pane
(no greenhouse grids). OG exterior returns: segmented Homeworld hull with a
midsection plateau the flower sits sunk into; crowns above deck; chamfered
side viewport into the Midway. Solar petals + camera-following wisp deleted.

Artefacts: seven oddities (The Unlit, A Very Small Star, World Bottled, The
Gyres, The Argument, Frozen Splash, Patience) on plinths in the Atrium +
vaults, each with a NOVA proximity line. Atrium floor: infinity-depth shader
(porcelain up close, parallax starfield beneath at glancing angles).

---

# v4 — MONOLITH (slice 6)

Kept only the Atrium. Everything else is grown.

**The Voronoi hull**: ~seeded points mirrored across z in a ship-length
superellipse, d3-delaunay cells extruded as brutalist grey prisms, heights
tapering to bow/stern. Cells over the growth field become deck tiles; gaps
between all cells reveal a glowing seam plane (the Homeworld lights) plus
instanced running-light strips. Brutalist outside, porcelain inside.

**Organic growth**: NOVA powers 9/0 grow Chambers (⬡18k) and Halls (⬡6k)
into grid slots adjacent to connectable faces. Ring doorways are cut through
shared walls automatically (per-edge replaceable walls). Four full-slot
observation bays sit sealed in the hull; reach them and they unseal.
"You found a window. I made it years ago. I knew you'd come."

**Starmap floors** (floors.js): the OG painted-park promenade as an obscure
star chart — constellation paths, orbital arcs, ecliptic ring, glyphs,
emissive-mapped glow. **Alive universe**: nebula sprites, galaxy band,
distant galaxies, hero stars with cross flares. **Hyperspace**: hot-edged
gate plane sweeps the hull on Warp Drive; mini sweep on every void jump.
**Flora**: vine runners + cascades + door arcs with instanced leaves,
mycelium filament decals — zero trees. **Mushroom-Orokin**: cap-dome roofs,
gill ribs, stem columns.

Gotcha for growth work: bays (and any future hull piece) MUST span their
full grid slot so walls land exactly on slot boundaries — otherwise doors
and walk portals misalign (28-unit dead gap, found the hard way).
