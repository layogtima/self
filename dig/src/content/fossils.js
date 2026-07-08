// The fossil registry — pure data, one entry per species. THIS is the file you
// add to when growing the game. See docs/CONTENT.md for the full contract.
//
// Rules (validated by tests/run.js, which doubles as a contributor lint):
//   • id: unique, kebab-case, == sprite filename (assets/sprites/fossils/<id>.png)
//   • period: MUST equal a stratum id in content/strata.js (lore accuracy)
//   • environment: marine | terrestrial | freshwater | any (biome fit)
//   • footprint: [w,h] in tiles, each 1..5
//   • rarity: common | uncommon | rare | legendary
//   • value: museum points (roughly scales with rarity/size)
//   • lengthM: real length in metres (shown on the dossier card)
//   • bones: the pieces you collate (1 for artifacts, 3-6 for skeletons)

/**
 * @typedef {Object} FossilSpec
 * @property {string} id
 * @property {string} name
 * @property {string} latin
 * @property {string} period          stratum id
 * @property {'marine'|'terrestrial'|'freshwater'|'any'} environment
 * @property {'common'|'uncommon'|'rare'|'legendary'} rarity
 * @property {[number,number]} footprint  tiles [w,h]
 * @property {number} lengthM       real-world length in metres (card scale bar)
 * @property {string[]} bones        the pieces you must collate (each buried separately)
 * @property {number} value
 * @property {string} blurb
 */

