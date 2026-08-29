# SPEC — shared core

Branch: `gauntlet/shared-core` · Brief: `briefs/08-shared-core.md` · Gate: G0

---

## One sentence

The engine room for every instrument on this site: one sample-accurate audio clock,
one pair of camera-tracked hands, and one monochrome design language — so that four
half-built audio toys stop reinventing (and re-breaking) the same three wheels.

## What it is

Three plain ES-module packages plus four repo scripts. No npm publish, no workspace
tooling, no framework. Consumers import by relative path and Vite bundles them.

```
shared/
  audio-core/    the clock, the master chain, the voices, the kit, MIDI, WAV export
  hands-core/    webcam + MediaPipe init, landmarks, smoothing, gestures, skeleton draw
  tokens/        the design system as CSS custom properties + a11y/reduced-motion CSS
scripts/
  check-durability.mjs   greps built output for CDN/http/TODO rot; resolves every local
                         src/href against the filesystem
  build-manifest.mjs     walks the repo, cross-checks /data/projects.json, fails on drift;
                         reads a MANIFEST_EXCLUDE list (rigs, fixtures, vendor dirs —
                         shared/demo/ is the first entry) so non-projects don't trip it
  og.mjs                 generates OG images from a template
  smoke.mjs              Playwright cold-load: zero console errors, zero 4xx/5xx,
                         no horizontal scroll at 375/1440, light + dark
```

## Interaction model

This package has no UI of its own. Its "interaction" is an API contract with four
consumers (`aether`, `drums`, `oroharp`, `symphony`) plus one **demo page**
(`shared/demo/index.html`) that exists so G2–G4 have something to load: a metronome
wired to the scheduler, a synthesized kit pad, a hand-skeleton overlay, and a tempo
slider that must not drop the beat. The demo page is a test rig, not a project — it
does not get a hub card.

Control flow rule (the whole thesis):

> Input handlers — pointer, rAF, MediaPipe callbacks — **write control state**.
> The scheduler **reads control state** and starts every audio event at an absolute
> `AudioContext.currentTime + n`. Nothing else ever calls a `start()`.

## Data model

TypeScript types, enforced by `tsc --noEmit`. No string-encoded quantities anywhere:
every duration is `number` seconds (audio) or `number` ms (timers), every frequency
`number` Hz, every tempo `number` BPM, every position `{bar: number, beat: number,
phase: number}`. Units live in the field name or JSDoc, never inside the value.

### audio-core

```ts
// context.ts
getContext(): AudioContext            // lazy singleton, created+resumed on user gesture
onReady(fn: () => void): void

// scheduler.ts — Chris Wilson lookahead; THE point of this package
type Scheduled = { time: number; fn: (t: number) => void }   // time: absolute ctx seconds
createScheduler(opts: {
  lookaheadMs: number      // default 25 — how often the timer wakes
  scheduleAheadS: number   // default 0.1 — how far ahead events are armed
}): Scheduler
interface Scheduler {
  at(time: number, fn: (t: number) => void): void
  every(intervalBeats: number, fn: (t: number, pos: Position) => void): Unsubscribe
  start(): void; stop(): void
  latency(): { base: number; output: number; userOffset: number }   // seconds
}

// transport.ts
type Position = { bar: number; beat: number; phase: number }  // phase 0..1 within beat
interface Transport {
  bpm: number                    // setter preserves playhead phase — G2 asserts this
  timeSignature: [number, number]
  swing: number                  // 0..1
  position(): Position
  tapTempo(): void
}

// scales.ts
getFrequency(semitone: number, octave: number): number   // 440 * 2**((s-9)/12 + (o-4))
scales: Record<'major'|'minor'|'pentatonic'|'blues'|'chromatic', number[]>

// voices.ts
interface Voice { gain: GainNode; envelope(a: number, d: number, s: number, r: number): void }
chokeGroup(...voices: Voice[]): void

// drums.ts — synthesized kit harvested from sandbox/sound/script.js:197-296
kick(t: number, opts?): void; snare(t): void; hihat(t, open?): void
clap(t): void; tom(t, pitch): void; sweep(t): void        // t is absolute ctx time

// midi.ts — navigator.requestMIDIAccess appears zero times in this repo today
interface MidiIO {
  inputs(): MIDIInput[]; outputs(): MIDIOutput[]          // + hot-plug events
  onNote(fn: (note: number, velocity: number) => void): Unsubscribe
  onCC(fn: (cc: number, value: number) => void): Unsubscribe   // CC4 = hi-hat pedal
  clock: { sync: boolean }                                 // MIDI clock in/out
  percussion: Record<number, DrumName>   // 36 kick, 38 snare, 42 CH, 46 OH, 49 crash…
  exportFile(events: MidiEvent[]): Uint8Array
}

// wav.ts — harvested from sandbox/base64/tone.html:139-199
bufferToWav(buffer: AudioBuffer): ArrayBuffer     // 16-bit PCM
arrayBufferToBase64(buf: ArrayBuffer): string
```

