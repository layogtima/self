# 05 — TERRA (replaces `eco-brutalism/`)

Branch: `gauntlet/terra` · New directory `terra/`. `eco-brutalism/` moves to
`archive/eco-brutalism/`, unlinked, unbuilt.

> *"Ecobrutalism is something I've moved on from. I'd rather have this be overhauled
> to showcase sustainable building practices from around the world that account for
> sunlight, better material usage and cohesiveness with nature + other creatures."*

The three axes in that sentence are the site's spine. Call them **(a) sun**,
**(b) matter**, **(c) kin**.

---

## What exists

A 6-slide, full-bleed, keyboard/wheel-driven photo-essay. One `<img>` fills the
viewport, a glass panel of ~50 words floats over it, Prev/Next, a `1/6` counter.
`body` is `overflow-hidden` — there is no scroll at all.

Thesis copy, verbatim (also the meta description and OG description):

> *"Eco Brutalism represents a radical reimagining of our relationship with built
> environments-a philosophy that rejects the artificial separation between human-made
> structures and the natural world."*

| # | Headline | Image | Credit |
|---|---|---|---|
| 1 | ECO BRUTALISM | hero.webp | Barbican Conservatory, London |
| 2 | ANCIENT INTEGRATION | india-courtyard.jpeg | Correia Afonso House, Goa |
| 3 | THE GREAT DISCONNECTION | modern-architecture.jpg | IIMA, Ahmedabad |
| 4 | BRUTAL vs NATURAL | juxtaposition.jpg | Vertical Forest, Milan |
| 5 | IMPLEMENTATION | wall-with-plants.jpg | Planterbox House, Kuala Lumpur |
| 6 | THE FUTURE IS INTEGRATION | future.jpg | Chez Georges, Rio de Janeiro |

### Keep (structural, concept-agnostic)
- The **one-image-per-idea full-bleed shell**. Photo first, argument second — exactly
  right for showcasing built practice.
- The `sections[]` data array. Widening `{title, background, content, position,
  panelClass}` to `{title, region, lat, climateZone, axis[], materials[], image,
  credit, licence, sources[]}` is purely additive; the render loop barely moves.
- `position` as a per-slide layout token (`"flex items-start justify-end"` etc.) —
  cheap variety, keep it.
- The fade-through-black transition, and dual arrow-key + wheel input.
- The **noise/grain treatment** — two inline SVG `feTurbulence` filters, zero network
  cost. **Retint per climate zone** (ochre for Sahel, blue-grey for Nordic) and it
  stops being decoration and becomes wayfinding.
- Wide display caps for headlines + mono for metadata. The right register for
  technical content; `572.6 MJ/m³` wants mono.
- The credit-link pattern. The new concept needs it **much harder** — provenance is
  the point.

### Kill
- **The name and every instance of the word "brutalism."** Now actively misleading:
  concrete is the highest-embodied-carbon thing in frame.
- **All six body texts.** *"Concrete becomes a canvas for natural growth"* and *"strip
  away finishes to reveal structural materials"* are interior-decor moves, not building
  practice. None survive a factual pivot.
- **The Eurocentric decline-and-redemption arc** (ANCIENT INTEGRATION → THE GREAT
  DISCONNECTION → THE FUTURE IS INTEGRATION). A global survey is a *map*, not a fall
  narrative. This structure is also what forces exactly 6 slides.
- **`concrete #b3b3b3` as a brand token.** Replace with material-derived swatches:
  laterite, sarooj, rammed earth, reed, mycelium.
- **Glassmorphism.** `backdrop-filter: blur(12px)` over dense architectural photography
  is a 2021 dashboard tic and costs a compositor layer every frame.
- **Bosco Verticale as an unqualified hero.** It's the most-contested exemplar in this
  space — high embodied carbon from the structural over-engineering needed to hold the
  trees, high maintenance, widely argued to be a per-unit-cost outlier. Keep it **only**
  as an explicit counterpoint. See "the sharpest editorial move" below.
- **`images/hero.webp`.** It is **not a WebP**. It's a **1.28 MB single-frame GIF89a,
  1600×900, 8-bit palette**, with a lying extension — **65% of the project's image
  payload**, visibly banded from quantisation. Re-encoding the already-damaged pixels
  to WebP q80 gives 505 KB (−61%); from a clean source, 120–180 KB (−90%). Resource
  the original.
- **The Druk Wide Bold hotlink** from `cdn.jsdelivr.net/gh/corearts/fonts/`. Druk is a
  commercial Commercial Type face served from a stranger's GitHub repo. Licensing
  exposure plus a hard third-party dependency. Delete on sight.
