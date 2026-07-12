// Single source of truth for world layout + content flags.

export const DECKS = [
  // x0/x1 along the spine; every deck shares the same y/z cross-section
  { id: 'A', name: 'Bow Gardens', x0: 10, x1: 330 },
  { id: 'B', name: 'Midway', x0: -290, x1: -50 },
  { id: 'C', name: 'The Deep Deck', x0: -570, x1: -330 },
  { id: 'D', name: 'Sternside', x0: -850, x1: -610 },
];

// shared deck cross-section (world y/z)
export const SECTION = {
  yMin: -25, yMax: 145,
  zMin: -95, zMax: 95,
  floorY: 0, ceilY: 130, wallT: 8,
};

// bridgeway tube between decks (through the collars)
export const BRIDGE = { halfW: 12, height: 14 };

// content flags — modules stay in the repo, these gate instantiation
export const WORLD = {
  guests: false,        // crowd off for now
  defaultRides: false,  // ferris/coaster/carousel/props off — build manually
};
