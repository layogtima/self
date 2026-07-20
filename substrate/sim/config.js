// JAR · config — materials, tuning constants, slider schema.
// Every constant the ecosystem depends on lives here, in one exported object.
// Sliders bind to a live copy; export/import round-trips this as JSON.

export const M = {
  AIR: 0, ROCK: 1, SOIL: 2, SAND: 3, WATER: 4, ICE: 5, STEAM: 6, SMOKE: 7,
  FIRE: 8, SEED: 9, PLANT: 10, DEAD: 11, MYC: 12, FRUIT: 13,
};
export const MAT_COUNT = 14;
export const MAT_NAME = [
  'air', 'rock', 'soil', 'sand', 'water', 'ice', 'steam', 'smoke',
  'fire', 'seed', 'plant', 'deadmatter', 'mycelium', 'fruit',
];

// heat conductivity per material (stable for k <= ~0.5 with 4-neighbour laplacian)
export const HEAT_K = new Float32Array([
  0.25, 0.10, 0.15, 0.15, 0.32, 0.36, 0.30, 0.25,
  0.30, 0.16, 0.18, 0.14, 0.14, 0.16,
]);

// light transmission per material (1 = clear, 0 = opaque)
export const TRANSMIT = new Float32Array([
  1.00, 0.00, 0.00, 0.00, 0.94, 0.88, 0.90, 0.78,
  0.95, 0.80, 0.62, 0.00, 0.00, 0.70,
]);

export const DEFAULTS = {
  // grid + timing
  GRID_W: 256, GRID_H: 384, SIM_HZ: 30, AGENT_CAP: 64,

  // heat field
  DECAY: 0.995,          // per-tick relaxation toward ambient
  AMBIENT: 0.35,         // ambient temp at the floor of the jar
  LAPSE: 0.14,           // how much colder the top of the jar is than the floor
  FREEZE: 0.0, MELT: 0.05, BOIL: 1.0, CONDENSE: 0.6,
  EVAP_T: 0.75, EVAP_P: 0.002,   // sub-boil surface evaporation
  FIRE_HEAT: 0.12, FIRE_TTL: 40, IGNITE_P: 0.18, IGNITE_T: 0.92,
  SMOKE_TTL: 90,

  // plants
  PLANT_GROW_COST: 40,   // energy spent converting an air cell to plant
  PLANT_GROW_P: 0.14,    // per-tick attempt chance for an energetic cell
  PLANT_LIGHT_MIN: 0.15, // seeds refuse to germinate in the dark
  PLANT_PHOTO: 0.35,     // energy gain scale: light × damp × this
  PLANT_METAB: 0.02,     // per-tick chance of losing 1 energy
  PLANT_MATURITY: 90,   // meta age at which tips may cast seed
  PLANT_AGE_P: 0.05,     // per-tick chance a cell ages by 1
  SEED_RATE: 0.02,      // per-tick chance a mature tip becomes a seed
  SEED_TTL: 220,         // dormancy ticks (×10) before an ungerminated seed rots
  FREEZE_KILL: 0.03,

  // mycelium (the decomposer keystone)
  MYC_SPREAD_P: 0.030,   // spread into adjacent deadmatter
  MYC_SOIL_P: 0.004,     // creep through damp soil toward the next corpse
  DECOMPOSE_RATE: 0.004, // old mycelium dissolving into nutrient
  MYC_DRY_P: 0.002,      // die-back chance per tick when no water nearby
  MYC_FRUIT_NUTRIENT: 2.5,
  MYC_FRUIT_P: 0.004,
  FRUIT_TTL: 160,        // fruit age (×10 ticks) before it falls to deadmatter

  // grazers
  GRAZER_METAB: 0.03,   // energy per tick, just existing
  GRAZER_MOVE_COST: 0.012,
  GRAZER_EAT_GAIN: 20,   // energy per plant cell (also sets energy↔mass rate)
  GRAZER_HUNGRY: 70,
  GRAZER_REPRO_AT: 190,
  GRAZER_SPEED: 0.38,
  GRAZER_COMFORT: 0.38,  // centre of the temperature comfort band
  GRAZER_BAND: 0.30,     // half-width; outside it they follow the gradient
  GRAZER_LETHAL: 0.55,   // beyond comfort±this, temperature does damage
  GRAZER_SENSE: 9,       // half-window (cells) for food search
};

// slider metadata for the config panel — [key, min, max, step, group]
export const SCHEMA = [
  ['AMBIENT', 0, 1, 0.01, 'heat'], ['LAPSE', 0, 0.5, 0.01, 'heat'],
  ['DECAY', 0.95, 1, 0.001, 'heat'], ['CONDENSE', 0, 1, 0.01, 'heat'],
  ['EVAP_T', 0.3, 1, 0.01, 'heat'], ['EVAP_P', 0, 0.02, 0.0005, 'heat'],
  ['PLANT_GROW_COST', 5, 120, 1, 'plants'], ['PLANT_GROW_P', 0, 0.5, 0.005, 'plants'],
  ['PLANT_LIGHT_MIN', 0, 1, 0.01, 'plants'], ['PLANT_PHOTO', 0, 1, 0.01, 'plants'],
  ['PLANT_METAB', 0, 0.2, 0.001, 'plants'], ['PLANT_MATURITY', 20, 250, 1, 'plants'],
  ['SEED_RATE', 0, 0.1, 0.001, 'plants'],
  ['MYC_SPREAD_P', 0, 0.2, 0.001, 'mycelium'], ['MYC_SOIL_P', 0, 0.05, 0.0005, 'mycelium'],
  ['DECOMPOSE_RATE', 0, 0.05, 0.0005, 'mycelium'], ['MYC_DRY_P', 0, 0.05, 0.0005, 'mycelium'],
  ['MYC_FRUIT_NUTRIENT', 0, 8, 0.1, 'mycelium'], ['MYC_FRUIT_P', 0, 0.05, 0.0005, 'mycelium'],
  ['GRAZER_METAB', 0, 0.2, 0.001, 'grazers'], ['GRAZER_EAT_GAIN', 1, 80, 1, 'grazers'],
  ['GRAZER_HUNGRY', 10, 200, 1, 'grazers'], ['GRAZER_REPRO_AT', 50, 250, 1, 'grazers'],
  ['GRAZER_SPEED', 0.05, 1.2, 0.01, 'grazers'], ['GRAZER_COMFORT', 0, 1, 0.01, 'grazers'],
  ['GRAZER_BAND', 0.05, 0.6, 0.01, 'grazers'], ['GRAZER_SENSE', 3, 15, 1, 'grazers'],
];