- **The 6-slide ceiling.** With 20–40 practices you need index, filter and permalink.
  The current shell has none — `goToSection()` is defined and never called, there are
  no URL hashes, **no slide is shareable**, and refresh always returns to slide 1.

---

## The new thing

**A world map of building practices that work with sun, matter and other creatures.**

Not a slideshow. Three linked views over one dataset:

1. **MAP** — practices pinned by location, coloured by climate zone (Köppen), filterable
   by axis, material, era, and whether it's vernacular or contemporary.
2. **DOSSIER** — the full-bleed photo-essay shell you already have, one per practice,
   with the section drawing, the numbers, and the sources. Deep-linkable (`#p=badgir-yazd`).
3. **COMPARE** — put two practices side by side on the same axis. Badgir vs. split AC.
   Kampung Admiralty vs. Bosco Verticale. This is where the argument lives.

### Data model

```ts
type Practice = {
  id: string
  name: string            // local name first, then translation
  localName?: string      // بادگیر
  where: { place: string, country: string, lat: number, lon: number, koppen: string }
  era: { from: number | 'vernacular', to?: number }
  kind: 'vernacular' | 'contemporary' | 'policy'
  axes: ('sun' | 'matter' | 'kin')[]
  how: string             // 2-3 sentences: the mechanism, not the vibe
  numbers: Q[]            // every one with a source_id — see CLAUDE.md §4
  materials: string[]
  criticism?: string      // REQUIRED where contested. This field is the difference
                          // between a survey and a brochure.
  media: { hero: Img, section?: Img, detail?: Img[] }
  sources: string[]
}
```

**`criticism` is mandatory for Earthships, Bosco Verticale, hempcrete carbon claims,
and the swift-brick policy.** A page that only praises is not a survey.

---

## The catalogue — 44 verified candidates

Axis key: **(a)** sun/thermal · **(b)** matter · **(c)** kin.
Imagery: **★ open** (strong Commons / public-agency coverage) · **◐ mixed** ·
**✕ tight** (rights-managed press imagery).

### MENA
1. **Bādgīr windcatcher — Yazd, Iran** *(a)* — directional shafts driving stack + cross ventilation; coupled to a qanat or courtyard pool for evaporative pre-cooling. **★**
2. **Yakhchāl — Kermān/Yazd** *(a,b)* — conical mud-brick dome over a pit; walls of *sarooj* (sand/clay/egg-white/lime/goat-hair/ash), a water-resistant low-fire mortar. Radiative night cooling froze water in a desert. **★**
3. **Qanat + shabestan coupling — Iran** *(a,c)* — gravity-fed underground aqueduct feeding a basement hall; air crosses flowing water before reaching occupants. **The badgir is only half the machine.** **◐** (sections beat photos)
4. **Malqaf & New Gourna — Hassan Fathy, Egypt** *(a,b)* — unidirectional wind scoop + mud-brick vaults. *Architecture for the Poor* (1973) is the founding text of vernacular revival. **◐** — **Archnet / Aga Khan Documentation Center (MIT)** holds the Fathy archive
5. **Shibam, Hadhramaut, Yemen** *(a,b)* — 16th-c. mud-brick towers to ~8 storeys, UNESCO 1982. Proves earth is not inherently low-rise. **★**
6. **Al Bahar Towers mashrabiya — Abu Dhabi, Aedas/AHR 2012** *(a)* — 1,000+ actuated PTFE umbrella units tracking the sun; a computational re-reading of the mashrabiya. CTBUH Innovation Award 2012. **✕**
7. **Majara Complex, Hormuz — ZAV Architects** *(b,c)* — superadobe domes, local labour. **2025 Aga Khan Award winner.** **◐**
8. **Jahad Metro Plaza — KA Architecture Studio** *(a,b)* — interlocking barrel vaults in locally handmade brick. **2025 AKAA winner.** **◐**

### Sub-Saharan Africa
9. **Nubian Vault / Association la Voûte Nubienne** *(b,c)* — catenary earth-brick vault laid leaning, **built with no formwork, no timber beams, no imported sheet metal**. **1,600+ vaulted buildings, 260+ masons trained since 2000** across Burkina Faso, Mali, Senegal. ~7 °C more comfortable than corrugated metal roofing. Directly addresses Sahel deforestation. **★**
10. **Gando Secondary School — Diébédo Francis Kéré** *(a,b)* — clay/gravel/cement elements cast on site; hot air rises through clay-ceiling apertures into a cavity under a raised roof, drawing cool air up through **earth tubes** that geothermally pre-cool the intake. Zero energy. **◐**
11. **Eastgate Centre — Mick Pearce + Arup, Harare, 1996** *(a,b)* — termite-mound-inspired passive stack, **48 brick funnels** venting basement-cooled air up nine storeys. **Correct framing: ~10% of a conventional building's energy passively; 35% less when actively assisted.** This figure is routinely mis-cited — use it precisely. **◐**