/** @type {FossilSpec[]} */
export const FOSSILS = [
  // — Anthropocene (the humans' layer — we catalogue them now) —
  { id: 'human', lengthM: 1.7, bones: ['skull', 'spine', 'ribs', 'pelvis', 'femur'], name: 'Human', latin: 'Homo sapiens', period: 'anthropocene', environment: 'terrestrial', rarity: 'legendary', footprint: [2, 3], value: 100, blurb: 'The layer\u2019s architect. Built everything around it, including the reasons it\u2019s down here.' },
  { id: 'smartphone', lengthM: 0.15, bones: ['device'], name: 'Smartphone', latin: 'Telephonum sapiens', period: 'anthropocene', environment: 'any', rarity: 'common', footprint: [1, 1], value: 12, blurb: 'Handheld slab. Carried everywhere; consulted several hundred times daily. Possibly devotional.' },
  { id: 'plastic-bottle', lengthM: 0.25, bones: ['bottle'], name: 'Plastic Bottle', latin: 'Polyethylenus eternus', period: 'anthropocene', environment: 'any', rarity: 'common', footprint: [1, 1], value: 8, blurb: 'Held water for approximately four minutes. Will outlast the mountain above you.' },
  { id: 'sneaker', lengthM: 0.3, bones: ['shoe'], name: 'Sneaker', latin: 'Calceus pneumaticus', period: 'anthropocene', environment: 'terrestrial', rarity: 'uncommon', footprint: [1, 1], value: 18, blurb: 'Foot armour with air inside. Traded for extraordinary sums while supplies lasted.' },
  { id: 'house-cat', lengthM: 0.5, bones: ['skull', 'spine', 'ribs', 'tail'], name: 'House Cat', latin: 'Felis catus', period: 'anthropocene', environment: 'terrestrial', rarity: 'uncommon', footprint: [2, 1], value: 35, blurb: 'Small predator. Evidence suggests it domesticated the humans, not the reverse.' },
  { id: 'pigeon', lengthM: 0.35, bones: ['skull', 'wing', 'spine'], name: 'Pigeon', latin: 'Columba livia', period: 'anthropocene', environment: 'any', rarity: 'common', footprint: [1, 1], value: 10, blurb: 'Urban survivor. Thrived on discarded carbohydrates and window ledges.' },
  { id: 'car-tyre', lengthM: 0.7, bones: ['tyre'], name: 'Car Tyre', latin: 'Rotundum vulcanisatum', period: 'anthropocene', environment: 'any', rarity: 'uncommon', footprint: [2, 2], value: 20, blurb: 'One quarter of an automobile\u2019s grip on reality. Found in rivers, mostly.' },

  // — Quaternary (ice age) —
  { id: 'mammoth', lengthM: 5.5, bones: ['skull', 'tusks', 'spine', 'ribs', 'pelvis', 'femur'], name: 'Woolly Mammoth', latin: 'Mammuthus primigenius', period: 'quaternary', environment: 'terrestrial', rarity: 'uncommon', footprint: [4, 3], value: 40, blurb: 'Shaggy tusked giant of the ice-age steppe; humans knew it well.' },
  { id: 'smilodon', lengthM: 2.2, bones: ['skull', 'fangs', 'spine', 'ribs', 'femur'], name: 'Sabre-tooth Cat', latin: 'Smilodon fatalis', period: 'quaternary', environment: 'terrestrial', rarity: 'rare', footprint: [3, 2], value: 55, blurb: 'Ambush predator with 18 cm canines; not actually a tiger.' },
  { id: 'giant-sloth', lengthM: 6.0, bones: ['skull', 'spine', 'ribs', 'pelvis', 'claw'], name: 'Giant Ground Sloth', latin: 'Megatherium', period: 'quaternary', environment: 'terrestrial', rarity: 'uncommon', footprint: [3, 3], value: 42, blurb: 'Elephant-sized sloth that browsed treetops standing upright.' },

  // — Paleogene —
  { id: 'eohippus', lengthM: 0.6, bones: ['skull', 'spine', 'legs'], name: 'Dawn Horse', latin: 'Eohippus', period: 'paleogene', environment: 'terrestrial', rarity: 'common', footprint: [2, 2], value: 20, blurb: 'Fox-sized ancestor of horses; walked on padded toes.' },
  { id: 'titanoboa', lengthM: 13.0, bones: ['skull', 'vertebrae', 'ribs', 'tail'], name: 'Titanoboa', latin: 'Titanoboa cerrejonensis', period: 'paleogene', environment: 'freshwater', rarity: 'legendary', footprint: [5, 2], value: 90, blurb: 'A 13 m snake from steamy post-dinosaur swamps.' },
  { id: 'basilosaurus', lengthM: 18.0, bones: ['skull', 'spine', 'ribs', 'flipper', 'tail'], name: 'Basilosaurus', latin: 'Basilosaurus cetoides', period: 'paleogene', environment: 'marine', rarity: 'rare', footprint: [5, 2], value: 70, blurb: 'An early whale, eel-bodied, with tiny leftover hind legs.' },

  // — Cretaceous —
  { id: 't-rex', lengthM: 12.0, bones: ['skull', 'jaw', 'spine', 'ribs', 'pelvis', 'femur'], name: 'Tyrannosaurus', latin: 'Tyrannosaurus rex', period: 'cretaceous', environment: 'terrestrial', rarity: 'legendary', footprint: [5, 4], value: 120, blurb: 'The tyrant lizard king; bite force to crush a car.' },
  { id: 'triceratops', lengthM: 8.0, bones: ['skull', 'frill', 'horns', 'spine', 'ribs', 'pelvis'], name: 'Triceratops', latin: 'Triceratops horridus', period: 'cretaceous', environment: 'terrestrial', rarity: 'rare', footprint: [4, 3], value: 65, blurb: 'Three-horned browser with a vast bony frill.' },
  { id: 'mosasaur', lengthM: 15.0, bones: ['skull', 'jaw', 'spine', 'flipper', 'tail'], name: 'Mosasaur', latin: 'Mosasaurus hoffmannii', period: 'cretaceous', environment: 'marine', rarity: 'rare', footprint: [5, 2], value: 68, blurb: 'Sea-going lizard, apex of the late Cretaceous oceans.' },
  { id: 'amber-insect', lengthM: 0.02, bones: ['amber'], name: 'Amber-trapped Insect', latin: 'in situ resin', period: 'cretaceous', environment: 'any', rarity: 'uncommon', footprint: [1, 1], value: 30, blurb: 'A gnat frozen mid-flight in fossil tree resin.' },

  // — Jurassic —
  { id: 'stegosaurus', lengthM: 9.0, bones: ['skull', 'plates', 'spine', 'ribs', 'tail-spikes'], name: 'Stegosaurus', latin: 'Stegosaurus stenops', period: 'jurassic', environment: 'terrestrial', rarity: 'rare', footprint: [4, 3], value: 66, blurb: 'Plated back, spiked tail, brain the size of a walnut.' },
  { id: 'diplodocus', lengthM: 26.0, bones: ['skull', 'neck', 'spine', 'ribs', 'pelvis', 'tail'], name: 'Diplodocus', latin: 'Diplodocus longus', period: 'jurassic', environment: 'terrestrial', rarity: 'legendary', footprint: [5, 3], value: 100, blurb: 'A 26 m whip-tailed sauropod; longer than a tennis court.' },
  { id: 'archaeopteryx', lengthM: 0.5, bones: ['skull', 'wing', 'spine'], name: 'Archaeopteryx', latin: 'Archaeopteryx lithographica', period: 'jurassic', environment: 'terrestrial', rarity: 'legendary', footprint: [2, 2], value: 95, blurb: 'Feathered, toothed, clawed — the bridge to birds.' },
  { id: 'ammonite', lengthM: 0.6, bones: ['shell'], name: 'Ammonite', latin: 'Ammonoidea', period: 'jurassic', environment: 'marine', rarity: 'common', footprint: [2, 2], value: 18, blurb: 'Coiled shellfish; its spiral is a museum-shop staple.' },

  // — Triassic —
  { id: 'coelophysis', lengthM: 3.0, bones: ['skull', 'spine', 'legs'], name: 'Coelophysis', latin: 'Coelophysis bauri', period: 'triassic', environment: 'terrestrial', rarity: 'uncommon', footprint: [3, 2], value: 38, blurb: 'Slender early dinosaur that hunted in packs.' },
  { id: 'phytosaur', lengthM: 4.0, bones: ['skull', 'jaw', 'spine', 'tail'], name: 'Phytosaur', latin: 'Rutiodon', period: 'triassic', environment: 'freshwater', rarity: 'uncommon', footprint: [4, 2], value: 44, blurb: 'Crocodile look-alike — nostrils up by the eyes, not the snout.' },

  // — Carboniferous–Permian —
  { id: 'dimetrodon', lengthM: 3.5, bones: ['skull', 'sail', 'spine', 'ribs'], name: 'Dimetrodon', latin: 'Dimetrodon limbatus', period: 'carboniferous', environment: 'terrestrial', rarity: 'rare', footprint: [4, 3], value: 60, blurb: 'Sail-backed synapsid — closer to you than to any dinosaur.' },
  { id: 'meganeura', lengthM: 0.7, bones: ['wings', 'thorax'], name: 'Meganeura', latin: 'Meganeura monyi', period: 'carboniferous', environment: 'terrestrial', rarity: 'uncommon', footprint: [3, 2], value: 46, blurb: 'Dragonfly with a 70 cm wingspan; thrived on oxygen-rich air.' },
  { id: 'fern-frond', lengthM: 0.5, bones: ['frond'], name: 'Fern Frond', latin: 'Pecopteris', period: 'carboniferous', environment: 'any', rarity: 'common', footprint: [2, 3], value: 14, blurb: 'Coal-forest plant; whole swamps became coal seams.' },

  // — Devonian–Silurian —
  { id: 'dunkleosteus', lengthM: 8.8, bones: ['skull-plate', 'jaw', 'spine', 'ribs', 'tail'], name: 'Dunkleosteus', latin: 'Dunkleosteus terrelli', period: 'devonian', environment: 'marine', rarity: 'legendary', footprint: [5, 3], value: 110, blurb: 'Armour-headed fish that sheared prey with bony blades.' },
  { id: 'eurypterid', lengthM: 1.3, bones: ['carapace', 'limbs', 'tail'], name: 'Sea Scorpion', latin: 'Eurypterus', period: 'devonian', environment: 'marine', rarity: 'uncommon', footprint: [3, 2], value: 40, blurb: 'Paddle-limbed arthropod hunter of ancient seas.' },

  // — Cambrian–Ordovician —
  { id: 'trilobite', lengthM: 0.09, bones: ['carapace', 'segments'], name: 'Trilobite', latin: 'Olenoides serratus', period: 'cambrian', environment: 'marine', rarity: 'common', footprint: [2, 1], value: 15, blurb: 'Armoured seafloor scuttler; ruled the oceans for 270 My.' },
  { id: 'anomalocaris', lengthM: 1.0, bones: ['head', 'arms', 'body', 'tail'], name: 'Anomalocaris', latin: 'Anomalocaris canadensis', period: 'cambrian', environment: 'marine', rarity: 'rare', footprint: [4, 2], value: 72, blurb: 'Metre-long Cambrian apex predator with grasping arms.' },

  // — Precambrian —
  { id: 'stromatolite', lengthM: 1.0, bones: ['layers', 'core'], name: 'Stromatolite', latin: 'layered cyanobacteria', period: 'precambrian', environment: 'marine', rarity: 'common', footprint: [2, 2], value: 22, blurb: 'Microbial mats — among the oldest evidence of life.' },
  { id: 'dickinsonia', lengthM: 0.6, bones: ['imprint', 'ribs'], name: 'Dickinsonia', latin: 'Dickinsonia costata', period: 'precambrian', environment: 'marine', rarity: 'legendary', footprint: [3, 2], value: 105, blurb: 'Ribbed Ediacaran oddity; possibly the earliest known animal.' },
];

export const FOSSILS_BY_ID = Object.fromEntries(FOSSILS.map(f => [f.id, f]));

/** all fossils whose period matches a stratum id */
export function fossilsForPeriod(periodId) {
  return FOSSILS.filter(f => f.period === periodId);
}

/** total bone count for a species */
export function boneCount(fossilId) {
  return (FOSSILS_BY_ID[fossilId]?.bones || ['piece']).length;
}
