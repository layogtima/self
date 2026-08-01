# 08 — Shared core

Branch: `gauntlet/shared-core` · **Merge this first.** `aether`, `drums`, `oroharp`
and `symphony` all depend on it, and if they run before it they will each reinvent
the scheduler.

---

## Why

There are **four half-built audio engines** and **four copies of MediaPipe glue** in
this repo:

| Project | Audio stack | Hands | Note |
|---|---|---|---|
| `sandbox/aether/script.js` | Tone.js **15.1.5** | MediaPipe ×2 | Theremin, continuous |
| `sandbox/aether/hand.js` | **none** | MediaPipe ×1 | Silent fork of the above |
| `sandbox/oroharp/airharp.js` | Tone.js **14.7.77** + Vue 3 | MediaPipe ×1 | Air harp, pluck detection |
| `sandbox/sound/script.js` | **raw Web Audio**, 1,665 lines | — | Full DIY engine |
| `sandbox/symphony` | **no audio at all** | MediaPipe ×2 | three.js particles only |
| `drums/index.html` | **HTMLAudioElement only** | — | Sample player |
| `islands/` | Tone.js **14.8.49** + `new Audio` | — | Direct ancestor of `drums` |
| `sandbox/base64/tone.html` | raw Web Audio | — | Has a working WAV encoder |

**Three incompatible Tone.js versions.** Repo-wide, `Tone.Transport.scheduleRepeat`,
`lookAhead`, `scheduleAheadTime` and `nextNoteTime` appear **zero times**; every timed
thing is `setInterval`. `AudioContext.currentTime` is used correctly only in
`sandbox/sound` — and even there the sequencer ignores it. **13 files** each do their
own `new (window.AudioContext || window.webkitAudioContext)()`.

Measured duplication:

- `aether/script.js` vs `aether/hand.js`: **53.7% of 1,027 non-trivial lines are
  verbatim identical.** Byte-identical blocks include the 21 landmark constants
  (`script.js:134-154` ≡ `hand.js:86-106`), `HAND_CONNECTIONS` (24 entries,
  `:157-182` ≡ `:109-134`), `LANDMARK_COLORS` / `SIZES` / `NAMES`, `setupWebcam()`,
  `initMediaPipeHands()`, `calculatePalmRotation()`, `smoothRotation()`,
  `smoothLandmarks()`, `getClosestNote()`, and the whole FPS-counter trio.
- The **29-entry hardcoded C2→C6 note table is triplicated verbatim** across
  `aether/script.js:73-103`, `aether/hand.js:50-80`, and `sandbox/sound/script.js`.
  All three collapse to `440 * 2**((semitone-9)/12 + (octave-4))` — which
  `oroharp/airharp.js:196-199` **already implements correctly**.
- **MediaPipe boilerplate is quadruplicated**: identical `new Hands({locateFile: …})`
  + `setOptions({modelComplexity: 1, minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5})` + `new Camera(...)` in `aether/script.js:296-329`,
  `aether/hand.js:228-261`, `oroharp/airharp.js:316-349`,
  `symphony/index.html:233-273`, with the same four CDN script tags in all four HTML
  files. The EMA `smoothLandmarks()` is triplicated with three different smoothing
  factors.

**One shared core deletes well over 1,500 lines and fixes the timing bug in every
project simultaneously.**

---

## `shared/audio-core`

```
shared/audio-core/
  context.ts      one AudioContext, created on user gesture, resumed correctly
  master.ts       gain → filter → DynamicsCompressor → analyser → destination
  scheduler.ts    the lookahead clock. THE point of this package.
  transport.ts    BPM, time signature, swing, position, tap tempo, phase-preserving
                  tempo change
  scales.ts       note math + scale tables
  voices.ts       per-voice GainNode envelope helpers, choke groups
  drums.ts        synthesized kit
  reverb.ts       procedural convolution impulse
  wav.ts          AudioBuffer → 16-bit PCM WAV, + base64
  midi.ts         requestMIDIAccess in/out, GM percussion map, clock, CC
```

### `scheduler.ts` — the whole reason this exists

Chris Wilson lookahead. Non-negotiable API shape:

```ts
type Scheduled = { time: number; fn: (t: number) => void }

createScheduler({
  lookaheadMs: 25,      // how often the timer wakes
  scheduleAheadS: 0.1,  // how far into the future we schedule
})
```

Rules, enforced at G3:

- **Nothing schedules audio from a rAF, a `setInterval`, a pointer handler, or a
  MediaPipe callback.** Those write into a control-state object; the scheduler reads it.
- Every event is started at an **absolute** `AudioContext.currentTime + n`.
- **Tempo changes preserve phase.** `drums/index.html:361-370` currently does
  `clearInterval` + fresh `setInterval`, resetting the beat. With a lookahead clock,
  preserving position is free.
- Expose measured latency: `ctx.baseLatency`, `ctx.outputLatency`, plus a
  user-settable offset for input latency.

### Harvest list — this code already exists, don't rewrite it