### South & Southeast Asia
12. **Jaali — Rajasthan / Mughal India** *(a,c)* — perforated lattice; accelerates airflow through small apertures via pressure drop while cutting glare. Hawa Mahal's 953 openings are the showpiece. **★**
13. **Kerala nalukettu, laterite, steep tiled roofs** *(a,b,c)* — central *nadumuttam* courtyard for stack ventilation and daylight; laterite that hardens on exposure; steep pitches and deep overhangs for 3,000 mm monsoon. **★**
14. **Auroville Earth Institute — CSEB** *(b)* — Compressed Stabilised Earth Block at ~5% cement. **572.6 MJ/m³ vs 6,122.5 for country-fired brick (10.7× less); 54.5 vs 642.9 kg CO₂/m³ (11.8× less)**; finished masonry 15–20% cheaper. **The hardest numbers on this list.** **★**
15. **METI Handmade School — Anna Heringer & Eike Roswag, Rudrapur, 2005** *(a,b)* — cob ground floor, bamboo upper storey, built by local craftspeople. AKAA 2007. **◐**
16. **Khudi Bari — Marina Tabassum, Bangladesh** *(b,c)* — demountable flood-resilient bamboo dwelling with chevron bracing and custom steel connectors; movable when the char island erodes. **2025 AKAA winner.** **◐**
17. **Green School Bali / IBUKU (Elora Hardy)** *(b)* — treated *Dendrocalamus asper* at architectural scale; widely credited with triggering the global bamboo renaissance. **◐**
18. **Vo Trong Nghia Architects, Vietnam** *(a,b,c)* — bamboo lattice halls + "House for Trees"; an explicit programme of returning tree cover to Ho Chi Minh City. **✕**
19. **Kampung Admiralty — WOHA, Singapore** *(a,c)* — 0.9 ha vertical "club sandwich": hawker centre, medical centre, childcare, eldercare, community farm, 104 senior flats. **100% green replacement across 53% of plot area**; post-occupancy audit found **50 animal species incl. 19 birds and 22 insects**; **>1 million litres** of tap water saved annually. **The strongest (c)-axis exemplar anywhere.** **◐**
20. **PARKROYAL on Pickering — WOHA** *(a,c)* — the poster child for Singapore's Green Plot Ratio / LUSH policy: displaced greenery must be replaced vertically. **◐**

### East Asia
21. **Fujian tulou, China** *(a,b,c)* — communal rammed-earth rings, walls often >1 m; thermal mass flattens the diurnal swing, central courtyard does light and air, single defensible entry. UNESCO 2008 (46 buildings). **★**
22. **West Wusutu Village Community Centre, Inner Mongolia — Zhang Pengju** *(a,b)* — built from **salvaged bricks** around a circular courtyard with roof towers for passive ventilation. **2025 AKAA winner.** Reuse as a first-class strategy. **◐**
23. **Engawa / shōji / deep noki eaves — Japan** *(a)* — eave depth sized to exclude summer sun and admit low winter sun; the engawa is a thermal buffer *and* the indoor/outdoor threshold; shōji turns direct sun into even glare-free light. Three techniques, one section drawing. **★**
24. **Ondol — Korea** *(a)* — flue gases routed under a stone-and-clay floor (*gudeul*) to heat the mass. Radiant, low-temperature, ~2,000-year lineage, direct ancestor of modern hydronic underfloor heating. **★**
25. **Ger / yurt — Mongolia** *(a,b,c)* — collapsible *khana* lattice wall, compression-ring *toono* crown that is simultaneously skylight, flue and structural keystone; wool-felt insulation, seasonally reversible; door faces south and the toono light works as a sundial. Near-zero-waste, fully demountable. **★**

