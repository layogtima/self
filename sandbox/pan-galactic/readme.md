# PAN-GALACTIC GARGLE TRADING

_Don't Panic! A Hitchhiker's Guide to Galactic Commerce_

## Game Concept

You are a hapless human who has been unwittingly thrust into the role of an interstellar trader after the destruction of Earth to make way for a hyperspace bypass. Armed with nothing but your towel and a copy of "The Hitchhiker's Guide to the Galaxy," you must navigate the absurdities of cosmic capitalism to earn enough money to find the legendary planet of Magrathea.

## Design Constraints

- Single font: Space Mono (fallback: monospace)
- Single color palette: Various shades of teal (#00FFFF to #003333)
- Iconography: Font Awesome icons only
- File structure: index.html, style.css, script.js only

## Core Game Systems

### Locations

Players travel between iconic locations from the Hitchhiker's universe:

- **Earth** (starting location, accessible only at game start)
- **Milliways** (The Restaurant at the End of the Universe)
- **Vogon Constructor Fleet**
- **Betelgeuse Trading Platform**
- **Ursa Minor Beta** (home of the Hitchhiker's Guide HQ)
- **Deep Thought Computer World**
- **Traal** (home of the Ravenous Bugblatter Beast)
- **Damogran** (home of the Heart of Gold)
- **Magrathea** (unlocked after meeting specific game conditions)

### Resources/Commodities

- **Pan Galactic Gargle Blaster** (highly valuable, fluctuating price)
- **Babel Fish** (rare but useful for trading with alien species)
- **Genuine People Personalities** (for robots and doors)
- **Infinite Improbability Drive Parts**
- **Nutrimatic Drinks** (almost, but not quite, entirely unlike tea)
- **Vogon Poetry Books** (dangerous to carry but valuable to the right buyer)
- **Towels** (essential item, provides trading bonuses)
- **Digital Copies of the Guide** (provides market information)
- **Jynnan Tonnyx** (less potent version of the Pan Galactic Gargle Blaster)
- **Algolian Zylatburger** (perishable food item)

### Game Mechanics

#### Trading System

- Each location has different buy/sell prices for commodities
- Prices fluctuate based on:
  - Random events ("Somebody Else's Problem field activated")
  - Location-specific multipliers
  - Improbability factor (random but predictable within ranges)
  - Player reputation with different species

#### Travel System

- Travel between locations costs money or resources
- Certain routes require special items (e.g., Electronic Thumb for hitchhiking)
- Improbability Drive: Chance to randomly teleport to any location (including normally inaccessible ones)
- Time passes as you travel (affects perishable items and market conditions)

#### Random Events

- **Vogon Poetry Reading**: Lose money or items unless you have specific protection
- **Infinite Improbability Event**: Drastically changes market prices across all locations
- **Heart of Gold Visit**: Opportunity to acquire rare items
- **Galactic Tax Audit**: Lose a percentage of your money
- **Ravenous Bugblatter Beast Attack**: Lose items unless you have a towel
- **Guide Update**: Receive new information about optimal trading routes
- **Restaurant at the End of the Universe Reservation**: Special trading opportunity with customers from the future

#### Player Stats

- **Money**: Measured in Altairian Dollars
- **Reputation** with various species (affects trading prices):
  - Humans (rare and sometimes valuable as Earth was destroyed)
  - Vogons (bureaucratic and difficult)
  - Betelgeusians (good traders)
  - Dentrassi (love to party, good source of Pan Galactic Gargle Blasters)
  - Magratheans (master builders, difficult to access)

#### Game Progression

- **Early Game**: Basic trading between accessible planets, earning enough for better ships
- **Mid Game**: Unlock special trading routes, build reputation with species
- **Late Game**: Discover the coordinates to Magrathea, gather enough wealth to commission a new Earth

#### Win Condition

Accumulate 1 million Altairian Dollars and locate Magrathea to commission a new Earth, or discover the Ultimate Question of Life, the Universe, and Everything (special hidden questline).

## UI Elements

### Main Screen

- **Location Information**: Current planet with brief description
- **Inventory Panel**: Shows current cargo and credits
- **Market Panel**: Buy/sell interface for current location
- **Navigation Panel**: Travel options from current location
- **Status Panel**: Shows current events and notifications
- **Character Stats**: Reputation with different species

### Market Interface

- Simple two-column layout showing buy/sell prices
- Quantity selector for transactions
- Transaction history log in Guide format

### Travel Interface

- List of destinations with travel costs
- Travel time indicators
- Special route requirements
- Probability calculator for Infinite Improbability Drive usage

## Narrative Elements

### The Guide Entries

Each location and item has a humorous entry from "The Hitchhiker's Guide to the Galaxy" providing:

- Flavor text about the location/item
- Subtle hints about trading strategies
- Easter eggs for fans of the series

### Interactions

- Encounter key characters from the books (Zaphod, Trillian, Marvin, etc.)
- Dialogue options inspired by Adams' wit and humor
- Quests that parody common sci-fi and trading game tropes

## Technical Implementation

### Data Structures

#### Locations

```javascript
{
  id: "betelgeuse",
  name: "Betelgeuse Trading Platform",
  description: "A bustling commercial hub where anything can be bought or sold—emphasis on anything.",
  guideEntry: "The Betelgeuse Trading Platform was built from the recycled remains of...",
  travelCosts: {
    "milliways": 500,
    "vogon_fleet": 300,
    // etc.
  },
  marketModifiers: {
    "pan_galactic_gargle_blaster": 0.8, // 20% cheaper than average
    "babel_fish": 1.3, // 30% more expensive than average
    // etc.
  },
  availableItems: ["pan_galactic_gargle_blaster", "babel_fish", "towels"],
  events: ["tax_audit", "guide_update"],
  requiredItems: null // No special items needed to access
}
```

#### Items

```javascript
{
  id: "pan_galactic_gargle_blaster",
  name: "Pan Galactic Gargle Blaster",
  description: "Like having your brains smashed out by a slice of lemon wrapped around a large gold brick.",
  guideEntry: "The Pan Galactic Gargle Blaster is the alcoholic equivalent of a mugging...",
  baseValue: 150,
  volatility: 0.5, // High price fluctuation
  weight: 1,
  perishable: true,
  perishTime: 10, // Turns before it goes bad
  specialEffects: {
    "dentrassi_reputation": 0.1 // Improves Dentrassi reputation when traded
  }
}
```

#### Player

```javascript
{
  credits: 1000,
  location: "earth",
  inventory: [
    {itemId: "towel", quantity: 1},
    {itemId: "guide", quantity: 1}
  ],
  reputation: {
    "humans": 1.0,
    "vogons": 0.2,
    "betelgeusians": 0.5,
    "dentrassi": 0.5,
    "magratheans": 0.0
  },
  visitedLocations: ["earth"],
  turnCount: 0,
  specialItemsDiscovered: [],
  questProgress: {
    "ultimate_question": 0,
    "heart_of_gold": 0
  }
}
```

### Core Game Loop

1. Player views current location information
2. Interacts with market (buy/sell)
3. Chooses next destination
4. Random event may occur
5. Travel occurs, time passes
6. Market prices update
7. Repeat from step 1

### Random Price Generation

Prices for each item in each location follow this formula:

```javascript
function calculatePrice(item, location, turn) {
  const basePrice = item.baseValue;
  const locationModifier = location.marketModifiers[item.id] || 1.0;
  const volatility = item.volatility;

  // Pseudorandom but deterministic based on turn number and location
  const randomFactor = seededRandom(turn + location.id.charCodeAt(0));
  const fluctuation = 1 + (randomFactor * volatility * 2 - volatility);

  return Math.round(basePrice * locationModifier * fluctuation);
}
```

## Visual Design

### Color Palette

- **Primary Background**: Deep Space (#001a1a)
- **Terminal Text**: Bright Teal (#00FFFF)
- **UI Elements**: Mid Teal (#00AAAA)
- **Highlights/Selection**: Bright Cyan (#80FFFF)
- **Warnings/Alerts**: Deep Cyan with increased brightness (#00CCCC)
- **Disabled Elements**: Muted Teal (#004444)

### Typography

- All text in Space Mono (fallback: monospace)
- Different font weights and sizes for hierarchy
- Guide entries in italics

### Layout

- Terminal-inspired interface with block elements
- Guide entries appear as indented blockquotes
- Tabbed interfaces for different sections (Inventory, Market, Travel)
- Status messages in a scrolling console at the bottom

### Animation

- Subtle cursor blink for interactive elements
- Typing effect for Guide entries
- Fade transitions between locations

### Iconography

Font Awesome icons:

- `fa-rocket` for travel
- `fa-money-bill-wave` for transactions
- `fa-flask` for Pan Galactic Gargle Blaster
- `fa-fish` for Babel Fish
- `fa-robot` for Genuine People Personalities
- `fa-cogs` for Infinite Improbability Drive Parts
- `fa-mug-hot` for Nutrimatic Drinks
- `fa-book` for Vogon Poetry
- `fa-bath` for Towels (closest to a towel icon)
- `fa-tablet` for Digital Copies of the Guide
- `fa-glass-martini-alt` for Jynnan Tonnyx
- `fa-hamburger` for Algolian Zylatburger

## Easter Eggs & Extra Features

- Occasional appearances by the number 42
- Marvin the Paranoid Android providing pessimistic market tips
- Hidden "Infinite Improbability" button that does something completely random
- Occasional text that temporarily transforms into Vogon Poetry
- "Don't Panic" message that appears during market crashes
- Hidden Tea quest to find a proper cup of tea in the galaxy

---

_Remember: A towel is about the most massively useful thing an interstellar trader can have._
