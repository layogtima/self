/* THE FERMENT ALCHEMIST — Vessel Types */

window.GameVessels = {
  items: [
    {
      id: 'mason-jar',
      name: 'Mason Jar',
      icon: '🫙',
      description: 'The workhorse of home fermentation. Affordable, transparent, widely available.',
      unlockLevel: 1,
      capacity: 'small',
      suitableFor: ['dry-salt', 'brine-submerge', 'paste-ferment', 'sugar-ferment'],
      bonus: 0,
      traits: ['transparent', 'airtight-optional', 'affordable'],
    },
    {
      id: 'fermentation-crock',
      name: 'Fermentation Crock',
      icon: '🏺',
      description: 'Traditional ceramic vessel with a water-seal moat. Keeps air out while letting CO2 escape.',
      unlockLevel: 3,
      capacity: 'large',
      suitableFor: ['dry-salt', 'brine-submerge', 'paste-ferment'],
      bonus: 2,
      traits: ['water-seal', 'opaque', 'traditional'],
    },
    {
      id: 'swing-top-bottle',
      name: 'Swing-Top Bottle',
      icon: '🍾',
      description: 'Perfect for carbonated ferments. The mechanical seal traps CO2 for natural fizz.',
      unlockLevel: 5,
      capacity: 'small',
      suitableFor: ['sugar-ferment', 'scoby-brew'],
      bonus: 3,
      traits: ['pressure-safe', 'carbonation', 'portable'],
    },
    {
      id: 'onggi',
      name: 'Onggi Pot',
      icon: '🏺',
      description: 'Korean breathable clay pot. Micro-pores allow air exchange while keeping contaminants out.',
      unlockLevel: 6,
      capacity: 'large',
      suitableFor: ['dry-salt', 'paste-ferment', 'mixed-ferment'],
      bonus: 4,
      traits: ['breathable', 'traditional', 'korean', 'temperature-stable'],
    },
    {
      id: 'glass-jar-airlock',
      name: 'Jar with Airlock',
      icon: '🫙',
      description: 'A mason jar fitted with an airlock lid. Best of both worlds — visible and sealed.',
      unlockLevel: 4,
      capacity: 'medium',
      suitableFor: ['dry-salt', 'brine-submerge', 'paste-ferment', 'sugar-ferment'],
      bonus: 2,
      traits: ['airlock', 'transparent', 'modern'],
    },
    {
      id: 'ceramic-bowl',
      name: 'Ceramic Bowl',
      icon: '🥣',
      description: 'Open vessel covered with cloth. Good for cultures that need oxygen.',
      unlockLevel: 2,
      capacity: 'medium',
      suitableFor: ['culture-inoculate', 'scoby-brew', 'koji-cultivation'],
      bonus: 1,
      traits: ['open', 'breathable', 'simple'],
    },
    {
      id: 'oak-barrel',
      name: 'Oak Barrel',
      icon: '🛢️',
      description: 'Adds complex woody, vanilla notes. For advanced, long-term ferments.',
      unlockLevel: 15,
      capacity: 'very-large',
      suitableFor: ['mixed-ferment', 'sugar-ferment'],
      bonus: 5,
      traits: ['wood', 'flavor-adding', 'long-term', 'premium'],
    },
    {
      id: 'koji-tray',
      name: 'Koji Tray',
      icon: '🍱',
      description: 'Shallow cedar or bamboo tray for spreading koji. Maximizes surface area for mold growth.',
      unlockLevel: 12,
      capacity: 'flat',
      suitableFor: ['koji-cultivation'],
      bonus: 5,
      traits: ['shallow', 'wood', 'specialized'],
    },
  ],

  getById(id) {
    return this.items.find(v => v.id === id);
  },

  getAvailable(playerLevel) {
    return this.items.filter(v => v.unlockLevel <= playerLevel);
  },

  getSuitableFor(techniqueId) {
    return this.items.filter(v => v.suitableFor.includes(techniqueId));
  }
};
