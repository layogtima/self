// ============================================
// APP.JS - Vue Application (UI Only)
// ============================================

import { Storage } from "./storage.js";
import { GameLogic } from "./game-logic.js";
import { GAME_CONFIG, STAT_ICONS, COLORS } from "./constants.js";

// Import game data from window (loaded via script tag)
const { CHARACTERS, CARD_TYPES, CARDS, GAME_OVER_MESSAGES } = window.gameData;

const { createApp } = Vue;

createApp({
  data() {
    return {
      // Game state
      gameState: "start", // 'start', 'playing', 'gameover'
      stats: {
        money: GAME_CONFIG.STARTING_STATS,
        soul: GAME_CONFIG.STARTING_STATS,
        social: GAME_CONFIG.STARTING_STATS,
        happiness: GAME_CONFIG.STARTING_STATS,
      },

      // Player info
      playerName: "",
      isEditingName: false,

      // Card management
      cards: [],
      currentCardIndex: 0,
      choicesMade: 0,

      // Drag state
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,

      // Game over
      gameOverReason: "",
      isNewHighScore: false,
      deadStat: null,

      // High score
      highScore: 0,

      // Colors from constants
      colors: COLORS,
    };
  },

  computed: {
    currentCard() {
      return this.cards[this.currentCardIndex] || null;
    },

    nextCard() {
      return this.cards[this.currentCardIndex + 1] || null;
    },

    cardStyle() {
      if (!this.isDragging) return {};

      const x = this.currentX - this.startX;
      const y = this.currentY - this.startY;
      const rotation = x * 0.1;

      return {
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        transition: "none",
      };
    },

    leftChoiceOpacity() {
      if (!this.isDragging) return 0;
      const x = this.currentX - this.startX;
      return x < 0 ? Math.min(Math.abs(x) / 100, 1) : 0;
    },

    rightChoiceOpacity() {
      if (!this.isDragging) return 0;
      const x = this.currentX - this.startX;
      return x > 0 ? Math.min(x / 100, 1) : 0;
    },

    statIcons() {
      return STAT_ICONS;
    },
  },

  methods: {
    // ==================== GAME FLOW ====================

    startGame() {
      Storage.init();

      if (this.playerName.trim()) {
        Storage.setPlayerName(this.playerName.trim());
      }

      Storage.incrementGames();
      Storage.updateLastPlayed();

      this.cards = GameLogic.shuffleCards(CARDS);
      this.gameState = "playing";
      this.currentCardIndex = 0;
      this.choicesMade = 0;
      this.resetStats();
    },

    resetStats() {
      this.stats = {
        money: GAME_CONFIG.STARTING_STATS,
        soul: GAME_CONFIG.STARTING_STATS,
        social: GAME_CONFIG.STARTING_STATS,
        happiness: GAME_CONFIG.STARTING_STATS,
      };
    },

    restartGame() {
      this.gameState = "start";
      this.isNewHighScore = false;
      this.gameOverReason = "";
      this.deadStat = null;
      this.loadHighScore();
    },

    // ==================== NAME EDITING ====================

    toggleNameEdit() {
      this.isEditingName = !this.isEditingName;
      if (!this.isEditingName && this.playerName.trim()) {
        Storage.setPlayerName(this.playerName.trim());
      }
    },

    // ==================== DRAGGING ====================

    startDrag(e) {
      if (this.gameState !== "playing" || !this.currentCard) return;

      this.isDragging = true;

      if (e.type === "mousedown") {
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = e.clientX;
        this.currentY = e.clientY;

        document.addEventListener("mousemove", this.onDrag);
        document.addEventListener("mouseup", this.endDrag);
      } else if (e.type === "touchstart") {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;

        document.addEventListener("touchmove", this.onDrag, { passive: false });
        document.addEventListener("touchend", this.endDrag);
      }
    },

    onDrag(e) {
      if (!this.isDragging) return;

      e.preventDefault();

      if (e.type === "mousemove") {
        this.currentX = e.clientX;
        this.currentY = e.clientY;
      } else if (e.type === "touchmove") {
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;
      }
    },

    endDrag() {
      if (!this.isDragging) return;

      const deltaX = this.currentX - this.startX;

      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.endDrag);
      document.removeEventListener("touchmove", this.onDrag);
      document.removeEventListener("touchend", this.endDrag);

      if (Math.abs(deltaX) > GAME_CONFIG.SWIPE_THRESHOLD) {
        this.commitChoice(deltaX < 0 ? "left" : "right");
      } else {
        this.returnCard();
      }

      this.isDragging = false;
    },

    returnCard() {
      const card = this.$refs.card;
      if (card) {
        card.classList.add("returning");
        setTimeout(() => {
          card.classList.remove("returning");
        }, 300);
      }
    },

    // ==================== CHOICE PROCESSING ====================

    commitChoice(direction) {
      const card = this.$refs.card;
      if (!card) return;

      card.classList.add("swiping-out");

      const effect =
        direction === "left"
          ? this.currentCard.leftEffect
          : this.currentCard.rightEffect;

      this.stats = GameLogic.applyEffect(this.stats, effect);
      this.choicesMade++;

      const gameOverCheck = GameLogic.checkGameOver(this.stats);

      if (gameOverCheck) {
        setTimeout(() => {
          this.handleGameOver(gameOverCheck.stat);
        }, 300);
      } else {
        setTimeout(() => {
          this.nextCardFn();
        }, 300);
      }
    },

    nextCardFn() {
      this.currentCardIndex++;

      if (this.currentCardIndex >= this.cards.length) {
        this.handleVictory();
        return;
      }

      this.$nextTick(() => {
        const card = this.$refs.card;
        if (card) {
          card.classList.remove("swiping-out");
          card.classList.add("card-enter");
          setTimeout(() => {
            card.classList.remove("card-enter");
          }, 400);
        }
      });
    },

    // ==================== GAME OVER ====================

    handleGameOver(deadStat) {
      this.gameState = "gameover";
      this.deadStat = deadStat;

      this.gameOverReason = this.getContextualEnding(deadStat);

      Storage.recordDeath(deadStat);

      this.isNewHighScore = Storage.saveScore(this.choicesMade);

      this.loadHighScore();
    },

    handleVictory() {
      this.gameState = "gameover";
      this.deadStat = "victory";

      const endings = GAME_OVER_MESSAGES.victory || [];
      const avgStats = Object.values(this.stats).reduce((a, b) => a + b, 0) / 4;

      if (avgStats >= 70 && endings[0]) {
        this.gameOverReason = endings[0];
      } else if (avgStats >= 40 && endings[1]) {
        this.gameOverReason = endings[1];
      } else if (endings[2]) {
        this.gameOverReason = endings[2];
      } else {
        this.gameOverReason = "You survived! Congratulations! 🎉";
      }

      this.isNewHighScore = Storage.saveScore(this.choicesMade);

      this.loadHighScore();
    },

    getContextualEnding(deadStat) {
      const endings = GAME_OVER_MESSAGES[deadStat];

      if (!endings || endings.length === 0) {
        return GameLogic.getGameOverReason(deadStat, this.stats);
      }

      return endings[Math.floor(Math.random() * endings.length)];
    },

    // ==================== STATS ====================

    getStatColor(value) {
      return GameLogic.getStatColor(value);
    },

    getStatHeight(value) {
      return `${value}%`;
    },

    // ==================== CHARACTER/IMAGE ====================

    getCardImage() {
      if (!this.currentCard) return "";

      if (this.currentCard.character) {
        const char = this.currentCard.character;
        return char.image ? `images/characters/${char.image}` : "";
      }

      if (this.currentCard.incident) {
        return `images/incidents/${this.currentCard.incident}.png`;
      }

      return "";
    },

    getCardIcon() {
      if (!this.currentCard) return "❓";

      if (this.currentCard.character) {
        return this.currentCard.character.icon;
      }

      return "⚠️";
    },

    getCardTitle() {
      if (!this.currentCard) return "";

      if (this.currentCard.character) {
        return this.currentCard.character.name;
      }

      if (this.currentCard.incidentTitle) {
        return this.currentCard.incidentTitle;
      }

      return "";
    },

    // ==================== HIGH SCORE ====================

    loadHighScore() {
      this.highScore = Storage.getHighScore();
    },
  },

  mounted() {
    Storage.init();

    this.playerName = Storage.getPlayerName();

    this.loadHighScore();
  },

  beforeUnmount() {
    document.removeEventListener("mousemove", this.onDrag);
    document.removeEventListener("mouseup", this.endDrag);
    document.removeEventListener("touchmove", this.onDrag);
    document.removeEventListener("touchend", this.endDrag);
  },
}).mount("#app");
