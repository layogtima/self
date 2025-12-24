const { createApp } = Vue;

// Fisher-Yates shuffle algorithm for randomizing cards
function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

createApp({
  data() {
    return {
      stats: {
        money: 50,
        soul: 50,
        social: 50,
        happiness: 50,
      },

      currentCardIndex: 0,
      cardsPlayed: 0,
      gameOver: false,
      gameOverReason: "",
      decisionHistory: [], // Track past choices for consequences

      // Drag state
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,

      cards: shuffleArray(CARDS), // Randomize cards on game start!
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
      const rotation = x * 0.1; // Rotate based on horizontal movement

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
  },

  methods: {
    getStatColor(value) {
      if (value <= 20) return "text-red-600";
      if (value <= 40) return "text-orange-600";
      if (value >= 80) return "text-green-600";
      return "text-white";
    },

    startDrag(e) {
      if (this.gameOver) return;

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
      const threshold = 100; // Pixels to swipe before committing

      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.endDrag);
      document.removeEventListener("touchmove", this.onDrag);
      document.removeEventListener("touchend", this.endDrag);

      if (Math.abs(deltaX) > threshold) {
        // Commit the swipe
        this.commitSwipe(deltaX < 0 ? "left" : "right");
      } else {
        // Return to center
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

    commitSwipe(direction) {
      const card = this.$refs.card;
      if (!card) return;

      card.classList.add("swiping-out");

      // Apply effect
      const effect =
        direction === "left"
          ? this.currentCard.leftEffect
          : this.currentCard.rightEffect;

      this.applyEffect(effect);

      // Wait for animation, then next card
      setTimeout(() => {
        this.nextCardFn();
      }, 300);
    },

    applyEffect(effect) {
      Object.keys(effect).forEach((stat) => {
        this.stats[stat] = Math.max(
          0,
          Math.min(100, this.stats[stat] + effect[stat])
        );
      });

      this.cardsPlayed++;
      this.checkGameOver();
    },

    nextCardFn() {
      this.currentCardIndex++;

      if (this.currentCardIndex >= this.cards.length) {
        this.gameOver = true;
        this.gameOverReason = "You survived the startup gauntlet! Legend! 🏆";
      }

      // Remove animation class if it exists
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

    checkGameOver() {
      if (this.stats.money <= 0) {
        this.gameOver = true;
        this.gameOverReason = "Bankrupt. Time to pivot to Web3! 🪙";
      } else if (this.stats.soul <= 0) {
        this.gameOver = true;
        this.gameOverReason = "Soul crushed. You're now a tech bro husk. 💀";
      } else if (this.stats.social <= 0) {
        this.gameOver = true;
        this.gameOverReason = "Everyone unfollowed you. Even your mom. 👻";
      } else if (this.stats.happiness <= 0) {
        this.gameOver = true;
        this.gameOverReason =
          "Clinical depression achieved. LinkedIn says 'congrats!' 😭";
      }
    },

    restart() {
      this.stats = {
        money: 50,
        soul: 50,
        social: 50,
        happiness: 50,
      };
      this.currentCardIndex = 0;
      this.cardsPlayed = 0;
      this.gameOver = false;
      this.gameOverReason = "";
      this.isDragging = false;
      this.cards = shuffleArray(CARDS); // Re-shuffle for a fresh playthrough!
    },
  },

  beforeUnmount() {
    // Cleanup listeners
    document.removeEventListener("mousemove", this.onDrag);
    document.removeEventListener("mouseup", this.endDrag);
    document.removeEventListener("touchmove", this.onDrag);
    document.removeEventListener("touchend", this.endDrag);
  },
}).mount("#app");
