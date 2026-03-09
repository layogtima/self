/**
 * FERMENT — Formatting Utilities
 * Unit conversion, date formatting, display helpers
 */

const FermentFormat = {
  // Unit conversion tables
  conversions: {
    weight: {
      g: { oz: 0.035274, lb: 0.00220462, kg: 0.001 },
      oz: { g: 28.3495, lb: 0.0625, kg: 0.0283495 },
      lb: { g: 453.592, oz: 16, kg: 0.453592 },
      kg: { g: 1000, oz: 35.274, lb: 2.20462 },
    },
    volume: {
      ml: { 'fl oz': 0.033814, cup: 0.00422675, tbsp: 0.067628, tsp: 0.202884, l: 0.001 },
      l: { ml: 1000, 'fl oz': 33.814, cup: 4.22675, tbsp: 67.628, tsp: 202.884 },
      'fl oz': { ml: 29.5735, cup: 0.125, tbsp: 2, tsp: 6, l: 0.0295735 },
      cup: { ml: 236.588, 'fl oz': 8, tbsp: 16, tsp: 48, l: 0.236588 },
      tbsp: { ml: 14.7868, 'fl oz': 0.5, cup: 0.0625, tsp: 3, l: 0.0147868 },
      tsp: { ml: 4.92892, 'fl oz': 0.166667, cup: 0.0208333, tbsp: 0.333333, l: 0.00492892 },
    },
    temperature: {
      // Special handling — not simple multiplication
    }
  },

  convertUnit(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;

    // Temperature special cases
    if (fromUnit === '°C' && toUnit === '°F') return (value * 9/5) + 32;
    if (fromUnit === '°F' && toUnit === '°C') return (value - 32) * 5/9;

    // Look up in conversion tables
    for (const category of Object.values(this.conversions)) {
      if (category[fromUnit] && category[fromUnit][toUnit]) {
        return value * category[fromUnit][toUnit];
      }
    }
    return value; // No conversion found
  },

  formatWeight(grams) {
    if (grams >= 1000) return (grams / 1000).toFixed(1) + ' kg';
    if (grams < 1) return (grams * 1000).toFixed(0) + ' mg';
    return grams.toFixed(1) + ' g';
  },

  formatVolume(ml) {
    if (ml >= 1000) return (ml / 1000).toFixed(1) + ' L';
    return ml.toFixed(0) + ' ml';
  },

  // Brine calculator
  calcDrySalt(vegWeightG, saltPercent) {
    return vegWeightG * (saltPercent / 100);
  },

  calcBrineSalt(waterMl, saltPercent) {
    return waterMl * (saltPercent / (100 - saltPercent));
  },

  saltToHuman(grams) {
    if (grams < 5) return grams.toFixed(1) + ' g (~' + (grams / 5).toFixed(1) + ' tsp)';
    if (grams < 15) return grams.toFixed(1) + ' g (~' + (grams / 5).toFixed(0) + ' tsp)';
    return grams.toFixed(1) + ' g (~' + Math.floor(grams / 15) + ' tbsp' +
      (grams % 15 >= 5 ? ' + ' + Math.round((grams % 15) / 5) + ' tsp' : '') + ')';
  },

  // Temperature-adjusted fermentation time
  adjustedFermentTime(baseDays, baseTempC, ambientTempC) {
    if (!ambientTempC || ambientTempC <= 0) return baseDays;
    return baseDays * (baseTempC / ambientTempC);
  },

  // Date formatting
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays + ' days ago';
    if (diffDays < 30) return Math.floor(diffDays / 7) + 'w ago';
    return this.formatDateShort(dateStr);
  },

  daysBetween(start, end) {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    return Math.floor((e - s) / (1000 * 60 * 60 * 24));
  },

  // Difficulty / Tier helpers
  tierInfo(difficulty) {
    const tiers = {
      1: { name: 'beginner', label: 'Beginner', tagline: 'Literally Just Add Salt', color: 'tier-beginner', emoji: '🟢' },
      2: { name: 'seasoned', label: 'Seasoned', tagline: 'Okay, We\'re Flavoring Now', color: 'tier-seasoned', emoji: '🟡' },
      3: { name: 'ambitious', label: 'Ambitious', tagline: 'Getting Serious', color: 'tier-ambitious', emoji: '🟠' },
      4: { name: 'advanced', label: 'Advanced', tagline: 'Sauces, Pastes & Condiments', color: 'tier-advanced', emoji: '🔴' },
      5: { name: 'master', label: 'Master', tagline: 'Final Boss Ferments', color: 'tier-master', emoji: '🟣' },
    };
    return tiers[difficulty] || tiers[1];
  },

  // Scale ingredient amounts
  scaleAmount(amount, multiplier) {
    const scaled = amount * multiplier;
    // Round nicely
    if (scaled < 0.1) return scaled.toFixed(2);
    if (scaled < 1) return scaled.toFixed(1);
    if (scaled < 10) return Math.round(scaled * 4) / 4; // Quarter precision
    return Math.round(scaled);
  },

  // Generate unique IDs
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
};
