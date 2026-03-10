/* THE FERMENT ALCHEMIST — LLM Mode (JSON API + Text Adventure) */

const LlmMode = {
  name: 'LlmMode',
  props: ['gameStore'],
  emits: ['navigate', 'play-sound', 'save-store'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <button class="game-btn game-btn-ghost" @click="$emit('navigate', 'mode-select')">← Menu</button>
        <h2 class="font-serif text-xl" style="color: var(--ink-primary)">🤖 LLM Mode</h2>
        <div class="flex gap-1">
          <button
            class="game-btn game-btn-ghost text-xs"
            :class="{ 'opacity-40': interfaceMode !== 'text' }"
            @click="interfaceMode = 'text'"
          >TXT</button>
          <button
            class="game-btn game-btn-ghost text-xs"
            :class="{ 'opacity-40': interfaceMode !== 'json' }"
            @click="interfaceMode = 'json'"
          >JSON</button>
        </div>
      </div>

      <!-- Mode Description -->
      <div class="game-card-inset p-3 mb-4 text-xs" style="color: var(--ink-secondary)">
        <div v-if="interfaceMode === 'text'">
          <strong>Text Adventure Mode:</strong> Play through natural language commands.
          Type commands like <code>add:cabbage</code>, <code>select_technique:dry-salt</code>, <code>set_salt:2.5</code>
        </div>
        <div v-else>
          <strong>JSON API Mode:</strong> Machine-readable interface. Send actions as JSON,
          receive structured state responses. Copy the state for your LLM prompt.
        </div>
      </div>

      <!-- Terminal / Console -->
      <div class="llm-terminal mb-4" ref="terminal" style="min-height: 300px;">
        <div v-for="(entry, idx) in transcript" :key="idx" class="mb-2">
          <div v-if="entry.type === 'system'" class="llm-system">{{ entry.text }}</div>
          <div v-else-if="entry.type === 'narrative'" class="llm-response whitespace-pre-wrap">{{ entry.text }}</div>
          <div v-else-if="entry.type === 'json'" class="llm-json"><pre class="overflow-x-auto">{{ entry.text }}</pre></div>
          <div v-else-if="entry.type === 'input'" class="llm-prompt">
            <span style="color: #C4A35A;">&gt; </span>{{ entry.text }}
          </div>
          <div v-else-if="entry.type === 'error'" style="color: #D4553A;">{{ entry.text }}</div>
          <div v-else-if="entry.type === 'score'" class="mt-2">
            <div style="color: #C4A35A; font-weight: bold;">═══ RESULTS ═══</div>
            <pre class="llm-json overflow-x-auto">{{ entry.text }}</pre>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          ref="commandInput"
          v-model="currentCommand"
          @keyup.enter="submitCommand"
          class="flex-1 p-3 rounded-lg text-sm font-mono"
          style="background: #1a1a2e; color: #a8e6cf; border: 1px solid #333;"
          :placeholder="interfaceMode === 'text' ? 'Type a command...' : 'Enter JSON action...'"
        >
        <button class="game-btn game-btn-primary" @click="submitCommand">Send</button>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2 mt-3">
        <button
          v-for="action in quickActions"
          :key="action"
          class="game-chip text-xs"
          @click="currentCommand = action; submitCommand()"
        >{{ action }}</button>
      </div>

      <!-- Utility Buttons -->
      <div class="flex gap-2 mt-4">
        <button class="game-btn game-btn-secondary flex-1 text-xs" @click="copyState">
          📋 Copy State
        </button>
        <button class="game-btn game-btn-secondary flex-1 text-xs" @click="copyTranscript">
          📝 Copy Transcript
        </button>
        <button class="game-btn game-btn-secondary flex-1 text-xs" @click="newGame">
          🔄 New Game
        </button>
      </div>

      <!-- System Prompt Template -->
      <details class="mt-4 text-xs" style="color: var(--ink-muted)">
        <summary class="cursor-pointer hover:underline">System Prompt Template (for your LLM)</summary>
        <div class="llm-terminal mt-2 text-xs">
          <pre class="whitespace-pre-wrap">{{ systemPromptTemplate }}</pre>
        </div>
      </details>
    </div>
  `,

  data() {
    return {
      interfaceMode: 'text', // 'text' | 'json'
      currentCommand: '',
      transcript: [],
      gameState: null,
    };
  },

  computed: {
    quickActions() {
      if (!this.gameState) return ['accept_order'];
      return GameEngine.getAvailableActions(this.gameState).slice(0, 6);
    },

    systemPromptTemplate() {
      return `You are playing "The Ferment Alchemist", a fermentation game.

GAME RULES:
- You receive orders from customers requesting specific fermented foods
- You must select ingredients, choose a fermentation technique, set parameters (salt %, temperature, time), and select a vessel
- You are scored on: ingredient accuracy (40pts), technique (20pts), parameters (30pts), vessel choice (5pts), speed (5pts)

COMMANDS:
- accept_order: Accept the current order
- add:<ingredient_id>: Add an ingredient (e.g., add:cabbage)
- remove:<ingredient_id>: Remove an ingredient
- confirm_ingredients: Move to technique selection
- select_technique:<id>: Choose technique (dry-salt, brine-submerge, paste-ferment, culture-inoculate, sugar-ferment, scoby-brew, koji-cultivation, mixed-ferment)
- set_salt:<value>: Set salt % (e.g., set_salt:2.5)
- set_temperature:<value>: Set temperature in °C
- set_time:<value>: Set fermentation time
- select_vessel:<id>: Choose vessel (mason-jar, fermentation-crock, swing-top-bottle, onggi, glass-jar-airlock, ceramic-bowl, oak-barrel, koji-tray)
- confirm_parameters: Begin fermentation
- wait: Wait for fermentation to complete
- serve: Serve the result

CURRENT STATE:
${this.gameState ? JSON.stringify(GameEngine.serializeStateForLLM(this.gameState), null, 2) : '(start a new game)'}

Play optimally based on the customer's request. Think about real fermentation science.`;
    },
  },

  methods: {
    initGame() {
      this.gameState = GameEngine.createGameState('story', { level: 1, chapter: 1 });
      const order = GameEngine.getStoryOrder(1);
      this.gameState.currentOrder = order;
      this.gameState.orderStartTime = Date.now();

      this.transcript = [];
      this.addSystemMessage('The Ferment Alchemist — LLM Mode initialized');
      this.addSystemMessage(`Interface: ${this.interfaceMode === 'text' ? 'Text Adventure' : 'JSON API'}`);

      if (this.interfaceMode === 'text') {
        this.addNarrative(GameEngine.narrateState(this.gameState));
      } else {
        this.addJSON(GameEngine.serializeStateForLLM(this.gameState));
      }
    },

    submitCommand() {
      const cmd = this.currentCommand.trim();
      if (!cmd) return;

      this.addInput(cmd);
      this.currentCommand = '';

      if (!this.gameState) {
        this.addError('No game in progress. Click "New Game" to start.');
        return;
      }

      const result = GameEngine.processLLMCommand(this.gameState, cmd);

      if (result.success) {
        if (this.interfaceMode === 'text') {
          this.addNarrative(result.message);
          if (result.stateChanged) {
            this.addNarrative(GameEngine.narrateState(this.gameState));
          }
        } else {
          this.addNarrative(result.message);
          if (result.state) {
            this.addJSON(result.state);
          }
        }

        if (result.score) {
          this.addScore(result.score);
          // Auto-start next level
          setTimeout(() => {
            this.addSystemMessage('Game complete! Type any command to start a new round, or click "New Game".');
          }, 500);
        }
      } else {
        this.addError(result.message);
      }

      this.scrollToBottom();
    },

    addSystemMessage(text) { this.transcript.push({ type: 'system', text }); },
    addNarrative(text) { this.transcript.push({ type: 'narrative', text }); },
    addJSON(obj) { this.transcript.push({ type: 'json', text: JSON.stringify(obj, null, 2) }); },
    addInput(text) { this.transcript.push({ type: 'input', text }); },
    addError(text) { this.transcript.push({ type: 'error', text }); },
    addScore(score) { this.transcript.push({ type: 'score', text: JSON.stringify(score, null, 2) }); },

    scrollToBottom() {
      this.$nextTick(() => {
        const terminal = this.$refs.terminal;
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      });
    },

    copyState() {
      if (!this.gameState) return;
      const state = JSON.stringify(GameEngine.serializeStateForLLM(this.gameState), null, 2);
      navigator.clipboard?.writeText(state).then(() => {
        this.addSystemMessage('State copied to clipboard.');
      });
    },

    copyTranscript() {
      const text = this.transcript.map(e => {
        if (e.type === 'input') return `> ${e.text}`;
        return e.text;
      }).join('\n\n');
      navigator.clipboard?.writeText(text).then(() => {
        this.addSystemMessage('Transcript copied to clipboard.');
      });
    },

    newGame() {
      const levels = GameOrders.orders;
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      this.gameState = GameEngine.createGameState('story', { level: randomLevel.level, chapter: randomLevel.chapter });
      this.gameState.currentOrder = randomLevel;
      this.gameState.orderStartTime = Date.now();

      this.transcript = [];
      this.addSystemMessage(`New game started — ${randomLevel.title}`);

      if (this.interfaceMode === 'text') {
        this.addNarrative(GameEngine.narrateState(this.gameState));
      } else {
        this.addJSON(GameEngine.serializeStateForLLM(this.gameState));
      }
    },
  },

  mounted() {
    this.initGame();
    this.$nextTick(() => {
      this.$refs.commandInput?.focus();
    });
  }
};

window.LlmMode = LlmMode;
