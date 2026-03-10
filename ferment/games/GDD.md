# The Ferment Alchemist — Game Design Document

**Version:** 1.0
**Date:** 2026-03-10
**Platform:** Mobile-first web (PWA)
**Tech:** Vue 3 CDN, Tailwind CSS CDN, localStorage
**Parent App:** FERMENT (fermentation recipe guide)

---

## 1. Vision Statement

**The Ferment Alchemist** is an interactive fermentation game that teaches real-world fermentation science through an alchemist-themed workshop experience. Players receive orders from customers around the world, select ingredients, choose techniques, and dial in precise parameters to create authentic fermented foods. The game bridges entertainment and education — every order teaches something real about fermentation.

**Core Fantasy:** You are a fermentation alchemist running a workshop. Customers from around the world bring orders for their traditional fermented foods. You must understand the science and culture behind each ferment to succeed.

---

## 2. Core Game Loop

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   RECEIVE ORDER  →  SELECT INGREDIENTS  →  CHOOSE       │
│   (customer      →  (tap to add/remove) →  TECHNIQUE    │
│    request)      →                      →  (ferment     │
│                  →                      →   method)      │
│                                                          │
│   →  SET PARAMETERS  →  FERMENT  →  SERVE  →  SCORE    │
│   →  (salt, temp,   →  (animated →  (deliver →  (grade  │
│   →   time, vessel) →   progress) →   result) →   + XP) │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Average play session:** 2-5 minutes per order
**Target completion time:** Story mode ~3 hours total

### Loop Detail

1. **Order Phase**: Customer avatar appears with a request in their voice. Shows requirements summary (technique, approximate time, ingredient count). Player taps "Accept Order".

2. **Ingredient Phase**: Grid of available ingredients sorted by category. Player taps to add/remove. Categories filter available choices. Count hint shows how many are needed.

3. **Technique Phase**: Cards showing each fermentation technique with description, parameter ranges, and tips. Selecting auto-advances.

4. **Parameter Phase**: Three sliders (salt %, temperature °C, time). Ranges set by the selected technique. Vessel picker as horizontal scroll strip.

5. **Fermentation Phase**: Animated vessel with rising bubbles. Progress bar fills over ~3 seconds (accelerated game time). Auto-advances when complete.

6. **Serving Phase**: Simple "Serve to Customer" button with anticipation moment.

7. **Results Phase**: Grade stamp animation (S/A/B/C/D/F). Score breakdown by category. Teaching note and cultural context. XP gain.

---

## 3. Scoring System

**100 points maximum per order:**

| Category | Points | Method |
|----------|--------|--------|
| Ingredient Accuracy | 40 | `(matched_required / total_required) * 35` + optional bonus (5) - extra penalty (2 each) - missing penalty (5 each) |
| Technique | 20 | Binary: correct = 20, wrong = 0 |
| Salt Precision | 10 | Linear interpolation: `10 * (1 - |actual - target| / tolerance)` |
| Temperature Precision | 10 | Same linear interpolation |
| Time Precision | 10 | Same linear interpolation |
| Vessel Choice | 5 | Suitable vessel = 5, unsuitable = min(2, vessel bonus) |
| Speed Bonus (endless) | 5 | Under 60s = 5, over 180s = 0, linear between |

### Grades

| Grade | Score | Stars | Unlocks Next? |
|-------|-------|-------|---------------|
| S | 95-100 | 3 ⭐ | Yes |
| A | 85-94 | 2 ⭐ | Yes |
| B | 70-84 | 1 ⭐ | Yes |
| C | 55-69 | 0 | No |
| D | 40-54 | 0 | No |
| F | 0-39 | 0 | No |

### XP Awards

| Grade | Base XP | First Completion | Endless Mode |
|-------|---------|-----------------|--------------|
| S | 100 | ×1.5 | ×0.75 |
| A | 75 | ×1.5 | ×0.75 |
| B | 50 | ×1.5 | ×0.75 |
| C | 30 | ×1.5 | ×0.75 |
| D | 15 | ×1.5 | ×0.75 |
| F | 5 | ×1.5 | ×0.75 |

