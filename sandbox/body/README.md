# BODY.

A shared health record for Amit G and Aparna D. One place to attach lab reports,
see what actually matters right now, and walk into a doctor's appointment with
the full longitudinal picture.

> **Not medical advice.** This is a personal tracking tool built to be reviewed
> and fine-tuned with our doctor co-founder. Every flag in it is a conversation
> starter, not a conclusion.

## Running it

No build step. Either open `index.html` directly (`file://` works — that's why
there are no ES modules), or:

```sh
python3 -m http.server
```

Handy URL params for testing/sharing a view: `?p=aparna&mode=expert&theme=dark&region=liver`

## The two modes

- **Human** — quick context in plain language. Health score, 3–5 "what matters
  now" cards with trend + actions, a "what's improved" card (reassurance is a
  feature), check-up schedule, records.
- **Expert** — the doctor co-pilot. Flagged parameters sorted by severity,
  draw-by-draw tables for all ~90 parameters grouped by lab panel, sparklines
  with reference bands, and per-issue analysis with **Account for / Rule out**
  lists. Print this view for a clean handout (`⌘P` — print styles strip the chrome).

The body figure is shared: hotspot color = worst status of the markers mapped
to that region. Click a region (or its chip) for the detail panel.

## Where things live

```
index.html      shell + Vue templates (in-DOM, no build)
styles.css      design tokens ( :root[data-theme=light|dark] ), all components
app.js          Vue app — ALL judgment (status, deltas, trends, region colors)
                is computed here from raw values
data/common.js  marker catalog: names, units, per-sex ref ranges, panel + body-region mapping
data/amit.js    raw values per draw + curated issues/regimen/retests/records
data/aparna.js  same
reports/        the source PDFs — the ground truth
assets/         avatars
```

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
