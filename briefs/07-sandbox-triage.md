# 07 — Sandbox triage

Branch: `gauntlet/sandbox-sweep` · Mostly mechanical. Run early — it unblocks the hub.

64 of 74 projects are invisible from the homepage, including **all 55 sandbox dirs**
(`grep -c 'sandbox/' index.html` → **0**). Every one has a machine-readable `<title>`.
The job: decide, fix, or delete — then write a manifest entry for everything that
survives.

Four verdicts. Every directory gets exactly one.

- **SHIP** — works, polished, worth linking. Write a manifest entry, self-host its
  CDN deps, done.
- **FIX** — good idea, one named blocker. Fix the named thing, then SHIP.
- **CUT** — delete the directory. Move to `archive/` if you're squeamish; do not link.
- **MERGE** — fold into another project, delete the original.

---

## SHIP — 24 (link these, minimal work)

| Path | What it is | Note |
|---|---|---|
| `sandbox/aether` | Webcam hand-tracking theremin | Promote to `/aether` → `briefs/03` |
| `sandbox/anti-design` | "Designer Contempt System" satirical manifesto | three.js r128 |
| `sandbox/bloom` | Hold-and-drag canvas bloom, plum palette, cursor hidden | |
| `sandbox/creatures` | Boids with 5 temperaments + food/predator/mouse attractors | Zero assets, self-contained |
| `sandbox/gestalt` | Interactive explainer for the 5 Gestalt principles, live demos each | |
| `sandbox/heart-of-gold` | HHGG ship bridge — improbability factor, Marvin's mood | |
| `sandbox/lioncircuits` | **Real** PCB fab quote calculator: Gerber upload, zip parsing, PWA | Client work, not a demo — decide whether it belongs on a personal site |
| `sandbox/lumi` | Ambient canvas ecosystem nurtured by cursor movement | |
| `sandbox/memphis` | Memphis Group manifesto, Sottsass shapes | CSS/SVG only |
| `sandbox/motion` | Typographic animation catalog in MONO | Has a `plan.md` |
| `sandbox/neverleave` | Dark-pattern parody that fights you leaving, unlockable easter egg | GSAP + Tone + Vue, all three actually wired |
| `sandbox/oroharp` | Webcam air-harp, selectable scales | **Lift `scales{}` `:39-45` and `getFrequency()` `:196-199` into shared-core first** |
| `sandbox/pain` | Deliberately hostile login: 4:59 countdown, floating-char captcha | Small, complete gag |
| `sandbox/pan-galactic` | HHGG interstellar commodity trading game | **Zero JS CDN deps** — will run in 2035 |
| `sandbox/quantum` | Qubit register + circuit builder, live state-vector display | 3,568 LOC, real math not a mock |
| `sandbox/red-thread` | Self-aware motion-design deck with meta commentary | The writing is the differentiator |
| `sandbox/shapes` | three.js geometry playground, live light sliders | **Version-pinned importmap** — do this everywhere |
| `sandbox/sound` | Pad sampler + step sequencer + synth | **Harvest into shared-core → `briefs/04`** before shipping |
| `sandbox/spacewar` | Faithful 1962 Spacewar!, 2-player, fuel/torpedoes/hyperspace/gravity | **Zero external deps.** `readme.md` is a full historical spec |
| `sandbox/spectral` | Design-system essay + live demos: type reacting to time, location, cursor | Best "hire me" artifact. Delete orphaned `ambient.js`, `spectre.js` |
| `sandbox/stellar` | Guide stars with slow cursor movement, each resonates a tone | |
| `sandbox/time` | Scroll through web-design history, each era rendered in period style | |
| `sandbox/toast` | GravToast™ anti-gravity toaster parody product page | Copy is finished |
| `sandbox/typography` | Google Fonts browser in monochrome, full weight ladder | |
| `sandbox/vogon` | Vogon bridge console in constructed glyphs + poetry generator | The glyphs are intentional, not mojibake |
| `sandbox/words` | Vocabulary across English + 6 Indic scripts, 3 modes | Correct per-script webfonts |

Plus top-level: `canvas` (the one with the committed `<!-- /canvas ADD HERE -->` TODO
in the hub), `dig`, `fireflies`, `formicarium`, `process`, `sci-fonts`.

---

## FIX — 20 (one named blocker each)