| Take | From | Lines |
|---|---|---|
| Master chain: gain → lowpass → `DynamicsCompressor` → analyser → destination | `sandbox/sound/script.js` | `:21-61` |
| Procedural convolution reverb from a generated impulse | `sandbox/sound/script.js` | `:64-82` |
| **Synthesized kit**: kick (pitch-swept sine), snare (noise+tone), hihat, clap (4 delayed noise bursts), tom, fx sweep | `sandbox/sound/script.js` | `:197-296` |
| `playBuffer()` with gain/filter/delay, scheduled at `ctx.currentTime` | `sandbox/sound/script.js` | `:299-336` |
| `SynthEngine` — per-voice osc/filter/ADSR/feedback-delay | `sandbox/sound/script.js` | `:340-450` |
| 4 preset patterns (BASIC BEAT / TRAP / HOUSE / TECHNO) | `sandbox/sound/script.js` | `:525-570` |
| **`scales{}`** — major, minor, pentatonic, blues, chromatic | `sandbox/oroharp/airharp.js` | `:39-45` |
| **`getFrequency(semitone, octave)`** — the correct note math | `sandbox/oroharp/airharp.js` | `:196-199` |
| **Pluck/onset detection** with `pluckThreshold` + `pluckCooldown` — exactly the gesture-onset model aether needs | `sandbox/oroharp/airharp.js` | `:468-518` |
| **`bufferToWav()`** — correct dependency-free 16-bit PCM encoder | `sandbox/base64/tone.html` | `:139-199` |
| **`arrayBufferToBase64()`** | `sandbox/base64/tone.html` | `:209-216` |

Leave behind from `sandbox/sound`: the `setInterval` sequencer (`:766`), the Matrix-rain
easter egg (`:679-711`), the Konami code (`:1192`), the hover-tone interval (`:1327`),
and the ten taglines (`:487-499`) — ~400 of its 1,665 lines are novelty.

Leave behind from `oroharp`: the Vue-3-inside-a-global-script structure (`app.strings`
mutated from outside the component at `:157`), the broken visualizer at `:265` (treats
`Tone.Analyser`'s float −1..1 output as if it were 0..255 byte data — `data[i]/128.0`
on an already-normalised value renders a flat line), and `updateFps()` at `:405-408`
which `console.log`s every second forever.

### `midi.ts` — new, and the highest-leverage thing in this package
`navigator.requestMIDIAccess` appears **zero times in this repo.** Ship:
device enumeration + hot-plug, GM percussion mapping (36 kick, 38 snare, 42 CH, 46 OH,
51 ride, 49 crash, 41/45/48 toms), incoming velocity honoured, hi-hat CC4 pedal
position, MIDI clock in/out, and MIDI-file export.

---

## `shared/hands-core`

```
shared/hands-core/
  landmarks.ts    the 21 indices, HAND_CONNECTIONS (24), colors, sizes, names
  setup.ts        webcam + MediaPipe Hands init, one config object
  smooth.ts       one EMA implementation, configurable factor
  gestures.ts     palm rotation, pinch distance, palm openness, onset detection
  draw.ts         skeleton overlay
```

Four consumers: `aether`, `oroharp`, `symphony`, and any future one.

**Do not deep-clone landmarks per frame.** `aether/script.js:785` does
`JSON.parse(JSON.stringify(...))` on 21 points per hand at 30 fps — pure GC churn.
Reuse typed arrays.

**Handle hands leaving the frame.** `aether/script.js:1111` iterates
`for (const handType in filteredLandmarks)`, which includes stale hands from previous
frames because nothing ever deletes them. Ghost hands drive the audio.

---

## `shared/tokens`

The design system as CSS custom properties. The repo has **zero `--var` declarations**
today; every colour is a Tailwind utility or one of eight raw hex literals.

```
--ink, --paper, --hairline, --grid
--font-mono, --font-display
--space-1..8
--dur-instant / --dur-quick / --dur-ambient   (the 90s–240s SMIL durations)
--motion-scale        set to 0 by prefers-reduced-motion, multiplied into every duration
```

Plus one shared `reduced-motion.css` and one `a11y.css` (`:focus-visible`, skip link,
`sr-only`). **Zero pages currently have a `prefers-reduced-motion` block.** Fixing it
once here fixes it everywhere.

---

## `scripts/`

| Script | Job |
|---|---|
| `check-durability.mjs` | `GAUNTLET.md` §7. Greps built output for `http://`, CDN hosts, `raw.githubusercontent.com`, `/api/placeholder/`, unversioned three.js, `TODO`/`FIXME`. **Resolves every local `src`/`href` against the filesystem** — that check alone catches treevalley, mib, palettes/bioflow, and three `/api/placeholder` refs |
| `build-manifest.mjs` | Walks the repo, extracts title/description/og:image from every `index.html`, cross-checks `/data/projects.json`. **Fails the build** on a directory with no entry or an entry pointing nowhere |
| `og.mjs` | Generates OG images from a template so they can never go stale again. The hub's current one still advertises a tagline that was cut from the hero |
| `smoke.mjs` | Playwright: cold load, assert zero console errors, zero 4xx/5xx, no horizontal scroll at 375 px and 1440 px, light + dark |

---

## Gauntlet notes

- **G2 for this branch is the whole point.** `scheduler.ts` needs a real test: simulate
  a 64-bar run at 180 BPM and assert every scheduled time lands within **1 ms** of its
  grid position, then change tempo mid-run and assert the phase does not shift.
- **G3** blocks on any consumer still holding its own `AudioContext`, its own note
  table, or its own MediaPipe init.
- **DURABILITY is the axis this branch is scored on.** Pin everything. Bundle
  everything. Zero external runtime deps in the output.
- Ship it as a plain ES module directory consumed by relative import — no npm publish,
  no workspace tooling. Vite handles it.