---

## 4. Game Modes

### 4.1 Story Mode (30 levels, 5 chapters)

**Chapter 1: The Salt Path** (Levels 1-6)
- Focus: Dry salting and brine submersion
- Recipes: Sauerkraut, dill pickles, curtido, carrot sticks, beet kvass, mixed veggie kraut
- Unlock: Always available
- Teaching: Salt ratios, osmosis, lacto-fermentation basics

**Chapter 2: Living Cultures** (Levels 7-12)
- Focus: Culture inoculation and starters
- Recipes: Dahi, kefir, kanji, preserved lemons, ginger bug, culture keeper challenge
- Unlock: 8 stars in Chapter 1
- Teaching: Temperature control, microbial diversity, wild fermentation

**Chapter 3: The Spice Route** (Levels 13-18)
- Focus: Paste fermentation and complex spice blending
- Recipes: Kimchi, fermented hot sauce, Indian pickle, fermented salsa, turmeric kraut, master kimchi
- Unlock: 8 stars in Chapter 2
- Teaching: Paste techniques, regional spice traditions, cultural context

**Chapter 4: The Brewmaster** (Levels 19-24)
- Focus: Sugar fermentation and SCOBY brewing
- Recipes: Tepache, ginger ale, kombucha (black tea), bread kvass, green tea kombucha, balance challenge
- Unlock: 8 stars in Chapter 3
- Teaching: Carbonation, SCOBY care, sugar-to-acid conversion

**Chapter 5: The Alchemist's Table** (Levels 25-30)
- Focus: Advanced techniques (koji, mixed fermentation)
- Recipes: Switchel, miso, amazake, fusion ferment, grand feast, final master test
- Unlock: 8 stars in Chapter 4
- Teaching: Koji cultivation, enzymatic processes, cross-cultural fusion

### 4.2 Endless Mode

- Random order selection from available pool
- Pool expands as orders completed (chapter 1 orders → chapters 1-2 → etc.)
- Tolerances tighten with progression:

| Orders | Tier | Tolerance Multiplier | Label |
|--------|------|---------------------|-------|
| 0-4 | 1 | 1.5× (wider) | Warm Up |
| 5-9 | 2 | 1.0× (standard) | Getting Busy |
| 10-19 | 3 | 0.75× | Rush Hour |
| 20-34 | 4 | 0.5× | Master's Pace |
| 35+ | 5 | 0.3× (very tight) | Impossible! |

- Streak multiplier for consecutive passes (not yet implemented — future enhancement)
- High score and longest streak persisted

### 4.3 Sandbox Mode

- All ingredients, techniques, and vessels unlocked
- No scoring or pressure
- "What did I make?" button finds closest match from:
  1. Game order database (30 orders)
  2. Real recipe database via RecipeBridge (30 recipes)
- Discoveries saved with timestamp
- Cultural context shown for matches
- Ideal for freeform learning

### 4.4 LLM Mode

Dual-interface mode for AI players:

**JSON API Protocol:**
```json
// Game state (output)
{
  "mode": "story",
  "phase": "ingredients",
  "order": { "title": "Your First Kraut", "request": "..." },
  "choices": { "ingredients": ["cabbage"], "technique": null, ... },
  "availableActions": ["add:sea-salt", "confirm_ingredients", ...],
  "fermentProgress": 0
}

// Actions (input)
"add:cabbage"
"select_technique:dry-salt"
"set_salt:2.0"
"set_temperature:20"
"set_time:14"
"select_vessel:mason-jar"
"confirm_parameters"
"wait"
"serve"
```

**Text Adventure Protocol:**
- Narrative descriptions of the workshop, customer, and current state
- Natural language command parsing
- Full transcript exportable for context windows
- System prompt template provided for LLM setup

---

## 5. Progression System

### Player Levels (1-25)

| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Salt Apprentice | 0 |
| 2 | Brine Mixer | 100 |
| 3 | Pickle Novice | 250 |
| 4 | Culture Keeper | 500 |
| 5 | Kraut Wrangler | 800 |
| 6 | Ferment Journeyman | 1,200 |
| 7 | Spice Alchemist | 1,700 |
| 8 | Brew Master | 2,300 |
| 9 | Culture Whisperer | 3,000 |
| 10 | Enzyme Artisan | 3,800 |
| 11-15 | ... | ... |
| 20 | Master Alchemist | 21,000 |
| 25 | Fermentation Anarchist | 50,000 |

### Ingredient/Technique Unlocks

Ingredients and techniques have `unlockLevel` values (1-15). In story mode, availability scales with player level. In sandbox and LLM modes, everything is unlocked.

---

## 6. Art Direction

### Parchment Aesthetic

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#F5E6C8` (warm cream) | `#1A1410` (deep brown) |
| Card surface | `#FDF8F0` (off-white) | `#241E18` (dark brown) |
| Card border | `#E8D5A8` (tan) | `#3A3028` (charcoal brown) |
| Primary text | `#2C1810` (dark brown) | `#F2ECE3` (cream) |
| Secondary text | `#6B5344` (medium brown) | `#C4B5A3` (light tan) |
| Accent (brine) | `#C4A35A` (gold) | Same |
| Accent (ferment) | `#D4553A` (red) | Same |
| Accent (culture) | `#7B8F3A` (green) | Same |

### Typography
- **Headings:** Instrument Serif (elegant, traditional)
- **Body:** DM Sans (clean, readable)
- **Code/LLM:** JetBrains Mono (terminal feel)

### Visual Placeholders
- Ingredients: Emoji icons (🥬🧄🌶️🫙 etc.)
- Vessels: Emoji icons (🫙🏺🍾🛢️)
- Animations: CSS-only (bubbles, steam, splash, grade stamp)
- All replaceable with custom artwork later

### Audio Placeholders
All audio triggers call `GameData.playSound(id)` which currently logs to console. Sound IDs defined:
- SFX: `order-arrive`, `ingredient-add`, `ingredient-remove`, `technique-select`, `vessel-select`, `parameter-adjust`, `ferment-bubble`, `ferment-complete`, `serve-whoosh`, `score-reveal`, `grade-s`, `grade-a`, `grade-fail`, `level-unlock`, `chapter-complete`, `btn-tap`, `btn-back`
- Music: `bg-music-menu`, `bg-music-gameplay`, `bg-music-sandbox`, `bg-music-results`

---

## 7. Technical Architecture

### File Structure
```
ferment/games/
├── index.html              # Entry point
├── GDD.md                  # This document
├── css/game.css             # Parchment theme + animations
├── js/
│   ├── game-app.js          # Vue app, routing, game orchestration
│   ├── game-store.js        # localStorage (ferment_games_v1)
│   ├── game-data.js         # Audio stubs, player titles, icons
│   ├── game-engine.js       # Core FSM, scoring, LLM protocol
│   ├── recipe-bridge.js     # Fetch real recipes from parent app
│   └── components/ (14)     # Vue components
├── data/ (7 files)          # Game content databases
```

### State Machine

**Screen Router:** `start → mode-select → [game | progression | sandbox | llm | settings | help]`

**Game Phase FSM:** `order → ingredients → technique → parameters → fermenting → serving`

### Data Flow
```
GameOrders.js → GameEngine (order selection)
                    ↓
              GameScreen (phase orchestration)
                    ↓
              Picker components (player choices)
                    ↓
              GameScoring (score calculation)
                    ↓
              ResultsScreen (display + XP)
                    ↓
              GameStore (persist progress)
```

### Independence from Parent
- Own `index.html` — separate Vue instance
- Own localStorage key (`ferment_games_v1`)
- Own CSS with game-specific design tokens
- `recipe-bridge.js` fetches parent data via relative path (`../data/recipes/`)
- No shared runtime state — only data reads
- Linked from parent's ToolsView as an external tool

---

## 8. Testing Checklist

### Play Loop Tests (Human Fun Factor) — Hand off to tester

