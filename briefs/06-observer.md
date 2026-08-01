# 06 — OBSERVER

Branch: `gauntlet/observer` · Overhaul in place. The concept is right; the execution
is a stock template.

> *"Observer feels banal compared to the initial idea; make it more punchy?"*

---

## What it actually is

A single-page, four-section scrollytelling essay about surveillance and behavioural
manipulation, which demonstrates its thesis by narrating your own telemetry back at you.

**No API. No network calls. No storage. No backend.** `app.js` never touches `fetch`,
`XHR`, `localStorage`, `sessionStorage`, or `document.cookie`.

| Section | Headline |
|---|---|
| `intro` | "This website is **studying** you." |
| `witness` | "Your **patterns** are visible." |
| `interact` | "Your mind can be **influenced**." |
| `consent` | "You have already **given** consent." |

**Real measurements:** `cursorMoves`, `timeOnPage`, `scrollPercentage` /
`maxScrollPercentage`, `screenSize` (once, at init), ring buffers of the last 100
hovers / 50 clicks / 50 scrolls, and text selections over 10 characters.

**Fabricated — i.e. everything that sounds clinical:**
- `readingSpeed = 200 + Math.floor(Math.random() * 50)`, relabelled `~{{ }} wpm`
- `focusRetention = min(95, 60 + timeOnPage/10)` ± 5 random — a clock with jitter
- `systemAnalysis` rotates one random key every 8 s through hardcoded arrays
  (`'Non-linear' | 'Associative' | 'Sequential'…`; `'56.2%' | '64.7%' | '72.3%'…`)
  behind a fake `analyzing…` → `processing…` typing sequence
- `visitorId` = 16 random hex chars after a 2 s delay

**The word test:** eight nouns with signed weights (`security: 10`, `freedom: -8`,
`control: 7`, `privacy: -7`, `power: 8`, `stability: 9`, `connection: 5`,
`knowledge: 2`); the mean maps to six labels via a threshold ladder. At ≥3 selections
it appends a random line like *"Your selection pattern matches 78% of users who later
accepted all terms without reading them."*

**The consent quiz:** five checkboxes, three of them inverted, four tiers
(Minimal / Partial / Elevated / Critical).

**Total visitor experience:** land on a black page with an invisible pointer, read four
screens, watch a counter tick, click eight words, tick five boxes, get told you're a
paradox, click "Return to beginning." About two minutes. Nothing persists, nothing
branches, the second visit is byte-identical to the first.

---

## Why "banal" is fair — specifically

**a) The centrepiece effect is mathematically invisible.**
`.subliminal { color: rgba(255, 51, 51, 0.1) }` combined with the inline binding
`:style="{ opacity: subliminal.visible ? '0.05' : '0' }"` gives an effective alpha of
**0.1 × 0.05 = 0.005** against `#0a0a0a`, for **50 ms**. The OBEY / CONSUME / SUBMIT
flash — the most transgressive idea in the project, wired to six separate triggers —
**renders as literally nothing.** The same compounding kills the eye (`opacity: 0.2`,
30 px, gone in 1.5 s). *The scary parts were built and then dimmed out of existence.*

**b) It tells you it's watching, then tells you it isn't, then asks you to be unsettled.**
`intro` says *"Your interactions, movements, and engagement patterns are being analyzed
in real-time."* `consent` says *"No actual data has been stored or transmitted—this is
merely an educational illustration."* The footer says *"No data is being collected."*
**A surveillance piece that opens with the disclaimer has spent its only bullet on
slide one.**

**c) The fake numbers poison the real ones.** The user watches `~231 wpm` become
`~207 wpm` while sitting still, and instantly stops trusting `cursorMoves` too — even
though that one is genuine. `systemAnalysis` flips `Cognitive pattern: Non-linear` to
`Convergent` while they do nothing. **The interface is caught lying inside fifteen
seconds.**

