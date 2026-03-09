/**
 * FERMENT — Recipe Database
 * Minimal stub for initial deployment. Full recipes coming soon!
 */

const FermentRecipes = {
  getAll() {
    return [
      {
        id: 'sauerkraut-classic',
        slug: 'sauerkraut-classic',
        name: 'Sauerkraut',
        nameLocal: null,
        nameRomanized: null,
        subtitle: 'Germany\'s tangy classic',
        category: 'vegetable',
        subcategory: 'cabbage',
        technique: 'dry-salt',
        region: 'Europe',
        country: 'Germany',
        countryCode: 'DE',
        culturalGroup: 'German',
        difficulty: 1,
        tier: 'beginner',
        tierLabel: 'Literally Just Add Salt',
        prepTime: '15 min',
        fermentTimeMin: 14,
        fermentTimeMax: 28,
        fermentTimeUnit: 'days',
        totalTimeHuman: '2-4 weeks',
        seasonality: ['autumn', 'winter'],
        ingredients: [
          { name: 'Cabbage', nameLocal: null, amount: 1, unit: 'head (~1kg)', unitMetric: '1kg', category: 'produce', essential: true, substitutions: [], localAvailability: { US: { ease: 'easy', where: 'Any supermarket' }, IN: { ease: 'easy', where: 'Any market' } } },
          { name: 'Sea Salt', nameLocal: null, amount: 20, unit: 'g', unitMetric: '20g', category: 'salt', essential: true, substitutions: [], localAvailability: { US: { ease: 'easy', where: 'Any supermarket' }, IN: { ease: 'easy', where: 'Any market' } } }
        ],
        equipment: [
          { name: 'Large jar', essential: true, notes: 'At least 1 liter' },
          { name: 'Weight or plate', essential: true, notes: 'To keep cabbage submerged' }
        ],
        tldr: 'Shred cabbage, salt it, pack it, wait. That\'s it. You\'re German now (culturally, anyway).',
        steps: [
          {
            step: 1,
            title: 'Prepare cabbage',
            instruction: 'Remove outer leaves. Shred the cabbage finely. Keep outer leaves for later.',
            duration: '10 min',
            tips: ['Use a sharp knife or mandoline'],
            checkpoint: 'Cabbage is in bite-sized shreds'
          },
          {
            step: 2,
            title: 'Salt and massage',
            instruction: 'Place shredded cabbage in a bowl. Sprinkle salt (2% of cabbage weight). Massage for 5-10 minutes until liquid releases.',
            duration: '10 min',
            tips: ['Your hands are the best tool'],
            checkpoint: 'Cabbage releases enough brine to cover itself'
          },
          {
            step: 3,
            title: 'Pack the jar',
            instruction: 'Pack salted cabbage tightly into jar. Press down so brine covers everything. Use reserved outer leaves to keep shreds submerged. Weigh down with plate or glass.',
            duration: '5 min',
            tips: ['Leave 2 inches of headspace for bubbling'],
            checkpoint: 'Cabbage is fully submerged under brine'
          },
          {
            step: 4,
            title: 'Ferment',
            instruction: 'Cover loosely (use cloth or paper towel secured with rubber band). Leave at room temperature. Check daily. Taste after 1 week. Ready when you like the sourness (1-4 weeks).',
            duration: '1-4 weeks',
            tips: ['Burp daily if using sealed lid to release CO2', 'Cooler temps = slower fermentation'],
            checkpoint: 'Tastes pleasantly sour'
          },
          {
            step: 5,
            title: 'Store',
            instruction: 'Transfer to refrigerator. Keeps for months. Enjoy!',
            duration: null,
            tips: ['Refrigeration slows fermentation dramatically'],
            checkpoint: 'Jar is cold and closed'
          }
        ],
        images: { hero: null, heroAttribution: null },
        culturalContext: {
          story: 'Sauerkraut is the soul of German and Eastern European cuisine. For centuries, it was the winter vegetable — preserved at harvest, eaten through cold months. Every family had their own method. Some made it sharp and sour. Others kept it mild. Today, it\'s recognized globally as the gateway ferment.',
          historicalNote: 'While fermented cabbage exists in many cultures (think: kimchi, suan cai), sauerkraut became iconic in Central Europe around the 15th century.',
          significance: 'More than food, sauerkraut is identity. German sailors brought it on long voyages to prevent scurvy (vitamin C!). It sustained populations through brutal winters.',
          relatedTraditions: ['Kimjang (Korean cabbage-making tradition)', 'Turnip fermentation festivals'],
          funFact: 'Sauerkraut is SO important to German culture that the term "sauerkraut" is considered outdated by some Germans who prefer "Sauerkohl" or just "Kraut." Language evolves, but fermentation endures.'
        },
        thingsToAccountFor: [
          {
            title: 'Kahm yeast (white film)',
            description: 'You might see a white fuzzy layer on top. This is harmless kahm yeast. Just skim it off. NOT the same as mold.',
            severity: 'info',
            appliesTo: ['all']
          },
          {
            title: 'Jar explosion risk',
            description: 'If using a sealed jar without burping, CO2 builds up. Either burp daily or use an airlock lid. Pressure is real.',
            severity: 'important',
            appliesTo: ['all']
          },
          {
            title: 'Temperature matters',
            description: 'At 20°C (68°F), fermentation takes ~3-4 weeks. At 25°C (77°F), it goes faster (~2-3 weeks). At 15°C (59°F), it\'s slow (~6-8 weeks). Plan accordingly.',
            severity: 'info',
            appliesTo: ['all']
          }
        ],
        dehydratorIntegration: {
          applicable: true,
          method: 'Drain sauerkraut thoroughly. Spread on dehydrator trays. Dehydrate at 40°C (105°F) for 8-12 hours until crispy.',
          result: 'Sauerkraut chips — crunchy, tangy, intensely flavored.',
          shelfLife: '6+ months in airtight container',
          tips: ['The smell during dehydration is... assertive. Open a window.', 'Over-fermented (very sour) sauerkraut makes THE BEST chips.']
        },
        variations: [
          { name: 'Caraway Sauerkraut', description: 'Add caraway seeds during fermentation. Traditional German flavor.', region: 'Germany' },
          { name: 'Rainbow Sauerkraut', description: 'Mix red and green cabbage. Same method. Beautiful colors persist.', region: 'Modern fusion' },
          { name: 'Turmeric-Ginger Sauerkraut', description: 'Add fresh ginger slices and turmeric during fermentation. Spiced warmth.', region: 'Fusion' }
        ],
        relatedRecipes: ['kimchi-traditional', 'suan-cai'],
        tags: ['beginner', 'iconic', 'two-ingredient', 'winter', 'european', 'probiotic'],
        dietaryFlags: ['gluten-free', 'vegan'],
        veganAdaptable: true,
        containsAllergens: [],
        sources: [
          { title: 'Sauerkraut on Wikipedia', url: 'https://en.wikipedia.org/wiki/Sauerkraut', license: 'CC BY-SA' }
        ]
      }
    ];
  }
};