### hands-core

```ts
// landmarks.ts — the 21 indices, HAND_CONNECTIONS (24 pairs), colors/sizes/names
// setup.ts
initHands(video: HTMLVideoElement, opts: {
  maxHands: 1 | 2
  modelComplexity: 0 | 1
  minDetectionConfidence: number
  minTrackingConfidence: number
}, onFrame: (hands: HandFrame) => void): Promise<HandsSession>

type HandFrame = {
  left: Float32Array | null      // 21 × (x,y,z) reused buffer — no per-frame cloning
  right: Float32Array | null     // null the moment a hand leaves frame — no ghosts
  timestamp: number              // ms
}

// smooth.ts — ONE EMA, factor configurable per consumer
smooth(factor: number): (frame: HandFrame) => HandFrame

// gestures.ts
palmRotation(hand: Float32Array): number          // degrees 0..360
pinchDistance(hand: Float32Array): number         // normalised 0..1
palmOpenness(hand: Float32Array): number          // 0..1
onset(opts: { threshold: number; cooldownMs: number }):
  (value: number, now: number) => boolean         // pluck detection from oroharp

// draw.ts
drawSkeleton(ctx: CanvasRenderingContext2D, frame: HandFrame): void
```

MediaPipe Hands + Camera are **pinned, self-hosted vendor files** under
`shared/hands-core/vendor/` — the four CDN script tags die.

### tokens

```css
--ink; --paper; --hairline; --grid;
--font-mono; --font-display;
--space-1 … --space-8;
--dur-instant; --dur-quick; --dur-ambient;   /* the 90s–240s SMIL band */
--motion-scale;   /* 1 normally, 0 under prefers-reduced-motion; multiplied into every duration */
```

Plus `a11y.css` (`:focus-visible`, `.sr-only`, skip link) and `reduced-motion.css`.
Zero pages have a `prefers-reduced-motion` block today; this fixes it once.

Also `theme.js`: the repo's one dark-mode mechanism, per CLAUDE.md §6 — reads the
`color-theme` localStorage key, sets the `dark` class in a **blocking `<head>`
script** so dark-mode users never see the white flash. Consumers inline or import
it; nobody reimplements it.

## Screens

None. The demo page (above) is the only renderable surface, and it is a rig.

## Provenance

Working code is harvested, not rewritten — per the brief's harvest table: master
chain, reverb impulse, synthesized kit, `playBuffer`, `SynthEngine`, presets from
`sandbox/sound/script.js`; scales, note math, pluck detection from
`sandbox/oroharp/airharp.js`; WAV + base64 encoders from `sandbox/base64/tone.html`.
The `setInterval` sequencer, Matrix rain, Konami code, and taglines stay behind.

## What it is NOT

- **Not a framework.** No components, no state management, no render loop. Consumers
  own their DOM.
- **Not published.** No npm package, no monorepo workspace, no versioning ceremony.
  Relative imports only.
- **Not a Tone.js wrapper.** Tone.js (all three versions of it) is deleted from
  consumers, not abstracted over.
- **Not backwards-compatible.** Existing pages are rebuilt against it in their own
  branches; nothing in `shared/` shims old call sites.
- **Not a home for project logic.** If only one consumer needs it, it doesn't go in
  `shared/`. The bar for entry is two real call sites.
- **Not visible.** No hub card, no manifest entry for the demo rig.

## Budget

**80k tokens / ~4 focused hours** for BUILDER across all gates, per GAUNTLET.md §5.
At 80% spent, JUDGE decides ship-what-exists or park. G2's scheduler test (64 bars at
180 BPM, every event within 1 ms of grid; tempo change mid-run preserves phase) is the
non-negotiable core; MIDI file *export* is first overboard if the budget bites.

## Definition of done (this branch)

- `npm run build` and `npm run test` exit 0 (root package.json arrives with this branch)
- Scheduler test passes: ≤1 ms grid deviation over 64 bars @ 180 BPM, phase preserved
  across a mid-run tempo change
- `check-durability.mjs` passes on `shared/demo/`
- Zero `AudioContext` constructions outside `context.ts`, zero note tables outside
  `scales.ts`, zero MediaPipe init outside `setup.ts` — enforced by grep in the test
- Demo rig loads cold with zero console errors at 375 px and 1440 px, light and dark
