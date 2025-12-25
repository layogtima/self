// ============================================
// CONSTANTS - Game Configuration
// ============================================

export const COLORS = {
  BG: "#FEF3E2", // Warm cream background
  YELLOW: "#FAB12F", // Healthy stats
  ORANGE: "#FA812F", // Warning stats
  RED: "#DD0303", // Critical stats / NO choice
  BLACK: "#000000", // Text, borders
  WHITE: "#FFFFFF", // Cards, accents
};

export const GAME_CONFIG = {
  STARTING_STATS: 50,
  STAT_MIN: 0,
  STAT_MAX: 100,
  SWIPE_THRESHOLD: 100, // Pixels to drag before committing
  DEFAULT_PLAYER_NAME: "Amit",
};

export const STAT_NAMES = {
  money: "Money",
  soul: "Soul",
  social: "Social",
  happiness: "Happiness",
};

export const STAT_ICONS = {
  money: "fa-indian-rupee-sign",
  soul: "fa-heart",
  social: "fa-people-group",
  happiness: "fa-face-smile",
};

// Stat thresholds for coloring
export const STAT_THRESHOLDS = {
  CRITICAL: 20, // 0-20: RED
  WARNING: 40, // 21-40: ORANGE
  HEALTHY: 80, // 80-100: YELLOW
  // 41-79: BLACK (default)
};
