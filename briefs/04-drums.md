# 04 — Drums

Branch: `gauntlet/drums` · Depends on `gauntlet/shared-core`. Absorbs `islands/`.

> *"Drums' UI is pretty.. meh; overhaul to make a drummer jealous."*

---

## What exists

`drums/index.html` — 513 lines, one file. Branded `MONOTONE` in-page, titled
"Drums: Drop a Beat!". Nine grey circles on white; click one → drum hit + ripple.
A 16-step sequencer hides in a slide-up panel behind an unlabelled hamburger.

**There is no `AudioContext` in this file. Zero occurrences.** Despite the `MONOTONE`
branding, no Tone.js either. Playback is `new Audio(...)` (`:187-197`) + `cloneNode()`
+ `.play()` (`:259-261`) — `HTMLMediaElement`. Consequences: no gain nodes, no filters,
no pitch control, no envelopes, no choke groups, no sample-accurate timing, unbounded
orphaned `<audio>` elements, and decode cost per hit.

**The nine samples are hotlinked from a stranger's repo:**
`raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/…/01-javascript-drum-kit/sounds/*.wav`.
Rate-limited, no CORS guarantee, dead the day that repo moves.

### The timing
`setInterval(tick, stepTime)` where `stepTime = (60/bpm)*1000/4` (`:345-346`, again at
`:367`). No lookahead, no `currentTime`. It contends with the `requestAnimationFrame`
`draw()` loop (`:379-448`) and with per-hit DOM writes, so the groove smears; in a
throttled background tab it stops being a groove at all.

**Changing BPM resets the beat.** `:361-370` does `clearInterval` + fresh
`setInterval`, so nudging tempo mid-loop jumps the phase.

### The sequencer model
`steps = new Array(16).fill(false)` (`:221`). **Booleans.** No velocity, no probability,
no microtiming, no ornaments. `tick()` (`:313-324`) calls `playDrum(island, 0.9)` —
**every sequenced hit is hardcoded velocity 0.9.** 16 steps fixed; no bars, no patterns,
no chaining, no swing, no per-track length (so no polyrhythm), no save/load, no clear.
`stopBtn` resets `currentStep = 0`; `playBtn` doesn't. Play/pause vs stop semantics are
half-implemented.

---

## Why the UI is meh — specifically

1. **It doesn't look like a drum kit, or like anything.** Nine grey discs on white,
   no ground plane, no perspective, no size-to-pitch logic. A drummer's spatial muscle
   memory *is* the interface: kick centre-low, snare left-of-centre, hats left with a
   pedal, toms arcing L→R descending in pitch, ride right, crash upper. Here
   tomLow/tomMid/tomHigh sit at `(0.5,0.6) (0.45,0.45) (0.55,0.35)` — a diagonal smear,
   not a tom arc. It reads as random because it is random.
2. **Greyscale carries no information.** `island.color` (fills 20–220, `:206-214`)
   encodes *nothing*. Identity, pitch, velocity, mute state and sequencer-armed state
   all have zero visual encoding.
3. **Unreadable at speed.** Labels are drawn at `r/3` px **and only if `r > 55`**
   (`:420`) — so **both hi-hats are completely unlabelled**. The glyphs are
   `🥁 💿 ● ◉ ✱ ✦ ◐ ◑ ◒`; three near-identical moon glyphs for three toms. Hit feedback
   is a 3 px ring at 0.5 alpha decaying over ~20 frames (~330 ms) — invisible in
   peripheral vision, which is where you're actually looking while playing.
4. **Velocity is a lie.** `mousedown` (`:454`) computes `1 - centerDist*0.4` → 0.6–1.0.
   `playDrum` (`:260`) applies `Math.max(0.3, velocity) * 0.8` → **0.48–0.80 linear
   amplitude. A 4.4 dB range.** The panel displays "90" as if it means something. A real
   snare spans ~40 dB from ghost note to rimshot.
5. **No keyboard mapping.** The only key handler is Space, which clears *visuals*
   (`:489-495`) while the legend icon implies mute. Drumming with a mouse is one limb.
6. **Monophonic mouse, crippled touch.** `mousedown` only — no `mousemove`-while-down
   for rolls, no `mouseup`. Touch reads `e.touches[0]` only (`:478-486`), so **no
   multitouch**, on the one device where playing two pads at once is natural.
7. **The best feature is hidden.** Sequencer starts collapsed (`sequencer-hidden`,
   `:139`) behind an unlabelled hamburger.
