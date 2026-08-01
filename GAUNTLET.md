# GAUNTLET.md — the loop

An adversarial build loop for `layogtima/self`. A project does not ship because a
builder says it's done. It ships because it **survived** a sequence of gates, each
staffed by an agent whose job is to fail it.

Read `CLAUDE.md` first. Then read your project's brief in `briefs/`.

---

## 1. Why a gauntlet and not a to-do list

Every failure mode in this repo is a failure of *nobody checking*:

- a page that has been broken in production since the first commit because a script
  tag says `http://` (`materials/`)
- a flagship interaction that renders at 0.005 alpha and has never been seen by a
  human (`observer/`)
- a hero image that is a GIF wearing a `.webp` extension (`eco-brutalism/`)
- a data file whose parser returns `150` for `"150,000 tons"` and nobody noticed
  because the panel displaying it is `class="hidden"` (`materials/`)
- 64 of 74 projects invisible from the homepage, with a literal
  `<!-- /canvas ADD HERE -->` TODO comment committed into the grid

None of these are hard problems. They are all *unverified assumptions*. The gauntlet
exists to make assumptions expensive.

---

## 2. Roles

Four agents. Different models, deliberately — a critic that shares the builder's
priors is not a critic.

| Role | Model | Job | Can write code? |
|---|---|---|---|
| **BUILDER** | Fable 5 | Implements the brief. Fast, high volume. | Yes |
| **CRITIC** | Opus 5 | Adversarial. Tries to break it. Files findings. | No — findings only |
| **JUDGE** | Opus 5 | Scores against the rubric. Decides pass/fail/park. | No |
| **ARCHIVIST** | Fable 5 | Manifest, README, CHANGELOG, hub entry. | Yes, metadata only |

**CRITIC's standing instruction:** *you are not reviewing, you are prosecuting.
Default to REFUTED. A finding you cannot reproduce is not a finding. A pass you
cannot justify is a fail.*

**JUDGE's standing instruction:** *you have never seen this project before. You have
no stake in it shipping. Score what is in front of you, not what it is trying to be.*

---

## 3. The gates

Six gates, in order. A project runs each gate to a pass before entering the next.
**No gate may be skipped, including for "trivial" changes.**

### G0 — SPEC
BUILDER writes `<project>/SPEC.md`: what it is in one sentence, the interaction
model, the data model with field types, the screens, what it explicitly is *not*.
No code written yet.

JUDGE passes G0 only if: the one-sentence description would make a stranger want to
open it, the data model has no string-encoded quantities, and the "is not" list is
non-empty. **Scope creep dies here or it dies in review.**

### G1 — TRUTH
Only applies where the project makes factual claims (`materials`, `terra`, and any
data shown in `observer`). BUILDER produces `data/sources.json` before producing UI.

CRITIC picks **10 random records** and independently verifies each number against
the cited URL. Any mismatch, any dead URL, any "source" that is an aggregator citing
an aggregator → G1 fails and the whole dataset is re-derived, not patched.

Pass condition: 10/10 verified, and `grep` finds no rendered value lacking a
`source_id`.

### G2 — BUILD
Mechanical. Automate this — it should be a script, not an agent.

```
npm run build                      exits 0, zero TS errors
npm run test                       exits 0
node scripts/check-durability.mjs  see §7
playwright: cold load              zero console errors, zero 4xx/5xx, zero mixed content
playwright: 375px + 1440px         no horizontal scroll, no overlap
```

### G3 — CRAFT
CRITIC audits against `CLAUDE.md` §6 and §7 with evidence, not assertion. Every
finding needs a file:line and a reproduction. Screenshots at 375 / 768 / 1440,
light and dark.

Blocking findings: any a11y floor missed, any perf budget exceeded, any design-system
violation, any dead code path shipped, any `TODO` in a shipped file.

### G4 — SOUL
The gate that this repo actually needs, and the one that is easiest to fake, so it
gets the most structure.

CRITIC opens the page cold, on a phone, and answers in writing:

1. **First five seconds** — what did you understand, and did you want to keep going?
2. **The move** — name the single thing this page does that no other page does. If
   you cannot name one, it fails.
3. **Read the copy aloud.** Does it sound like the person who wrote *"my brain's a
   delightful buffet of design, engineering, science, and absurdity"*, or does it
   sound like a competent stranger? Quote the worst sentence.
4. **Density** — is there more information on screen than you expected, or less?
   Less fails.
5. **Would you send this to someone?** With what one-line message?

A pass requires a yes to 5 and a real answer to 2. *"It's clean"* is a fail.
*"It's fine"* is a fail. The bar is the README's own promise: **make you go mmmMMMm.**

### G5 — SHIP
ARCHIVIST: manifest entry in `/data/projects.json`, README, OG image generated and
correct, CHANGELOG line, `og:image` actually renders the current page (the hub's
current one still shows a tagline that was cut from the hero).

JUDGE gives final scores and merges, or parks (see §5).

---

## 4. Rubric

Six axes, 0–5 each, scored by JUDGE at G3 and again at G5.