### Europe
26. **Torvtak sod roof — Norway / Iceland** *(a,b,c)* — turf over layered birch bark on log purlins: insulation, wind ballast, and a pre-industrial green roof. Icelandic turf houses are the extreme case. **★**
27. **Thatch — Norfolk water reed / long straw, UK & NL** *(a,b,c)* — excellent U-value with zero manufactured insulation; water reed commonly cited at 50+ year lifespans; **reed beds are high-value wetland habitat, so the supply chain *is* biodiversity.** Historic England publishes conservation guidance. **★**
28. **Cob — Devon, England** *(b)* — subsoil, straw, water. No formwork, no firing, monolithic. Active revival, with ongoing work to route cob through modern Building Regs. **★**
29. **Rammed earth / pisé — CRAterre, Grenoble** *(a,b)* — the research institute that made earth construction legible to European regulators; now feeding rammed-earth social housing in Paris. **◐**
30. **Trombe wall — Odeillo, French Pyrenees (Trombe & Michel, 1960s–70s)** *(a)* — south-facing dark high-mass wall behind glazing; gain stored and re-radiated on an 8–10 hour lag. Named prior art for every "solar wall" since. **◐**
31. **Passivhaus — Darmstadt, 1990** *(a,b)* — hard numbers: **space heating ≤ 15 kWh/m²·a** (or heating load ≤ 10 W/m²), **primary-energy-renewable ≤ 60 kWh/m²·a**, **airtightness ≤ 0.6 ACH @ 50 Pa**, **overheating ≤ 10% of hours above 25 °C**. *Quote from the current PHI criteria sheet, not from memory — the UK Passivhaus Trust table also lists a ≤ 25 kWh/m²·a alternative pathway.* **★**
32. **Mjøstårnet — Voll Arkitekter, Brumunddal, 2019** *(b)* — **85.4 m, 18 storeys**, glulam frame + CLT cores. CTBUH-certified world's tallest timber building on completion (since surpassed by Ascent, Milwaukee). **◐**
33. **Hempcrete** *(b)* — hemp shiv + lime binder; carbon-storing cradle-to-gate, non-structural, vapour-open. **Get kg CO₂e/m³ from a specific named LCA before publishing a number** — circulating figures vary wildly with binder mix, system boundary, and whether biogenic carbon is counted. **◐**
34. **Basel green-roof ordinance, Switzerland** *(c)* — the strongest policy exemplar anywhere. 2002 law required greening of all new and renovated flat roofs; 2015 raised **minimum substrate to 12 cm**; guidance specifies **native regional soils, native Basel plant mixes, and 30 cm × 3 m habitat mounds for invertebrates**. Result: ~23% of flat roof area green by 2006 (1,711 extensive + 218 intensive), rising toward ~40%; **~80,000 m²/yr added**; **5.71 m²/inhabitant (2019) — highest in the world.** Stephan Brenneisen's research underpins it. **★**
35. **Biosolar roofs** *(b,c)* — green roof *plus* rooftop PV: substrate evaporative cooling lowers panel temperature and raises yield, while panel shade creates microhabitat variation that increases invertebrate diversity relative to either alone. Both effects peer-reviewed. **◐**
36. **Swift bricks — England** *(c)* — swifts are UK Red List; loss of building crevices is the identified driver. **18 Dec 2025**: government proposed an NPPF requirement in new housing (consultation to **10 Mar 2026**). **Feature it with the criticism** — Hannah Bourne-Taylor called it *"no statutory weight – there is no legal requirement, no enforcement, no transparency, no monitoring… greenwashing by the government."* **That tension is better content than the policy alone.** **★**
37. **Integrated bat boxes & bat lofts — UK** *(c)* — Bat Conservation Trust new-build guidance for boxes built into the wall fabric. Pair with the Oxford finding that developers install **as few as half** the ecological features they promised. **Measurement, not intent, is the story.** **★**
38. **Biodiversity Net Gain, England** *(c)* — mandatory **10% net gain** since Feb 2024 (small sites Apr 2024), secured for **30 years**. First national attempt to price habitat into planning. **★**
39. **Ecoducts & wildlife overpasses — Netherlands / Banff** *(c)* — the Netherlands runs one of the densest defragmentation networks in the world (incl. Natuurbrug Zanderij Crailoo); Banff's Trans-Canada crossings are the longest-monitored dataset, showing **structure type matters differently for small vs large mammals.** The building-scale analogue of a green roof. **★**
40. **Sponge cities — Kongjian Yu / Turenscape, China** *(a,c)* — terraced wetlands, permeable paving, floodable parks; cities absorb rather than repel water. Yu won the 2023 Oberlander Prize and **died in a plane crash in Brazil in September 2025** — a memorial slide is both accurate and unusually affecting. **◐**

