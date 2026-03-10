/* THE FERMENT ALCHEMIST — Game Data Helpers & Audio Stubs */

const GameData = {
  // ─── Audio Placeholder System ─────────────────────────
  // All audio calls go through here. Logs to console until real audio added.
  _audioEnabled: true,
  _musicEnabled: true,

  playSound(soundId) {
    if (!this._audioEnabled) return;
    // TODO: Replace with actual audio playback
    console.log(`[Audio] SFX: ${soundId}`);
  },

  playMusic(trackId) {
    if (!this._musicEnabled) return;
    // TODO: Replace with actual music playback
    console.log(`[Audio] Music: ${trackId}`);
  },

  stopMusic() {
    console.log('[Audio] Music stopped');
  },

  setAudioEnabled(enabled) { this._audioEnabled = enabled; },
  setMusicEnabled(enabled) {
    this._musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  },

  // ─── Sound IDs Reference ──────────────────────────────
  // SFX: order-arrive, ingredient-add, ingredient-remove, technique-select,
  //       vessel-select, parameter-adjust, ferment-bubble, ferment-complete,
  //       serve-whoosh, score-reveal, grade-s, grade-a, grade-fail,
  //       level-unlock, chapter-complete, btn-tap, btn-back
  // Music: bg-music-menu, bg-music-gameplay, bg-music-sandbox, bg-music-results

  // ─── Player Titles ────────────────────────────────────
  playerTitles: [
    { level: 1, title: 'Salt Apprentice', xpRequired: 0 },
    { level: 2, title: 'Brine Mixer', xpRequired: 100 },
    { level: 3, title: 'Pickle Novice', xpRequired: 250 },
    { level: 4, title: 'Culture Keeper', xpRequired: 500 },
    { level: 5, title: 'Kraut Wrangler', xpRequired: 800 },
    { level: 6, title: 'Ferment Journeyman', xpRequired: 1200 },
    { level: 7, title: 'Spice Alchemist', xpRequired: 1700 },
    { level: 8, title: 'Brew Master', xpRequired: 2300 },
    { level: 9, title: 'Culture Whisperer', xpRequired: 3000 },
    { level: 10, title: 'Enzyme Artisan', xpRequired: 3800 },
    { level: 11, title: 'Vessel Sage', xpRequired: 4700 },
    { level: 12, title: 'Temperature Oracle', xpRequired: 5700 },
    { level: 13, title: 'Microbe Commander', xpRequired: 6800 },
    { level: 14, title: 'Fermentation Virtuoso', xpRequired: 8000 },
    { level: 15, title: 'Koji Mystic', xpRequired: 9500 },
    { level: 16, title: 'Lacto Legend', xpRequired: 11000 },
    { level: 17, title: 'Grand Fermenter', xpRequired: 13000 },
    { level: 18, title: 'Living Culture', xpRequired: 15000 },
    { level: 19, title: 'Ferment Philosopher', xpRequired: 18000 },
    { level: 20, title: 'Master Alchemist', xpRequired: 21000 },
    { level: 21, title: 'Fermentation Sage', xpRequired: 25000 },
    { level: 22, title: 'Ancient Preserver', xpRequired: 30000 },
    { level: 23, title: 'Eternal Culture', xpRequired: 36000 },
    { level: 24, title: 'Microbial Deity', xpRequired: 43000 },
    { level: 25, title: 'Fermentation Anarchist', xpRequired: 50000 },
  ],

  getTitleForXP(xp) {
    let current = this.playerTitles[0];
    for (const t of this.playerTitles) {
      if (xp >= t.xpRequired) current = t;
      else break;
    }
    return current;
  },

  getXPForGrade(grade) {
    const xpMap = { S: 100, A: 75, B: 50, C: 30, D: 15, F: 5 };
    return xpMap[grade] || 0;
  },

  // ─── Emoji Placeholders for Visual Assets ─────────────
  // These will be replaced with actual images later
  icons: {
    // Ingredients
    cabbage: '🥬', carrot: '🥕', pepper: '🌶️', garlic: '🧄', ginger: '🫚',
    onion: '🧅', cucumber: '🥒', radish: '🫚', apple: '🍎', grape: '🍇',
    pineapple: '🍍', lemon: '🍋', tea: '🍵', milk: '🥛', rice: '🍚',
    soybean: '🫘', wheat: '🌾', honey: '🍯', sugar: '🧊',
    salt: '🧂', chili: '🌶️', mustard: '🟡', cumin: '🟤', turmeric: '🟡',
    coriander: '🟢', dill: '🌿', fennel: '🌱', cinnamon: '🟫',
    // Cultures
    whey: '💧', kefirGrains: '⚪', scoby: '🟠', koji: '🍄', starter: '🫧',
    // Vessels
    jar: '🫙', crock: '🏺', bottle: '🍾', barrel: '🛢️', pot: '🍯',
    // Misc
    thermometer: '🌡️', timer: '⏱️', scale: '⚖️', star: '⭐', lock: '🔒',
    check: '✓', cross: '✗', fire: '🔥', snowflake: '❄️', bubble: '🫧',
  },

  getIcon(id) {
    return this.icons[id] || '❓';
  }
};

window.GameData = GameData;