8. **`toggleStep()` calls `buildSequencerUI()`** (`:307-310`) — full teardown and
   rebuild of 153 DOM nodes on every step click, wiping the playhead `boxShadow`.
9. **`updateStepHighlight()`** (`:327-336`) runs `querySelectorAll('.step-btn')` over
   144 nodes and writes inline `style.boxShadow` **every 16th note**. At 240 BPM that's
   16 full-DOM sweeps per second on the same thread as the canvas loop.
10. **The playhead is a black box-shadow on a black-bordered white square** — near
    invisible. No bar grouping, so steps 1/5/9/13 look identical to 2/3/4. You cannot
    see where beat 1 is.
11. **Resize is broken** (`:498-505`) — `absX`/`absY` rescale but `island.r` stays in
    absolute px, so a narrow window has a 120 px kick overlapping everything.
12. Dead code: `lastPos` (`:238`), `isOverOcean` (`:239`) declared, never used.
13. **No mixer at all.** No per-pad volume, pan, mute, solo, or master. No metronome,
    no count-in, no tap tempo, no swing, no undo.

### Keep
The ripple / pulse / cursor-trail canvas rendering (`draw()`, `:379-448`) — it's the one
genuinely charming thing in the file. `getIsland()` hit-testing (`:242-252`). The
slide-up panel pattern (just don't hide the sequencer in it).

---

## Absorb `islands/`

`drums` is a fork of `islands/` — same island metaphor, same variable names, same four
hotlinked sample URLs (`islands/script.js:13-16` ≡ `drums:188-192`), same `setInterval`
sequencer. `islands` has the **better audio layer** (Tone.js `Sampler`, `Tone.now()`
scheduling, melodic instruments: piano/guitar/bass/trumpet/sax). `drums` has the better
visuals. Merge them; ship one thing.

---

## Also lift: `sandbox/sound/script.js`

That file already contains, unused by anything else, most of what drums needs:

- `AudioUtils.init()` `:21-61` — a proper master chain: gain → lowpass →
  `DynamicsCompressor` → analyser → destination
- `createReverb()` `:64-82` — procedural convolution reverb from a generated impulse
- **`generateDrumSound()` `:197-296`** — fully synthesized kick (pitch-swept sine),
  snare (noise+tone), hihat, clap (4 delayed noise bursts), tom, fx sweep. **This is
  the synth kit, already written.**
- `playBuffer()` `:299-336` — gain/filter/delay options scheduled at `ctx.currentTime`
- `SynthEngine` `:340-450` — per-voice osc/filter/ADSR/feedback-delay
- 4 preset patterns `:525-570` — BASIC BEAT / TRAP / HOUSE / TECHNO
- 9 keyboard-mapped pads `:502-512`

Leave behind: its `setInterval` sequencer (`:766`), the Matrix-rain easter egg
(`:679-711`), the Konami code (`:1192`), the hover-tone `setInterval` (`:1327`), and
the ten smug taglines (`:487-499`) — roughly 400 of its 1665 lines are novelty.

---

## Build this — the drummer-jealous list

**Step 0, before anything else.** Rip out `setInterval` and `HTMLAudioElement`. Move to
`AudioContext` + `decodeAudioData` → `AudioBuffer`s + a 25 ms lookahead scheduler
starting `BufferSource`s at absolute `currentTime + lookahead`. Per-voice `GainNode`s.
Self-host the samples. Everything below assumes this.

1. **Velocity spanning 40+ dB, with layers.** 3–4 sampled layers per pad (soft /
   medium / hard / accent), **crossfaded by velocity, not one sample scaled by gain** —
   a loud snare is spectrally different, not just louder. Velocity sources: strike
   distance from pad centre (keep it, map to full 0–127), pointer speed on approach,
   `PointerEvent.pressure`, key-hold duration, MIDI velocity. **Round-robin 3–4
   alternates per layer** to kill the machine-gun effect.
2. **Ghost notes as a first-class concept.** A step is at minimum tri-state
   (off / ghost / accent), ideally continuous 0–127 with visible bar height. Ghost
   snares at 15–35 are what make a groove breathe. A boolean grid **literally cannot
   express funk.**
3. **Flams, drags, ruffs.** Per-step ornament flag, adjustable spacing 10–40 ms, grace
   velocity 30–50% of the main hit. Trivial with absolute-time scheduling; impossible
   with `setInterval`. Buzz/press roll as a held-pad gesture.
4. **Humanization, split into two dials.** *Timing* jitter (±0–25 ms Gaussian,
   **per-track**, so hats float while the kick stays locked) and *velocity* jitter
   (±0–20). Plus a per-track push/pull offset in ms — real drummers play the snare
   5–12 ms behind the kick. Swing 50–75% with selectable subdivision.
5. **Per-pad tuning and decay.** Pitch ±12 semitones, decay/choke length via a gain
   envelope, attack shaping, per-pad tone filter. **Toms are useless without tuning.**
   **Choke groups**: open hat must cut when closed hat fires; crash choke on
   modifier-click. All of this is a `GainNode` ramp per voice — impossible today.
6. **Kit swapping.** Acoustic / 808 / 909 / linndrum / brushes / hand percussion, as
   JSON manifests (sample URLs + per-pad defaults + layer thresholds), user-loadable,
   plus a drop-your-own-WAVs path. And a **synth kit** from `sandbox/sound`'s
   `generateDrumSound()`.
7. **MIDI in and out.** `navigator.requestMIDIAccess()` — **zero occurrences anywhere
   in this repo.** Highest-leverage feature on the list: a real drummer will plug in an
   e-kit or an MPD and play it with sticks. Map GM percussion (36 kick, 38 snare, 42 CH,
   46 OH, 51 ride, 49 crash, 41/45/48 toms), honour incoming velocity, support MIDI
   clock in/out and hi-hat CC4. MIDI **out** lets them drive real gear. MIDI-file export
   of the pattern.
8. **Tap tempo** — four taps, rolling average, outlier rejection. Plus ±1 BPM / ±1 ms
   nudge. **And fix the phase reset** — with a lookahead scheduler, preserving playhead
   position across a tempo change is free.
9. **Polyrhythm / per-track length.** Independent step count and subdivision per track
   (kick in 4, hats in 7, ride in 5) with automatic LCM cycling. One integer per track
   and a modulo — and it's the difference between a toy and an instrument. Bar counts
   1/2/4/8 and pattern chaining A/B/C/D → song mode.
10. **Foot hi-hat states.** Not two pads — **one hi-hat with continuous pedal position**
    (closed / half / open / splash / pedal-chick) driven by a held key, a slider, MIDI
    CC4, or vertical strike position. Openness modulates decay continuously; a closing
    pedal chokes a ringing open hat. The current two-unlabelled-small-circles design is
    the single most drummer-alienating thing in the file.
11. **Visual feedback that reads at speed.**
    - **Kit-realistic layout**: kick centred low and largest; snare left-of-centre; hats
      far left with a visible pedal indicator; toms arcing L→R *descending in size and
      pitch*; ride right; crash upper. Top-down / front-view toggle.
    - **Colour as an information channel**: hue = family (membrane / metal / percussion),
      brightness = last-hit velocity, ring = sequencer-armed. (This is the one place the
      MONO monochrome rule bends — argue it at G3 or find a luminance-only encoding.)
    - **Hit flash big, fast, short**: full-pad fill scaled by velocity, 60–120 ms. Not a
      330 ms hairline. Peripheral vision reads *area and luminance change*.
    - **Sequencer grid**: heavier borders every 4 steps, step height/opacity = velocity,
      playhead as a **bright sweeping column**, real row names not moon glyphs.
    - **Persistent labels on every pad**, regardless of radius, with the keyboard key
      and MIDI note printed on it.
    - **Per-pad hit-history / groove meter** showing your last few hits' timing vs the
      grid in ms, early/late. Drummers obsess over this and no browser toy has it.
      *This is a strong candidate for the G4 "move".*
12. **Practice features, cheap:** metronome with accented downbeat, count-in,
    record-live-then-quantize with strength 0–100%, loop record with overdub, per-track
    mute/solo, undo, pattern export/import as JSON and MIDI.

---

## Gauntlet notes

- **G2** smoke test: assert scheduled hit times land within 1 ms of grid positions over
  a simulated 64-bar run at 180 BPM; assert a tempo change mid-run does not shift phase.
- **G3** blocks on: `setInterval` anywhere in the audio path, `cloneNode()` playback,
  any hotlinked sample, full-DOM sweeps per step, unlabelled pads.
- **G4** — CRITIC for this gate should be prompted as a drummer. The question is
  literally *"would a drummer be jealous?"*, and "it's clean" is a fail.
- Multitouch on mobile is a hard requirement, not a nice-to-have.
