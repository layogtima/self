/**
 * FERMENT — Tier 1: Beginner Recipes
 * "Literally Just Add Salt"
 * All recipes tested for Bengaluru ingredient availability and ~25°C ambient temp.
 */

window.__fermentRecipes = window.__fermentRecipes || [];
window.__fermentRecipes.push(

  // ─── 1. SAUERKRAUT ──────────────────────────────────────────────────────────
  {
    id: 'sauerkraut-classic',
    slug: 'sauerkraut-classic',
    name: 'Sauerkraut',
    nameLocal: 'Sauerkohlraum',
    nameRomanized: null,
    subtitle: 'Germany\'s tangy winter staple',
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
    totalTimeHuman: '2–4 weeks',
    blrNote: 'Cabbage is available year-round at KR Market or any sabziwala. At Bengaluru\'s 25°C, ferments in ~14 days.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Cabbage', nameLocal: 'Kobi / Patta Gobhi', amount: 1, unit: 'medium head (~1kg)', unitMetric: '1kg', category: 'produce', essential: true, substitutions: ['Red cabbage (same method, purple colour)'], localAvailability: { IN: { ease: 'easy', where: 'Any sabziwala or KR Market' } } },
      { name: 'Non-iodised salt', nameLocal: 'Saindhav Namak / Rock Salt', amount: 20, unit: 'g', unitMetric: '20g', category: 'salt', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana store — avoid iodised table salt, it inhibits fermentation' } } }
    ],
    equipment: [
      { name: 'Large glass jar (1L+)', essential: true, notes: 'Bisleri jars work well' },
      { name: 'Weight or small zip-lock bag filled with brine', essential: true, notes: 'To keep cabbage submerged' }
    ],
    tldr: 'Shred cabbage, add salt, massage until it weeps, pack tight, wait. Two ingredients. Maximum bacteria.',
    steps: [
      { step: 1, title: 'Shred', instruction: 'Quarter the cabbage. Remove the outer leaves (keep them). Shred finely — 3–4mm strips. A sharp knife works; a mandoline is faster.', duration: '10 min', tips: ['Thinner shreds ferment faster and more evenly'], checkpoint: 'Pile of thin cabbage strips' },
      { step: 2, title: 'Salt & massage', instruction: 'Weigh the cabbage. Add 2% of that weight in salt. Massage firmly for 5–10 minutes until the cabbage releases enough liquid to cover itself.', duration: '10 min', tips: ['Don\'t rush this — the brine you create is the fermentation environment', 'At BLR temperatures it releases liquid quickly'], checkpoint: 'Cabbage is limp and swimming in its own brine' },
      { step: 3, title: 'Pack the jar', instruction: 'Pack the cabbage tightly into your jar, pressing down so brine rises above the cabbage. Use a reserved outer leaf folded on top to keep shreds submerged. Weigh down.', duration: '5 min', tips: ['Leave 3–4cm headspace — it will bubble'], checkpoint: 'Cabbage fully submerged under brine' },
      { step: 4, title: 'Ferment', instruction: 'Cover loosely with a cloth secured with a rubber band. Keep at room temperature away from direct sun. Taste daily from day 7. Ready when it\'s pleasantly sour (typically 14 days at BLR temps).', duration: '14–28 days', tips: ['In Bengaluru\'s warmth, check from day 7 — it moves faster than European recipes suggest', 'Skim any white film (kahm yeast) — harmless, just aesthetics'], checkpoint: 'Tastes tangy-sour with no off smells' },
      { step: 5, title: 'Refrigerate', instruction: 'Once happy with the sourness, seal the jar and refrigerate. Fermentation slows dramatically but continues.', duration: null, tips: ['Keeps for 3+ months in the fridge'], checkpoint: 'Jar is cold and sealed' }
    ],
    images: { hero: null, heroAttribution: null },
    culturalContext: {
      story: 'Sauerkraut predates refrigeration by centuries. For Central Europeans, it was the survival vegetable — made in autumn, eaten through winter, and credited with keeping sailors alive on long voyages. Every family had their own technique, their own timing, their own idea of how sour is "right."',
      historicalNote: 'Fermented cabbage has independent origins across Eurasia — Chinese workers on the Great Wall fermented cabbage in rice wine 2000 years ago. The salt-only European method emerged around the 15th century.',
      significance: 'Sauerkraut is the gateway ferment for most people in the Western world. Two ingredients, no special equipment, no culture required. If you can make this, you understand the basic principle behind almost everything in fermentation.',
      relatedTraditions: ['Kimchi (Korean)', 'Suan cai (Chinese pickled cabbage)', 'Curtido (Salvadoran)'],
      funFact: 'German sailors brought barrels of sauerkraut on voyages as a vitamin C source — long before anyone knew what vitamins were. Captain Cook carried it on his Pacific voyages.'
    },
    thingsToAccountFor: [
      { title: 'White film on surface', description: 'Kahm yeast — looks alarming, is harmless. Skim it off with a spoon. NOT mould (mould is fuzzy and coloured).', severity: 'info', appliesTo: ['all'] },
      { title: 'Iodised salt kills fermentation', description: 'Use rock salt, sea salt, or any non-iodised salt. Iodine is an antimicrobial — it will suppress the bacteria you\'re trying to grow.', severity: 'important', appliesTo: ['all'] },
      { title: 'BLR humidity in monsoon', description: 'June–September, ambient humidity is high. Fermentation stays reliable but keep jars away from excess moisture. Check more frequently.', severity: 'info', appliesTo: ['blr'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Drain thoroughly, spread on trays, dehydrate at 40°C for 8–12 hours.',
      result: 'Crunchy sauerkraut chips — intensely sour, great on dal or as a snack.',
      shelfLife: '6+ months airtight',
      tips: ['Very sour sauerkraut makes better chips than mild', 'The smell while dehydrating is powerful — open the windows']
    },
    variations: [
      { name: 'Caraway sauerkraut', description: 'Add 1 tsp caraway seeds during packing. Earthy, traditional German profile.', region: 'Germany' },
      { name: 'Ginger-turmeric sauerkraut', description: 'Add 1 tbsp fresh ginger + 1 tsp turmeric. BLR pantry-friendly, anti-inflammatory.', region: 'Fusion' },
      { name: 'Red cabbage kraut', description: 'Same method, purple cabbage. Vivid colour, slightly sweeter.', region: 'Modern' }
    ],
    relatedRecipes: ['kimchi-baechu', 'curtido-salvadoran'],
    tags: ['beginner', 'two-ingredient', 'probiotic', 'european', 'year-round', 'vegan'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Sauerkraut — Wikipedia', url: 'https://en.wikipedia.org/wiki/Sauerkraut', license: 'CC BY-SA' }]
  },

  // ─── 2. DAHI (YOGURT) ────────────────────────────────────────────────────────
  {
    id: 'dahi-homemade',
    slug: 'dahi-homemade',
    name: 'Dahi',
    nameLocal: 'ದಹಿ / दही',
    nameRomanized: 'Dahi',
    subtitle: 'The original Indian live culture ferment',
    category: 'dairy',
    subcategory: 'yogurt',
    technique: 'culture',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    culturalGroup: 'Pan-Indian',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '10 min',
    fermentTimeMin: 6,
    fermentTimeMax: 12,
    fermentTimeUnit: 'hours',
    totalTimeHuman: '6–12 hours (overnight)',
    blrNote: 'Bengaluru\'s warmth is ideal — set it in the evening, have fresh dahi by morning. Use full-fat milk from any dairy or Nandini.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Full-fat milk', nameLocal: 'Halu / Doodh', amount: 1, unit: 'litre', unitMetric: '1L', category: 'dairy', essential: true, substitutions: ['Low-fat milk (thinner dahi)', 'A2 milk (richer flavour)'], localAvailability: { IN: { ease: 'easy', where: 'Any dairy, Nandini booths, or supermarket' } } },
      { name: 'Existing dahi (starter)', nameLocal: 'Haalu Mosaru', amount: 2, unit: 'tbsp', unitMetric: '30g', category: 'culture', essential: true, substitutions: ['Any store-bought live-culture yogurt'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana or use your last batch' } } }
    ],
    equipment: [
      { name: 'Heavy-bottomed pot', essential: true, notes: 'For heating milk evenly' },
      { name: 'Wide ceramic or steel container', essential: true, notes: 'For setting the dahi — wide surface = faster setting' }
    ],
    tldr: 'Heat milk, cool to warm, stir in a spoon of last batch, leave overnight. Wake up to dahi. Repeat forever.',
    steps: [
      { step: 1, title: 'Heat the milk', instruction: 'Bring milk to a full boil, stirring occasionally. This kills competing bacteria and partially denatures proteins for a thicker set.', duration: '10 min', tips: ['Don\'t skip boiling — it\'s what makes Indian dahi different from Western yogurt'], checkpoint: 'Milk has come to a rolling boil' },
      { step: 2, title: 'Cool to the right temperature', instruction: 'Let milk cool to 40–45°C. The old test: dip your clean finger — it should feel warm but not burn. If you can hold your finger comfortably for 5 seconds, it\'s right.', duration: '30–40 min', tips: ['Too hot kills the culture. Too cold and it won\'t set.', 'In BLR, this usually takes 35–40 min at room temp'], checkpoint: 'Milk feels comfortably warm on your wrist' },
      { step: 3, title: 'Add starter', instruction: 'Put your 2 tbsp of dahi into the setting vessel. Add a small amount of warm milk and whisk smooth, then pour in the rest of the milk. Stir gently.', duration: '2 min', tips: ['Mix starter smooth first to avoid lumps in the final dahi'], checkpoint: 'Starter is evenly distributed' },
      { step: 4, title: 'Set overnight', instruction: 'Cover loosely. Leave undisturbed in a warm spot. In Bengaluru\'s climate, room temperature is sufficient — no need to wrap in towels. Check after 6–8 hours.', duration: '6–12 hours', tips: ['Don\'t move or jostle the container while it\'s setting', 'In cooler BLR winter months (Dec–Jan), place near the stove or in a closed cupboard'], checkpoint: 'Dahi has set — tilting the container shows a solid mass' },
      { step: 5, title: 'Refrigerate', instruction: 'Once set, refrigerate. It will firm up further and sourness will develop slowly over the next day.', duration: null, tips: ['Save 2 tbsp from this batch as your next starter'], checkpoint: 'Firm, creamy, pleasantly tangy' }
    ],
    images: { hero: null, heroAttribution: null },
    culturalContext: {
      story: 'Dahi has been made in the Indian subcontinent for at least 5000 years. It appears in the Rigveda, in Ayurvedic texts, in every regional cuisine. It is simultaneously medicine, comfort food, religious offering, and daily nutrition. Each household maintains a living culture passed through generations — sometimes decades old.',
      historicalNote: 'The practice of setting dahi is considered sacred in many households. The culture is treated as a living thing — it is "fed" new milk and ideally never allowed to die out. Some families maintain the same culture for generations.',
      significance: 'In Bengaluru, dahi (mosaru in Kannada) is foundational. Curd rice (mosaranna) is the ultimate comfort meal. Majjige (spiced buttermilk) is the summer survival drink. Raita accompanies almost every meal. Making your own dahi means you understand the live culture principle that underlies all dairy fermentation.',
      relatedTraditions: ['Labneh (strained yogurt, Middle East)', 'Skyr (Icelandic)', 'Crème fraîche (French)'],
      funFact: 'The word "dahi" likely derives from Sanskrit "dadhi," one of the five products of the cow considered sacred in Hindu texts. The other four: milk, ghee, butter, and cow urine.'
    },
    thingsToAccountFor: [
      { title: 'Culture quality degrades', description: 'If you\'ve been using the same starter for many generations without refreshing from a new source, the culture weakens. If dahi stops setting properly, start fresh from a good store-bought yogurt.', severity: 'info', appliesTo: ['all'] },
      { title: 'Summer sourness', description: 'In hot weather, dahi sets faster and becomes more sour. Check earlier (4–5 hours) and refrigerate promptly.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Watery layer on top', description: 'Whey separation is normal and healthy — it means fermentation worked. Stir it back in or drain it off (whey is nutritious, use in cooking).', severity: 'info', appliesTo: ['all'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Spread strained dahi (labneh-style) thinly on parchment. Dehydrate at 45°C for 10–14 hours.',
      result: 'Yogurt powder — adds probiotics and tang to smoothies, raitas, or dry rubs.',
      shelfLife: '2–3 months in airtight container',
      tips: ['Strain whey first for faster dehydration', 'Add salt + herbs before dehydrating for flavoured yogurt chips']
    },
    variations: [
      { name: 'Shrikhand', description: 'Hang dahi in muslin cloth overnight, then whip with sugar, cardamom, and saffron. Maharashtrian/Gujarati festive dessert.', region: 'Western India' },
      { name: 'Labneh', description: 'Same strained hung curd concept, but finish with olive oil and zaatar. Middle Eastern pantry staple.', region: 'Levant' },
      { name: 'Coconut milk dahi', description: 'Replace dairy with full-fat coconut milk (Maggi or homemade). Vegan, works with same culture. Slightly looser set.', region: 'South India / Fusion' }
    ],
    relatedRecipes: ['majjige-buttermilk', 'milk-kefir'],
    tags: ['beginner', 'daily', 'probiotic', 'south-asian', 'year-round', 'vegetarian'],
    dietaryFlags: ['gluten-free', 'vegetarian'],
    veganAdaptable: true,
    containsAllergens: ['dairy'],
    sources: [{ title: 'Dahi — Wikipedia', url: 'https://en.wikipedia.org/wiki/Dahi_(curd)', license: 'CC BY-SA' }]
  },

  // ─── 3. GINGER BUG ───────────────────────────────────────────────────────────
  {
    id: 'ginger-bug-starter',
    slug: 'ginger-bug-starter',
    name: 'Ginger Bug',
    nameLocal: null,
    nameRomanized: null,
    subtitle: 'Wild-fermented ginger starter for natural sodas',
    category: 'starter',
    subcategory: 'wild-culture',
    technique: 'wild-ferment',
    region: 'Global',
    country: null,
    countryCode: null,
    culturalGroup: 'Traditional / Folk',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '5 min/day',
    fermentTimeMin: 3,
    fermentTimeMax: 7,
    fermentTimeUnit: 'days',
    totalTimeHuman: '3–7 days to activate',
    blrNote: 'Bengaluru is exceptional for ginger bugs — fresh ginger from KR Market or any sabziwala is cheap and loaded with wild yeasts. At BLR temps, expect a healthy bug in 3–4 days. Use it to carbonate homemade sodas — lemon soda, kokum soda, sugarcane soda.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Fresh ginger (unpeeled)', nameLocal: 'Adrak / Shunti', amount: 3, unit: 'tbsp grated (daily)', unitMetric: '~45g/day', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any sabziwala or KR Market — ₹20–40 per 100g' } } },
      { name: 'Sugar', nameLocal: 'Cheeni', amount: 3, unit: 'tbsp (daily)', unitMetric: '~45g/day', category: 'sweetener', essential: true, substitutions: ['Jaggery (adds complexity)', 'Coconut sugar'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana store' } } },
      { name: 'Unchlorinated water', nameLocal: null, amount: 2, unit: 'cups (for jar)', unitMetric: '500ml', category: 'liquid', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Use filtered or boiled-and-cooled water. Tap water chlorine can inhibit wild yeasts.' } } }
    ],
    equipment: [
      { name: 'Glass jar (500ml+)', essential: true, notes: 'Wide mouth preferred' },
      { name: 'Cloth or loose lid', essential: true, notes: 'Needs to breathe — don\'t seal airtight' }
    ],
    tldr: 'Grated ginger + sugar + water. Feed daily. It starts bubbling. Now you have a wild yeast starter you can use to naturally carbonate any sweet liquid.',
    steps: [
      { step: 1, title: 'Start the jar', instruction: 'In a clean jar, combine 500ml unchlorinated water, 2 tbsp grated unpeeled ginger, and 2 tbsp sugar. Stir well. Cover with a cloth. Leave at room temperature.', duration: '5 min', tips: ['Unpeeled ginger has more wild yeast on the skin', 'Dechlorinate tap water by leaving it uncovered overnight'], checkpoint: 'Jar is cloudy with ginger bits' },
      { step: 2, title: 'Feed daily', instruction: 'Every day for 3–7 days, add 1 tbsp fresh grated ginger and 1 tbsp sugar. Stir vigorously and re-cover.', duration: '2 min/day', tips: ['Vigorous stirring incorporates oxygen and helps wild yeast populate faster'], checkpoint: 'Bubbles start appearing after day 2–3 in BLR' },
      { step: 3, title: 'Watch for activity', instruction: 'Your bug is ready when it\'s actively bubbling, smells yeasty-gingery, and fizzes when stirred. In Bengaluru, typically 3–4 days. Taste — it should be slightly fizzy, tangy-sweet.', duration: null, tips: ['Don\'t refrigerate until active — cold slows wild yeast capture'], checkpoint: 'Consistent bubbling within minutes of stirring, fizzy taste' },
      { step: 4, title: 'Maintain or use', instruction: 'Use ¼ cup of bug to ferment 1 litre of sweet liquid (ginger ale, lemon soda, etc.) for 2–3 days. Replenish what you used with water + ginger + sugar. Keep feeding to maintain indefinitely.', duration: 'Ongoing', tips: ['Refrigerate and feed once a week if not using often', 'Bring back to room temp and feed daily for 2 days before using from the fridge'], checkpoint: 'Bug is a perpetual fermentation engine' }
    ],
    images: { hero: null, heroAttribution: null },
    culturalContext: {
      story: 'Before commercial yeast and carbonation, people around the world maintained wild ferment starters to make fizzy drinks. The ginger bug is the simplest version — a living community of wild yeasts and bacteria captured from ginger\'s skin, sustained by sugar, used to naturally carbonate homemade sodas.',
      historicalNote: 'Traditional ginger beer (not the commercial version) was made this way in 18th and 19th century Britain. The "ginger beer plant" was a symbiotic community of yeast and bacteria kept alive for years and traded between households.',
      significance: 'The ginger bug is a gateway to natural carbonation. Once you have a healthy bug, you can turn any sweet liquid — fruit juice, herbal tea, kokum water, sugarcane juice — into a naturally fizzy probiotic drink. It\'s the South Asian equivalent of maintaining a sourdough starter.',
      relatedTraditions: ['Ginger beer plant (British)', 'Tepache (Mexican)', 'Kanji (Indian)'],
      funFact: 'The "ginger beer plant" was so prized in Victorian England that people traded it like a pet, giving portions to friends and family. Its actual microbial composition — a specific yeast (Saccharomyces florentinus) and bacteria (Lactobacillus) — was only identified in the 1980s.'
    },
    thingsToAccountFor: [
      { title: 'Won\'t start if water is chlorinated', description: 'Tap water chlorine kills wild yeast. Boil and cool, or leave overnight uncovered to dechlorinate before using.', severity: 'important', appliesTo: ['all'] },
      { title: 'Mould vs. yeast foam', description: 'White bubbles and foam = good yeast activity. Fuzzy coloured growth = mould. If you see mould, discard and start again.', severity: 'important', appliesTo: ['all'] },
      { title: 'Very fast in BLR heat', description: 'At 28–30°C in summer, your bug can become very active within 48 hours. Taste before using — if very sour, it\'s over-fermented. Use less and top up sugar.', severity: 'info', appliesTo: ['blr'] }
    ],
    dehydratorIntegration: {
      applicable: false,
      method: null,
      result: null,
      shelfLife: null,
      tips: []
    },
    variations: [
      { name: 'Turmeric Bug', description: 'Substitute half the ginger with fresh turmeric root. Same method. Adds anti-inflammatory compounds and a golden colour to sodas.', region: 'Fusion / South India' },
      { name: 'Kokum Ginger Soda', description: 'Use ¼ cup active bug to ferment 1L kokum extract + jaggery syrup for 2 days. Naturally fizzy, deeply Konkan.', region: 'Maharashtra / Karnataka coast' },
      { name: 'Lemon Ginger Ale', description: 'Dissolve 100g sugar in 1L water, add ginger bug and fresh lime juice. Bottle and leave 2–3 days. Classic natural soda.', region: 'Global' }
    ],
    relatedRecipes: ['tepache-pineapple', 'kanji-rice'],
    tags: ['beginner', 'starter', 'soda', 'wild-ferment', 'year-round', 'vegan', 'blr-friendly'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Ginger beer plant — Wikipedia', url: 'https://en.wikipedia.org/wiki/Ginger_beer_plant', license: 'CC BY-SA' }]
  },

  // ─── 4. CURTIDO ──────────────────────────────────────────────────────────────
  {
    id: 'curtido-salvadoran',
    slug: 'curtido-salvadoran',
    name: 'Curtido',
    nameLocal: 'Curtido',
    nameRomanized: null,
    subtitle: 'El Salvador\'s lightly fermented cabbage relish',
    category: 'vegetable',
    subcategory: 'cabbage',
    technique: 'dry-salt',
    region: 'Latin America',
    country: 'El Salvador',
    countryCode: 'SV',
    culturalGroup: 'Salvadoran',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '20 min',
    fermentTimeMin: 1,
    fermentTimeMax: 3,
    fermentTimeUnit: 'days',
    totalTimeHuman: '1–3 days',
    blrNote: 'All ingredients available at any BLR market. Quick ferment — ready in 24 hours. Pairs beautifully with rice, chapati, or as a side to any South Indian meal.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Cabbage', nameLocal: 'Kobi', amount: 500, unit: 'g, shredded', unitMetric: '500g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Carrot', nameLocal: 'Gajar', amount: 2, unit: 'medium, julienned', unitMetric: '200g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'White onion', nameLocal: 'Pyaz', amount: 1, unit: 'small, thinly sliced', unitMetric: '80g', category: 'produce', essential: false, substitutions: ['Red onion'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Dried oregano', nameLocal: 'Ajwain ke phool', amount: 1, unit: 'tsp', unitMetric: '2g', category: 'spice', essential: true, substitutions: ['Fresh oregano (2x amount)'], localAvailability: { IN: { ease: 'moderate', where: 'Supermarkets like More, Spar, or Nature\'s Basket. Or online.' } } },
      { name: 'Non-iodised salt', nameLocal: 'Rock salt', amount: 1.5, unit: 'tsp', unitMetric: '8g', category: 'salt', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana' } } },
      { name: 'White vinegar (optional)', nameLocal: 'Sirka', amount: 2, unit: 'tbsp', unitMetric: '30ml', category: 'liquid', essential: false, substitutions: ['Apple cider vinegar'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana or supermarket' } } }
    ],
    equipment: [
      { name: 'Large mixing bowl', essential: true, notes: null },
      { name: 'Glass jar or container with lid', essential: true, notes: '1 litre' }
    ],
    tldr: 'Shred cabbage and carrot, salt, massage, add oregano, pack. Ready in 24 hours. Eat with everything.',
    steps: [
      { step: 1, title: 'Shred the vegetables', instruction: 'Finely shred cabbage, julienne carrots, thinly slice onion. Combine in a large bowl.', duration: '15 min', tips: ['Uniform thin shreds ferment evenly'], checkpoint: 'Colourful pile of shredded veg' },
      { step: 2, title: 'Salt and massage', instruction: 'Sprinkle salt over the vegetables. Massage for 3–5 minutes until they soften and release liquid.', duration: '5 min', tips: ['It doesn\'t need to release as much liquid as sauerkraut — curtido is lighter'], checkpoint: 'Vegetables are wilted and moist' },
      { step: 3, title: 'Add flavour and pack', instruction: 'Add oregano and optional vinegar. Toss well. Pack tightly into a jar. Press down so liquid (and vinegar if using) covers the veg.', duration: '3 min', tips: ['Vinegar speeds the sour flavour but isn\'t needed if fermenting longer'], checkpoint: 'Packed jar with liquid visible' },
      { step: 4, title: 'Ferment briefly', instruction: 'Cover loosely. Leave at room temperature. In BLR, 24 hours gives a lightly sour, fresh curtido. 48–72 hours for more tang.', duration: '1–3 days', tips: ['Traditional Salvadoran curtido is only lightly fermented — it\'s not as sour as sauerkraut'], checkpoint: 'Smells fresh-sour, crisp when tasted' },
      { step: 5, title: 'Refrigerate and serve', instruction: 'Refrigerate when it reaches your preferred sourness. Keeps 2–3 weeks.', duration: null, tips: [], checkpoint: 'Crisp, tangy, vibrant' }
    ],
    images: { hero: null, heroAttribution: null },
    culturalContext: {
      story: 'Curtido is El Salvador\'s national condiment — an essential partner to pupusas (thick corn cakes stuffed with cheese, beans, or chicharrón). It\'s lighter and faster than sauerkraut by design: Salvadoran cuisine tends toward fresh, bright flavours rather than deeply soured preservation.',
      historicalNote: 'Central American fermented vegetables predate Spanish colonisation. Curtido as we know it evolved after European cabbage was introduced in the colonial period, blending indigenous preservation techniques with Old World vegetables.',
      significance: 'Curtido demonstrates that fermentation doesn\'t have to be long or intense to be valuable. Short ferments develop flavour and begin beneficial bacterial activity without crossing into strong sourness — ideal for people new to fermented foods.',
      relatedTraditions: ['Sauerkraut (German)', 'Kimchi (Korean)', 'Coleslaw (American — unfermented version)'],
      funFact: 'In El Salvador, no pupusa is considered complete without curtido and salsa roja. The combination is so standard that pupuserías serve both as automatically as a restaurant serves bread and butter in France.'
    },
    thingsToAccountFor: [
      { title: 'Very quick in BLR heat', description: 'At 25–30°C, curtido ferments quickly. Taste after 18 hours — you may find it\'s already at your preferred sourness.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Texture softens over time', description: 'The longer it ferments, the softer the texture. Traditional curtido retains some crunch — don\'t overferment if you prefer crispness.', severity: 'info', appliesTo: ['all'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Drain, spread thinly, dehydrate at 40°C for 6–8 hours.',
      result: 'Tangy vegetable flakes — crumble on rice or use as seasoning.',
      shelfLife: '3 months',
      tips: ['Better when only lightly fermented before dehydrating']
    },
    variations: [
      { name: 'Spiced curtido', description: 'Add sliced jalapeño or green chilli. A natural fit for Indian palates.', region: 'Fusion' },
      { name: 'Beet curtido', description: 'Add 1 small grated beetroot. Vivid pink colour, earthy sweetness.', region: 'Modern' }
    ],
    relatedRecipes: ['sauerkraut-classic', 'kimchi-baechu'],
    tags: ['beginner', 'quick', 'latin-american', 'vegan', 'year-round', 'condiment'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Curtido — Wikipedia', url: 'https://en.wikipedia.org/wiki/Curtido', license: 'CC BY-SA' }]
  },

  // ─── 5. KANJI ────────────────────────────────────────────────────────────────
  {
    id: 'kanji-rice',
    slug: 'kanji-rice',
    name: 'Kanji',
    nameLocal: 'ಕಂಜಿ / கஞ்சி',
    nameRomanized: 'Kanji / Ganji',
    subtitle: 'Fermented rice water — probiotic drink of the South',
    category: 'beverage',
    subcategory: 'fermented-grain',
    technique: 'wild-ferment',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    culturalGroup: 'South Indian / Pan-Asian',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '5 min',
    fermentTimeMin: 8,
    fermentTimeMax: 24,
    fermentTimeUnit: 'hours',
    totalTimeHuman: 'Overnight',
    blrNote: 'Zero-waste, zero-barrier. If you cook rice, you already have everything you need. At BLR temperatures, overnight fermentation is usually perfect — sour, slightly fizzy, deeply probiotic.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Cooked rice (leftover works perfectly)', nameLocal: 'Akki / Chawal', amount: 1, unit: 'cup', unitMetric: '150g', category: 'grain', essential: true, substitutions: ['Raw rice (cook very soft)', 'Ragi (finger millet) for ambali variant'], localAvailability: { IN: { ease: 'easy', where: 'You already have this. Every kitchen.' } } },
      { name: 'Water (cooled boiled or filtered)', nameLocal: null, amount: 3, unit: 'cups', unitMetric: '750ml', category: 'liquid', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any tap (use filtered)' } } },
      { name: 'Non-iodised salt (to serve)', nameLocal: 'Rock salt', amount: 0.5, unit: 'tsp', unitMetric: '3g', category: 'salt', essential: false, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana' } } }
    ],
    equipment: [
      { name: 'Clay pot (ideal) or glass jar', essential: true, notes: 'Clay pots impart minerals and improve flavour; any container works' },
      { name: 'Cloth cover', essential: false, notes: 'Loose cover — it needs to breathe' }
    ],
    tldr: 'Add water to leftover rice. Leave overnight. Drink in the morning with salt. Your gut will thank you.',
    steps: [
      { step: 1, title: 'Prepare the base', instruction: 'Place cooked rice in a clay pot or glass jar. Add 3 cups of cooled water (room temperature — not cold from the fridge).', duration: '2 min', tips: ['More water = thinner, more drinkable kanji. Less water = porridge-style ambali.'], checkpoint: 'Rice submerged in water' },
      { step: 2, title: 'Ferment overnight', instruction: 'Cover loosely with a cloth. Leave at room temperature. Bengaluru nights (18–22°C in winter, 24–26°C in summer) are ideal. Ferment for 8–16 hours.', duration: '8–16 hours', tips: ['In summer, 8 hours is usually sufficient. In cooler months, go longer.', 'Traditional households use the same clay pot daily — the absorbed cultures speed up fermentation over time.'], checkpoint: 'Smells slightly sour and tangy in the morning' },
      { step: 3, title: 'Serve', instruction: 'Stir well. Add salt to taste. Serve as a morning drink (strain for liquid-only) or eat as a soft porridge. Traditional accompaniments: pickle, raw onion, papad.', duration: null, tips: ['The water is more probiotic than the rice — don\'t discard it', 'Add buttermilk for extra richness (traditional in Tamil Nadu and Karnataka)'], checkpoint: 'Pleasantly sour, refreshing, slightly effervescent' }
    ],
    images: { hero: null, heroAttribution: null },
    culturalContext: {
      story: 'Kanji is one of the oldest fermented foods in South and Southeast Asia. Before modern nutrition science, rural communities understood intuitively that fermented rice water was restorative — given to the sick, the weak, the recovering. It appears in Ayurvedic texts as a digestive and is still the first food offered to patients recovering from illness in many South Indian households.',
      historicalNote: 'The practice of fermenting rice water appears across South Asia, Southeast Asia, China, Japan (amazake), and Korea (sikhye). The South Indian and Sri Lankan tradition of overnight kanji is among the simplest variants — no cooking required if using leftover rice.',
      significance: 'Kanji represents the fermentation philosophy at its most elemental: don\'t discard, transform. Leftover rice + water + time = a living probiotic drink. It\'s also deeply egalitarian — this is not cuisine that requires money or equipment. It is the everyday ferment of every household.',
      relatedTraditions: ['Congee / Juk (East Asian fermented rice porridge)', 'Ambali (ragi kanji, Karnataka)', 'Pozol (Mexican fermented corn drink)', 'Amazake (Japanese sweet rice drink)'],
      funFact: 'A 2019 study in Frontiers in Microbiology documented over 200 strains of beneficial bacteria and wild yeasts in traditional South Indian fermented rice water. The diversity rivals commercial probiotic supplements at ₹0 additional cost.'
    },
    thingsToAccountFor: [
      { title: 'Over-fermentation in summer', description: 'At BLR summer temperatures (28–32°C), kanji can become very sour within 8 hours. Taste before the full fermentation period and stop when you like it.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Pink or orange discolouration', description: 'If the kanji turns pink, orange, or develops an off smell, discard. This indicates contamination. Use cleaner equipment and fresh water next time.', severity: 'important', appliesTo: ['all'] }
    ],
    dehydratorIntegration: {
      applicable: false,
      method: null,
      result: null,
      shelfLife: null,
      tips: []
    },
    variations: [
      { name: 'Ragi Ambali', description: 'Use finger millet (ragi) flour instead of rice. Cook into a thin porridge, ferment overnight. A Karnataka staple — more nutritious, slightly more complex.', region: 'Karnataka, India' },
      { name: 'Spiced Kanji', description: 'Add curry leaves, green chilli, ginger to the fermented kanji. Heat briefly (don\'t boil — kills cultures). Or serve raw with the same additions.', region: 'Kerala / Tamil Nadu' },
      { name: 'Sweet Kanji', description: 'Add jaggery and cardamom instead of salt. Dessert kanji — fermented grain sweetened with unrefined sugar. Served warm.', region: 'Kerala' }
    ],
    relatedRecipes: ['dahi-homemade', 'idli-dosa-batter'],
    tags: ['beginner', 'zero-waste', 'probiotic', 'south-indian', 'year-round', 'vegan', 'blr-friendly'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [
      { title: 'Kanji (food) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Kanji_(food)', license: 'CC BY-SA' },
      { title: 'Fermented Rice Water Microbial Diversity, Frontiers in Microbiology, 2019', url: 'https://www.frontiersin.org/articles/10.3389/fmicb.2019.02369/full', license: 'Open Access' }
    ]
  }

); // end tier 1