| Path | Blocker | Fix |
|---|---|---|
| `sandbox/treevalley` | **Every photo 404s.** `treeData.js` points at `images/trees/gulmohar-1327.jpg`; the file is `images/gulmohur.jpg` — flat dir, different spelling. Only **3 tree records**. 1.4 MB of unreferenced jpgs (`1,2,4,5,7,8.jpg`) | Fix paths, delete orphan images, add records or cut |
| `sandbox/mib` | `incident.html` loads `GeoSpy.js`/`OSMEnvironment.js` from root; they live in `js/` → guaranteed 404. `index.html` links **9 pages that don't exist** (aliens, tech, handbook, neuralizer, protocols, settings, incidents, communications, mission) | Fix script paths, remove or stub the dead nav |
| `sandbox/palettes` | `bioflow.html` loads **`flowmorph.js` which does not exist** (only the `.css`). `technof.html` uses `/api/placeholder/400/320` + "Coming soon" | **CUT both orphan pages.** Keep `index.html` (Lampy, 14 aesthetics) and `dos.html` (a separate brush collection — split it out) |
| `sandbox/megastructure` | `/api/placeholder/400/320` — Claude-artifact stub, 404s | Real image or remove |
| `sandbox/terrarium` | `/api/placeholder/375/500`. "AR View" tab has **no WebXR or camera code** — it's text saying "find a flat surface" | Fix image, remove or build the AR tab |
| `sandbox/symphony` | Ships with **"Neural Interface v2.1 - DEBUG MODE"** in the header and a visible DEBUG CONSOLE panel | Remove dev scaffolding. Note: **no audio at all** despite being called "Particle Symphony" — either add it or rename |
| `sandbox/body` | `data.js` and `data-amit.js` are **byte-identical** (22,490 bytes); only `data.js` loads. Contains **real personal health data** | Delete the dupe. **Decide deliberately whether personal health data belongs on a public site** |
| `sandbox/repository` | README describes Vue 3 + Pinia + Hono + IndexedDB + Cloudflare Workers. `index.html` loads **only Tailwind**. `hydration.js` never referenced | Rewrite the README to describe reality, or build the thing it describes |
| `sandbox/map-of-plants` | Every image hotlinked from britannica / guim.co.uk / squarespace-cdn / plantlet.org — rot + licensing risk | Self-host with proper licences, or cut |
| `sandbox/blrhikes` | Photos hotlinked from the blrhikes.com CDN; all data is fake. `skills.html` is a second tab variant | Self-host, or mark clearly as a UI mock |
| `sandbox/base64` | Entry file is **`index.htm`**, not `.html` — many hosts won't auto-serve it. Four escalating scratch tests | **Lift `bufferToWav()` `tone.html:139-199` + `arrayBufferToBase64()` `:209-216` into shared-core**, merge the rest into one page or cut |
| `sandbox/forest` | Counter advertises **48 whispers**; most are unwritten | Write them or lower the number |
| `sandbox/codex` | Wordless glyph alchemy game — unreadable cold, no onboarding | Add a wordless tutorial. Genuinely original; worth the work |
| `sandbox/isometric` | Called "Collaborative Zen Garden"; **no websocket or fetch anywhere** — the collaboration is fictional | Rename or build it |
| `sandbox/neutron` | Zero on-screen copy or instructions | Add a start screen |
| `sandbox/aria` | Branching dialogue VN, one short scene tree, abrupt ending | Extend or mark as a fragment |
| `sandbox/dreams` | Surreal click-adventure, dead-ends fast | Extend or mark as a fragment |
| `sandbox/geth` | Mass Effect terminal, one screen, no interaction beyond watching | Add interaction or accept as a vignette |
| `sandbox/book` | Fantasy RPG inventory, static data, no depth | Same component tree as `sandbox/repository` — consider merging |
| `sandbox/osmotic` | Absorb-the-particles blob game with no fail or win state | Fine as ambient — file it under "toy", not "game" |
| `sandbox/paramter` | **Directory name is misspelled.** Otherwise good — Vue + Tone, real hook copy | Rename to `parameter/`. That's the whole blocker |
| `sandbox/solarpunk` | Well-written architecture report with **zero imagery** | Add diagrams, or fold into `terra/` (`briefs/05`) |
| `chips` (top level) | Four real `// TODO: Implement …` comments — **in `script.js`, which `index.html` doesn't even load** (it loads `app.js` + `scene.js`). Importmap points at unversioned `https://threejs.org/build/three.module.js` | Pin three.js, resolve or delete the orphan file |
| `islands` (top level) | Samples hotlinked from `raw.githubusercontent.com` | **MERGE into `drums/` → `briefs/04`** |

---

## CUT — 11

