/* THE FERMENT ALCHEMIST — Main App (Vue 3 Init) */

const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  template: `
    <div :class="{ dark: isDark }" class="font-sans">
      <!-- START SCREEN -->
      <start-screen
        v-if="screen === 'start'"
        :game-store="store"
        @navigate="navigateTo"
        @play-sound="playSound"
      />

      <!-- MODE SELECT -->
      <mode-select
        v-if="screen === 'mode-select'"
        :game-store="store"
        @navigate="navigateTo"
        @start-game="startGame"
        @play-sound="playSound"
      />

      <!-- PROGRESSION (Story Level Map) -->
      <progression-screen
        v-if="screen === 'progression'"
        :game-store="store"
        @navigate="navigateTo"
        @start-level="startStoryLevel"
        @play-sound="playSound"
      />

      <!-- MAIN GAME -->
      <game-screen
        v-if="screen === 'game'"
        :game-state="gameState"
        :game-store="store"
        @update:game-state="(s) => gameState = s"
        @navigate="navigateTo"
        @play-sound="playSound"
        @complete-order="handleOrderComplete"
      />

      <!-- RESULTS -->
      <results-screen
        v-if="screen === 'results'"
        :score="lastScore"
        :order="lastOrder"
        :mode="currentMode"
        :game-store="store"
        @continue="handleContinue"
        @retry="handleRetry"
        @navigate="navigateTo"
        @play-sound="playSound"
      />

      <!-- SANDBOX -->
      <sandbox-workbench
        v-if="screen === 'sandbox'"
        :game-store="store"
        @navigate="navigateTo"
        @play-sound="playSound"
        @save-store="saveStore"
      />

      <!-- LLM MODE -->
      <llm-mode
        v-if="screen === 'llm'"
        :game-store="store"
        @navigate="navigateTo"
        @play-sound="playSound"
        @save-store="saveStore"
      />

      <!-- SETTINGS -->
      <settings-panel
        v-if="screen === 'settings'"
        :game-store="store"
        @navigate="navigateTo"
        @save-store="saveStore"
        @play-sound="playSound"
      />

      <!-- HELP -->
      <help-overlay
        v-if="screen === 'help'"
        @close="navigateTo(previousScreen || 'start')"
        @play-sound="playSound"
      />
    </div>
  `,

  setup() {
    // ─── State ──────────────────────────────────────────
    const store = reactive(GameStore.load());
    const screen = ref('start');
    const previousScreen = ref(null);
    const gameState = ref(null);
    const lastScore = ref(null);
    const lastOrder = ref(null);
    const currentMode = ref('story');

    // ─── Theme ──────────────────────────────────────────
    const isDark = computed(() => {
      if (store.settings.theme === 'dark') return true;
      if (store.settings.theme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // ─── Navigation ─────────────────────────────────────
    function navigateTo(target) {
      previousScreen.value = screen.value;
      screen.value = target;

      // Push hash state for back-button support
      const hash = `#/${target}`;
      if (window.location.hash !== hash) {
        history.pushState({ screen: target }, '', hash);
      }
    }

    // Handle browser back button
    window.addEventListener('popstate', (e) => {
      if (e.state?.screen) {
        screen.value = e.state.screen;
      } else {
        const hash = window.location.hash.replace('#/', '');
        if (hash && ['start', 'mode-select', 'game', 'results', 'progression', 'sandbox', 'llm', 'settings', 'help'].includes(hash)) {
          screen.value = hash;
        } else {
          screen.value = 'start';
        }
      }
    });

    // Restore from URL hash on load
    onMounted(() => {
      const hash = window.location.hash.replace('#/', '');
      if (hash === 'mode-select' || hash === 'sandbox' || hash === 'llm' || hash === 'settings') {
        screen.value = hash;
      }

      // Apply theme on load
      if (isDark.value) {
        document.documentElement.classList.add('dark');
      }

      // Load recipe bridge in background
      RecipeBridge.load();

      // Apply audio settings
      GameData.setAudioEnabled(store.settings.soundEnabled);
      GameData.setMusicEnabled(store.settings.musicEnabled);
    });

    // ─── Game Start ─────────────────────────────────────
    function startGame(mode) {
      currentMode.value = mode;

      if (mode === 'story') {
        navigateTo('progression');
        return;
      }

      if (mode === 'sandbox') {
        navigateTo('sandbox');
        GameData.playMusic('bg-music-sandbox');
        return;
      }

      if (mode === 'llm') {
        navigateTo('llm');
        return;
      }

      if (mode === 'endless') {
        startEndlessRound();
        return;
      }
    }

    function startStoryLevel({ chapter, level }) {
      currentMode.value = 'story';
      const order = GameEngine.getStoryOrder(level);
      if (!order) return;

      gameState.value = GameEngine.createGameState('story', { level, chapter });
      gameState.value.currentOrder = order;
      gameState.value.orderStartTime = Date.now();

      // Set default parameters from technique
      const tech = GameTechniques.getById(order.requiredTechnique);
      if (tech) {
        gameState.value.playerChoices.saltPercent = tech.defaultSaltPercent;
        gameState.value.playerChoices.temperature = Math.round((tech.tempRange[0] + tech.tempRange[1]) / 2);
        gameState.value.playerChoices.time = Math.round((tech.timeRange[0] + tech.timeRange[1]) / 2);
      }

      GameData.playMusic('bg-music-gameplay');
      navigateTo('game');
    }

    function startEndlessRound() {
      const ordersCompleted = store.endless.totalOrdersServed || 0;
      const playerLevel = store.player.level || 1;
      const order = GameEngine.generateEndlessOrder(ordersCompleted, playerLevel);

      gameState.value = GameEngine.createGameState('endless');
      gameState.value.currentOrder = order;
      gameState.value.orderStartTime = Date.now();
      gameState.value.ordersCompleted = ordersCompleted;

      const tech = GameTechniques.getById(order.requiredTechnique);
      if (tech) {
        gameState.value.playerChoices.saltPercent = tech.defaultSaltPercent;
        gameState.value.playerChoices.temperature = Math.round((tech.tempRange[0] + tech.tempRange[1]) / 2);
        gameState.value.playerChoices.time = Math.round((tech.timeRange[0] + tech.timeRange[1]) / 2);
      }

      GameData.playMusic('bg-music-gameplay');
      navigateTo('game');
    }

    // ─── Order Completion ───────────────────────────────
    function handleOrderComplete() {
      if (!gameState.value) return;

      const score = GameEngine.calculateScore(gameState.value);
      lastScore.value = score;
      lastOrder.value = gameState.value.currentOrder;

      // Update player XP
      const isFirst = currentMode.value === 'story' &&
        !store.story.levels[`${gameState.value.storyChapter}-${gameState.value.storyLevel}`]?.completed;
      const xp = GameScoring.calculateXP(score.grade, isFirst, currentMode.value);
      store.player.xp += xp;
      store.player.totalOrdersCompleted++;

      if (score.total === 100) store.player.perfectScores++;

      // Update player level/title
      const titleInfo = GameData.getTitleForXP(store.player.xp);
      store.player.level = titleInfo.level;
      store.player.title = titleInfo.title;

      // Mode-specific updates
      if (currentMode.value === 'story') {
        const key = `${gameState.value.storyChapter}-${gameState.value.storyLevel}`;
        const existing = store.story.levels[key];
        const stars = score.stars;

        if (!existing || score.total > (existing.score || 0)) {
          store.story.levels[key] = {
            grade: score.grade,
            score: score.total,
            stars,
            completed: score.grade !== 'F',
          };
        }

        // Recalculate total stars
        let totalStars = 0;
        for (const k of Object.keys(store.story.levels)) {
          totalStars += store.story.levels[k]?.stars || 0;
        }
        store.story.totalStars = totalStars;

        // Advance current level if completed
        if (score.grade !== 'F' && gameState.value.storyLevel >= store.story.currentLevel) {
          store.story.currentLevel = gameState.value.storyLevel + 1;
          const nextOrder = GameOrders.getByLevel(gameState.value.storyLevel + 1);
          if (nextOrder && nextOrder.chapter > store.story.currentChapter) {
            store.story.currentChapter = nextOrder.chapter;
          }
        }
      }

      if (currentMode.value === 'endless') {
        store.endless.totalOrdersServed++;
        store.endless.highScore = Math.max(store.endless.highScore, score.total);
        if (score.grade !== 'F') {
          gameState.value.streak++;
          store.endless.longestStreak = Math.max(store.endless.longestStreak, gameState.value.streak);
        } else {
          gameState.value.streak = 0;
        }
      }

      saveStore();
      GameData.playMusic('bg-music-results');
      navigateTo('results');
    }

    function handleContinue() {
      if (currentMode.value === 'story') {
        navigateTo('progression');
      } else if (currentMode.value === 'endless') {
        startEndlessRound();
      } else {
        navigateTo('mode-select');
      }
    }

    function handleRetry() {
      if (currentMode.value === 'story' && lastOrder.value) {
        startStoryLevel({
          chapter: lastOrder.value.chapter,
          level: lastOrder.value.level,
        });
      } else if (currentMode.value === 'endless') {
        startEndlessRound();
      }
    }

    // ─── Persistence ────────────────────────────────────
    function saveStore() {
      GameStore.save(store);
    }

    // Auto-save on changes
    watch(store, () => { saveStore(); }, { deep: true });

    // ─── Audio ──────────────────────────────────────────
    function playSound(soundId) {
      GameData.playSound(soundId);
    }

    // ─── Theme reactivity ───────────────────────────────
    watch(isDark, (dark) => {
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    });

    return {
      store,
      screen,
      previousScreen,
      gameState,
      lastScore,
      lastOrder,
      currentMode,
      isDark,
      navigateTo,
      startGame,
      startStoryLevel,
      handleOrderComplete,
      handleContinue,
      handleRetry,
      saveStore,
      playSound,
    };
  },
});

// ─── Register Components ──────────────────────────────
app.component('start-screen', StartScreen);
app.component('mode-select', ModeSelect);
app.component('progression-screen', ProgressionScreen);
app.component('game-screen', GameScreen);
app.component('order-card', OrderCard);
app.component('ingredient-picker', IngredientPicker);
app.component('technique-picker', TechniquePicker);
app.component('vessel-picker', VesselPicker);
app.component('fermentation-monitor', FermentationMonitor);
app.component('results-screen', ResultsScreen);
app.component('sandbox-workbench', SandboxWorkbench);
app.component('llm-mode', LlmMode);
app.component('settings-panel', SettingsPanel);
app.component('help-overlay', HelpOverlay);

// ─── Error Handler ──────────────────────────────────
app.config.errorHandler = (err, vm, info) => {
  console.error('[FermentAlchemist] Error:', err, info);
};

// ─── Mount ──────────────────────────────────────────
app.mount('#game-app');
