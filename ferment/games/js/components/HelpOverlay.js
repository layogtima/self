/* THE FERMENT ALCHEMIST — Help / Tutorial Overlay */

const HelpOverlay = {
  name: 'HelpOverlay',
  emits: ['close', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-2xl" style="color: var(--ink-primary)">How to Play</h2>
        <button class="game-btn game-btn-ghost" @click="$emit('close')">✕ Close</button>
      </div>

      <div class="space-y-4 max-w-lg mx-auto">
        <!-- Game Loop -->
        <div class="game-card p-4">
          <div class="font-serif text-lg mb-2" style="color: var(--accent-brine)">🧪 The Game Loop</div>
          <ol class="space-y-2 text-sm" style="color: var(--ink-secondary)">
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">1.</span> Receive an order from a customer requesting a specific fermented food</li>
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">2.</span> Select the right ingredients from your pantry</li>
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">3.</span> Choose the correct fermentation technique</li>
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">4.</span> Set parameters: salt concentration, temperature, and time</li>
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">5.</span> Pick an appropriate vessel</li>
            <li class="flex gap-2"><span class="font-medium" style="color: var(--ink-primary)">6.</span> Watch the fermentation happen, then serve your creation!</li>
          </ol>
        </div>

        <!-- Scoring -->
        <div class="game-card p-4">
          <div class="font-serif text-lg mb-2" style="color: var(--accent-brine)">🎯 Scoring (100 points)</div>
          <div class="space-y-2 text-sm" style="color: var(--ink-secondary)">
            <div class="flex justify-between"><span>Ingredient accuracy</span><span class="font-medium">40 pts</span></div>
            <div class="flex justify-between"><span>Technique correctness</span><span class="font-medium">20 pts</span></div>
            <div class="flex justify-between"><span>Parameter precision (salt, temp, time)</span><span class="font-medium">30 pts</span></div>
            <div class="flex justify-between"><span>Vessel choice</span><span class="font-medium">5 pts</span></div>
            <div class="flex justify-between"><span>Speed bonus (endless only)</span><span class="font-medium">5 pts</span></div>
          </div>
          <div class="mt-3 pt-2 text-xs" style="border-top: 1px solid var(--parchment-mid); color: var(--ink-muted)">
            Grades: S (95+) A (85+) B (70+) C (55+) D (40+) F (&lt;40)
          </div>
        </div>

        <!-- Modes -->
        <div class="game-card p-4">
          <div class="font-serif text-lg mb-2" style="color: var(--accent-brine)">📜 Game Modes</div>
          <div class="space-y-3 text-sm" style="color: var(--ink-secondary)">
            <div>
              <div class="font-medium" style="color: var(--ink-primary)">📜 Story Mode</div>
              <p>30 levels across 5 chapters. Learn real fermentation techniques from cultures around the world. Get B or better to unlock the next level.</p>
            </div>
            <div>
              <div class="font-medium" style="color: var(--ink-primary)">♾️ Endless Mode</div>
              <p>Random orders with increasing difficulty. Build streaks for bonus points. How long can you last?</p>
            </div>
            <div>
              <div class="font-medium" style="color: var(--ink-primary)">🧪 Sandbox</div>
              <p>All ingredients unlocked, no scoring. Experiment freely and discover what combinations create real recipes.</p>
            </div>
            <div>
              <div class="font-medium" style="color: var(--ink-primary)">🤖 LLM Mode</div>
              <p>Text-based interface for AI players. Supports both natural language commands and structured JSON for programmatic play.</p>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="game-card p-4">
          <div class="font-serif text-lg mb-2" style="color: var(--accent-brine)">💡 Tips</div>
          <ul class="space-y-2 text-sm" style="color: var(--ink-secondary)">
            <li>• Read the customer's request carefully — it contains clues about what they want</li>
            <li>• The hint button (💡) during gameplay gives you extra guidance</li>
            <li>• Salt percentage is crucial — too little and it spoils, too much and it's inedible</li>
            <li>• Different cultures need different temperatures — yogurt likes it hot, kefir likes it cool</li>
            <li>• The right vessel can earn you bonus points</li>
            <li>• Cultural notes after each order teach you real fermentation history</li>
          </ul>
        </div>
      </div>
    </div>
  `
};

window.HelpOverlay = HelpOverlay;
