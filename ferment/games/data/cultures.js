/* THE FERMENT ALCHEMIST — Cultural Context for Results */

window.GameCultures = {
  // Cultural context shown on result screens to educate players
  entries: {
    'sauerkraut': {
      region: 'Europe',
      country: 'Germany',
      flag: '🇩🇪',
      funFact: 'Captain James Cook brought sauerkraut on his voyages to prevent scurvy. The vitamin C in fermented cabbage kept his crew healthy for years at sea.',
      tradition: 'German families have made sauerkraut every autumn for centuries, often using a large communal crock.',
      pronunciation: 'ZOUR-krout',
    },
    'kimchi': {
      region: 'Asia',
      country: 'South Korea',
      flag: '🇰🇷',
      funFact: 'There are over 200 varieties of kimchi in Korea. UNESCO inscribed kimjang (the practice of making kimchi) as an Intangible Cultural Heritage.',
      tradition: 'Kimjang is a communal autumn event where families and neighbors gather to make enough kimchi to last the winter.',
      pronunciation: 'KIM-chee',
    },
    'pickles': {
      region: 'Global',
      country: 'Various',
      flag: '🌍',
      funFact: 'Cleopatra attributed her beauty to pickles. The word "pickle" comes from the Dutch word "pekel" meaning brine.',
      tradition: 'Every culture has its own pickle tradition — from Indian achaar to Japanese tsukemono to Eastern European fermented pickles.',
    },
    'yogurt': {
      region: 'Central Asia / South Asia',
      country: 'Various',
      flag: '🌏',
      funFact: 'Yogurt was likely discovered by accident when milk stored in animal stomachs curdled from natural enzymes.',
      tradition: 'In India, no meal is complete without dahi (curd). It\'s considered cooling for the body and is central to Ayurvedic tradition.',
      pronunciation: 'YOH-gurt / DAH-hee',
    },
    'kombucha': {
      region: 'East Asia',
      country: 'China (origin)',
      flag: '🇨🇳',
      funFact: 'Kombucha was called the "Tea of Immortality" in ancient China, dating back to 221 BC during the Tsin Dynasty.',
      tradition: 'SCOBYs are traditionally shared between friends and neighbors, earning them the nickname "mother."',
    },
    'tepache': {
      region: 'Central America',
      country: 'Mexico',
      flag: '🇲🇽',
      funFact: 'Pre-Hispanic peoples of Mexico fermented maize to make the original tepache. The pineapple version came after Spanish colonization.',
      tradition: 'Street vendors in Mexico City sell tepache from large glass barrels called vitroleros.',
      pronunciation: 'teh-PAH-cheh',
    },
    'miso': {
      region: 'East Asia',
      country: 'Japan',
      flag: '🇯🇵',
      funFact: 'Some miso in Japan has been fermenting continuously for over 100 years, passed down through generations of makers.',
      tradition: 'Miso soup is eaten at nearly every Japanese breakfast. The type of miso varies by region.',
      pronunciation: 'MEE-soh',
    },
    'kvass': {
      region: 'Eastern Europe',
      country: 'Russia / Ukraine',
      flag: '🇷🇺',
      funFact: 'Kvass was so important in medieval Russia that it was consumed by rich and poor alike. Even hospital patients received a daily ration.',
      tradition: 'Kvass vendors with yellow tanks on wheels are a common summer sight in Russian cities.',
      pronunciation: 'kuh-VAHS',
    },
    'gochujang': {
      region: 'Asia',
      country: 'South Korea',
      flag: '🇰🇷',
      funFact: 'Traditional gochujang is fermented in earthenware pots (jangdok) on rooftops or in courtyards, exposed to sun and wind.',
      tradition: 'Making jang (fermented sauces) is considered one of the most important skills for a Korean household.',
      pronunciation: 'GO-choo-jahng',
    },
    'harissa': {
      region: 'North Africa',
      country: 'Tunisia',
      flag: '🇹🇳',
      funFact: 'Harissa is so central to Tunisian cuisine that it\'s sometimes called "the ketchup of Tunisia."',
      tradition: 'Families prepare large batches of harissa after the pepper harvest, often sun-drying the peppers on rooftops.',
      pronunciation: 'hah-REE-sah',
    },
    'kefir': {
      region: 'Caucasus',
      country: 'Various',
      flag: '🏔️',
      funFact: 'Kefir grains were once considered a gift from the gods by Caucasus mountain peoples, and sharing them outside the community was forbidden.',
      tradition: 'The word kefir comes from the Turkish "keyif" meaning "feeling good."',
      pronunciation: 'keh-FEER',
    },
    'default': {
      region: 'Global',
      country: 'Various',
      flag: '🌍',
      funFact: 'Fermentation is one of the oldest food preservation methods, predating written history. Nearly every culture independently discovered it.',
      tradition: 'The art of fermentation connects us to our ancestors and to cultures around the world.',
    },
  },

  getContext(recipeId) {
    // Try exact match, then partial match, then default
    if (this.entries[recipeId]) return this.entries[recipeId];

    for (const key of Object.keys(this.entries)) {
      if (recipeId.includes(key) || key.includes(recipeId)) return this.entries[key];
    }

    return this.entries['default'];
  },

  getRandomFact() {
    const keys = Object.keys(this.entries).filter(k => k !== 'default');
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { ...this.entries[key], id: key };
  }
};
