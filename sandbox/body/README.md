# body.

A shared health record for Amit G and Aparna D. One place to attach lab reports,
see what actually matters right now, and walk into a doctor's appointment with
the full longitudinal picture. A garden we tend, not a cockpit we monitor —
the design language (salutogenic / biophilic / calm-tech) is documented in
[DESIGN.md](DESIGN.md).

> **Not medical advice.** This is a personal tracking tool built to be reviewed
> and fine-tuned with our doctor co-founder. Every flag in it is a conversation
> starter, not a conclusion.

## Running it

No build step. Either open `index.html` directly (`file://` works — that's why
there are no ES modules), or:

```sh
python3 -m http.server
```

Handy URL params for testing or sharing a view:
`?p=aparna&mode=expert&theme=dark&issue=liver&region=liver&drawer=1&tab=results&edit=1`

## Who it shows

Opening the app plainly shows **a demo body** — "You", with invented but
internally coherent numbers — so it can be shown to anyone without exposing a
real record. Add `?lovesey` to the URL to unlock Amit and Aparna; that choice
sticks on the device until `?lovesey=off`.

## How it's shaped

The home screen is a **vista**, not a dashboard (the full rationale is in
[DESIGN.md](DESIGN.md)):

- the **sun** is the health score — click it for the full ledger
- the **body** stands in the landscape; organs light by status, front/back
  toggle underneath, click any organ for its markers
- **markers standing in the field** are the issues; the closer and larger one
  stands, the more it needs tending. Click one to walk up to it.
- the **drawer** at the bottom holds everything archival: Records (+ insurance),
  Schedule (weekly movement + check-ups + regimen), the numbers / all results,
  and Log & save. On a phone it's a proper bottom sheet — drag the grabber
  between peek, half and full; tap outside to dismiss.
- the setting is a **karesansui** — a raked sand garden. A **stone** stands for
  every thing that needs tending: nearer and larger when it matters more,
  capped with **moss** once it starts mending, with rake rings around it. The
  score hangs in a **stone lantern**. Petals fall for things on the mend.
- behind it, a **generated mountain range** — layered Perlin ridgelines drawn
  to a canvas, drifting slowly for parallax. Its palette follows the real
  clock (dawn, morning, noon, golden, dusk, night) and its shape follows the
  record: more layers receding and thinner haze as more markers come into
  range, jaggier and murkier when they don't. Preview any hour in ⚙ → Sky.
- **two reading lights, chosen not simulated**: Daylight and Lamplight. The
  cards never change with the hour — only the view out the window does.

`Esc` backs out one layer at a time (export → settings → look-card → drawer).

## Settings (⚙)

