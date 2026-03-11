/**
 * FERMENT - WelcomePage Component
 * Rich editorial scroll experience introducing fermentation and the app.
 * Shown on first visit, accessible via Settings afterward.
 */

const WelcomePageComponent = {
  name: 'welcome-page',

  emits: ['enter', 'open-recipe', 'navigate'],

  data() {
    return {
      observer: null,
    };
  },

  mounted() {
    // Intersection Observer for scroll-reveal
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    this.$nextTick(() => {
      this.$el.querySelectorAll('.reveal-on-scroll').forEach(el => {
        this.observer.observe(el);
      });
    });
  },

  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },

  methods: {
    enter() { this.$emit('enter'); },
    goTo(tab) { this.$emit('navigate', tab); },
    openStarter(id) { this.$emit('open-recipe', id); },
    scrollNext() {
      const el = this.$el.querySelector('#welcome-science');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    },
  },

  template: `
    <div class="welcome-page">

      <!-- ═══════════════ 1. HERO ═══════════════ -->
      <section class="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div class="absolute inset-0">
          <img src="assets/images/shelf-of-fermented-foods.jpeg" alt="" class="w-full h-full object-cover" loading="eager" />
          <div class="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/70 to-stone-950/95"></div>
        </div>
        <div class="relative z-10 max-w-2xl mx-auto">
          <div class="text-7xl sm:text-8xl mb-8 hero-jar">🫙</div>
          <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-wider text-amber-100 mb-6" style="letter-spacing: 0.25em;">F E R M E N T</h1>
          <p class="font-serif text-2xl sm:text-4xl text-amber-200/80 italic leading-relaxed mb-4">A cultural guide to the oldest<br>biotechnology on Earth.</p>
          <p class="text-amber-300/60 text-sm tracking-[0.3em] uppercase mt-6 mb-12">Salt · Time · Bacteria · Magic</p>
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <button @click="scrollNext" class="px-8 py-3 bg-amber-200/10 hover:bg-amber-200/20 text-amber-100 border border-amber-200/20 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm">
              Discover the science ↓
            </button>
            <button @click="enter" class="px-8 py-3 text-amber-300/50 hover:text-amber-200 text-sm transition-colors">
              Skip to recipes →
            </button>
          </div>
        </div>
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber-300/30 animate-bounce">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
        </div>
      </section>

      <!-- ═══════════════ 2. THE SCIENCE ═══════════════ -->
      <section id="welcome-science" class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-brine text-sm font-medium tracking-widest uppercase mb-3">The Science</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">10,000 years before refrigerators</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary">
              <div class="text-4xl mb-4">🧪</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The Chemistry</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed"><strong class="text-text-primary dark:text-dark-text">Lacto-fermentation</strong> is controlled decomposition. Lactobacillus bacteria convert sugars into lactic acid, dropping pH below 4.6 - a level where pathogens cannot survive.</p>
              <p class="text-xs text-text-muted mt-3">No vinegar. No heat. No additives. Just salt, time, and trillions of invisible workers.</p>
            </div>

            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary" style="transition-delay: 100ms">
              <div class="text-4xl mb-4">🏺</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The History</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Every civilisation independently discovered fermentation. Koreans made <em>kimchi</em>. Germans made <em>sauerkraut</em>. Indians set <em>dahi</em>. Egyptians brewed beer. Ethiopians fermented teff for <em>injera</em>.</p>
              <p class="text-xs text-text-muted mt-3">It's not a trend. It's arguably the most important food technology humans ever developed.</p>
            </div>

            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary" style="transition-delay: 200ms">
              <div class="text-4xl mb-4">🌍</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The Why</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Fermented foods contain <strong class="text-text-primary dark:text-dark-text">live bacteria</strong> that support digestion, immunity, and even mental health through the gut-brain axis.</p>
              <p class="text-xs text-text-muted mt-3">You're not just making food. You're cultivating an ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 3. THE GUT ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-secondary/30 dark:bg-dark-secondary/30">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-culture text-sm font-medium tracking-widest uppercase mb-3">The Connection</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Your gut is a rainforest</h2>
          </div>

          <div class="space-y-8">
            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🦠</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Your gut contains <strong class="text-accent-brine">~38 trillion</strong> microorganisms - slightly more than your own human cells.</p>
                <p class="text-sm text-text-muted mt-1">You are, technically, more bacteria than person.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🧠</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">The gut produces <strong class="text-accent-brine">~95% of your body's serotonin</strong> - the "happiness hormone."</p>
                <p class="text-sm text-text-muted mt-1">The gut-brain axis is a two-way highway. What you feed your gut, you feed your mood.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🛡️</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed"><strong class="text-accent-brine">~70% of your immune system</strong> lives in your gut.</p>
                <p class="text-sm text-text-muted mt-1">Fermented foods introduce diverse beneficial bacteria that train and strengthen this defence network.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🔬</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Lactic acid bacteria from fermented foods <strong class="text-accent-brine">survive stomach acid</strong> and colonise the intestine.</p>
                <p class="text-sm text-text-muted mt-1">Unlike most probiotic supplements, they arrive alive.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🌱</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Fermentation <strong class="text-accent-brine">increases bioavailability</strong> of nutrients - breaking down antinutrients like phytic acid.</p>
                <p class="text-sm text-text-muted mt-1">Iron, zinc, and B-vitamins become easier to absorb. The same food, more nutrition.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 4. APP TOUR ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-ferment text-sm font-medium tracking-widest uppercase mb-3">What's Inside</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Your fermentation companion</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button @click="goTo('browse')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-brine hover:border-accent-brine/80 cursor-pointer group">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">📦</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">30 Recipes</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">From 20+ countries, each with cultural context, step-by-step instructions, and the story behind the ferment.</p>
              <div class="flex items-center gap-2 mt-4">
                <span class="text-xs px-2 py-0.5 rounded-full bg-tier-beginner text-white">Beginner</span>
                <span class="text-xs text-text-muted">to</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-tier-master text-white">Master</span>
              </div>
            </button>

            <button @click="goTo('wiki')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-culture/80 hover:border-accent-culture cursor-pointer group" style="transition-delay: 50ms">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">📚</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Wiki</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">23 articles on fermentation science, safety, equipment, and techniques - with citations, cross-links, and glossary.</p>
            </button>

            <button @click="goTo('pantry')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-culture hover:border-accent-culture/80 cursor-pointer group" style="transition-delay: 100ms">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">🫙</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Pantry</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Track ingredients and equipment. FERMENT matches your pantry to recipes you can make <em>right now</em>.</p>
            </button>

            <button @click="goTo('journal')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-ferment hover:border-accent-ferment/80 cursor-pointer group" style="transition-delay: 150ms">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">📖</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Journal</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Log batches, track fermentation progress, rate results. Build your personal history of what worked and what exploded.</p>
            </button>

            <button @click="goTo('tools')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-aged hover:border-accent-aged/80 cursor-pointer group" style="transition-delay: 200ms">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">🔧</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Tools</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Brine calculator, batch scaler, unit converter, pH reference, seasonal calendar, and fermentation glossary.</p>
            </button>

            <button @click="goTo('tools')" class="reveal-on-scroll feature-card text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-amber-600/50 hover:border-amber-600 cursor-pointer group" style="transition-delay: 250ms">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl group-hover:scale-110 transition-transform">⏱️</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Timers</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Set fermentation timers with alerts. Never forget a batch again - from overnight yogurt to 6-week miso.</p>
            </button>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 5. PHILOSOPHY ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-gradient-to-b from-accent-aged/5 to-accent-brine/5 dark:from-accent-aged/10 dark:to-accent-brine/10">
        <div class="max-w-2xl mx-auto text-center reveal-on-scroll">
          <p class="text-accent-aged dark:text-accent-brine text-sm font-medium tracking-widest uppercase mb-6">The Philosophy</p>
          <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight mb-10">Slow down. Add salt. Wait.</h2>
          <div class="space-y-6 text-base sm:text-lg text-text-secondary dark:text-dark-text-secondary leading-relaxed font-serif">
            <p>Fermentation cannot be rushed, optimised, or disrupted. It operates on bacterial time.</p>
            <p>FERMENT is built on the belief that every culture on Earth independently discovered the same truth: <strong class="text-text-primary dark:text-dark-text">salt + time + patience = transformation.</strong></p>
            <p>Every recipe comes with its story - where it's from, why it matters, and the humans who've been making it for generations.</p>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 6. STARTER RECIPES ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-culture text-sm font-medium tracking-widest uppercase mb-3">Begin</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Pick your first ferment</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button @click="openStarter('sauerkraut-classic')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥬</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Sauerkraut</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">2 ingredients. 14 days. The gateway ferment for most of the Western world.</p>
              <span class="text-xs text-text-muted">Germany · 🌱 Beginner</span>
            </button>

            <button @click="openStarter('dahi-homemade')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1" style="transition-delay: 100ms">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥛</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Dahi</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">The one you already know. Now own the process. Set it tonight, have it by morning.</p>
              <span class="text-xs text-text-muted">India · 🌱 Beginner</span>
            </button>

            <button @click="openStarter('brine-pickles-basic')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1" style="transition-delay: 200ms">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥒</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Brine Pickles</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">Any vegetable + salt water. The simplest and most universal lacto-ferment in existence.</p>
              <span class="text-xs text-text-muted">Global · 🌱 Beginner</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 7. FOOTER CTA ═══════════════ -->
      <section class="relative py-20 sm:py-28 px-6 text-center overflow-hidden" style="background: linear-gradient(to bottom, #1c1410, #1a1208, #1c1410);">
        <!-- Fermentation bubbles animation -->
        <div class="ferment-bubbles" aria-hidden="true">
          <div class="bubble" style="--x: 10%; --size: 8px; --delay: 0s; --duration: 4s;"></div>
          <div class="bubble" style="--x: 25%; --size: 5px; --delay: 0.8s; --duration: 5s;"></div>
          <div class="bubble" style="--x: 40%; --size: 10px; --delay: 1.5s; --duration: 3.5s;"></div>
          <div class="bubble" style="--x: 55%; --size: 6px; --delay: 0.3s; --duration: 4.5s;"></div>
          <div class="bubble" style="--x: 65%; --size: 12px; --delay: 2s; --duration: 3.8s;"></div>
          <div class="bubble" style="--x: 75%; --size: 7px; --delay: 1s; --duration: 4.2s;"></div>
          <div class="bubble" style="--x: 85%; --size: 4px; --delay: 2.5s; --duration: 5.5s;"></div>
          <div class="bubble" style="--x: 18%; --size: 6px; --delay: 3s; --duration: 3.2s;"></div>
          <div class="bubble" style="--x: 50%; --size: 9px; --delay: 1.8s; --duration: 4.8s;"></div>
          <div class="bubble" style="--x: 92%; --size: 5px; --delay: 0.5s; --duration: 5.2s;"></div>
        </div>
        <!-- Brine surface shimmer -->
        <div class="absolute top-0 left-0 right-0 h-px opacity-30" style="background: linear-gradient(90deg, transparent, rgba(196,163,90,0.6), transparent);"></div>
        <div class="relative z-10 max-w-2xl mx-auto reveal-on-scroll">
          <blockquote class="font-serif text-xl sm:text-2xl text-amber-200/80 italic leading-relaxed mb-10">
            "May your cultures be strong,<br>
            your brine be clear,<br>
            and your jars never explode."
          </blockquote>
          <button @click="enter"
            class="px-10 py-4 bg-amber-200/10 hover:bg-amber-200/20 text-amber-100 border border-amber-200/20 rounded-xl text-base font-medium transition-all duration-300 backdrop-blur-sm hover:scale-105">
            Start Fermenting →
          </button>
          <p class="text-amber-300/30 text-xs mt-8 tracking-widest uppercase">Salt · Time · Bacteria · Magic</p>
        </div>
      </section>

    </div>
  `
};