| Path | Why |
|---|---|
| `orbiter/` | Contains only `MOVED.md`. Project became `wondervoid`, private. Add a redirect stub at `/orbiter`, note it in the root README, delete the dir |
| `sandbox/amartha` | **185 bytes.** One line: an `<elevenlabs-convai agent-id="…">` element + its unpkg script. No doctype, no `<html>`, no `<head>`, no title. Renders a blank page with a floating chat bubble that works only while that agent ID stays provisioned |
| `sandbox/ephem` | "ÆTHERWAVES Design System" — aether's chrome with the engine removed. **No MediaPipe, no Tone, no canvas.** The "FPS: 60 / Latency: 12ms" readout is hardcoded strings |
| `sandbox/quantia` | The discarded 486-LOC sketch of `sandbox/quantum` (3,568 LOC, real math). Coherence "99.9987%" is literal text |
| `sandbox/uncertain-instruction` | One static screen of invented percentages. No rAF, no canvas, no interaction beyond an epoch toggle |
| `sandbox/brutalism` | Weakest of four manifesto pages. `anti-design` and `terra` cover the ground better |
| `diggg/` | Self-declared "three.js mock". `formicarium`'s README explicitly names it as an abandoned step. Superseded twice |
| `sandbox/aether/hand.{html,js,css}` | 53.7% verbatim fork of `script.js`, no audio, fatal pitch bug at `:587`, `TypeError` on `D` at `:887` → `briefs/03` |
| `materials/alt.html` | Orphaned variant that **shares `app.js`** with `index.html` → `briefs/02` |
| `sandbox/palettes/bioflow.html`, `technof.html` | Both broken, both unrelated to the Lampy piece they're filed under |
| `sandbox/body/data-amit.js` | Byte-identical duplicate, never loaded |

**Also delete, file-level:** `chips/script.js`, `sandbox/spectral/ambient.js`,
`sandbox/spectral/spectre.js`, `sandbox/repository/hydration.js` (all orphaned — loaded
by nothing), `sandbox/treevalley/images/{1,2,4,5,7,8}.jpg` (1.4 MB unreferenced), the 9
unreferenced videos in `videos/` (~14 MB), and every tracked `.DS_Store`.

---

## Cross-cutting sweep — apply to every surviving dir

1. **Kill the Tailwind Play CDN.** ~40 pages ship a JIT compiler to the client.
   Either bundle per-project, or extract one shared prebuilt stylesheet.
2. **Pin every CDN import.** Currently three Tone.js versions coexist (15.1.5, 14.8.49,
   14.7.77); `chips` imports three.js **unversioned** from `threejs.org`.
   `sandbox/shapes` does it right (`jsdelivr@0.160.0`) — copy that.
3. **Self-host every hotlinked asset.** drums, islands, eco-brutalism, map-of-plants,
   blrhikes, palettes(giphy), chips.
4. **Run the durability check** (`GAUNTLET.md` §7) over every directory. Resolving every
   local `src`/`href` against the filesystem alone would have caught treevalley, mib,
   bioflow and all three `/api/placeholder` refs.
5. **Every survivor gets a manifest entry** in `/data/projects.json` with a real blurb.
   The build fails if a directory exists with no entry, or an entry points nowhere.

---

## Top 10 for the front page

Ranked by "would you show this to someone in the next minute":

1. **`sandbox/aether`** — webcam theremin. The "you can't believe this runs in a
   browser" demo, already live and OG-complete.
2. **`fireflies`** — a real game with a real emotional arc (dread → wonder). Zero deps,
   zero assets, pinned CDN. Nothing in it can break.
3. **`formicarium`** — most original concept here: talk to an ant colony in chemistry.
   Pure canvas, no libraries, species-accurate.
4. **`sandbox/spacewar`** — 1962 recreation with a genuine historical spec in the readme
   and literally zero external dependencies.
5. **`sandbox/quantum`** — the most technically substantial thing in the repo. Real
   state-vector math, not a mock dashboard.
6. **`sandbox/spectral`** — a design thesis with live proof. Best hire-me artifact.
7. **`dig`** — a full survival-crafting paleontology game with tests, docs, and a
   roadmap. Currently invisible from the homepage.
8. **`sandbox/oroharp`** — the second hand-tracking instrument that isn't a rehash.
9. **`sandbox/neverleave`** — funniest thing here, and the joke is technically earned.
10. **`sandbox/pan-galactic`** — full trading game, no framework at all.

Runners-up already deployed and worth keeping linked: `sandbox/zen` 🔒, `moonfall` 🔒,
`process`, `sandbox/red-thread`, `sandbox/vogon`.