Garden (light, petals, motion) · Reading (lens, text size, tooltips) ·
People (who's shown, insurance) · Export · About. The structure mirrors the
settings panel in the `cubbon` project.

## Movement &amp; home measurements

Weekly sessions live in each patient file (`routine[]` — Mon/Wed mobility &
pilates, Fri cardio). Tap a session in the Schedule tab or the chip on the
ground line to tick it off; ticks are stored per date in the local overlay.
The log form offers **Measure at home** first — blood pressure, resting heart
rate, SpO₂, sleep, temperature, waist, steps, energy — before the lab markers.
Anything logged flows straight into the tables, sparklines and body regions.

## Export (⚙ → Export)

Builds a print-ready document: cover with score and verdict, what needs
tending with actions, flourishing, weekly movement, check-ups, regimen,
insurance, a **legend that decodes the scene** (the sun is the score, distance
means urgency, what the colours and the ✎ mean), then every measured value by
panel. Always light, page-break aware — print it or save as PDF.

## Edit mode (✎)

The pencil in the top bar opens the drawer's **Log & save** panel:

- **Vitals** — weight and height are inputs; BMI recomputes live.
- **Log a measurement** — marker, date, value: a home reading, a follow-up
  ALT from another lab, next month's weight. Logged dates appear as new ✎
  columns in Expert tables and extend the sparklines.
- **Persistence** — edits save to this browser instantly (localStorage). To
  write them into the project, hit **Save to data/manual.js** (Chrome/Edge
  over localhost — File System Access API; pick the file once, then it saves
  in place). Elsewhere, **Download manual.js** and drop it into `data/`.
- `data/manual.js` is machine-written and merged on load — the curated
  patient files are never touched by the UI.

## Where things live

```
index.html      the vista + drawer shell, Vue templates (in-DOM, no build)
styles.css      TEND design tokens ( :root[data-theme=light|dark] ) + the scene
app.js          Vue app — ALL judgment (status, deltas, trends, verdict,
                which markers stand where) is computed here from raw values
cards.js        the drawer's panels (records / schedule / results / log)
data/figures.js body silhouettes + organ glyphs, front and back
data/common.js  marker catalog: names, units, per-sex ref ranges, panel + body-region mapping
data/amit.js    raw values per draw + curated issues/regimen/retests/records
data/aparna.js  same
data/manual.js  machine-written overlay: self-logged values, session ticks,
                insurance. GITIGNORED — it holds personal details.
data/you.js     the demo persona shown without ?lovesey
assets/organs/  circular organ icons sliced from the Freepik infographic
assets/anatomy/ the anatomy plates shown inside the silhouette
landscape.js    the generative range: own Perlin noise, ridge layers, parallax
reports/        the source PDFs — the ground truth
assets/         avatars
DESIGN.md       the TEND design language and why it fits preventive health
```

## Credits

- The generated range is **an original implementation**. It was inspired by
  anokhee/generative-landscapes, but that repository carries **no licence**
  (no LICENSE file; GitHub reports `license: null`), so none of its code is
  used here. Perlin's improved-noise algorithm is implemented from the
  published algorithm in `landscape.js`.

- Body silhouettes traced from Wikimedia Commons
  "Dermatomes_labeled,_female-male_front-back_3d-shaded.svg" — which carries
  all four figures we need (female and male, front and back) as vectors.
  The tracing pipeline lives in the project history: saturation mask →
  largest connected component → hole fill → Moore-neighbour boundary
  following → Douglas-Peucker → smoothed quadratic path, ~250 points each.
- Organ illustrations in `assets/organs/` sliced from
  `references/icons-for-organs.svg` — Freepik / Magnific,
  <https://www.magnific.com/free-vector/human-internal-organs-infographic-poster_6168813.htm>
- Settings-panel structure follows the `cubbon` project in this workspace.

## What's inside the body

The silhouette is not empty. Ten **anatomy plates** — real medical
illustrations lifted whole out of
`references/Female_shadow_template.svg` (which stores each organ as its own
layer) — sit inside it: brain, thyroid, lungs, heart, liver, stomach, spleen,
pancreas, intestines and pelvis on the front; spine, kidneys with bladder,
and pelvis on the back. They are clipped to the body outline, keep their own
illustrated colour, and **glow in their region's status colour** when
something there is out of range. Selecting a region lights that plate and
dims the rest.

Placements live in `BODY_FIGURES.anatomy` in `data/figures.js` as
`{k, x, y, w, h, region}` against the shared 220×460 box — hand-tuned to the
traced figures, so adjusting one organ is a four-number edit.

## The body plates

`data/figures.js` holds two anatomical silhouettes adapted from Wikimedia
Commons' *Human body diagrams* project (Mikael Häggström et al.): male from
"Green man shadow.svg" (CC0), female from "Female shadow.svg" (public
domain). On top of each sits a set of **isolated organ layers** — original
stylized glyphs (brain, thyroid, heart, liver, stomach, kidneys, blood drop,
femur, reproductive) drawn once in a 100×100 unit box and placed per figure.
Each layer is its own hotspot: tinted by the worst marker status in its
region, pulsing when out of range, and selecting one dims all the others.

The plate has **two genuinely different outlines** — Front and Back, traced
separately for each sex, all four sharing a 220×460 box so placements are
directly comparable. Organs live on their anatomically honest side: kidneys
and the spine are on the back, and selecting a region whose layer is on the
other side turns the body around automatically. Each organ entry in a
figure's `organs` map is `{ front?: {x, y, s, glyph?}, back?: {…} }`.

Design rule: **patient files contain raw values only, plus curated prose.**
Nothing judgmental is stored — status/borderline/trend/flags are computed at
runtime — so ingesting a new report is pure transcription.

The `issues[]` blocks in the patient files are the hand-written layer (human
blurb + expert analysis). That's the surface the doctor edits.

## Adding a new report

1. Drop the PDF into `reports/`.
2. Ask Claude:
   *"Ingest reports/<file>.pdf — extract the new draw into data/<patient>.js"*.
   Claude runs `pdftotext -layout`, appends a draw id (`YYYY-MM-DD`) to
   `draws`, adds each marker's new value to `results`, adds a `records` entry,
   updates `retests`, and revises `issues[]` — those revisions are drafts for
   doctor review.
3. Reload. Trends, statuses, and region colors update themselves.

New marker the catalog doesn't know? Add it to `data/common.js` with a ref
range (per-sex if the lab differentiates) and a body region, and it flows
through every view automatically.

## Status logic

- `out` — outside the reference range
- `borderline` — inside the range but within 10% of a bound (span-based)
- `ok` — everything else
- Non-numeric results (urine strings, "Non-Reactive") display as-is, never flag.
- Ratio/index markers with `ref: null` are display-only and can't redden a region.