| Axis | 0 | 3 | 5 |
|---|---|---|---|
| **CONCEPT** | Generic; a category, not an idea | A clear idea, executed literally | An idea you haven't seen, and the execution *is* the argument |
| **TRUTH** | Numbers invented | Sourced, some stale | Every value traceable, uncertainty shown, primary sources, contradictions surfaced not hidden |
| **CRAFT** | Console errors, broken layouts | Builds clean, meets floors | Meets floors with margin; the code is a reference implementation |
| **DENSITY** | A landing page with three cards | Reasonable information per screen | More on screen than you expected, and still legible — the orb bar |
| **DELIGHT** | Nothing surprises you | One good moment | You show someone within a minute of finding it |
| **DURABILITY** | CDNs, hotlinks, unpinned deps | Self-hosted, pinned | Zero external runtime deps; will still run untouched in 2035 |

**Gate to merge: every axis ≥ 4, and zero CONFIRMED blocking findings.**

Mean scores are banned. A 5/5/5/5/5/1 does not average to a pass — the 1 is the
whole review.

---

## 5. Stop conditions

The loop must be able to end. It must also be able to fail without lying.

- **Iteration cap:** 4 BUILDER→CRITIC→JUDGE cycles per gate. On the 5th, park.
- **No-improvement rule:** if two consecutive JUDGE passes produce the same or lower
  score on the same axis, stop iterating on that axis and escalate. The builder has
  hit the ceiling of what the brief says; the brief is the problem.
- **Park, don't fake:** a parked project gets a `PARKED.md` stating the exact axis
  and score that blocked it, what was tried, and what a human needs to decide. It
  stays on its branch. It does not merge at a 3.
- **Regression halt:** if a change drops a previously-passed gate, revert to the last
  passing commit before continuing. Do not fix forward across a gate boundary.
- **Time/token budget:** each project gets a fixed budget declared at G0. At 80%
  spent, JUDGE decides ship-what-exists or park. It never silently overruns.

---

## 6. Scorecard (paste into every PR)

```markdown
## Gauntlet scorecard — <project>

| Gate | Result | Cycles | Notes |
|------|--------|--------|-------|
| G0 SPEC       | PASS/FAIL | | |
| G1 TRUTH      | PASS/FAIL/NA | | n verified / n checked |
| G2 BUILD      | PASS/FAIL | | |
| G3 CRAFT      | PASS/FAIL | | |
| G4 SOUL       | PASS/FAIL | | |
| G5 SHIP       | PASS/FAIL | | |

| Axis | Score | One-line justification |
|------|-------|------------------------|
| CONCEPT    | /5 | |
| TRUTH      | /5 | |
| CRAFT      | /5 | |
| DENSITY    | /5 | |
| DELIGHT    | /5 | |
| DURABILITY | /5 | |

**The move:** <the one thing this does that nothing else does>
**Worst remaining sentence:** <quote>
**Would send to someone with the message:** "<...>"

Findings filed: N · confirmed: N · fixed: N · deferred: N (list with reasons)
Budget: <spent> / <allotted>
```

---

## 7. Durability check

`scripts/check-durability.mjs` — write this first, run it in G2 on every project.
It greps the built output and exits non-zero on any hit:

```
http://                                    mixed content
cdn.tailwindcss.com | unpkg.com            CDN runtime
cdnjs.cloudflare.com | cdn.jsdelivr.net
raw.githubusercontent.com                  hotlinked asset
/api/placeholder/                          Claude-artifact stub
threejs.org/build/                         unversioned three.js
<script src="http                          any protocol-relative or insecure script
TODO | FIXME | XXX                         in any shipped file
loading=              (absence of)         below-fold img without lazy
```

Plus: resolve every local `src`/`href` against the filesystem and fail on any that
does not exist. That single check would have caught treevalley, mib, palettes/bioflow,
and three `/api/placeholder` references.

---

## 8. Execution order

```
1. gauntlet/shared-core    briefs/08-shared-core.md    ← merge first, others depend on it
2. gauntlet/sandbox-sweep  briefs/07-sandbox-triage.md ← mostly mechanical, unblocks the hub
3. gauntlet/materials      briefs/02-materials.md      ← biggest; start early, runs long
4. gauntlet/terra          briefs/05-terra.md          ← research-heavy, runs parallel to materials
5. gauntlet/aether         briefs/03-aether.md
6. gauntlet/drums          briefs/04-drums.md
7. gauntlet/observer       briefs/06-observer.md
8. gauntlet/hub            briefs/01-index-hub.md      ← LAST; consumes everyone's manifest entries
```

`materials` and `terra` are the two that can absorb unlimited effort. Budget them
explicitly. `aether` and `drums` share the audio core, so run them after `shared-core`
merges or they'll both reinvent the scheduler.

---

## 9. What a good cycle looks like

```
BUILDER  → implements brief section 4, commits 6 times, opens draft PR
CRITIC   → files 11 findings with file:line + repro; 4 refuted on inspection,
           7 confirmed, 2 of them blocking
BUILDER  → fixes 7, argues 1 (with evidence), defers 0
CRITIC   → re-verifies; the argued one stands; 0 blocking remain
JUDGE    → CONCEPT 5, TRUTH 5, CRAFT 4, DENSITY 5, DELIGHT 3, DURABILITY 5
           → DELIGHT 3 blocks merge. Names the specific missing moment.
BUILDER  → adds the moment (cycle 2 of 4)
JUDGE    → DELIGHT 4. Merge.
```

The JUDGE naming a *specific missing moment* is the part that makes this work. A
judge who says "needs more polish" has wasted the cycle.
