/* THE FERMENT ALCHEMIST — Core Game Engine */

const GameEngine = {
  // ─── State Machine ────────────────────────────────────
  // Game phases within a single order
  phases: ['order', 'ingredients', 'technique', 'parameters', 'fermenting', 'serving'],

  createGameState(mode, options = {}) {
    return {
      mode,              // 'story' | 'endless' | 'sandbox'
      phase: 'order',
      currentOrder: null,
      playerChoices: {
        ingredients: [],
        technique: null,
        vessel: null,
        saltPercent: 2.0,
        temperature: 20,
        time: 7,
      },
      // Fermentation progress (animated in FermentationMonitor)
      fermentProgress: 0,
      fermentStartTime: null,
      // Timing
      orderStartTime: null,
      // Endless mode
      streak: 0,
      ordersCompleted: 0,
      totalScore: 0,
      // Story mode
      storyLevel: options.level || 1,
      storyChapter: options.chapter || 1,
    };
  },

  // ─── Phase Transitions ────────────────────────────────
  canAdvancePhase(gameState) {
    switch (gameState.phase) {
      case 'order':
        return gameState.currentOrder !== null;
      case 'ingredients':
        return gameState.playerChoices.ingredients.length > 0;
      case 'technique':
        return gameState.playerChoices.technique !== null;
      case 'parameters':
        return gameState.playerChoices.vessel !== null;
      case 'fermenting':
        return gameState.fermentProgress >= 100;
      case 'serving':
        return true;
      default:
        return false;
    }
  },

  nextPhase(gameState) {
    const idx = this.phases.indexOf(gameState.phase);
    if (idx < this.phases.length - 1) {
      gameState.phase = this.phases[idx + 1];
      if (gameState.phase === 'fermenting') {
        gameState.fermentStartTime = Date.now();
        gameState.fermentProgress = 0;
      }
    }
    return gameState;
  },

  previousPhase(gameState) {
    const idx = this.phases.indexOf(gameState.phase);
    if (idx > 0 && gameState.phase !== 'fermenting' && gameState.phase !== 'serving') {
      gameState.phase = this.phases[idx - 1];
    }
    return gameState;
  },

  // ─── Order Generation ─────────────────────────────────

  getStoryOrder(level) {
    return GameOrders.getByLevel(level);
  },

  generateEndlessOrder(ordersCompleted, playerLevel) {
    const difficulty = GameScoring.getEndlessDifficulty(ordersCompleted);
    const availableOrders = GameOrders.orders.filter(o => {
      // Use orders from unlocked chapters based on player level
      const chapterForOrder = GameLevels.getChapter(o.chapter);
      if (!chapterForOrder) return false;
      // In endless mode, progressively unlock orders based on completion count
      const maxChapter = Math.min(5, Math.floor(ordersCompleted / 5) + 1);
      return o.chapter <= maxChapter;
    });

    if (availableOrders.length === 0) return GameOrders.orders[0];

    // Random selection with difficulty-adjusted tolerances
    const order = { ...availableOrders[Math.floor(Math.random() * availableOrders.length)] };

    // Tighten tolerances based on difficulty
    order.saltTolerance = (order.saltTolerance || 1) * difficulty.toleranceMultiplier;
    order.tempTolerance = (order.tempTolerance || 5) * difficulty.toleranceMultiplier;
    order.timeTolerance = (order.timeTolerance || 5) * difficulty.toleranceMultiplier;
    order._endlessDifficulty = difficulty;

    return order;
  },

  // ─── Score & Results ──────────────────────────────────

  calculateScore(gameState) {
    if (!gameState.currentOrder) return null;

    const elapsed = gameState.orderStartTime
      ? Math.round((Date.now() - gameState.orderStartTime) / 1000)
      : 0;

    return GameScoring.calculate(
      gameState.currentOrder,
      gameState.playerChoices,
      gameState.mode === 'endless' ? elapsed : 0
    );
  },

  // ─── Sandbox: Find Closest Recipe ─────────────────────

  findClosestRecipe(playerChoices) {
    // First try the recipe bridge (real recipes)
    const bridgeMatch = RecipeBridge.findClosestMatch(playerChoices);

    // Also check game orders for matches
    let bestOrder = null;
    let bestScore = -1;

    for (const order of GameOrders.orders) {
      let score = 0;
      const selectedIds = (playerChoices.ingredients || []).map(i => typeof i === 'string' ? i : i.id);

      for (const ing of (order.requiredIngredients || [])) {
        if (selectedIds.includes(ing)) score += 10;
      }
      if (playerChoices.technique === order.requiredTechnique) score += 20;

      if (score > bestScore) {
        bestScore = score;
        bestOrder = order;
      }
    }

    return {
      realRecipe: bridgeMatch,
      gameOrder: bestOrder ? { order: bestOrder, score: bestScore } : null,
    };
  },

  // ─── LLM Mode: State Serialization ───────────────────

  serializeStateForLLM(gameState) {
    return {
      mode: gameState.mode,
      phase: gameState.phase,
      order: gameState.currentOrder ? {
        title: gameState.currentOrder.title,
        customerName: gameState.currentOrder.customerName,
        request: gameState.currentOrder.request,
        hint: gameState.currentOrder.hint,
      } : null,
      choices: {
        ingredients: gameState.playerChoices.ingredients,
        technique: gameState.playerChoices.technique,
        vessel: gameState.playerChoices.vessel,
        saltPercent: gameState.playerChoices.saltPercent,
        temperature: gameState.playerChoices.temperature,
        time: gameState.playerChoices.time,
      },
      availableActions: this.getAvailableActions(gameState),
      fermentProgress: gameState.fermentProgress,
    };
  },

  getAvailableActions(gameState) {
    switch (gameState.phase) {
      case 'order':
        return ['accept_order'];
      case 'ingredients': {
        const available = GameIngredients.getAvailable(25); // All ingredients in LLM mode
        return ['add_ingredient', 'remove_ingredient', 'confirm_ingredients']
          .concat(available.map(i => `add:${i.id}`));
      }
      case 'technique': {
        const techniques = GameTechniques.items;
        return techniques.map(t => `select_technique:${t.id}`);
      }
      case 'parameters':
        return ['set_salt', 'set_temperature', 'set_time', 'select_vessel', 'confirm_parameters'];
      case 'fermenting':
        return ['wait', 'check_progress'];
      case 'serving':
        return ['serve'];
      default:
        return [];
    }
  },

  // Process a text command from LLM mode
  processLLMCommand(gameState, command) {
    const cmd = command.toLowerCase().trim();
    const response = { success: false, message: '', stateChanged: false };

    if (cmd === 'accept_order' && gameState.phase === 'order') {
      this.nextPhase(gameState);
      response.success = true;
      response.message = 'Order accepted. Choose your ingredients.';
      response.stateChanged = true;
    }
    else if (cmd.startsWith('add:') && gameState.phase === 'ingredients') {
      const ingId = cmd.slice(4);
      const ingredient = GameIngredients.getById(ingId);
      if (ingredient && !gameState.playerChoices.ingredients.includes(ingId)) {
        gameState.playerChoices.ingredients.push(ingId);
        response.success = true;
        response.message = `Added ${ingredient.name} to your workbench.`;
        response.stateChanged = true;
      } else {
        response.message = ingredient ? 'Already added.' : 'Unknown ingredient.';
      }
    }
    else if (cmd.startsWith('remove:') && gameState.phase === 'ingredients') {
      const ingId = cmd.slice(7);
      const idx = gameState.playerChoices.ingredients.indexOf(ingId);
      if (idx >= 0) {
        gameState.playerChoices.ingredients.splice(idx, 1);
        response.success = true;
        response.message = `Removed ${ingId} from your workbench.`;
        response.stateChanged = true;
      }
    }
    else if (cmd === 'confirm_ingredients' && gameState.phase === 'ingredients') {
      if (gameState.playerChoices.ingredients.length > 0) {
        this.nextPhase(gameState);
        response.success = true;
        response.message = 'Ingredients confirmed. Choose your fermentation technique.';
        response.stateChanged = true;
      } else {
        response.message = 'Add at least one ingredient first.';
      }
    }
    else if (cmd.startsWith('select_technique:') && gameState.phase === 'technique') {
      const techId = cmd.slice(17);
      const technique = GameTechniques.getById(techId);
      if (technique) {
        gameState.playerChoices.technique = techId;
        this.nextPhase(gameState);
        response.success = true;
        response.message = `Selected ${technique.name}. Set your parameters.`;
        response.stateChanged = true;
      }
    }
    else if (cmd.startsWith('set_salt:') && gameState.phase === 'parameters') {
      const val = parseFloat(cmd.slice(9));
      if (!isNaN(val) && val >= 0 && val <= 20) {
        gameState.playerChoices.saltPercent = val;
        response.success = true;
        response.message = `Salt set to ${val}%.`;
        response.stateChanged = true;
      }
    }
    else if (cmd.startsWith('set_temperature:') && gameState.phase === 'parameters') {
      const val = parseFloat(cmd.slice(16));
      if (!isNaN(val) && val >= 0 && val <= 80) {
        gameState.playerChoices.temperature = val;
        response.success = true;
        response.message = `Temperature set to ${val}°C.`;
        response.stateChanged = true;
      }
    }
    else if (cmd.startsWith('set_time:') && gameState.phase === 'parameters') {
      const val = parseFloat(cmd.slice(9));
      if (!isNaN(val) && val > 0) {
        gameState.playerChoices.time = val;
        response.success = true;
        response.message = `Fermentation time set to ${val} ${gameState.currentOrder?.timeUnit || 'days'}.`;
        response.stateChanged = true;
      }
    }
    else if (cmd.startsWith('select_vessel:') && gameState.phase === 'parameters') {
      const vesselId = cmd.slice(14);
      const vessel = GameVessels.getById(vesselId);
      if (vessel) {
        gameState.playerChoices.vessel = vesselId;
        response.success = true;
        response.message = `Selected ${vessel.name}.`;
        response.stateChanged = true;
      }
    }
    else if (cmd === 'confirm_parameters' && gameState.phase === 'parameters') {
      if (gameState.playerChoices.vessel) {
        this.nextPhase(gameState);
        response.success = true;
        response.message = 'Parameters set. Fermentation begins...';
        response.stateChanged = true;
      } else {
        response.message = 'Select a vessel first.';
      }
    }
    else if ((cmd === 'wait' || cmd === 'check_progress') && gameState.phase === 'fermenting') {
      gameState.fermentProgress = 100;
      this.nextPhase(gameState);
      response.success = true;
      response.message = 'Fermentation complete! Time to serve.';
      response.stateChanged = true;
    }
    else if (cmd === 'serve' && gameState.phase === 'serving') {
      const score = this.calculateScore(gameState);
      response.success = true;
      response.message = `Served! Score: ${score.total}/100 (Grade: ${score.grade})`;
      response.score = score;
      response.stateChanged = true;
    }
    else {
      response.message = `Invalid command for phase "${gameState.phase}". Available: ${this.getAvailableActions(gameState).join(', ')}`;
    }

    if (response.stateChanged) {
      response.state = this.serializeStateForLLM(gameState);
    }

    return response;
  },

  // Generate text narrative for LLM text-adventure mode
  narrateState(gameState) {
    const order = gameState.currentOrder;
    switch (gameState.phase) {
      case 'order':
        if (!order) return 'You stand in your fermentation workshop, awaiting the next customer...';
        return `${order.customerIcon} ${order.customerName} enters your workshop.\n\n"${order.request}"\n\nType 'accept_order' to begin.`;

      case 'ingredients': {
        const selected = gameState.playerChoices.ingredients;
        let text = `Your workbench awaits. ${order.customerName} needs: "${order.request}"\n\n`;
        if (selected.length > 0) {
          text += `On your workbench: ${selected.map(id => {
            const ing = GameIngredients.getById(id);
            return ing ? `${ing.icon} ${ing.name}` : id;
          }).join(', ')}\n\n`;
        }
        text += `Available ingredients: ${GameIngredients.getAvailable(25).map(i => `${i.icon} ${i.id}`).join(', ')}\n`;
        text += `\nCommands: add:<ingredient_id>, remove:<ingredient_id>, confirm_ingredients`;
        return text;
      }

      case 'technique':
        return `Ingredients ready. Choose your fermentation technique:\n\n${
          GameTechniques.items.map(t => `${t.icon} ${t.id} — ${t.name}: ${t.description}`).join('\n')
        }\n\nCommand: select_technique:<technique_id>`;

      case 'parameters': {
        const tech = GameTechniques.getById(gameState.playerChoices.technique);
        let text = `Technique: ${tech?.name || 'Unknown'}\n\n`;
        text += `Set your parameters:\n`;
        text += `  Salt: ${gameState.playerChoices.saltPercent}% (set_salt:<value>)\n`;
        text += `  Temperature: ${gameState.playerChoices.temperature}°C (set_temperature:<value>)\n`;
        text += `  Time: ${gameState.playerChoices.time} ${order?.timeUnit || 'days'} (set_time:<value>)\n`;
        text += `  Vessel: ${gameState.playerChoices.vessel || 'none'} (select_vessel:<vessel_id>)\n\n`;
        text += `Available vessels: ${GameVessels.items.map(v => `${v.icon} ${v.id}`).join(', ')}\n`;
        text += `\nCommand: confirm_parameters (when ready)`;
        return text;
      }

      case 'fermenting':
        return `🫧 Fermentation in progress... ${gameState.fermentProgress}% complete.\n\nThe bubbles rise slowly. The transformation is happening.\n\nCommand: wait`;

      case 'serving':
        return `✨ Fermentation complete! Your creation awaits judgment.\n\nCommand: serve`;

      default:
        return 'Something went wrong in the workshop...';
    }
  }
};

window.GameEngine = GameEngine;
