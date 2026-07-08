// The single source of colour truth - v3.1 "field dossier" theme.
// Deep blueprint blues + chunky dark frames + cream text + one amber accent,
// with richer, earthier strata (defined alongside the strata in content/strata.js).

export const PALETTE = {
  // world
  sky: '#BCD7E8',            // soft day blue up top
  skyDusk: '#8FB3CC',
  cloud: '#E9F1F4',
  cloudShadow: '#CFDEE7',
  ink: '#33303E',            // outlines, the dwarf, in-world marks
  bone: '#F2EBD7',           // fossil bone
  boneShadow: '#CFC5A9',
  lantern: '#FFE9B8',        // warm headlamp glow
  dark: '#1D2433',           // cave darkness (deep blue-black)

  // surface life
  grass: '#7FA86A',
  grassDeep: '#5F8A54',
  tundraGrass: '#9DB8AE',
  duneGrass: '#B9AE72',
  wood: '#8A6A4F',
  tent: '#C46A4F',
  tentShadow: '#A2523C',

  // player
  hardhat: '#F0A93B',
  hardhatBrim: '#D18F27',
  beard: '#D9CDB8',

  // UI - the FIELD JOURNAL language (parchment pages in wood frames).
  // Token names are kept from the old blueprint theme so call sites don't churn.
  frame: '#6E4F33',          // wood frame
  frameLight: '#8A6A47',     // lighter grain streak
  frameDark: '#4A3421',      // dark grain / shadow edge
  blueprint: '#E9DCBC',      // parchment page fill
  blueprintDeep: '#DCCBA2',  // aged parchment (headers / deeper panels)
  grid: 'rgba(74,52,33,0.07)', // faint ledger rule
  cream: '#3B2F22',          // primary text is now sepia ink ON parchment
  creamDim: 'rgba(59,47,34,0.60)',
  parchment: '#E9DCBC',
  parchmentEdge: '#CBB88E',
  amber: '#C8791E',          // ocher accent (buttons, markers)
  amberSoft: '#E0A24A',
  good: '#6C9A54',
  danger: '#B4553C',
  shadow: 'rgba(0,0,0,0.35)',
};

/** rarity → accent used on cards & dex entries */
export const RARITY_COLORS = {
  common: '#9FB4C4',
  uncommon: '#7FC4A8',
  rare: '#C79FDB',
  legendary: '#F0A93B',
};
