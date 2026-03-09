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
    images: { hero: 'https://images.unsplash.com/photo-1612257999756-196703081a0e?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Anshu A on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=snxb_PSe3Ps', title: 'Brad Makes Sauerkraut', channel: 'Bon Appétit — It\'s Alive' },
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
    images: { hero: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Sara Cervera on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=_0hhMPSqY_c', title: 'How to Make Thick Curd / Dahi at Home', channel: 'Hebbar\'s Kitchen' },
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
    images: { hero: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Mockup Graphics on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=AN_lCyc7D64', title: '3 Ingredient Homemade Fermented Ginger Beer', channel: 'Joshua Weissman' },
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
    images: { hero: 'https://images.unsplash.com/photo-1625938145744-e380515399bf?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Brooke Lark on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=jHcKFRsaPZI', title: 'How to Make Curtido — Salvadoran Fermented Slaw', channel: 'Internet Shaquille' },
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
    images: { hero: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by K8 on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=1oXheGE0cO0', title: 'Kanji — Traditional Fermented Rice Water', channel: 'Bong Eats' },
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
  },

  // ─── 6. BRINE PICKLES ─────────────────────────────────────────────────────────
  {
    id: 'brine-pickles-basic',
    slug: 'brine-pickles-basic',
    name: 'Brine Pickles',
    nameLocal: null,
    nameRomanized: null,
    subtitle: 'Any vegetable, saltwater, time — the universal lacto-ferment',
    category: 'vegetable',
    subcategory: 'mixed-vegetables',
    technique: 'brine',
    region: 'Global',
    country: null,
    countryCode: null,
    culturalGroup: 'Eastern European / Global',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '15 min',
    fermentTimeMin: 3,
    fermentTimeMax: 14,
    fermentTimeUnit: 'days',
    totalTimeHuman: '3–14 days',
    blrNote: 'KR Market is your playground — cucumbers, carrots, beans, cauliflower, radish, all dirt cheap and year-round. At BLR\'s 25°C, expect half-sours in 3 days, full sours by day 7. Use rock salt from any kirana store.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Mixed vegetables', nameLocal: 'Sabzi', amount: 500, unit: 'g', unitMetric: '500g', category: 'produce', essential: true, substitutions: ['Any firm vegetable — cucumber, carrot, beans, cauliflower, radish, turnip'], localAvailability: { IN: { ease: 'easy', where: 'KR Market, any sabziwala — ₹20–60/kg depending on vegetable' } } },
      { name: 'Non-iodised salt', nameLocal: 'Saindhav Namak', amount: 30, unit: 'g (for 3% brine)', unitMetric: '30g per litre', category: 'salt', essential: true, substitutions: ['Sea salt'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana store' } } },
      { name: 'Water (unchlorinated)', nameLocal: null, amount: 1, unit: 'litre', unitMetric: '1L', category: 'liquid', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Filtered or boiled-and-cooled tap water' } } },
      { name: 'Garlic cloves (optional)', nameLocal: 'Lahsun / Bellulli', amount: 3, unit: 'cloves, peeled', unitMetric: '10g', category: 'flavouring', essential: false, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Dill or mustard seeds (optional)', nameLocal: 'Rai / Sasive', amount: 1, unit: 'tsp', unitMetric: '3g', category: 'spice', essential: false, substitutions: ['Bay leaf, peppercorns, dried chilli'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana — mustard seeds are a South Indian pantry staple' } } }
    ],
    equipment: [
      { name: 'Glass jar (1L+)', essential: true, notes: 'Wide-mouth preferred for packing vegetables' },
      { name: 'Weight to keep vegetables submerged', essential: true, notes: 'Small zip-lock bag filled with brine, or a clean stone' }
    ],
    tldr: 'Dissolve salt in water. Submerge any vegetables. Wait. The simplest fermentation technique in existence.',
    steps: [
      { step: 1, title: 'Make the brine', instruction: 'Dissolve 30g non-iodised salt in 1 litre of unchlorinated water. Stir until fully dissolved. This gives you a 3% brine — the sweet spot for most vegetable ferments.', duration: '2 min', tips: ['3% is mild and crisp. Go to 5% for longer storage or softer vegetables like cucumbers.', 'Taste the brine — it should taste like pleasant seawater, not aggressively salty'], checkpoint: 'Clear brine, salt fully dissolved' },
      { step: 2, title: 'Prepare vegetables', instruction: 'Wash vegetables. Cut into uniform pieces — spears, coins, or florets. Keep sizes consistent so they ferment evenly. Add optional garlic, mustard seeds, or other aromatics to the jar first.', duration: '10 min', tips: ['Cucumbers: cut off blossom end (contains enzymes that soften pickles)', 'Carrots and beans: leave whole or halve lengthwise', 'Cauliflower: break into small florets'], checkpoint: 'Uniform vegetable pieces ready to pack' },
      { step: 3, title: 'Pack and submerge', instruction: 'Pack vegetables tightly into the jar. Pour brine over until vegetables are fully submerged with 2–3cm of brine above them. Place a weight on top to keep everything under the brine.', duration: '5 min', tips: ['Tight packing prevents vegetables from floating above the brine', 'Leave 3–4cm headspace above the brine for bubbling'], checkpoint: 'All vegetables submerged under brine with weight in place' },
      { step: 4, title: 'Ferment', instruction: 'Cover loosely (cloth or loose lid — gas needs to escape). Leave at room temperature away from direct sun. In BLR, taste daily from day 3. Half-sour by day 3–4, full sour by day 7–10.', duration: '3–14 days', tips: ['Bubbles forming within 24–48 hours means fermentation is active', 'Brine will turn cloudy — this is normal and good', 'Skim any white film (kahm yeast) from the surface — harmless but tastes yeasty'], checkpoint: 'Vegetables taste pleasantly sour and tangy' },
      { step: 5, title: 'Refrigerate', instruction: 'When vegetables reach your preferred sourness, seal the jar and refrigerate. Cold slows fermentation nearly to a halt.', duration: null, tips: ['Keeps 2–3 months in the fridge', 'The brine is drinkable and deeply probiotic — don\'t discard it'], checkpoint: 'Tangy, crunchy, sour pickles in cold storage' }
    ],
    images: { hero: 'https://images.unsplash.com/photo-1589135233689-3faae72aa11a?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Monika Grabkowska on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=vD6XWXj9l8Q', title: 'Brad Makes Pickles', channel: 'Bon Appétit — It\'s Alive' },
    culturalContext: {
      story: 'Brine pickling is arguably the oldest food preservation technique after drying. Before refrigeration, before canning, before any technology at all — humans discovered that saltwater keeps food from spoiling. Every civilisation with access to salt independently developed some version of brine fermentation.',
      historicalNote: 'Archaeological evidence of brine-pickled cucumbers dates to 2030 BCE in Mesopotamia. The word "pickle" derives from the Dutch "pekel" (brine). Cleopatra attributed her beauty to pickles. Roman soldiers carried them on campaigns.',
      significance: 'Brine pickles are the template for all lacto-fermentation. If you understand this technique — salt + water + submersion + time — you understand the principle behind sauerkraut, kimchi, and most vegetable ferments. This is fermentation at its most elemental.',
      relatedTraditions: ['Sauerkraut (German dry-salt)', 'Torshi (Persian/Middle Eastern pickles)', 'Tsukemono (Japanese salt pickles)', 'Indian achaar (oil-based preservation, different technique)'],
      funFact: 'New York City\'s Lower East Side was once the pickle capital of America. In the early 1900s, pickle vendors sold brine-fermented cucumbers from barrels on the street. The famous "pickle guys" of Essex Street still operate today.'
    },
    thingsToAccountFor: [
      { title: 'Vegetables floating above brine', description: 'Anything above the brine will mould. Always use a weight. A zip-lock bag filled with brine works perfectly — if it leaks, it\'s just more brine.', severity: 'important', appliesTo: ['all'] },
      { title: 'Soft or mushy pickles', description: 'Over-fermentation or too-warm conditions can soften vegetables. In BLR summers, check earlier and refrigerate sooner. Adding grape leaves, oak leaves, or a pinch of calcium chloride helps maintain crunch.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Salt concentration matters', description: '3% is standard. Below 2%, harmful bacteria can outcompete lactobacillus. Above 5%, fermentation slows significantly. Measure by weight, not volume.', severity: 'important', appliesTo: ['all'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Drain vegetables, slice thinly, dehydrate at 40°C for 8–12 hours.',
      result: 'Sour vegetable chips — tangy, crunchy, deeply flavoured snack.',
      shelfLife: '4–6 months airtight',
      tips: ['Carrot and beet pickles dehydrate especially well', 'Cucumber pickles become chewy rather than crunchy — still delicious']
    },
    variations: [
      { name: 'Deli-style dill pickles', description: 'Cucumbers in 5% brine with dill, garlic, mustard seeds, and peppercorns. The classic American deli pickle.', region: 'American / Eastern European' },
      { name: 'Indian-spiced brine pickles', description: 'Add mustard seeds, curry leaves, green chillies, and turmeric to the brine. Familiar spice profile, unfamiliar technique.', region: 'India / Fusion' },
      { name: 'Quick pickled beans', description: 'French beans in 3% brine with garlic. Ready in 3–4 days. Snappy, sour, addictive.', region: 'Global' }
    ],
    relatedRecipes: ['sauerkraut-classic', 'pickled-turnips-lift', 'kimchi-baechu'],
    tags: ['beginner', 'versatile', 'probiotic', 'global', 'year-round', 'vegan', 'blr-friendly'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Pickling — Wikipedia', url: 'https://en.wikipedia.org/wiki/Pickling', license: 'CC BY-SA' }]
  },

  // ─── 7. SWITCHEL ──────────────────────────────────────────────────────────────
  {
    id: 'switchel-drinking-vinegar',
    slug: 'switchel-drinking-vinegar',
    name: 'Switchel',
    nameLocal: null,
    nameRomanized: null,
    subtitle: 'The original energy drink — ginger, vinegar, and sweetness',
    category: 'beverage',
    subcategory: 'drinking-vinegar',
    technique: 'mixed-ferment',
    region: 'North America',
    country: 'United States',
    countryCode: 'US',
    culturalGroup: 'American Colonial',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '10 min',
    fermentTimeMin: 1,
    fermentTimeMax: 3,
    fermentTimeUnit: 'days',
    totalTimeHuman: '1–3 days (or drink immediately)',
    blrNote: 'Perfect for BLR\'s warm weather. Apple cider vinegar (Bragg\'s or local brands) is at Nature\'s Basket, Namdhari\'s, or any supermarket. Use jaggery instead of maple syrup — it\'s cheaper, local, and adds a gorgeous caramel depth. Fresh ginger from any sabziwala.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Fresh ginger', nameLocal: 'Adrak / Shunti', amount: 50, unit: 'g, grated or sliced', unitMetric: '50g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any sabziwala or KR Market' } } },
      { name: 'Apple cider vinegar (with mother)', nameLocal: null, amount: 3, unit: 'tbsp', unitMetric: '45ml', category: 'vinegar', essential: true, substitutions: ['Any raw, unpasteurised vinegar'], localAvailability: { IN: { ease: 'moderate', where: 'Nature\'s Basket, Namdhari\'s, Amazon India — Bragg\'s or local brands like WOW' } } },
      { name: 'Jaggery (or honey)', nameLocal: 'Bella / Gur', amount: 3, unit: 'tbsp', unitMetric: '45g', category: 'sweetener', essential: true, substitutions: ['Honey (raw, unprocessed)', 'Maple syrup (imported, expensive)'], localAvailability: { IN: { ease: 'easy', where: 'Any kirana store — jaggery is ₹40–80/kg' } } },
      { name: 'Water', nameLocal: null, amount: 1, unit: 'litre', unitMetric: '1L', category: 'liquid', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Filtered water' } } },
      { name: 'Lime juice (optional)', nameLocal: 'Nimbu ras', amount: 1, unit: 'tbsp', unitMetric: '15ml', category: 'flavouring', essential: false, substitutions: ['Lemon juice'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } }
    ],
    equipment: [
      { name: 'Glass jar or bottle (1L+)', essential: true, notes: null },
      { name: 'Strainer', essential: false, notes: 'For removing ginger bits before serving' }
    ],
    tldr: 'Ginger + vinegar + jaggery + water. Stir, infuse, drink. An 18th-century sports drink that actually works.',
    steps: [
      { step: 1, title: 'Combine ingredients', instruction: 'Grate or thinly slice the ginger. In a jar, combine ginger, apple cider vinegar, and jaggery (or honey). Add a splash of warm water and stir until jaggery dissolves.', duration: '5 min', tips: ['Grating the ginger releases more flavour faster than slicing', 'If using jaggery, crumble it fine for faster dissolving'], checkpoint: 'Jaggery dissolved, gingery-vinegary liquid' },
      { step: 2, title: 'Add water and mix', instruction: 'Add the remaining water (room temperature or cold). Stir well. Taste and adjust — more jaggery for sweetness, more vinegar for tang, more ginger for heat.', duration: '2 min', tips: ['The balance should be: refreshing, slightly sweet, tangy, with a ginger kick', 'Start conservative with vinegar — you can always add more'], checkpoint: 'Balanced, drinkable, tangy-sweet liquid' },
      { step: 3, title: 'Infuse or ferment (optional)', instruction: 'You can drink immediately, but for best flavour, refrigerate for 24 hours to let ginger infuse. For a lightly fermented version, leave at room temperature for 1–3 days (the ACV mother will create slight carbonation).', duration: '0–3 days', tips: ['Room temperature fermentation at BLR temps develops fizz within 24 hours if the ACV has a live mother', 'If fermenting, burp the jar daily to release gas'], checkpoint: 'Either a fresh gingery drink or a lightly fizzy, tangy tonic' },
      { step: 4, title: 'Strain and serve', instruction: 'Strain out the ginger bits. Serve cold over ice. Add lime juice if desired. Dilute further if too concentrated.', duration: '2 min', tips: ['Excellent as a post-exercise rehydration drink', 'Mix with soda water for a sparkling switchel'], checkpoint: 'Clear, golden, refreshing drink' }
    ],
    images: { hero: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Vero Manrique on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=uOB_IOQNKHY', title: 'Switchel — The 18th Century Energy Drink', channel: 'Townsends' },
    culturalContext: {
      story: 'Switchel was the Gatorade of 18th and 19th century America. Farmers making hay in the blazing summer heat drank switchel by the gallon to stay hydrated, replace electrolytes, and keep cool. It was so associated with harvest time that it earned the nickname "haymaker\'s punch."',
      historicalNote: 'The drink likely originated in the Caribbean, where ginger, vinegar, and molasses were all readily available. It migrated to colonial America and became a staple of farm life. Some historians trace the concept further back to Roman posca (vinegar water given to soldiers).',
      significance: 'Switchel is a reminder that humans have been making functional beverages for centuries. The combination of ginger (anti-inflammatory, digestive), vinegar (probiotic if raw, mineral absorption), and natural sweetener (quick energy) is genuinely effective — not just tradition for tradition\'s sake.',
      relatedTraditions: ['Shrub (fruit drinking vinegar, Colonial American)', 'Posca (Roman soldier\'s vinegar drink)', 'Nimbu pani (Indian lemon water)', 'Jal jeera (Indian spiced drink)'],
      funFact: 'During the American Revolution, switchel was provided to troops as a standard ration. Benjamin Franklin reportedly drank it daily. The drink is experiencing a hipster revival in Brooklyn — at 10x the price of making it at home.'
    },
    thingsToAccountFor: [
      { title: 'ACV quality matters', description: 'Use raw, unfiltered apple cider vinegar "with the mother" for any probiotic benefit. Clear, pasteurised vinegar adds sourness but no live cultures.', severity: 'important', appliesTo: ['all'] },
      { title: 'Too acidic on empty stomach', description: 'Switchel is acidic. If you have acid reflux or a sensitive stomach, dilute more and don\'t drink on an empty stomach.', severity: 'info', appliesTo: ['all'] },
      { title: 'BLR jaggery substitution', description: 'Jaggery works beautifully in place of molasses or maple syrup. Use dark jaggery (unrefined) for a deeper, more complex flavour.', severity: 'info', appliesTo: ['blr'] }
    ],
    dehydratorIntegration: {
      applicable: false,
      method: null,
      result: null,
      shelfLife: null,
      tips: []
    },
    variations: [
      { name: 'Turmeric switchel', description: 'Add 1 tsp ground turmeric or 1 tbsp grated fresh turmeric. Anti-inflammatory powerhouse. BLR pantry natural.', region: 'Fusion / India' },
      { name: 'Kokum switchel', description: 'Replace ACV with kokum concentrate + a splash of lime. A Konkan-coastal twist on the colonial recipe.', region: 'India / Fusion' },
      { name: 'Sparkling switchel', description: 'Make concentrated, then dilute with cold soda water just before serving. Refreshing and fizzy.', region: 'Modern' }
    ],
    relatedRecipes: ['ginger-bug-starter', 'tepache-pineapple'],
    tags: ['beginner', 'beverage', 'quick', 'probiotic-adjacent', 'year-round', 'vegan', 'blr-friendly'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Switchel — Wikipedia', url: 'https://en.wikipedia.org/wiki/Switchel', license: 'CC BY-SA' }]
  },

  // ─── 8. FERMENTED SALSA ───────────────────────────────────────────────────────
  {
    id: 'fermented-salsa',
    slug: 'fermented-salsa',
    name: 'Fermented Salsa',
    nameLocal: 'Salsa Lactofermentada',
    nameRomanized: null,
    subtitle: 'Mexican salsa gone probiotic — tomato, chili, cilantro, alive',
    category: 'condiment',
    subcategory: 'salsa',
    technique: 'dry-salt',
    region: 'Latin America',
    country: 'Mexico',
    countryCode: 'MX',
    culturalGroup: 'Mexican',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '15 min',
    fermentTimeMin: 2,
    fermentTimeMax: 3,
    fermentTimeUnit: 'days',
    totalTimeHuman: '2–3 days',
    blrNote: 'Tomatoes, green chillies, onions, and coriander — all abundant year-round in BLR. This is your existing chutney ingredients, rearranged Mexican-style and fermented. At 25°C, 2 days is usually perfect.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Ripe tomatoes', nameLocal: 'Tamatar / Thakkali', amount: 4, unit: 'medium, diced', unitMetric: '400g', category: 'produce', essential: true, substitutions: ['Cherry tomatoes (sweeter, more concentrated)'], localAvailability: { IN: { ease: 'easy', where: 'Any sabziwala, KR Market — ₹20–40/kg' } } },
      { name: 'Green chillies', nameLocal: 'Hari mirch / Hasiru menasinakayi', amount: 2, unit: 'finely chopped', unitMetric: '10g', category: 'produce', essential: true, substitutions: ['Jalapeño (milder)', 'Bird\'s eye chilli (hotter)'], localAvailability: { IN: { ease: 'easy', where: 'Any market — Indian green chillies are perfect' } } },
      { name: 'Onion', nameLocal: 'Pyaz / Eerulli', amount: 1, unit: 'small, finely diced', unitMetric: '80g', category: 'produce', essential: true, substitutions: ['Shallots', 'Spring onion'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Fresh coriander (cilantro)', nameLocal: 'Dhania / Kottambari soppu', amount: 1, unit: 'small bunch, chopped', unitMetric: '30g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market — ₹5–10 per bunch' } } },
      { name: 'Lime juice', nameLocal: 'Nimbu ras', amount: 1, unit: 'tbsp', unitMetric: '15ml', category: 'flavouring', essential: false, substitutions: ['Lemon juice'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Non-iodised salt', nameLocal: 'Rock salt', amount: 1, unit: 'tsp', unitMetric: '6g', category: 'salt', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana' } } },
      { name: 'Garlic', nameLocal: 'Lahsun / Bellulli', amount: 2, unit: 'cloves, minced', unitMetric: '8g', category: 'produce', essential: false, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } }
    ],
    equipment: [
      { name: 'Glass jar (500ml–1L)', essential: true, notes: 'Wide-mouth for easy packing' },
      { name: 'Mixing bowl', essential: true, notes: null }
    ],
    tldr: 'Dice tomatoes, chillies, onion, cilantro. Salt. Pack in a jar. 2 days later: probiotic salsa with a deep, complex tang.',
    steps: [
      { step: 1, title: 'Dice and combine', instruction: 'Dice tomatoes, finely chop chillies and onion, mince garlic, and roughly chop coriander. Combine in a bowl.', duration: '10 min', tips: ['Smaller dice = more surface area = faster, more even fermentation', 'Reserve a sprig of coriander for garnish after fermentation'], checkpoint: 'Chunky, colourful salsa mix in bowl' },
      { step: 2, title: 'Salt and mix', instruction: 'Add salt and optional lime juice. Mix thoroughly. The salt will draw moisture from the tomatoes within minutes.', duration: '3 min', tips: ['Taste the salsa before fermenting — it should taste well-seasoned (slightly salty is fine, it mellows)', 'The lime juice adds flavour but isn\'t necessary for fermentation'], checkpoint: 'Juicy salsa mixture, tomato liquid pooling' },
      { step: 3, title: 'Pack the jar', instruction: 'Transfer to a clean glass jar. Press down firmly so the salsa\'s own liquid rises to cover it. If needed, add a splash of brine (1 tsp salt in ½ cup water) to ensure coverage.', duration: '3 min', tips: ['Pack tightly — air pockets invite mould', 'Leave 3cm headspace for bubbling'], checkpoint: 'Salsa submerged under its own liquid' },
      { step: 4, title: 'Ferment', instruction: 'Cover loosely. Leave at room temperature for 2–3 days. You\'ll see bubbles forming — this is active lacto-fermentation. Taste daily.', duration: '2–3 days', tips: ['In BLR\'s warmth, 2 days usually produces a perfect balance of fresh and fermented', 'The flavour will deepen — more complex, tangier, slightly effervescent', 'If it starts to smell boozy or yeasty, it\'s gone too long — refrigerate immediately'], checkpoint: 'Bubbling, tangy salsa with depth beyond fresh' },
      { step: 5, title: 'Refrigerate and serve', instruction: 'Once you like the flavour, seal and refrigerate. Add fresh coriander on top. Serve with tortilla chips, on tacos, or — perfectly — with idli, dosa, or rice.', duration: null, tips: ['Keeps 2 weeks refrigerated', 'The tang gets more pronounced over time — it won\'t stay "mild"'], checkpoint: 'Complex, living salsa ready for any meal' }
    ],
    images: { hero: 'https://images.unsplash.com/photo-1560684352-8497838b2810?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Farhad Ibrahimzade on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=nsXGPmBxMzU', title: 'Fermented Salsa — Lacto-Fermented Tomato Salsa', channel: 'Fermented Homestead' },
    culturalContext: {
      story: 'Salsa has pre-Columbian roots — the Aztecs combined tomatoes, chillies, and squash seeds into sauces long before Europeans arrived. The word "salsa" is simply Spanish for "sauce." While most modern salsa is eaten fresh, lacto-fermentation adds depth, complexity, and beneficial bacteria — transforming a condiment into a living food.',
      historicalNote: 'Tomatoes, chillies, and coriander were all domesticated in the Americas. The global spread of salsa-like condiments happened after the Columbian Exchange. Today, salsa outsells ketchup in the United States.',
      significance: 'Fermented salsa bridges Mexican and Indian kitchens beautifully. The ingredient overlap — tomatoes, green chillies, coriander, onion — is almost identical to Indian chutney. The only difference is technique: Indian chutneys are ground, Mexican salsas are chunky. Fermenting either adds probiotic value.',
      relatedTraditions: ['Pico de gallo (fresh, unfermented)', 'Indian tomato chutney (ground, cooked)', 'Zhug (Yemeni green chilli sauce)', 'Sambal (Southeast Asian chilli paste)'],
      funFact: 'Americans consume over 800 million dollars worth of salsa annually. In 1991, salsa overtook ketchup as America\'s top-selling condiment — a shift food historians call "the salsa moment."'
    },
    thingsToAccountFor: [
      { title: 'Tomato quality matters', description: 'Use ripe, flavourful tomatoes — not the pale, underripe ones. Better tomatoes = better salsa. Desi tomatoes from KR Market often have more flavour than hybrid varieties.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Fast ferment in BLR heat', description: 'At 28–30°C in summer, this can ferment aggressively. Start checking at 36 hours. The line between "perfectly tangy" and "too sour" is narrow.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Texture softens', description: 'Fermentation breaks down cell walls. If you want some crunch, ferment only 1–2 days. After 3+ days, it becomes more sauce-like.', severity: 'info', appliesTo: ['all'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Spread fermented salsa thinly on parchment-lined trays. Dehydrate at 45°C for 10–14 hours until brittle.',
      result: 'Tangy salsa leather or powder — grind into a seasoning for rice, popcorn, or rub for grilled vegetables.',
      shelfLife: '3–4 months airtight',
      tips: ['Blend smooth before dehydrating for even drying', 'Makes an incredible spice powder when ground']
    },
    variations: [
      { name: 'Roasted fermented salsa', description: 'Char tomatoes and chillies over a gas flame before dicing. Adds smoky depth to the fermented tang.', region: 'Mexico' },
      { name: 'Mango salsa (fermented)', description: 'Replace half the tomato with diced raw mango. Sweet-sour-spicy. Mangoes in season (Apr–Jun) make this outstanding.', region: 'Fusion / India' },
      { name: 'Salsa verde fermentada', description: 'Use tomatillos instead of tomatoes if available (check Nature\'s Basket or grow your own). Tangier, greener.', region: 'Mexico' }
    ],
    relatedRecipes: ['fermented-green-chutney', 'lacto-hot-sauce'],
    tags: ['beginner', 'quick', 'condiment', 'probiotic', 'mexican', 'year-round', 'vegan', 'blr-friendly'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Salsa (sauce) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Salsa_(sauce)', license: 'CC BY-SA' }]
  },

  // ─── 9. PICKLED TURNIPS (LIFT) ────────────────────────────────────────────────
  {
    id: 'pickled-turnips-lift',
    slug: 'pickled-turnips-lift',
    name: 'Pickled Turnips (Lift)',
    nameLocal: 'لفت مخلل',
    nameRomanized: 'Lift Mkhallal',
    subtitle: 'Lebanon\'s electric-pink pickled turnips',
    category: 'vegetable',
    subcategory: 'root-vegetable',
    technique: 'brine',
    region: 'Middle East',
    country: 'Lebanon',
    countryCode: 'LB',
    culturalGroup: 'Levantine',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '15 min',
    fermentTimeMin: 5,
    fermentTimeMax: 10,
    fermentTimeUnit: 'days',
    totalTimeHuman: '5–10 days',
    blrNote: 'Turnips (shalgam) available at KR Market, Hopcoms, and larger sabziwalas — they\'re a winter staple but available most of the year in BLR. Beetroot is always available and cheap. At BLR temperatures, expect a good ferment in 5–7 days.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Turnips', nameLocal: 'Shalgam', amount: 500, unit: 'g, peeled and cut into sticks or wedges', unitMetric: '500g', category: 'produce', essential: true, substitutions: ['Radish (mooli) — different flavour but works with the technique'], localAvailability: { IN: { ease: 'moderate', where: 'KR Market, Hopcoms, Nature\'s Basket — more available in winter months (Nov–Feb)' } } },
      { name: 'Beetroot', nameLocal: 'Beetroot / Beet', amount: 1, unit: 'small, peeled and sliced', unitMetric: '80g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market — ₹20–30/kg' } } },
      { name: 'Non-iodised salt', nameLocal: 'Rock salt', amount: 30, unit: 'g', unitMetric: '30g', category: 'salt', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana' } } },
      { name: 'Water', nameLocal: null, amount: 1, unit: 'litre', unitMetric: '1L', category: 'liquid', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Filtered water' } } },
      { name: 'Garlic cloves (optional)', nameLocal: 'Lahsun', amount: 2, unit: 'cloves, halved', unitMetric: '8g', category: 'flavouring', essential: false, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } }
    ],
    equipment: [
      { name: 'Glass jar (1L)', essential: true, notes: 'Wide-mouth for packing turnip sticks' },
      { name: 'Weight to keep vegetables submerged', essential: true, notes: 'Small zip-lock bag with brine, or a plate' }
    ],
    tldr: 'Turnip sticks + a slice of beetroot + salt brine = shocking pink pickles that every Lebanese table considers essential.',
    steps: [
      { step: 1, title: 'Prepare the brine', instruction: 'Dissolve 30g non-iodised salt in 1 litre of water. Stir until clear.', duration: '2 min', tips: ['This is approximately a 3% brine — the standard for most vegetable ferments'], checkpoint: 'Clear brine, salt dissolved' },
      { step: 2, title: 'Cut the vegetables', instruction: 'Peel turnips and cut into sticks (about finger-width) or wedges. Peel the beetroot and slice into thin rounds or chunks.', duration: '10 min', tips: ['The beetroot is primarily for colour — you don\'t need much', 'Wear gloves when handling beetroot unless you want pink fingers for a day'], checkpoint: 'Turnip sticks and beetroot slices ready' },
      { step: 3, title: 'Pack the jar', instruction: 'Place beetroot slices at the bottom and interspersed through the jar. Pack turnip sticks vertically (standing up). Add garlic if using. Pour brine over until everything is submerged.', duration: '5 min', tips: ['Vertical packing keeps turnips submerged more easily', 'Leave 3cm headspace'], checkpoint: 'Jar packed with turnips and beet, submerged in brine' },
      { step: 4, title: 'Ferment', instruction: 'Cover loosely. Leave at room temperature away from sun. The brine will turn pink within hours as beetroot bleeds. Taste from day 5.', duration: '5–10 days', tips: ['The colour transformation is dramatic — brine goes from clear to vivid pink within 24 hours', 'In BLR, 5–7 days usually produces the right balance of crunch and sourness', 'Bubbles indicate active fermentation — normal and good'], checkpoint: 'Shocking pink brine, turnips are sour-tangy and still slightly crunchy' },
      { step: 5, title: 'Refrigerate', instruction: 'When turnips are tangy and still have some crunch, seal and refrigerate. The pink deepens over time.', duration: null, tips: ['Keeps 2–3 months refrigerated', 'The brine is also delicious — use it in salad dressings or as a probiotic shot'], checkpoint: 'Vibrant pink pickled turnips, ready to serve' }
    ],
    images: { hero: 'https://images.unsplash.com/photo-1601564921647-b446839fa08e?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Micah Tindell on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=9J_K5VEOaS8', title: 'Pickled Turnips — Lebanese Lift', channel: 'Middle Eats' },
    culturalContext: {
      story: 'In Lebanon, Syria, and across the Levant, no shawarma stand, falafel shop, or family table is complete without a jar of bright pink pickled turnips. They\'re called "lift" (لفت) — Arabic for turnip — and their shocking magenta colour (from beetroot) makes them one of the most visually striking ferments in any cuisine.',
      historicalNote: 'Vegetable pickling in brine has been practiced in the Levant for thousands of years. The region\'s hot, dry climate made preservation essential. Turnips, being a hardy root vegetable that stores well and grows in poor soil, became a natural candidate for fermentation.',
      significance: 'Lift demonstrates how a single addition — beetroot for colour — can elevate a simple pickle into something iconic. The technique is identical to basic brine pickles, but the result looks and feels completely different. It\'s a masterclass in how presentation transforms food culture.',
      relatedTraditions: ['Torshi (Persian mixed pickles)', 'Turşu (Turkish pickles)', 'Indian gajar-shalgam achaar (carrot-turnip pickle)', 'Kisela repa (Balkan pickled turnips)'],
      funFact: 'The pink colour of lift is so associated with Lebanese cuisine that food bloggers call it "Lebanese pink." The colour comes from betalain pigments in beetroot — the same compounds that make beet juice a natural dye used in cosmetics and food colouring.'
    },
    thingsToAccountFor: [
      { title: 'Turnip availability in BLR', description: 'Turnips are most abundant November–February but available sporadically year-round. Ask your sabziwala or check Hopcoms. If unavailable, radish (mooli) works as an alternative.', severity: 'info', appliesTo: ['blr'] },
      { title: 'Beetroot stains everything', description: 'Beetroot will stain hands, cutting boards, and countertops. Use a glass cutting board or line your workspace with newspaper. Wear old clothes.', severity: 'info', appliesTo: ['all'] },
      { title: 'Don\'t over-ferment', description: 'Turnips go from crunchy-sour to mushy-sour faster than cucumbers. In BLR heat, check at day 5 and refrigerate when they still have some bite.', severity: 'info', appliesTo: ['blr'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Drain pickled turnips, slice thin, dehydrate at 40°C for 8–10 hours.',
      result: 'Pink turnip chips — sour, earthy, stunning colour. Conversation-starter snack.',
      shelfLife: '4 months airtight',
      tips: ['The colour fades slightly when dehydrated but remains visibly pink', 'Sprinkle with za\'atar before dehydrating for extra flavour']
    },
    variations: [
      { name: 'Spiced lift', description: 'Add a dried red chilli, bay leaf, and a few peppercorns to the brine. Subtle warmth behind the tang.', region: 'Levant' },
      { name: 'Mooli lift (Indian fusion)', description: 'Use Indian radish (mooli) instead of turnip. Same beet-brine technique. The radish\'s peppery bite adds dimension.', region: 'India / Fusion' },
      { name: 'Quick-pink pickled onions', description: 'Slice red onions, add a piece of beetroot, cover in the same brine. Ready in 3 days. Incredible on kebabs.', region: 'Modern / Fusion' }
    ],
    relatedRecipes: ['brine-pickles-basic', 'sauerkraut-classic'],
    tags: ['beginner', 'brine', 'probiotic', 'middle-eastern', 'year-round', 'vegan', 'stunning'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Pickled turnips — Wikipedia', url: 'https://en.wikipedia.org/wiki/Pickled_turnip', license: 'CC BY-SA' }]
  },

  // ─── 10. FERMENTED GREEN CHUTNEY ──────────────────────────────────────────────
  {
    id: 'fermented-green-chutney',
    slug: 'fermented-green-chutney',
    name: 'Fermented Green Chutney',
    nameLocal: 'ಹಸಿರು ಚಟ್ನಿ / हरी चटनी',
    nameRomanized: 'Hari Chutney',
    subtitle: 'Your everyday green chutney, upgraded with live cultures',
    category: 'condiment',
    subcategory: 'chutney',
    technique: 'dry-salt',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    culturalGroup: 'Pan-Indian',
    difficulty: 1,
    tier: 'beginner',
    tierLabel: 'Literally Just Add Salt',
    prepTime: '10 min',
    fermentTimeMin: 2,
    fermentTimeMax: 3,
    fermentTimeUnit: 'days',
    totalTimeHuman: '2–3 days',
    blrNote: 'Coriander, mint, and green chillies — every BLR kitchen already has these. You make this chutney weekly anyway; now ferment it. Costs ₹15–20 for a batch from any sabziwala. At BLR\'s 25°C, 2 days is perfect.',
    seasonality: ['all'],
    ingredients: [
      { name: 'Fresh coriander (cilantro)', nameLocal: 'Kottambari soppu / Dhania', amount: 2, unit: 'large bunches', unitMetric: '100g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any sabziwala — ₹5–10 per bunch' } } },
      { name: 'Fresh mint', nameLocal: 'Pudina', amount: 1, unit: 'bunch', unitMetric: '50g', category: 'produce', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market — often sold alongside coriander' } } },
      { name: 'Green chillies', nameLocal: 'Hari mirch / Hasiru menasinakayi', amount: 3, unit: 'or to taste', unitMetric: '15g', category: 'produce', essential: true, substitutions: ['Serrano chillies', 'Adjust to taste — 1 for mild, 5+ for fiery'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Non-iodised salt', nameLocal: 'Saindhav Namak', amount: 1.5, unit: 'tsp', unitMetric: '9g', category: 'salt', essential: true, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any kirana' } } },
      { name: 'Garlic (optional)', nameLocal: 'Bellulli / Lahsun', amount: 2, unit: 'cloves', unitMetric: '8g', category: 'produce', essential: false, substitutions: [], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } },
      { name: 'Lemon juice', nameLocal: 'Nimbu ras', amount: 1, unit: 'tbsp', unitMetric: '15ml', category: 'flavouring', essential: false, substitutions: ['Lime juice'], localAvailability: { IN: { ease: 'easy', where: 'Any market' } } }
    ],
    equipment: [
      { name: 'Mixer grinder / blender', essential: true, notes: 'Every Indian kitchen has one' },
      { name: 'Glass jar (250–500ml)', essential: true, notes: 'Small jar — this is a condiment, not a main course' }
    ],
    tldr: 'Grind coriander, mint, chilli, and salt into a paste. Jar it. Wait 2 days. Your regular green chutney, now alive.',
    steps: [
      { step: 1, title: 'Wash and prep', instruction: 'Wash coriander and mint thoroughly. Remove thick stems (thin stems are fine). Roughly chop. Deseed chillies for milder heat, or leave whole for full fire.', duration: '5 min', tips: ['Wash well — these come from open markets and carry soil bacteria (some of which you actually want for fermentation)', 'Dry the greens briefly in a salad spinner or towel — excess water dilutes the chutney'], checkpoint: 'Clean herbs, prepped chillies' },
      { step: 2, title: 'Grind to paste', instruction: 'Blend coriander, mint, green chillies, salt, and optional garlic in a mixer grinder. Add minimal water — just enough to get the blades moving. You want a thick paste, not a liquid.', duration: '3 min', tips: ['Less water = thicker paste = better fermentation', 'Add lemon juice during grinding for brightness (optional at this stage)'], checkpoint: 'Thick, vibrant green paste' },
      { step: 3, title: 'Pack the jar', instruction: 'Transfer the paste to a clean glass jar. Press down to remove air pockets. Leave 2cm headspace. Drizzle a thin layer of salt on top (optional, helps prevent surface mould).', duration: '2 min', tips: ['Pack tightly — air is the enemy of good fermentation', 'A thin layer of oil on top also helps seal against air'], checkpoint: 'Jar packed with dense green paste' },
      { step: 4, title: 'Ferment', instruction: 'Cover loosely. Leave at room temperature for 2–3 days. The chutney will darken slightly and develop a tangy, complex flavour distinct from fresh chutney. Small bubbles may appear.', duration: '2–3 days', tips: ['Day 2 in BLR is usually the sweet spot — tangy but still fresh-tasting', 'The colour will shift from bright green to a deeper, olive green — normal', 'If it turns brown-black or smells off, discard — this means oxidation or contamination'], checkpoint: 'Slightly darker green, distinctly tangy, complex aroma' },
      { step: 5, title: 'Refrigerate and use', instruction: 'Seal and refrigerate. Use as you would regular green chutney — with dosa, idli, pakora, sandwiches, chaat, or stirred into rice.', duration: null, tips: ['Keeps 2–3 weeks refrigerated (longer than fresh chutney)', 'The tang deepens over days — taste evolves', 'Stir before each use'], checkpoint: 'Living green chutney with probiotic tang' }
    ],
    images: { hero: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80', heroAttribution: 'Photo by Rajesh Kavasseri on Unsplash' },
    video: { url: 'https://www.youtube.com/watch?v=hDKuSyFRjsw', title: 'Green Chutney Recipe — Coriander Mint Chutney', channel: 'Swasthi\'s Recipes' },
    culturalContext: {
      story: 'Green chutney — coriander, mint, chilli, ground together — is the universal condiment of the Indian subcontinent. It appears at every chaat stall, alongside every dosa, inside every sandwich in Mumbai. Usually consumed fresh, it has a shelf life of just 2–3 days in the fridge. Fermenting it deliberately extends its life AND adds probiotic benefit — turning something ephemeral into something alive.',
      historicalNote: 'The practice of grinding herbs with salt and fermenting them is ancient across South Asia. Before blenders, stone mortars (sil-batta) were used. The fermentation step was often unintentional — chutneys made in bulk would naturally ferment in warm weather. Many grandmothers\' "special flavour" was, unknowingly, lacto-fermentation.',
      significance: 'This recipe is about reframing something you already make. Every Bangalorean household has green chutney in their routine. Adding a 2-day fermentation step requires no new skills, no new ingredients, no new equipment — just patience. It\'s the lowest-barrier entry point to fermentation for anyone in India.',
      relatedTraditions: ['Zhug (Yemeni green chilli paste)', 'Chimichurri (Argentine herb sauce — unfermented)', 'Pesto (Italian basil paste — unfermented)', 'Sambal hijau (Malay green chilli paste)'],
      funFact: 'In a 2018 food science study, lacto-fermented herb pastes showed 10x higher bioavailability of iron and zinc compared to fresh versions. The fermentation breaks down phytic acid — the same compound that makes spinach iron "less available" than it appears on paper.'
    },
    thingsToAccountFor: [
      { title: 'Colour change is normal', description: 'Fermented green chutney will darken from bright green to olive-khaki. This is chlorophyll breaking down in the acidic environment. It\'s cosmetic, not harmful. Taste, don\'t judge by colour alone.', severity: 'info', appliesTo: ['all'] },
      { title: 'Minimal water is key', description: 'Too much water in the paste invites contamination and weakens the ferment. The paste should be thick enough to hold its shape on a spoon.', severity: 'important', appliesTo: ['all'] },
      { title: 'BLR summer speed', description: 'In April–May, when BLR hits 30°C+, this can over-ferment in 36 hours. Start checking early and refrigerate when tangy.', severity: 'info', appliesTo: ['blr'] }
    ],
    dehydratorIntegration: {
      applicable: true,
      method: 'Spread fermented chutney thinly on parchment. Dehydrate at 40°C for 8–10 hours. Crumble or powder.',
      result: 'Fermented green chutney powder — tangy, herby, probiotic-adjacent seasoning for rice, raita, popcorn.',
      shelfLife: '3–4 months airtight in a cool, dry place',
      tips: ['Spread as thin as possible for even drying', 'Grind to powder and mix with salt for an incredible chutney salt']
    },
    variations: [
      { name: 'Curry leaf fermented chutney', description: 'Add a handful of fresh curry leaves (karibevu) to the blend. Deepens the South Indian character.', region: 'South India' },
      { name: 'Coconut green chutney (fermented)', description: 'Add 2 tbsp fresh grated coconut to the blend. Richer, more Karnataka-style. Ferments similarly.', region: 'Karnataka / Kerala' },
      { name: 'Spicy fermented chutney', description: 'Double the green chillies. Add raw mango (when in season) for extra sour punch. Not for the faint-hearted.', region: 'India' }
    ],
    relatedRecipes: ['fermented-salsa', 'lacto-hot-sauce'],
    tags: ['beginner', 'quick', 'condiment', 'probiotic', 'indian', 'year-round', 'vegan', 'blr-friendly', 'pantry-staple'],
    dietaryFlags: ['gluten-free', 'vegan'],
    veganAdaptable: true,
    containsAllergens: [],
    sources: [{ title: 'Chutney — Wikipedia', url: 'https://en.wikipedia.org/wiki/Chutney', license: 'CC BY-SA' }]
  }

); // end tier 1
