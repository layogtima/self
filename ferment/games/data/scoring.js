/* THE FERMENT ALCHEMIST — Scoring System */

window.GameScoring = {
  // Maximum points per category
  weights: {
    ingredients: 40,
    technique: 20,
    parameters: 30,
    vessel: 5,
    speed: 5,
  },

  // Calculate total score for a completed order
  calculate(order, playerChoices, elapsedSeconds) {
    const breakdown = {
      ingredients: this.scoreIngredients(order, playerChoices.ingredients || []),
      technique: this.scoreTechnique(order, playerChoices.technique),
      parameters: this.scoreParameters(order, playerChoices),
      vessel: this.scoreVessel(order, playerChoices.vessel),
      speed: this.scoreSpeed(elapsedSeconds),
    };

    breakdown.total = Math.round(
      breakdown.ingredients.score +
      breakdown.technique.score +
      breakdown.parameters.score +
      breakdown.vessel.score +
      breakdown.speed.score
    );

    breakdown.total = Math.min(100, Math.max(0, breakdown.total));
    breakdown.grade = GameLevels.getGradeForScore(breakdown.total);
    breakdown.stars = GameLevels.getLevelStars(breakdown.total);

    return breakdown;
  },

  // ─── Ingredient Scoring (40 pts) ──────────────────────
  scoreIngredients(order, selected) {
    const required = order.requiredIngredients || [];
    const optional = order.optionalIngredients || [];
    const selectedIds = selected.map(s => typeof s === 'string' ? s : s.id);

    let matchedRequired = 0;
    let matchedOptional = 0;
    let extras = 0;
    const details = [];

    for (const id of selectedIds) {
      if (required.includes(id)) {
        matchedRequired++;
        details.push({ id, status: 'correct' });
      } else if (optional.includes(id)) {
        matchedOptional++;
        details.push({ id, status: 'optional' });
      } else {
        extras++;
        details.push({ id, status: 'extra' });
      }
    }

    // Missing required ingredients
    const missingRequired = required.filter(r => !selectedIds.includes(r));
    for (const id of missingRequired) {
      details.push({ id, status: 'missing' });
    }

    // Score: base from required matches, bonus from optional, penalty for extras/missing
    const requiredScore = required.length > 0
      ? (matchedRequired / required.length) * 35
      : 35;
    const optionalBonus = optional.length > 0
      ? (matchedOptional / optional.length) * 5
      : 0;
    const extraPenalty = extras * 2;
    const missingPenalty = missingRequired.length * 5;

    const score = Math.max(0, Math.min(40, requiredScore + optionalBonus - extraPenalty - missingPenalty));

    return { score: Math.round(score), details, matchedRequired, total: required.length };
  },

  // ─── Technique Scoring (20 pts) ───────────────────────
  scoreTechnique(order, selectedTechnique) {
    if (!selectedTechnique) return { score: 0, correct: false };
    const correct = selectedTechnique === order.requiredTechnique;
    return {
      score: correct ? 20 : 0,
      correct,
      expected: order.requiredTechnique,
      selected: selectedTechnique,
    };
  },

  // ─── Parameter Scoring (30 pts) ───────────────────────
  scoreParameters(order, playerChoices) {
    let saltScore = 0;
    let tempScore = 0;
    let timeScore = 0;
    const details = {};

    // Salt percent (10 pts) — linear interpolation within tolerance
    if (order.targetSaltPercent !== undefined) {
      const saltDiff = Math.abs((playerChoices.saltPercent || 0) - order.targetSaltPercent);
      const saltTol = order.saltTolerance || 1;
      saltScore = saltTol > 0
        ? Math.max(0, 10 * (1 - saltDiff / saltTol))
        : (saltDiff === 0 ? 10 : 0);
      details.salt = {
        target: order.targetSaltPercent,
        actual: playerChoices.saltPercent || 0,
        tolerance: saltTol,
        score: Math.round(saltScore * 10) / 10,
      };
    } else {
      saltScore = 10; // No salt required, full marks
    }

    // Temperature (10 pts)
    if (order.targetTemp !== undefined) {
      const tempDiff = Math.abs((playerChoices.temperature || 20) - order.targetTemp);
      const tempTol = order.tempTolerance || 5;
      tempScore = tempTol > 0
        ? Math.max(0, 10 * (1 - tempDiff / tempTol))
        : (tempDiff === 0 ? 10 : 0);
      details.temp = {
        target: order.targetTemp,
        actual: playerChoices.temperature || 20,
        tolerance: tempTol,
        score: Math.round(tempScore * 10) / 10,
      };
    } else {
      tempScore = 10;
    }

    // Time (10 pts)
    if (order.targetTime !== undefined) {
      const timeDiff = Math.abs((playerChoices.time || 0) - order.targetTime);
      const timeTol = order.timeTolerance || 5;
      timeScore = timeTol > 0
        ? Math.max(0, 10 * (1 - timeDiff / timeTol))
        : (timeDiff === 0 ? 10 : 0);
      details.time = {
        target: order.targetTime,
        actual: playerChoices.time || 0,
        tolerance: timeTol,
        unit: order.timeUnit,
        score: Math.round(timeScore * 10) / 10,
      };
    } else {
      timeScore = 10;
    }

    return {
      score: Math.round(saltScore + tempScore + timeScore),
      details,
    };
  },

  // ─── Vessel Scoring (5 pts) ───────────────────────────
  scoreVessel(order, selectedVessel) {
    if (!selectedVessel) return { score: 0, suitable: false };
    const bestVessels = order.bestVessels || [];
    const suitable = bestVessels.includes(selectedVessel);
    const vessel = GameVessels.getById(selectedVessel);
    const bonus = vessel ? vessel.bonus : 0;

    return {
      score: suitable ? 5 : Math.min(2, bonus),
      suitable,
      bonus,
    };
  },

  // ─── Speed Bonus (5 pts, endless mode only) ───────────
  scoreSpeed(elapsedSeconds) {
    if (!elapsedSeconds) return { score: 0 };
    // Under 60 seconds = full bonus, scales down to 0 at 180 seconds
    const score = elapsedSeconds <= 60 ? 5
      : elapsedSeconds >= 180 ? 0
      : Math.round(5 * (1 - (elapsedSeconds - 60) / 120));
    return { score };
  },

  // ─── Endless Mode Difficulty Scaling ──────────────────
  getEndlessDifficulty(ordersCompleted) {
    if (ordersCompleted < 5) return { tier: 1, toleranceMultiplier: 1.5, label: 'Warm Up' };
    if (ordersCompleted < 10) return { tier: 2, toleranceMultiplier: 1.0, label: 'Getting Busy' };
    if (ordersCompleted < 20) return { tier: 3, toleranceMultiplier: 0.75, label: 'Rush Hour' };
    if (ordersCompleted < 35) return { tier: 4, toleranceMultiplier: 0.5, label: 'Master\'s Pace' };
    return { tier: 5, toleranceMultiplier: 0.3, label: 'Impossible!' };
  },

  // ─── XP Calculation ──────────────────────────────────
  calculateXP(grade, isFirstCompletion, mode) {
    let base = GameData.getXPForGrade(grade);
    if (isFirstCompletion) base *= 1.5;
    if (mode === 'endless') base *= 0.75;
    return Math.round(base);
  }
};