- [ ] **Onboarding:** New player can complete Level 1 without external help
- [ ] **Clarity:** Order requirements are understandable from the card alone
- [ ] **Feedback:** Ingredient tap feedback feels immediate (< 100ms perceived)
- [ ] **Transparency:** Player can roughly predict their grade before seeing results
- [ ] **Education:** Cultural notes feel like interesting facts, not quiz answers
- [ ] **Flow (Endless):** Difficulty escalation feels like growing challenge, not random frustration
- [ ] **Discovery (Sandbox):** Experimenting with random ingredients produces surprising/delightful results
- [ ] **Aesthetic:** Parchment theme reads as warm and inviting, not dated or hard to read
- [ ] **Mobile:** All interactions comfortable with thumb on a 375px-wide phone
- [ ] **Pace:** Individual orders feel brisk (2-5 min), not draggy
- [ ] **Motivation:** Stars and grades motivate replay attempts
- [ ] **Learning:** After completing Chapter 1, player genuinely understands salt ratios
- [ ] **Satisfaction:** Getting an S-grade feels earned and exciting
- [ ] **Recovery:** Getting an F-grade doesn't feel punishing — player knows what to fix

### Technical Tests

- [ ] Renders correctly at 320px, 375px, 414px, 768px, 1024px widths
- [ ] Dark mode works on all screens
- [ ] State persists across browser close/reopen
- [ ] Full offline play after initial cache (via parent SW)
- [ ] Zero console errors during complete story mode playthrough
- [ ] Back button navigates within game (not out to parent app)
- [ ] All touch targets >= 44×44px (WCAG)
- [ ] Reduced motion preference disables all animations
- [ ] Fermentation animation maintains 60fps on mobile
- [ ] Sliders are usable on touch (no accidental page scroll)
- [ ] Hash routing doesn't conflict with parent app
- [ ] localStorage doesn't overflow (LLM transcripts pruned)

### LLM Mode Tests

- [ ] Game state round-trips through JSON serialization without data loss
- [ ] All actions available via text commands
- [ ] Full game transcript is coherent when read as a standalone document
- [ ] Playable with zero visual/CSS dependency
- [ ] System prompt template produces good play from Claude/GPT-4
- [ ] JSON API responses include all state needed for informed decisions
- [ ] Error messages for invalid commands are clear and actionable

### Integration Tests

- [ ] Game link visible and clickable in ferment ToolsView
- [ ] RecipeBridge loads real ingredient data from parent `/data/recipes/`
- [ ] Service worker caches game assets after first visit
- [ ] Game works offline after cache
- [ ] Game localStorage doesn't interfere with parent app state
- [ ] Back link ("← Back to FERMENT") works from start screen

---

## 9. Future Enhancements (Not in v1)

- Real audio assets (SFX + ambient music)
- Custom artwork replacing emoji placeholders
- Multiplayer: competitive fermentation challenges
- Seasonal events: limited-time orders tied to real-world harvest seasons
- Recipe creator: design your own ferment and share the order code
- Streak multipliers in endless mode
- Achievement badges
- Leaderboard (anonymous, optional)
- Second ferment mechanics for kombucha (flavor + carbonation phase)
- Fermentation failure states (mold, off-flavors) as learning moments
- Integration with parent app's pantry (suggest game orders based on pantry)

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **Dry Salting** | Massaging salt directly into shredded/sliced vegetables |
| **Brine Submersion** | Submerging vegetables in prepared salt water |
| **Paste Fermentation** | Blending ingredients into a paste with salt |
| **Culture Inoculation** | Adding specific microbial cultures (yogurt, kefir) |
| **Sugar Fermentation** | Fermenting sugary liquids for carbonated drinks |
| **SCOBY Brewing** | Using a Symbiotic Culture of Bacteria and Yeast |
| **Koji Cultivation** | Growing Aspergillus oryzae mold on grain |
| **Mixed Fermentation** | Combining multiple techniques in sequence |
| **Salt %** | Salt weight as percentage of total ingredient weight |
| **Tolerance** | Acceptable deviation from target parameter |
