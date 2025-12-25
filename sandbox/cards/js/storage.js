// ============================================
// STORAGE - localStorage Management
// ============================================

import { GAME_CONFIG } from "./constants.js";

const STORAGE_KEYS = {
  PLAYER_NAME: "if_choice_player_name",
  HIGH_SCORE: "if_choice_high_score",
  TOTAL_GAMES: "if_choice_total_games",
  LAST_PLAYED: "if_choice_last_played",
  DEATH_STATS: "if_choice_death_stats",
};

export const Storage = {
  /**
   * Initialize storage with defaults if empty
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)) {
      this.setPlayerName(GAME_CONFIG.DEFAULT_PLAYER_NAME);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, "0");
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOTAL_GAMES)) {
      localStorage.setItem(STORAGE_KEYS.TOTAL_GAMES, "0");
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEATH_STATS)) {
      localStorage.setItem(
        STORAGE_KEYS.DEATH_STATS,
        JSON.stringify({
          money: 0,
          soul: 0,
          social: 0,
          happiness: 0,
        })
      );
    }
  },

  /**
   * Get player name
   * @returns {string}
   */
  getPlayerName() {
    return (
      localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) ||
      GAME_CONFIG.DEFAULT_PLAYER_NAME
    );
  },

  /**
   * Set player name
   * @param {string} name
   */
  setPlayerName(name) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  },

  /**
   * Get high score
   * @returns {number}
   */
  getHighScore() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || "0");
  },

  /**
   * Check if current score is a new high score and save it
   * @param {number} score
   * @returns {boolean} True if new high score
   */
  saveScore(score) {
    const currentHigh = this.getHighScore();
    if (score > currentHigh) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
      return true; // New high score!
    }
    return false;
  },

  /**
   * Get total games played
   * @returns {number}
   */
  getTotalGames() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_GAMES) || "0");
  },

  /**
   * Increment total games counter
   */
  incrementGames() {
    const current = this.getTotalGames();
    localStorage.setItem(STORAGE_KEYS.TOTAL_GAMES, (current + 1).toString());
  },

  /**
   * Get last played timestamp
   * @returns {string|null}
   */
  getLastPlayed() {
    return localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
  },

  /**
   * Update last played timestamp
   */
  updateLastPlayed() {
    localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, new Date().toISOString());
  },

  /**
   * Get death statistics
   * @returns {Object}
   */
  getDeathStats() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEATH_STATS) || "{}");
  },

  /**
   * Record a death by specific stat
   * @param {string} statName - 'money', 'soul', 'social', or 'happiness'
   */
  recordDeath(statName) {
    const stats = this.getDeathStats();
    stats[statName] = (stats[statName] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.DEATH_STATS, JSON.stringify(stats));
  },

  /**
   * Clear all game data (for reset)
   */
  clearAll() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.init(); // Reinitialize with defaults
  },
};
