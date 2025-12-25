// ============================================
// GAME LOGIC - Pure Functions (No Vue, No DOM)
// ============================================

import { GAME_CONFIG, STAT_THRESHOLDS, COLORS } from "./constants.js";

export const GameLogic = {
  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled copy of array
   */
  shuffleCards(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Apply stat effect and clamp between min/max
   * @param {Object} currentStats - Current stat object
   * @param {Object} effect - Effect to apply
   * @returns {Object} New stats object
   */
  applyEffect(currentStats, effect) {
    const newStats = { ...currentStats };

    Object.keys(effect).forEach((stat) => {
      if (newStats.hasOwnProperty(stat)) {
        newStats[stat] = Math.max(
          GAME_CONFIG.STAT_MIN,
          Math.min(GAME_CONFIG.STAT_MAX, newStats[stat] + effect[stat])
        );
      }
    });

    return newStats;
  },

  /**
   * Check if game is over based on stats
   * @param {Object} stats - Current stats
   * @returns {Object|null} { stat: 'money', reason: '...' } or null
   */
  checkGameOver(stats) {
    const deadStat = Object.keys(stats).find((stat) => stats[stat] <= 0);

    if (deadStat) {
      return {
        stat: deadStat,
        reason: this.getGameOverReason(deadStat, stats),
      };
    }

    return null;
  },

  /**
   * Get game over reason based on which stat killed you
   * @param {string} deadStat - The stat that hit 0
   * @param {Object} stats - All stats
   * @returns {string} Game over message
   */
  getGameOverReason(deadStat, stats) {
    // This gets replaced by contextual endings from data.js
    // But keeping as fallback
    const defaults = {
      money: "Bankrupt. Time to pivot to Web3! 🪙",
      soul: "Soul crushed. You're now a tech bro husk. 💀",
      social: "Everyone unfollowed you. Even your mom. 👻",
      happiness: "Clinical depression achieved. LinkedIn says 'congrats!' 😭",
    };

    return defaults[deadStat] || "Game Over!";
  },

  /**
   * Get contextual ending based on choices survived and how you died
   * @param {string} deadStat - The stat that killed you
   * @param {number} choicesMade - Number of choices survived
   * @param {Object} allStats - All final stats
   * @param {Object} endings - Endings object from data.js
   * @returns {string} Contextual ending message
   */
  getContextualEnding(deadStat, choicesMade, allStats, endings) {
    if (!endings || !endings[deadStat]) {
      return this.getGameOverReason(deadStat, allStats);
    }

    const statEndings = endings[deadStat];

    // Determine tier based on choices survived
    if (choicesMade >= 0 && choicesMade <= 10) {
      return statEndings.tier1 || statEndings.default;
    } else if (choicesMade >= 11 && choicesMade <= 30) {
      return statEndings.tier2 || statEndings.default;
    } else if (choicesMade >= 31 && choicesMade <= 50) {
      return statEndings.tier3 || statEndings.default;
    } else {
      return statEndings.tier4 || statEndings.default;
    }
  },

  /**
   * Get victory message (survived all cards)
   * @param {Object} finalStats - Final stats
   * @param {Object} endings - Endings object from data.js
   * @returns {string} Victory message
   */
  getVictoryMessage(finalStats, endings) {
    if (!endings || !endings.victory) {
      return "You survived! Congratulations, you absolute madlad! 🎉";
    }

    const avgStats = Object.values(finalStats).reduce((a, b) => a + b, 0) / 4;

    if (avgStats >= 70) {
      return endings.victory.high;
    } else if (avgStats >= 40) {
      return endings.victory.balanced;
    } else {
      return endings.victory.low;
    }
  },

  /**
   * Get stat color based on value
   * @param {number} value - Stat value 0-100
   * @returns {string} Color hex code
   */
  getStatColor(value) {
    if (value <= STAT_THRESHOLDS.CRITICAL) return COLORS.RED;
    if (value <= STAT_THRESHOLDS.WARNING) return COLORS.ORANGE;
    if (value >= STAT_THRESHOLDS.HEALTHY) return COLORS.YELLOW;
    return COLORS.BLACK;
  },

  /**
   * Get stat color Tailwind class
   * @param {number} value - Stat value 0-100
   * @returns {string} Tailwind color class
   */
  getStatColorClass(value) {
    if (value <= STAT_THRESHOLDS.CRITICAL) return "text-red-600";
    if (value <= STAT_THRESHOLDS.WARNING) return "text-orange-600";
    if (value >= STAT_THRESHOLDS.HEALTHY) return "text-yellow-600";
    return "text-black";
  },
};
