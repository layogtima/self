/* THE FERMENT ALCHEMIST — Fermentation Technique Definitions */

window.GameTechniques = {
  items: [
    {
      id: 'dry-salt',
      name: 'Dry Salting',
      icon: '🧂',
      description: 'Massage salt directly into vegetables to draw out natural juices. The simplest and most ancient technique.',
      unlockLevel: 1,
      difficulty: 1,
      defaultSaltPercent: 2.0,
      saltRange: [1.5, 3.5],
      tempRange: [18, 24],
      timeRange: [7, 28],
      timeUnit: 'days',
      tips: [
        'Use 2% salt by weight of vegetables for a good starting point',
        'Massage until vegetables release enough liquid to submerge themselves',
        'Keep submerged under brine to prevent mold'
      ],
      recipes: ['sauerkraut-classic', 'curtido-salvadoran'],
    },
    {
      id: 'brine-submerge',
      name: 'Brine Submersion',
      icon: '💧',
      description: 'Submerge vegetables in a prepared salt-water brine. Great for whole or large-cut vegetables.',
      unlockLevel: 2,
      difficulty: 1,
      defaultSaltPercent: 3.5,
      saltRange: [2.0, 5.0],
      tempRange: [18, 24],
      timeRange: [3, 21],
      timeUnit: 'days',
      tips: [
        'A 3.5% brine is a good all-purpose starting concentration',
        'Ensure all vegetables stay below the brine surface',
        'Add aromatics like dill, garlic, or peppercorns for flavor'
      ],
      recipes: ['brine-pickles-basic'],
    },
    {
      id: 'paste-ferment',
      name: 'Paste Fermentation',
      icon: '🌶️',
      description: 'Blend or pound ingredients into a paste with salt and ferment. Used for condiments and sauces.',
      unlockLevel: 5,
      difficulty: 2,
      defaultSaltPercent: 3.0,
      saltRange: [2.5, 5.0],
      tempRange: [15, 22],
      timeRange: [7, 60],
      timeUnit: 'days',
      tips: [
        'Paste should be thick enough to hold together',
        'Pack tightly to remove air pockets',
        'Some pastes ferment for months — patience is key'
      ],
      recipes: ['fermented-salsa'],
    },
    {
      id: 'culture-inoculate',
      name: 'Culture Inoculation',
      icon: '🫧',
      description: 'Add a specific microbial culture to milk or other base. Precise temperature control is essential.',
      unlockLevel: 4,
      difficulty: 2,
      defaultSaltPercent: 0,
      saltRange: [0, 1.0],
      tempRange: [30, 45],
      timeRange: [4, 24],
      timeUnit: 'hours',
      tips: [
        'Temperature is critical — too hot kills the culture, too cold slows it',
        'Use a warm oven or insulated container to maintain temperature',
        'The longer you ferment, the tangier the result'
      ],
      recipes: ['dahi-homemade'],
    },
    {
      id: 'sugar-ferment',
      name: 'Sugar Fermentation',
      icon: '🍯',
      description: 'Dissolve sugar in liquid with a culture to produce carbonated, mildly alcoholic beverages.',
      unlockLevel: 6,
      difficulty: 2,
      defaultSaltPercent: 0,
      saltRange: [0, 0],
      tempRange: [20, 28],
      timeRange: [2, 14],
      timeUnit: 'days',
      tips: [
        'Sugar feeds the microbes and produces CO2 (bubbles!)',
        'Burp bottles daily to prevent explosion',
        'Shorter ferment = sweeter, longer = drier and more sour'
      ],
      recipes: ['tepache-pineapple', 'ginger-bug-starter'],
    },
    {
      id: 'scoby-brew',
      name: 'SCOBY Brewing',
      icon: '🟠',
      description: 'Brew sweetened tea and ferment with a SCOBY (Symbiotic Culture of Bacteria and Yeast).',
      unlockLevel: 9,
      difficulty: 3,
      defaultSaltPercent: 0,
      saltRange: [0, 0],
      tempRange: [22, 30],
      timeRange: [7, 21],
      timeUnit: 'days',
      tips: [
        'Always start with cooled tea — hot liquid kills the SCOBY',
        'The SCOBY needs oxygen, so cover with cloth, not sealed lid',
        'First ferment for vinegary base, second ferment for flavor and fizz'
      ],
      recipes: [],
    },
    {
      id: 'koji-cultivation',
      name: 'Koji Cultivation',
      icon: '🍄',
      description: 'Inoculate steamed grain with Aspergillus oryzae mold. The foundation of miso, soy sauce, and sake.',
      unlockLevel: 12,
      difficulty: 4,
      defaultSaltPercent: 0,
      saltRange: [0, 12],
      tempRange: [28, 35],
      timeRange: [36, 48],
      timeUnit: 'hours',
      tips: [
        'Humidity control is as important as temperature',
        'Koji should smell sweet and chestnut-like, never sour',
        'This is the master technique — the gateway to umami'
      ],
      recipes: [],
    },
    {
      id: 'mixed-ferment',
      name: 'Mixed Fermentation',
      icon: '🔮',
      description: 'Combine multiple techniques in sequence. For complex, layered ferments.',
      unlockLevel: 15,
      difficulty: 5,
      defaultSaltPercent: 2.5,
      saltRange: [0, 10],
      tempRange: [15, 35],
      timeRange: [7, 90],
      timeUnit: 'days',
      tips: [
        'Plan your stages carefully — each step builds on the last',
        'Temperature and timing must be precise for each phase',
        'The most rewarding results come from the most patient fermenters'
      ],
      recipes: [],
    },
  ],

  getById(id) {
    return this.items.find(t => t.id === id);
  },

  getAvailable(playerLevel) {
    return this.items.filter(t => t.unlockLevel <= playerLevel);
  },

  getByDifficulty(diff) {
    return this.items.filter(t => t.difficulty === diff);
  }
};