**d) The tooltip is unreadable by construction.** `getRandomAssumption(key)` is called
**directly in the template**, and `pageStats.cursorMoves++` fires on **every**
`mousemove` — so every pixel of mouse travel re-renders and re-rolls the random string.
The text changes on the movement required to hover it. Five carefully written strings
per metric, none of them ever read by anyone.

**e) The word test is a horoscope with a lookup table.** `security` and `stability`
differ by one point. Nothing about actual behaviour — dwell time, hesitation, order,
what was hovered and rejected — enters the calculation. `toggleWordSelection` records
the **set**, not the **process**. The one place the site could show you something you
didn't know about yourself, it ignores the data it's already collecting three feet away.

**f) The consent section is a compliance form.** Five checkboxes, an "Analyze Responses"
button, a paragraph of output. This is the interaction pattern of mandatory workplace
training. You cannot make "you are being manipulated" land through a form submit.

**g) The copy is uniformly Serious Tech Dystopia voice.** "digital experiment,"
"behavioral metrics," "cognitive pattern," "suggestibility index," "the defining
condition of digital existence." Every sentence the same length, register, middle
distance. Nothing funny, nothing petty, nothing specific. **Compare the repo's own
README** — *"my brain's a delightful buffet of design, engineering, science, and
absurdity."* Observer reads like it was written by a different, duller person. That
gap is exactly what "banal compared to the initial idea" means.

**h) The visual language is 2019 default-dark-mode.** `#0a0a0a`, Inter + JetBrains Mono,
20 px pixel grid, SVG noise, RGB-split glitch, custom dot cursor, `font-light`. Each is
a signifier of "edgy web experiment"; using all seven at once produces something that
looks like every other edgy web experiment.

**i) It is strictly linear and completely stateless.** Four sections, four identical
Continue arrows, "Return to beginning." No branching, no memory, no consequence — from
a site whose premise is *"The longer you stay, the more the system learns about you."*
**The piece is about accumulation and it does not accumulate.** That is the banality,
in one sentence.

**j) Half the interaction layer is dead code.** 24 pairs of mouseenter/mouseleave that
do nothing, a notification sound that can never play, five "micro-messages" never read.
The site *feels* thinner than it looks in source because it literally is.

---

## Fix the two bugs eating the concept — do these first

1. **Un-dim the subliminal.** `color: #ff3333` at full alpha, element opacity 0.35–0.5,
   duration 80–120 ms. It should be genuinely startling **once**. Then gate it behind
   `prefers-reduced-motion` **and** a visible one-time "this page flashes text" notice —
   do it properly so you can afford to do it hard.
2. **Hoist the tooltip randomness out of render.** `getRandomAssumption` resolves once
   on `@mouseenter` into a data property. Nobody has ever read those strings.

---

## The single highest-leverage change: make it accumulate

Write a compact profile to `localStorage` and **greet returning visitors with it**:

> `visitor_a3f19c02. Third visit. You have spent 6m14s here. Last time you chose
> Security, Control, Stability. You have not changed.`

One `localStorage` key converts the piece from a demo into an accusation — and it makes
the "no data is collected" footer land as **a lie you can catch**, which is far better
theatre than a disclaimer. Then offer a real, working **"delete everything"** button
that visibly wipes it, and note in copy that this is the one thing the real web won't
give you.

---

## Replace the tell with a demonstration

Kill the intro disclaimer. **Prove it mid-scroll instead.** At `witness`, replay the
user's own last 8 seconds of cursor path as an animated polyline over the text — you
already store `events.hovers` with timestamps and `events.clicks` with `{x, y}`.
A visitor watching their own hesitation redrawn in front of them needs no adjectives.
Seeing the exact spot where they paused over "Freedom" and moved away does more than
every sentence in `interact` combined.

## Make the word test read the process, not the answer

The timing data already exists. Use it:

- **Time-to-first-click** → *"You took 11 seconds to choose. Most people take 3."*
- **Hover-then-reject** → *"You hovered Privacy for 1.4 seconds and chose Security
  instead."* (add `mouseenter`/`mouseleave` per `.word-choice` — trivial)
