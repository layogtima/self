# TEND — the design language of body.

**A garden you tend, not a cockpit you monitor.**

Most health dashboards are surveillance aesthetics: dark glass, alarm reds,
numbers twitching for attention. That grammar is built for intervention —
something is wrong, act now. Preventive health is the opposite discipline:
long horizons, small consistent acts, attention *before* alarm. The design
language should say that.

TEND draws on three named traditions:

## 1. Salutogenic design (Antonovsky)

Aaron Antonovsky's salutogenesis asks what *creates* health rather than what
causes disease, and names three conditions for a person to thrive with their
own health information — a "sense of coherence." Each maps to a concrete
decision here:

- **Comprehensibility** → Human mode. Plain language, one idea per card,
  numbers only when they carry meaning ("13.7 → 19.7 → 23.8"). Jargon lives in
  Expert mode where it's load-bearing, not decorative.
- **Manageability** → every look-card ends in action chips. Nothing is
  presented as a problem without a next move sized to a human week.
- **Meaningfulness** → *Flourishing* opens the drawer's results panel, and the
  verdict leads with what's well before what isn't. Trends are the primary
  verb: you are not a snapshot, you are a direction.

## 2. Biophilic palette & material

The palette comes from a single reference: golden-hour expedition artwork —
hazy cream sun, gold fields, mauve mountain ranges, a deep-teal meadow with
mint sparks in the grass. Colors from a landscape, not from traffic signals:

- Light theme is **golden hour** — hazy sky, two ranges of low-poly mountains
  dissolving into a gold field, a dark meadow band with mint glints in front.
- Dark theme is **teal night** — the same meadow after sundown; mint glow
  takes over as the "good" color. Never console-black.
- Status colors are **meadow green / sun gold / expedition orange**. Orange is
  serious without being a siren — this app contains no pure red, because
  nothing in a preventive tool is an emergency.
- The body silhouette is the artwork's deep-teal foreground, on both themes.
- One organic shape system: the leaf radius (one clipped corner) on every
  surface and input, pills for everything actionable, and a film of paper
  grain over the entire scene. Craft over gloss.
- Type: **Fraunces** (a warm, old-style serif) for the moments that matter —
  names, scores, section titles, the fleuron ❦ — and **Karla** for working text.

## 3. Calm technology (Case / Weiser)

Information should move to the periphery until it earns the center:

- Color carries state; motion almost never does. The only movement is the
  slow breath of an out-of-range organ and a two-minute rotation of the sun's
  rays — `prefers-reduced-motion` stills both.
- The scene is the calm index of the whole system: sun height, which organs
  glow, how close the markers stand. One glance, no reading.
- Reassurance is explicit, not implied: "everything else here looks normal"
  is rendered text, because silence reads as dread in a health tool.
- Expert mode changes *content density*, never urgency styling. Clinical
  rigor is a lens, not an alarm state.

## The vista, not a dashboard

Three redesigns failed the same way: I kept repainting a three-column card
grid. New palette, new type, same bones — and a grid of uniform rounded
rectangles reads as generic no matter how it's coloured. The structure was
the problem.

So the home screen is not a document at all. It is a **place**:

- **The sky holds the score.** The health number is the sun — glanceable from
  across a room, with a ring around it showing the score as an arc. Clicking
  it opens the full ledger.
- **The person stands in a landscape.** Hazy ranges recede behind them, a
  dark meadow with mint glints sits in front, and a contact shadow puts them
  on the ground. Organs light up on the body itself.
- **Problems stand in the field.** Each issue is a marker planted in the
  landscape, and *distance encodes urgency*: the thing that needs tending is
  large and near the front; things merely worth an eye are small and far
  back. You read the priority spatially, before reading a single word.
- **The answer is stated in two seconds.** "Amit is doing well overall. One
  thing needs tending: vitamin B12." That sentence is the whole home screen's
  job.
- **Everything else is underground.** Records, schedules, regimen, logging
  and every table live in a drawer that pulls up from the bottom. The archive
  is one gesture away and zero pixels of clutter until asked for.

Walking up to something (a marker in the field, an organ on the body) opens a
single look-card beside it. Nothing else moves.

## Two readers, ages 6 and 97

The scene is legible before language: a body, a sun, some things standing
around it. Then one short sentence per card ("The liver needs a doctor visit
soon. Very fixable."), with detail folded behind "Tell me more". Nothing
important rides on colour alone, small text alone, or jargon. Expert mode
keeps the same scene and swaps the register: markers show live values, the
look-card shows pattern analysis and account-for / rule-out.

## The garden, not the weather

An earlier version ran a live day/night cycle: the sky moved with the clock,
a sun became a moon, stars came out. It was clever and it read badly — a
health record that keeps changing colour is a record you cannot trust your
eyes on, and the night palette made every card muddy. It is gone.

What replaced it is a **karesansui**, a raked gravel garden — the calmest
image Japanese design has for "a thing you tend deliberately, forever":

- **A stone for each thing that needs tending.** Bigger and nearer to you when
  it matters more; rings raked around it the way a gardener works around an
  obstacle you cannot remove. When a marker starts mending, the stone grows a
  cap of **moss** — the visual reward for patience rather than speed.
- **The rake lines settle as your numbers do.** More markers in range, more
  passes of the rake across the bed.
- **The score hangs in a stone lantern**, lit from within. It is the only
  bright thing in the scene, which is exactly the weight it should carry.
- **Petals fall for what is improving** — the one piece of motion that carries
  information rather than atmosphere.

Two lights, both chosen by hand: Daylight (pale sand, dark stones) and
Lamplight (the same garden after dark). The time of day is told plainly in
the corner. The garden does not perform it.

## The window and the room

The scene is now two things with different jobs. The **room** — cards, text,
tables — is lit by a theme you choose, and it never changes on its own,
because a record you cannot trust your eyes on is not a record. The
**window** — the generated range behind the garden — does follow the clock,
shifting from dawn through noon to dusk and night, and it also reads the
record: the range recedes further and the haze thins as more markers come
back into range, and the moon shows tonight's true phase. Atmosphere belongs
outside; legibility belongs inside — which is why every sky is blended
part-way toward the reading theme before it is drawn. A night sky in daylight
mode is moonlit pale, never black, because the words in front of it have to
stay readable.

## The body is not a pictogram

The silhouette carries a real organ stack inside it, taken from its source
file whole rather than assembled from parts. That distinction turned out to
matter: picking organs out one at a time and re-placing them by hand produced
a body of floating, disconnected bands, because the relationships between
organs — the heart sitting inside the lungs, the liver lying over the gut, the
rotations several of them are drawn with — carry as much anatomical meaning as
the organs themselves. Now the whole stack moves as one, and only its position
in the torso is ours to choose.

Two rules keep it from becoming noise: the illustrations keep their own
colour, with status shown as a glow around an organ and never by repainting it
a false one; and an organ only appears if it is genuinely the thing being
measured. Where there is no honest plate for a region, a simple drawn glyph
stands in rather than a plausible-looking substitute.

## The honesty rule

Softness lives in presentation only. Values are transcribed exactly as the
lab printed them, flags are computed from reference ranges without rounding
in either direction, and Expert mode says "worsening" where Human mode says
"needs care" — same data, same direction, different register. The garden
metaphor is never allowed to hide a weed.
