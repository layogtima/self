/* THE FERMENT ALCHEMIST — Ingredient Database */

window.GameIngredients = {
  // Category definitions
  categories: {
    produce: { label: 'Produce', icon: '🥬', color: '#7B8F3A' },
    dairy: { label: 'Dairy', icon: '🥛', color: '#E8D5A8' },
    grain: { label: 'Grains & Legumes', icon: '🌾', color: '#C4A35A' },
    salt: { label: 'Salt', icon: '🧂', color: '#A89485' },
    sugar: { label: 'Sweeteners', icon: '🍯', color: '#D4A03A' },
    spice: { label: 'Spices & Herbs', icon: '🌶️', color: '#D4553A' },
    culture: { label: 'Cultures & Starters', icon: '🫧', color: '#4A7B8F' },
    liquid: { label: 'Liquids', icon: '💧', color: '#4A7B8F' },
  },

  // All ingredients available in the game
  items: [
    // ─── Produce ─────────────────────────────────────────
    { id: 'cabbage', name: 'Cabbage', icon: '🥬', category: 'produce', unlockLevel: 1,
      tags: ['vegetable', 'cruciferous'], flavor: 'mild' },
    { id: 'napa-cabbage', name: 'Napa Cabbage', icon: '🥬', category: 'produce', unlockLevel: 3,
      tags: ['vegetable', 'cruciferous', 'korean'], flavor: 'mild' },
    { id: 'carrot', name: 'Carrot', icon: '🥕', category: 'produce', unlockLevel: 1,
      tags: ['vegetable', 'root'], flavor: 'sweet' },
    { id: 'cucumber', name: 'Cucumber', icon: '🥒', category: 'produce', unlockLevel: 2,
      tags: ['vegetable'], flavor: 'mild' },
    { id: 'radish', name: 'Radish', icon: '🟣', category: 'produce', unlockLevel: 3,
      tags: ['vegetable', 'root', 'korean'], flavor: 'peppery' },
    { id: 'garlic', name: 'Garlic', icon: '🧄', category: 'produce', unlockLevel: 1,
      tags: ['aromatic', 'allium'], flavor: 'pungent' },
    { id: 'ginger', name: 'Ginger', icon: '🫚', category: 'produce', unlockLevel: 2,
      tags: ['aromatic', 'root'], flavor: 'spicy' },
    { id: 'onion', name: 'Onion', icon: '🧅', category: 'produce', unlockLevel: 2,
      tags: ['aromatic', 'allium'], flavor: 'pungent' },
    { id: 'pepper-hot', name: 'Hot Pepper', icon: '🌶️', category: 'produce', unlockLevel: 3,
      tags: ['vegetable', 'spicy'], flavor: 'hot' },
    { id: 'tomato', name: 'Tomato', icon: '🍅', category: 'produce', unlockLevel: 4,
      tags: ['vegetable', 'fruit'], flavor: 'acidic' },
    { id: 'beet', name: 'Beetroot', icon: '🟣', category: 'produce', unlockLevel: 5,
      tags: ['vegetable', 'root'], flavor: 'earthy' },
    { id: 'apple', name: 'Apple', icon: '🍎', category: 'produce', unlockLevel: 6,
      tags: ['fruit'], flavor: 'sweet' },
    { id: 'pineapple', name: 'Pineapple', icon: '🍍', category: 'produce', unlockLevel: 8,
      tags: ['fruit', 'tropical'], flavor: 'sweet-acidic' },
    { id: 'lemon', name: 'Lemon', icon: '🍋', category: 'produce', unlockLevel: 4,
      tags: ['fruit', 'citrus'], flavor: 'sour' },
    { id: 'scallion', name: 'Scallion', icon: '🧅', category: 'produce', unlockLevel: 3,
      tags: ['aromatic', 'allium', 'korean'], flavor: 'mild' },
    { id: 'daikon', name: 'Daikon Radish', icon: '🥕', category: 'produce', unlockLevel: 3,
      tags: ['vegetable', 'root', 'korean', 'japanese'], flavor: 'mild' },

    // ─── Dairy ───────────────────────────────────────────
    { id: 'whole-milk', name: 'Whole Milk', icon: '🥛', category: 'dairy', unlockLevel: 4,
      tags: ['dairy', 'base'], flavor: 'creamy' },
    { id: 'cream', name: 'Heavy Cream', icon: '🥛', category: 'dairy', unlockLevel: 8,
      tags: ['dairy', 'rich'], flavor: 'rich' },

    // ─── Grains & Legumes ────────────────────────────────
    { id: 'rice', name: 'Rice', icon: '🍚', category: 'grain', unlockLevel: 5,
      tags: ['grain', 'starch'], flavor: 'neutral' },
    { id: 'soybean', name: 'Soybeans', icon: '🫘', category: 'grain', unlockLevel: 10,
      tags: ['legume', 'protein'], flavor: 'nutty' },
    { id: 'barley', name: 'Barley', icon: '🌾', category: 'grain', unlockLevel: 12,
      tags: ['grain'], flavor: 'malty' },
    { id: 'rye-bread', name: 'Rye Bread', icon: '🍞', category: 'grain', unlockLevel: 8,
      tags: ['grain', 'bread'], flavor: 'sour' },

    // ─── Salt ────────────────────────────────────────────
    { id: 'sea-salt', name: 'Sea Salt', icon: '🧂', category: 'salt', unlockLevel: 1,
      tags: ['salt', 'mineral'], flavor: 'salty' },
    { id: 'rock-salt', name: 'Rock Salt', icon: '🧂', category: 'salt', unlockLevel: 1,
      tags: ['salt', 'mineral'], flavor: 'salty' },
    { id: 'korean-coarse-salt', name: 'Korean Coarse Salt', icon: '🧂', category: 'salt', unlockLevel: 3,
      tags: ['salt', 'korean'], flavor: 'salty' },

    // ─── Sweeteners ──────────────────────────────────────
    { id: 'sugar', name: 'White Sugar', icon: '🧊', category: 'sugar', unlockLevel: 6,
      tags: ['sweetener'], flavor: 'sweet' },
    { id: 'brown-sugar', name: 'Brown Sugar', icon: '🟫', category: 'sugar', unlockLevel: 7,
      tags: ['sweetener', 'molasses'], flavor: 'sweet-caramel' },
    { id: 'honey', name: 'Honey', icon: '🍯', category: 'sugar', unlockLevel: 8,
      tags: ['sweetener', 'natural'], flavor: 'sweet-floral' },
    { id: 'piloncillo', name: 'Piloncillo', icon: '🟫', category: 'sugar', unlockLevel: 8,
      tags: ['sweetener', 'mexican'], flavor: 'sweet-smoky' },

    // ─── Spices & Herbs ──────────────────────────────────
    { id: 'chili-flakes', name: 'Chili Flakes', icon: '🌶️', category: 'spice', unlockLevel: 3,
      tags: ['spice', 'hot', 'korean'], flavor: 'hot' },
    { id: 'gochugaru', name: 'Gochugaru', icon: '🌶️', category: 'spice', unlockLevel: 3,
      tags: ['spice', 'korean', 'essential'], flavor: 'sweet-hot' },
    { id: 'cumin', name: 'Cumin Seeds', icon: '🟤', category: 'spice', unlockLevel: 5,
      tags: ['spice', 'indian'], flavor: 'earthy' },
    { id: 'mustard-seed', name: 'Mustard Seeds', icon: '🟡', category: 'spice', unlockLevel: 4,
      tags: ['spice', 'indian'], flavor: 'pungent' },
    { id: 'turmeric', name: 'Turmeric', icon: '🟡', category: 'spice', unlockLevel: 5,
      tags: ['spice', 'indian'], flavor: 'earthy-bitter' },
    { id: 'cinnamon', name: 'Cinnamon', icon: '🟫', category: 'spice', unlockLevel: 7,
      tags: ['spice', 'sweet'], flavor: 'warm-sweet' },
    { id: 'dill', name: 'Dill', icon: '🌿', category: 'spice', unlockLevel: 2,
      tags: ['herb', 'european'], flavor: 'fresh' },
    { id: 'coriander', name: 'Coriander', icon: '🟢', category: 'spice', unlockLevel: 5,
      tags: ['herb', 'seed'], flavor: 'citrus' },
    { id: 'fish-sauce', name: 'Fish Sauce', icon: '🐟', category: 'spice', unlockLevel: 3,
      tags: ['umami', 'korean', 'fermented'], flavor: 'umami' },
    { id: 'rice-flour', name: 'Rice Flour Paste', icon: '🍚', category: 'spice', unlockLevel: 3,
      tags: ['thickener', 'korean'], flavor: 'neutral' },

    // ─── Cultures & Starters ─────────────────────────────
    { id: 'whey', name: 'Whey Starter', icon: '💧', category: 'culture', unlockLevel: 4,
      tags: ['starter', 'dairy'], flavor: 'tangy' },
    { id: 'kefir-grains', name: 'Kefir Grains', icon: '⚪', category: 'culture', unlockLevel: 7,
      tags: ['starter', 'symbiotic'], flavor: 'tangy' },
    { id: 'scoby', name: 'SCOBY', icon: '🟠', category: 'culture', unlockLevel: 9,
      tags: ['starter', 'symbiotic', 'tea'], flavor: 'vinegary' },
    { id: 'koji', name: 'Koji (Aspergillus)', icon: '🍄', category: 'culture', unlockLevel: 12,
      tags: ['starter', 'mold', 'japanese'], flavor: 'sweet-umami' },
    { id: 'yogurt-starter', name: 'Yogurt Culture', icon: '🫧', category: 'culture', unlockLevel: 4,
      tags: ['starter', 'dairy'], flavor: 'tangy' },
    { id: 'ginger-bug', name: 'Ginger Bug', icon: '🫧', category: 'culture', unlockLevel: 6,
      tags: ['starter', 'wild', 'carbonation'], flavor: 'spicy-sweet' },
    { id: 'wild', name: 'Wild Fermentation', icon: '🌿', category: 'culture', unlockLevel: 1,
      tags: ['wild', 'natural'], flavor: 'variable' },

    // ─── Liquids ─────────────────────────────────────────
    { id: 'water', name: 'Filtered Water', icon: '💧', category: 'liquid', unlockLevel: 1,
      tags: ['base', 'neutral'], flavor: 'neutral' },
    { id: 'black-tea', name: 'Black Tea', icon: '🍵', category: 'liquid', unlockLevel: 9,
      tags: ['tea', 'caffeine'], flavor: 'tannic' },
    { id: 'green-tea', name: 'Green Tea', icon: '🍵', category: 'liquid', unlockLevel: 10,
      tags: ['tea', 'caffeine', 'delicate'], flavor: 'grassy' },
    { id: 'brine', name: 'Prepared Brine', icon: '💧', category: 'liquid', unlockLevel: 2,
      tags: ['salt-water', 'base'], flavor: 'salty' },
  ],

  // Get ingredients available at a given player level
  getAvailable(playerLevel) {
    return this.items.filter(i => i.unlockLevel <= playerLevel);
  },

  getById(id) {
    return this.items.find(i => i.id === id);
  },

  getByCategory(category) {
    return this.items.filter(i => i.category === category);
  },

  getByTag(tag) {
    return this.items.filter(i => i.tags.includes(tag));
  }
};
