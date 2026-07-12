// MONOLITH: one Atrium at the heart of a brutalist Voronoi hull, and an open
// growth field around it. NOVA grows chambers and halls on demand — the
// station expands organically. See docs/DESIGN.md (v4).

export const R_OCT = 80;                                   // octagon circumradius
export const OCT_EDGE = 2 * R_OCT * Math.sin(Math.PI / 8); // ≈ 61.2
export const OCT_IN = R_OCT * Math.cos(Math.PI / 8);       // inradius ≈ 73.9
export const A = 2 * OCT_IN;                               // grid pitch ≈ 147.8

// growth field: cols −3..3, rows −1..1; bays pre-occupy the marked slots
export const FIELD = { cols: 3, rows: 1 };
export const BAY_SLOTS = [
  { col: 3, row: 0 }, { col: -3, row: 0 },   // in-field, at the E/W ends
  { col: 0, row: 2 }, { col: 0, row: -2 },   // just beyond the N/S field edge
];

export const GROW = {
  chamber: { cost: 18000, name: 'Chamber' },
  hall: { cost: 6000, name: 'Hall' },
};

export const ATRIUM = { R: R_OCT, h: 110, oculusR: 30 };
export const CHAMBER = { R: R_OCT, h: 60, oculusR: 22 };
export const HALL = { halfW: 10, h: 18 };

export const RING_DOOR = { r: 10, cy: 6, wallT: 4 };       // chamber-chamber
export const RING_DOOR_S = { r: 7.5, cy: 4.5, wallT: 4 };  // hall ends

export const PALETTE = {
  porcelain: 0xeae4d8,
  porcelainDark: 0xcfc7b8,
  celadon: 0x9cc4a8,
  verdigris: 0x63b0a0,
  brutal: 0x85888c,
  brutalDark: 0x5c5f63,
  glowWarm: [1.9, 1.72, 1.4],
  glowCyan: [0.8, 1.9, 1.9],
};

export const WORLD = {
  guests: false,
  defaultRides: false,
};
