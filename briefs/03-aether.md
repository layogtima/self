# 03 — ÆTHERWAVES

Branch: `gauntlet/aether` · Depends on `gauntlet/shared-core`.
Move `sandbox/aether/` → `aether/` (it's deployed at `aether.layogtima.com`; it isn't
a sandbox experiment).

> *"Atherwaves needs quantization because the sounds."*

---

## The diagnosis

The complaint is two problems wearing one word.

**Problem A: there is nothing to quantize.** The instrument fires **one
`triggerAttack` and one `triggerRelease` per session** — `script.js:495` and `:510`.
Everything in between is continuous parameter modulation:

```js
// script.js:942-954  updateAudio()
synth.frequency.rampTo(frequency, 0.1);
synth.volume.rampTo(volumeDB, 0.1);
```

That 100 ms `rampTo` is portamento, not an envelope. "Notes" are articulated by
*muting* — palm rotation × hand height gates the volume. There is no attack transient
per note. It is a drone with a volume knob. **You cannot quantize events that don't
exist.**

**Problem B: the audio clock is the webcam.** The call chain is
`MediaPipe Camera.onFrame` (`:320`) → `hands.send()` → `handleResults()` (`:1061`) →
`calculateThereminValues()` (`:808`) → `updateAudio()` (`:942`). Parameter updates
arrive at ~24–30 fps, jittery, gated on inference latency.

Repo-wide evidence: `AudioContext.currentTime` is **never referenced** in this file.
`Tone.Transport` appears exactly once — `Tone.Transport.stop()` in `cleanup()`
(`:1385`), stopping a transport that was never started. `setInterval` is used once,
for the FPS counter. `requestAnimationFrame` once, for the waveform draw.

**Problem C: pitch is continuous but the display lies.** `notes[]` (`:73-103`) is 29
hardcoded C2→C6 diatonic entries used **only for display** by `getClosestNote()`
(`:685`). The actual oscillator runs a continuous exponential map (`:838-840`):

```js
const minFreq = 65.41, maxFreq = 1046.50;
const frequency = minFreq * Math.pow(maxFreq / minFreq, boundedX);
```

The readout says "E4" while the oscillator sits at 327.9 Hz.

---

## Fix these first, on `main`, before the rebuild

| Bug | Location | Effect |
|---|---|---|
| `minFreq`/`maxFreq` are `const`s block-scoped inside the left-hand `if` at 838-839, but read at 899 — which only executes in `right-only` mode, where that block is skipped | `script.js:899` | **Pressing `3` throws a `ReferenceError` and kills the audio loop** |
| `handleResize` is undefined | `script.js:1405` | `cleanup()` throws on `beforeunload` |
| `for (const handType in filteredLandmarks)` includes stale hands; hands are never deleted when they leave frame | `script.js:1111` | Ghost hands drive audio |
| `JSON.parse(JSON.stringify(...))` per frame per hand — a 21-point deep clone at 30 fps | `script.js:785` | Pure GC churn |
| `createHandAura()` creates + destroys a DOM node **every frame**; `createCoordinateLabel()` makes up to 42 nodes/frame | `script.js:957`, `:1039` | Layout thrash |