- **Order** → *"You chose Control first. That is usually chosen third."*
- **De-selection** → *"You un-chose Power. We kept it."*

That last line is worth the whole rebuild. **The horoscope becomes forensics.**

## Interaction moves with teeth

- **Make the eye earn its place.** Appear only when the user is idle >10 s, and have it
  look at **where they last clicked**, not at the cursor. Being watched at your last
  decision is creepier than being followed.
- **Weaponise `visibilitychange`.** They tab away and come back: *"You left for 47
  seconds. We waited."* One line, zero new UI, enormous effect.
- **Degrade the page as they scroll.** Progressively raise noise opacity, tighten
  letter-spacing, slow the scroll-smoothing by depth — the deeper they go, the more the
  environment closes in. The `tracking-shift` keyframe **already in the Tailwind config
  does exactly this and is never applied to anything.**
- **Break the "Continue" affordance once.** Somewhere in `interact`, have it move 40 px
  away on hover, once, then behave normally. Never mention it. A single unrepeatable
  glitch is remembered; a permanent gimmick is a nuisance.
- **Add a fake opt-out.** A ghosted `[ opt out ]` in the header. Clicking fades the UI
  toward off for 600 ms, then restores with `"opt-out request received"` in the corner
  and nothing changed. **This is the actual thesis of the site, delivered as an
  interaction instead of a paragraph.**
- **Put the honest telemetry in peripheral vision.** A live one-line HUD fixed to the
  viewport, not a grey card buried halfway down the page.

## Copy surgery

- Cut every instance of "digital experiment," "psychological," "cognitive," "behavioral
  metrics" — the vocabulary of the thing being satirised, used unironically.
- Short, second-person, present-tense, **specific**. Not *"Your interactions,
  movements, and engagement patterns are being analyzed in real-time"* but
  **"You have moved your mouse 1,204 times. None of it was necessary."**
- **Let one line be funny.** The register is currently 100% dread; a single dry aside
  makes the dread believable. The README voice already exists in this repo — use it.
- Rewrite the `consent` reveal as an accusation, not an apology. Keep the data, show
  them exactly what you have, delete it in front of them, and note that this was a
  choice.

## Visual moves

- **Drop six of the seven dark-mode signifiers.** Keep the mono type and the grid; lose
  the RGB glitch, the noise, the trailing-ring cursor, and `font-light`. Spend the
  reclaimed attention on **one** memorable device — e.g. every genuinely-measured number
  in a heavy weight and every fabricated one in a lighter one, unlabelled, so the
  distinction is discoverable but never explained.
- **Give up `cursor: none`,** or make the custom cursor *do* something — a decaying
  trail that persists as a heatmap on the section being read. Right now hiding the
  pointer is pure cost.
- **`threat #ff3333` is defined and used at 0.1–0.4 alpha everywhere.** Use it **once,
  at full strength, at exactly one moment.** A palette with an unused accent is a
  palette with a weapon left in the drawer.

---

## Tech defects