### Americas
41. **Quincha — Peru** *(a,b,c)* — cane or bamboo woven between timber posts, rendered with earth. Light, ductile, genuinely seismic-resistant because it *flexes*; now formalised as *quincha prefabricada* and reflected in Peru's earthen building code. **The counter-argument to "earth = brittle."** **★**
42. **Earthship — Michael Reynolds, Taos** *(a,b,c)* — rammed-tyre thermal mass bermed into the earth, south-facing greenhouse, greywater botanical cells cascading to blackwater. **Feature it critically** — independent monitoring repeatedly finds real-world thermal performance below claims in cold/cloudy climates, and the tyre off-gassing question is unresolved. **★**
43. **Living Breakwaters — SCAPE, Staten Island** *(c)* — **$111M**, completed 2024: near-shore breakwaters of textured ECOncrete units with "reef streets" seeded via the Billion Oyster Project, so the coastal-defence structure *is* habitat. **★**
44. **Bosco Verticale — Boeri Studio, Milan, 2014** — **the deliberate counterpoint.** ~900 trees on two towers; also the most-criticised project in the field. **Pairing it against Kampung Admiralty in COMPARE is the single sharpest editorial move available to this site.**

---

## Sourcing rules

- **Best open pools:** Wikimedia Commons — **verify each file's specific licence**
  (Commons hosts CC0 / CC BY / CC BY-SA / PD side by side) and **check freedom of
  panorama by country**, which bites for modern buildings in France, Italy and Greece.
  Also UNESCO WHC for Shibam and the tulou; UK Parliament POST and gov.uk for BNG and
  NPPF; Historic England for thatch; NY State HCR for Living Breakwaters.
- **Best curated (non-open but citable):** **Archnet** (Aga Khan Documentation Center,
  MIT Libraries) for the entire MENA/South Asia vernacular set incl. the Fathy archive;
  the **Aga Khan Award for Architecture** publishes substantial documentation on winners.
- **Best hard data:** Auroville Earth Institute (CSEB MJ/m³ and kg CO₂/m³ tables),
  Passive House Institute (criteria), Basel / Climate-ADAPT (green roof area & policy
  text), Ramboll (Kampung Admiralty species audit).
- **Do not publish a number you haven't opened the source for.** The three most
  frequently mis-cited figures in this domain are **hempcrete sequestration**,
  **Eastgate's savings**, and **AVN's building count**.

---

## Tech fixes carried over

| Severity | Issue |
|---|---|
| High | `hero.webp` is a 1.28 MB GIF89a (see above) |
| High | Druk Wide Bold hotlink — licensing + third-party dependency |
| High | Tailwind Play CDN in production |
| High | `overflow-hidden` + wheel-jacking = no scrollbar, no browser-native nav. The 1000 ms `wheelThreshold` swallows trackpad input; **there is no touch/swipe handler at all**, so mobile gets slide 1 and two small buttons |
| High (a11y) | `alt="Background"` for six different buildings. No `<h1>` outside the fixed header. No `aria-live` or focus move on slide change — screen readers are never told the content swapped. No `<noscript>` |
| Medium | `wheel` listener registered **non-passive** → Chrome flags it as scroll-blocking |
| Medium | ~quarter of the CSS is dead: `.animate-float`, `.animate-pulse-slow`, `.parallax-wrapper`, `.parallax-section`, `.parallax-bg`, `backdropBlur.xs`, and the colours `concrete`, `soil`, `leaf`, `bark` each appear exactly once — at their definition. `goToSection(index)` defined, never called. `panelClass` is `""` on all six slides |
| Medium | No `prefers-reduced-motion` despite full-viewport crossfades |
| Medium | **No per-slide URL hash** → nothing is linkable, back button dead, refresh returns to slide 1 |
| Low | `v-html` on title and content — forecloses external content sourcing |
| Low | `<meta name="keywords">` is copy-pasted from the portfolio: `"digital design, flow arts, hardware consulting… dapo, gearshare"` |
| Low | `eco-brutalism/.DS_Store` is committed |

---

## Gauntlet notes

- **G1 TRUTH is the primary gate.** CRITIC verifies 10 random `numbers[]` entries
  against cited URLs. The Eastgate, hempcrete and AVN figures should be deliberately
  seeded into the sample.
- **G3** blocks on: any practice without a `sources[]`, any contested practice without
  a `criticism`, any Commons image without licence + attribution rendered on the page.
- **G4** — the move: *COMPARE.* Two buildings, one axis, real numbers, and the
  expensive famous one loses. If COMPARE isn't in the build, DELIGHT caps at 3.
- Target ≥ 30 practices at ship, across ≥ 5 continents, with all three axes represented
  on every continent.