**Delete `hand.html` + `hand.js` + `hand.css` entirely.** `hand.js` is a **53.7%
verbatim fork** of `script.js` with the synth amputated (Tone.js isn't even loaded),
a fatal pitch bug at `:587` (divides a MediaPipe 0..1 normalised `palm.x` by
`window.innerWidth`, so frequency pins at C2 forever — a bug `script.js` already
fixed), and a `TypeError` on the `D` key at `:887` (`toggleDebugPanel()` is invoked as
a function but is a DOM element). If a landmarks-only debug view is wanted, it's a
boolean flag.

---

## The rebuild

### Keep — this part is genuinely good
The entire MediaPipe/visual layer: `handleResults()` (`:1061`), `calculatePalmRotation()`
(`:703`), `smoothRotation()` (`:747`), `updateControlZones()` (`:579`),
`createRotationGuide()` (`:634`), the aura and waveform visuals, and the three-mode
dual-hand role model (`dual` / `left-only` / `right-only`). Move the MediaPipe glue
into `shared/hands-core` (see `briefs/08`).

### Architecture change — sensing and sound must be decoupled

```
MediaPipe frame  →  sensing layer  →  control state {pitch, gain, gesture events}
                                                    ↓  (no audio calls here, ever)
                        25 ms lookahead scheduler reading AudioContext.currentTime
                                                    ↓
                        Tone events at absolute future times ≥100 ms out
```

Exact edits:

| # | Location | Change |
|---|---|---|
| 1 | `updateAudio()` `:942-954` | Split into `setTargetPitch()` / `setTargetGain()` (state writes only) and a new `triggerQuantizedNote(time, freq, vel)` calling `synth.triggerAttackRelease(freq, dur, time)` at an explicit AudioContext time |
| 2 | `calculateThereminValues()` `:808-939` | Stop calling `updateAudio()` at `:912`. Write `pendingNote = {freq, vel}` into control state. This function becomes **pure sensing** |
| 3 | `handleResults()` `:1061-1186` | Demote to sensor-only. Reroute the no-hands branch at `:1166-1183` that currently calls `updateAudio(440, 0)` |
| 4 | `toggleTheremin()` `:480-530` | Replace `triggerAttack(440)` / `triggerRelease()` with `Tone.Transport.start()` / `.stop()` + scheduler lifecycle. **Biggest structural edit** |
| 5 | `initAudio()` `:332-414` | Hoist `filter` and `reverb` out of function scope (currently trapped as locals at `:354`/`:361`, mutated by three listener closures at `:393-405`). Add `Transport.bpm`, `getContext().lookAhead`, `Transport.scheduleRepeat(scheduler, '16n')`. Swap `Tone.Synth` → `PolySynth` for overlap |
| 6 | `notes[]` `:73-103` + `getClosestNote()` `:685-700` | Promote from display-only to the pitch quantizer. `getClosestNote()` already does nearest-neighbour — reuse it as `quantizePitch()`. Replace the hardcoded diatonic table with `root + scale[] + octaves` from `shared/audio-core` |
| 7 | `:838-840` | Keep the exponential map, but its output becomes an *unquantized target* that gets snapped |

### Note onset — the missing primitive
`sandbox/oroharp/airharp.js:468-518` already solves this. `checkStringPluck()` with
`pluckThreshold` + `pluckCooldown` is exactly the gesture-onset model aether needs.
Lift it. Candidate onsets: pinch, palm close, velocity threshold crossing, or entering
a new pitch cell.

### Quantization feature set

1. **Transport** — `Tone.Transport`, BPM 60–200, time signature, bar/beat/16th readout,
   play/stop/tap tempo. Don't invent a clock; Tone 15 has one and it's already imported.
2. **Lookahead scheduler** — Chris Wilson pattern. 25 ms timer, inspect
   `AudioContext.currentTime`, schedule ≥100 ms out at absolute times. **Never call
   `triggerAttack()` from `handleResults()`** — that path carries ±30 ms of camera
   jitter plus inference variance.
3. **Grid** — 1/4, 1/8, 1/16, 1/32, plus 1/8T and 1/16T triplets and dotted. Tone's
   `'8n'` / `'8t'` notation handles it natively.
4. **Swing** — `Transport.swing` + `swingSubdivision`. 50–66% is where it feels human.
5. **Pitch quantization** — root (12) × scale (major, minor, dorian, mixolydian,
   pentatonic, blues, chromatic — the table already exists at `oroharp/airharp.js:39-45`)
   × octave range. **Ship a glide/snap blend dial, 0 = hard snap, 1 = current theremin
   behaviour.** A theremin that always snaps stops being a theremin; make it a dial,
   not a switch. This is the single most important design decision in the project.
6. **Latency compensation** — three stacked latencies, all exposed:
   - MediaPipe inference + camera: ~40–90 ms. **Timestamp landmarks on arrival.**
   - `Tone.getContext().lookAhead` (default 0.1 s)
   - `AudioContext.outputLatency` / `baseLatency`
   Plus a user "gesture offset" slider (−100…+100 ms) and a calibration mode: tap along
   to a metronome, measure the mean offset, auto-set.
7. **Loop / record layer — required, not optional.** Quantization without capture is
   pointless: you snap a note to the grid, hear it once, it's gone. Minimum viable:
   1/2/4/8-bar loop buffer capturing `{time, freq, vel, dur}`, overdub, per-layer undo,
   clear, metronome, count-in, and **re-quantize-after-the-fact** (record free, quantize
   on playback — the only way to keep theremin expression). This is the feature that
   turns Ætherwaves from a toy into an instrument.
8. **Cheap wins** — humanize (±ms jitter), gate/note-length, and **velocity from hand
   speed** (velocity does not exist at all today).
9. **WAV export** — `sandbox/base64/tone.html:139-199` has a correct, dependency-free
   16-bit PCM `bufferToWav()` plus `arrayBufferToBase64()` at `:209-216`. Lift both into
   `shared/audio-core` and delete that page.

---

## Gauntlet notes

- **G2** must include a headless smoke test that boots the audio graph without a camera
  (mock the landmark stream) and asserts scheduled event times land on grid boundaries
  within 1 ms. This is testable; test it.
- **G3** blocks on: any audio call in a rAF or MediaPipe callback path; any `setInterval`
  driving sound; per-frame DOM creation.
- **G4** — the move: *free-hand expression that lands on the grid anyway.* If the snap
  dial at 0.5 doesn't feel like the best of both, DELIGHT is a 2.
- Camera permission denial and no-webcam must degrade gracefully to a mouse/keyboard
  mode, not a dead page.
- `prefers-reduced-motion` on the aura/waveform visuals.