| Severity | Issue |
|---|---|
| High (bug) | **24 `.text-node` spans carry `data-meaning`; zero carry `data-hover-text`.** `showMeaning()` → `showHoverText()` → `getAttribute('data-hover-text')` → `null` → early return. **All 48 handlers are dead.** Only the CSS `content: attr(data-meaning)` rule works |
| High (bug) | **The notification audio can never play.** The `data:audio/mp3;base64,…` payload is **2,777 chars — length ≡ 1 (mod 4)**, structurally invalid. `.play().catch(e => {})` swallows it. It also decodes to pure silence (36% of bytes are `0x55`/`0xAA` padding). **2.8 KB of broken nothing** |
| High (bug) | **`.hover-text` is `position: absolute` but positioned from `clientX`/`clientY`.** As a child of `body` it offsets from the document origin, so after any scroll every tooltip renders `scrollY` px above the cursor — off-screen. Change to `position: fixed` (as `.eye`, `.dot`, `.circle`, `.selection-message` correctly are) |
| High (bug) | **The eye has two pupils.** `styles.css` defines both `.eye::after` (12×12, static, centred) and a `.pupil` div of identical size that translates with the cursor. Delete `.eye::after` |
| High (perf) | The `mousemove` handler does, **per event**: two reactive writes, a `Date.now()`, **a `setTimeout(…, 100)` closure allocation**, two more reactive writes inside it, plus a `recordHoverEvent` push with an O(n) `.shift()` past the 100 cap. At 60–120 moves/sec that's 60–120 timers/sec and a full re-render each. Coalesce into one `requestAnimationFrame` |
| High (perf) | `getRandomAssumption(key)` invoked from the template → re-executes on every re-render, i.e. every mousemove |
| Medium | `scroll` listener non-passive, doing layout reads (`documentElement.scrollHeight`) every event |
| Medium (bug) | `scrollPercentage = scrollPosition / (scrollHeight - innerHeight) * 100` → **`0/0 = NaN`** on a viewport tall enough not to scroll. Loader renders `width: NaN%` |
| Medium | `pageStats.screenSize` captured once at init, **never updates on resize.** No resize listener anywhere |
| Medium (a11y) | `cursor: none` on **both `html` and `body`**, replaced by a 4 px dot at `rgba(138,138,138,0.8)`. On touch devices the dot and ring sit dead at `0,0` |
| Medium (a11y) | **No `prefers-reduced-motion` guard** on `glitch-text` (3 s RGB split), `micro-shift` (body shake), `scan-line`, `cursor-blink`, `subtle-pulse`, or the subliminal flash. A full-viewport 50 ms flash and a body shake are both photosensitivity-relevant patterns shipped with no opt-out |
| Medium (a11y) | `.scroll-counter` is `#8a8a8a` at `opacity: 0.7` ≈ **3.9:1 — fails WCAG AA** at its 0.7 rem size. Body text is `opacity-80`, footer `opacity-50` |
| Medium (a11y) | Native checkboxes styled `bg-transparent border border-whisper` — near-invisible on black. **No `:focus-visible` styles anywhere in `styles.css`** |
| Medium | `app.mount('#app')` where `#app` **is the `<body>` element.** Vue 3 advises against it and the dev build warns |
| Medium | Tailwind Play CDN + Vue from unpkg, no SRI, no `crossorigin` |
| Low (dead code) | `meaningTooltip` declared in `data()`, never referenced. `hideMeaning()` exists solely to call `hideHoverText()`. The five `<span data-message="…">` micro-messages are **never read by any JS** — pure dead weight and a wasted idea. `.reflection` / `data-reflection="observer"` have no behaviour. Tailwind's `tracking-shift`, `very-slow-spin`, `subtle-pulse` configured and never applied |
| Low | `.assumption-tooltip` styled **twice** — fully in `styles.css` *and* again inline via Tailwind, with conflicting values |
| Low | `<!-- Minimal footer -->` appears twice, consecutively |
| Low (SEO) | **Zero** `<meta name="description">`, zero OG tags, zero Twitter card, no favicon, no theme-color. It shares as a bare grey link |
| Low | Two `setInterval`s (1 s, 10 s) run forever with no `document.hidden` check — the page keeps ticking `timeOnPage` in a background tab, **lying about time-on-page** |

---

## Gauntlet notes

- **G4 SOUL is the gate this project exists for.** Everything above is in service of
  it. The CRITIC prompt should include: *"the previous version's fatal flaw was that
  it announced itself. Does this one?"*
- **G3** blocks on: any fabricated number rendered without the honest/fabricated
  visual distinction; any dead handler shipped; the flash without a reduced-motion
  guard and a warning.
- **The move** must be nameable. Strong candidate: *the returning-visitor greeting.*
  If the second visit is identical to the first, DELIGHT caps at 2 and the whole
  overhaul has failed at the thing it was for.
- Keep it honest: if you store something, **say you store it, and let them delete it.**
  The piece is stronger as a working demonstration than as a simulation of one.
