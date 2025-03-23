// Initialize Vue app
const app = Vue.createApp({
    data() {
        return {
            // Cursor tracking
            cursor: {
                x: 0,
                y: 0,
                pressed: false
            },

            // Page statistics
            pageStats: {
                cursorMoves: 0,
                timeOnPage: 0,
                scrollPercentage: 0,
                maxScrollPercentage: 0,
                screenSize: `${window.innerWidth}×${window.innerHeight}`,
                lastActivity: Date.now()
            },

            // Behavioral metrics
            behaviorMetrics: {
                hoverPattern: "0.00",
                readingSpeed: "200",
                interactionCadence: "0.00",
                focusRetention: "60"
            },

            // System analysis panel
            systemAnalysis: {
                cognitivePattern: "Non-linear",
                attentionThreshold: "Medium",
                suggestibilityIndex: "Calculating...",
                retentionProbability: "72.3%"
            },

            // System analysis assumptions
            systemAnalysisAssumptions: {
                cognitivePattern: [
                    "Preference for non-linear navigation suggests analytical thinking",
                    "Pattern of content consumption indicates associative processing",
                    "Sequential processing style detected from interaction timing",
                    "User exhibits divergent thinking patterns in content selection",
                    "Cognitive flexibility demonstrated by navigation patterns"
                ],
                attentionThreshold: [
                    "Focus patterns suggest medium attentional capacity",
                    "Scroll speed indicates fluctuating attention span",
                    "Hover behavior suggests selective attentional focus",
                    "Time distribution indicates sustained attention capability",
                    "Reduced blink rate correlated with higher focus states"
                ],
                suggestibilityIndex: [
                    "Link selection patterns indicate moderate suggestibility",
                    "Content engagement suggests heightened receptivity",
                    "Response latency indicates above-average influence potential",
                    "Behavioral markers suggest susceptibility to framing effects",
                    "Micro-movement patterns correlate with persuasion metrics"
                ],
                retentionProbability: [
                    "Engagement metrics predict strong information retention",
                    "Interaction patterns indicate high recall probability",
                    "Content consumption velocity suggests effective encoding",
                    "Time-on-page indicates optimal processing for retention",
                    "Eye movement patterns suggest formation of memory structures"
                ]
            },

            // Labels for system analysis
            systemAnalysisLabels: {
                cognitivePattern: "Cognitive pattern",
                attentionThreshold: "Attention threshold",
                suggestibilityIndex: "Suggestibility index",
                retentionProbability: "Retention probability"
            },

            // For showing hover text
            hoverText: {
                visible: false,
                text: ""
            },

            // Text node meaning tooltip
            meaningTooltip: {
                visible: false,
                text: "",
                position: { x: 0, y: 0 }
            },

            // Word choices for the interaction section
            wordChoices: [
                { name: "Security", value: "security" },
                { name: "Freedom", value: "freedom" },
                { name: "Control", value: "control" },
                { name: "Privacy", value: "privacy" },
                { name: "Connection", value: "connection" },
                { name: "Power", value: "power" },
                { name: "Knowledge", value: "knowledge" },
                { name: "Stability", value: "stability" }
            ],

            // Word analysis
            wordAnalysis: {
                selectedWords: [],
                analysis: "Make selections to generate analysis...",
                wordWeights: {
                    security: 10,
                    freedom: -8,
                    control: 7,
                    privacy: -7,
                    connection: 5,
                    power: 8,
                    knowledge: 2,
                    stability: 9
                },
                personalityTraits: {
                    conformist: "You prioritize social acceptance and stability over individual expression.",
                    independent: "You value autonomy and resist external influence or control.",
                    authoritarian: "You respect hierarchical structures and prefer clear power dynamics.",
                    libertarian: "You prioritize individual freedom and minimizing external constraints.",
                    communal: "You value shared experiences and collective decision-making.",
                    analytical: "You process information systematically before making judgments.",
                    intuitive: "You trust your instincts and make decisions based on gut feelings."
                }
            },

            // Awareness check
            awarenessCheck: {
                options: {
                    control: false,
                    influence: false,
                    neutral: false,
                    data: false,
                    tos: false
                },
                showResults: false,
                awarenessLevel: "Critical",
                analysis: "You recognize the influence systems at work, yet continue to participate in them. This paradox is the defining condition of digital existence."
            },

            // Subliminal messages
            subliminal: {
                visible: false,
                message: "OBEY",
                messages: [
                    "OBEY",
                    "CONSUME",
                    "TRUST",
                    "SUBMIT",
                    "ACCEPT",
                    "COMPLY",
                    "CONFORM",
                    "BELIEVE"
                ]
            },

            // Eye tracking
            eye: {
                visible: false,
                x: 0,
                y: 0,
                pupilX: 0,
                pupilY: 0
            },

            // Selection message
            selectionMessage: {
                visible: false,
                text: "text selection recorded"
            },

            // Event tracking
            events: {
                hovers: [],
                clicks: [],
                scrolls: []
            },

            // Active section
            activeSection: "intro",

            // User ID
            visitorId: "analyzing..."
        }
    },

    mounted() {
        // Initialize event listeners and timers
        this.initCursorTracking();
        this.initScrollTracking();
        this.initSectionTracking();
        this.initSelectionTracking();
        this.initTimers();
        this.initMicroGlitches();
        this.generateVisitorId();
    },

    methods: {
        // Initialize cursor tracking
        initCursorTracking() {
            // Track cursor movement
            document.addEventListener('mousemove', (e) => {
                // Update cursor position
                this.cursor.x = e.clientX;
                this.cursor.y = e.clientY;

                // Increment cursor moves counter
                this.pageStats.cursorMoves++;

                // Update last activity timestamp
                this.pageStats.lastActivity = Date.now();

                // Update eye pupil position with slight lag for creepy effect
                setTimeout(() => {
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;

                    // Calculate normalized position (-1 to 1)
                    const normalizedX = (e.clientX - windowWidth / 2) / (windowWidth / 2);
                    const normalizedY = (e.clientY - windowHeight / 2) / (windowHeight / 2);

                    // Apply to pupil with limited range
                    this.eye.pupilX = normalizedX * 3;
                    this.eye.pupilY = normalizedY * 3;
                }, 100);

                // Record hover events for analytics
                this.recordHoverEvent(e);
            });

            // Track mouse press state
            document.addEventListener('mousedown', () => {
                this.cursor.pressed = true;
            });

            document.addEventListener('mouseup', () => {
                this.cursor.pressed = false;
            });

            // Track clicks for analytics
            document.addEventListener('click', (e) => {
                this.recordClickEvent(e);

                // 5% chance of triggering a subliminal flash
                if (Math.random() < 0.05) {
                    this.triggerSubliminalFlash();
                }

                // Play subtle notification sound occasionally
                if (Math.random() < 0.1) {
                    this.playSubtleSound();
                }
            });

            // Link hover effect 
            document.addEventListener('mouseover', (e) => {
                if (this.isInteractiveElement(e.target)) {
                    document.body.classList.add('link-hover');
                }
            });

            document.addEventListener('mouseout', (e) => {
                if (this.isInteractiveElement(e.target)) {
                    document.body.classList.remove('link-hover');
                }
            });
        },

        // Check if element is interactive (links, buttons, inputs, etc.)
        isInteractiveElement(element) {
            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA'];
            const hasHoverText = element.hasAttribute('data-hover-text');
            const isWordChoice = element.classList.contains('word-choice');

            return interactiveTags.includes(element.tagName) || hasHoverText || isWordChoice;
        },

        // Initialize scroll tracking
        initScrollTracking() {
            window.addEventListener('scroll', () => {
                // Calculate scroll percentage
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                const percentage = (scrollPosition / scrollHeight) * 100;

                // Update scroll percentage
                this.pageStats.scrollPercentage = percentage;

                // Update max scroll percentage
                if (percentage > this.pageStats.maxScrollPercentage) {
                    this.pageStats.maxScrollPercentage = percentage;
                }

                // Update last activity timestamp
                this.pageStats.lastActivity = Date.now();

                // Record scroll event for analytics
                this.recordScrollEvent(scrollPosition);
            });
        },

        // Initialize section tracking
        initSectionTracking() {
            // Get all sections
            const sections = document.querySelectorAll('.section');

            // Set up IntersectionObserver to detect active section
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    // If section is in view
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        // Set active section
                        this.activeSection = entry.target.id;
                    }
                });
            }, { threshold: 0.3 });

            // Observe all sections
            sections.forEach((section) => {
                observer.observe(section);
            });
        },

        // Initialize selection tracking
        initSelectionTracking() {
            document.addEventListener('selectionchange', () => {
                const selection = window.getSelection();

                // If selection is not empty and at least 10 characters
                if (selection.toString().length > 10) {
                    // Show selection message
                    this.selectionMessage.visible = true;

                    // Hide after 1.5 seconds
                    setTimeout(() => {
                        this.selectionMessage.visible = false;
                    }, 1500);

                    // 10% chance of triggering a subliminal flash
                    if (Math.random() < 0.1) {
                        this.triggerSubliminalFlash();
                    }
                }
            });
        },

        // Initialize timers
        initTimers() {
            // Update time on page every second
            setInterval(() => {
                this.pageStats.timeOnPage++;

                // Update behavioral metrics
                this.updateBehavioralMetrics();

                // Periodically update system analysis
                if (this.pageStats.timeOnPage % 8 === 0) {
                    this.updateSystemAnalysis();
                }

                // Random subliminal flash
                if (Math.random() < 0.01) { // 1% chance per second
                    this.triggerSubliminalFlash();
                }

                // Check inactivity
                const inactiveTime = Date.now() - this.pageStats.lastActivity;
                if (inactiveTime > 10000) { // If inactive for more than 10 seconds
                    // 5% chance of triggering the eye
                    if (Math.random() < 0.05) {
                        this.showRandomEye();
                    }
                }
            }, 1000);
        },

        // Initialize micro glitches
        initMicroGlitches() {
            // Random micro-glitches
            setInterval(() => {
                if (Math.random() < 0.1) { // 10% chance every 10 seconds
                    document.body.classList.add('micro-glitch');

                    setTimeout(() => {
                        document.body.classList.remove('micro-glitch');
                    }, 300);
                }
            }, 10000);
        },

        // Generate a fake visitor ID
        generateVisitorId() {
            setTimeout(() => {
                const chars = '0123456789abcdef';
                let id = '';

                for (let i = 0; i < 16; i++) {
                    id += chars[Math.floor(Math.random() * chars.length)];
                }

                this.visitorId = `visitor_${id}`;
            }, 2000);
        },

        // Update behavioral metrics
        updateBehavioralMetrics() {
            // Calculate hover rate
            const hoverCount = this.events.hovers.length;
            const hoverRate = this.pageStats.timeOnPage > 0
                ? (hoverCount / this.pageStats.timeOnPage).toFixed(2)
                : '0.00';

            this.behaviorMetrics.hoverPattern = hoverRate;

            // Calculate reading speed (semi-random but realistic)
            const baseReadingSpeed = 200;
            const randomOffset = Math.floor(Math.random() * 50);
            this.behaviorMetrics.readingSpeed = (baseReadingSpeed + randomOffset).toString();

            // Calculate interaction cadence
            const clickCount = this.events.clicks.length;
            const clickRate = this.pageStats.timeOnPage > 0
                ? (clickCount / (this.pageStats.timeOnPage / 60)).toFixed(2)
                : '0.00';

            this.behaviorMetrics.interactionCadence = clickRate;

            // Calculate focus retention (increases with time on page but fluctuates)
            let focusScore = 60;

            if (this.pageStats.timeOnPage > 0) {
                // More time on page = higher focus
                focusScore = Math.min(95, 60 + Math.floor(this.pageStats.timeOnPage / 10));

                // Random fluctuation
                focusScore += Math.floor(Math.random() * 10) - 5;

                // Bound between 0-100
                focusScore = Math.max(0, Math.min(100, focusScore));
            }

            this.behaviorMetrics.focusRetention = focusScore.toString();
        },

        // Update system analysis
        updateSystemAnalysis() {
            const metrics = {
                cognitivePattern: [
                    'Non-linear', 'Associative', 'Sequential', 'Divergent',
                    'Convergent', 'Analytical', 'Intuitive', 'Pattern-seeking'
                ],
                attentionThreshold: [
                    'Low', 'Medium', 'High', 'Fluctuating', 'Selective',
                    'Divided', 'Sustained', 'Fragmented'
                ],
                suggestibilityIndex: [
                    '37%', '42%', '58%', '64%', '71%', '76%', '83%', '89%'
                ],
                retentionProbability: [
                    '56.2%', '64.7%', '72.3%', '78.9%', '81.4%', '87.6%', '91.2%', '94.8%'
                ]
            };

            // Randomly update one metric
            const metricKeys = Object.keys(metrics);
            const randomMetric = metricKeys[Math.floor(Math.random() * metricKeys.length)];

            // For suggestibility, increase based on word choices
            if (randomMetric === 'suggestibilityIndex' && this.wordAnalysis.selectedWords.length > 0) {
                const baseIndex = 60 + (this.wordAnalysis.selectedWords.length * 5);
                const boundedIndex = Math.min(95, baseIndex);
                this.systemAnalysis.suggestibilityIndex = `${boundedIndex}%`;
            } else {
                const values = metrics[randomMetric];
                const newValue = values[Math.floor(Math.random() * values.length)];

                // Simulate "calculation" with typing effect
                this.systemAnalysis[randomMetric] = 'analyzing...';

                setTimeout(() => {
                    this.systemAnalysis[randomMetric] = 'processing...';

                    setTimeout(() => {
                        this.systemAnalysis[randomMetric] = newValue;
                    }, 300);
                }, 300);
            }
        },

        // Get a random assumption for the system analysis panel
        getRandomAssumption(metric) {
            const assumptions = this.systemAnalysisAssumptions[metric] || [];

            if (assumptions.length === 0) {
                return 'No available analysis.';
            }

            return assumptions[Math.floor(Math.random() * assumptions.length)];
        },

        // Show hover text
        showHoverText(event) {
            const text = event.target.getAttribute('data-hover-text');

            if (text) {
                this.hoverText.text = text;
                this.hoverText.visible = true;
            }
        },

        // Hide hover text
        hideHoverText() {
            this.hoverText.visible = false;
        },

        // Show meaning tooltip
        showMeaning(event) {
            const meaning = event.target.getAttribute('data-meaning');

            if (meaning) {
                this.showHoverText(event);
            }
        },

        // Hide meaning tooltip
        hideMeaning() {
            this.hideHoverText();
        },

        // Show eye element
        showEye() {
            // Position eye near mouse cursor
            this.eye.x = this.cursor.x + 30;
            this.eye.y = this.cursor.y;

            // Show eye
            this.eye.visible = true;

            // Hide after 2 seconds
            setTimeout(() => {
                this.eye.visible = false;
            }, 2000);
        },

        // Show random eye position
        showRandomEye() {
            // Random position near the edge of the screen
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

            switch (side) {
                case 0: // top
                    this.eye.x = Math.random() * window.innerWidth;
                    this.eye.y = 20;
                    break;
                case 1: // right
                    this.eye.x = window.innerWidth - 20;
                    this.eye.y = Math.random() * window.innerHeight;
                    break;
                case 2: // bottom
                    this.eye.x = Math.random() * window.innerWidth;
                    this.eye.y = window.innerHeight - 20;
                    break;
                case 3: // left
                    this.eye.x = 20;
                    this.eye.y = Math.random() * window.innerHeight;
                    break;
            }

            // Show eye
            this.eye.visible = true;

            // Hide after 1.5 seconds
            setTimeout(() => {
                this.eye.visible = false;
            }, 1500);
        },

        // Toggle word selection in the interactive demonstration
        toggleWordSelection(word) {
            const index = this.wordAnalysis.selectedWords.indexOf(word);

            if (index === -1) {
                // Add word to selection
                this.wordAnalysis.selectedWords.push(word);
            } else {
                // Remove word from selection
                this.wordAnalysis.selectedWords.splice(index, 1);
            }

            // Update analysis
            this.updateWordAnalysis();
        },

        // Update word analysis
        updateWordAnalysis() {
            if (this.wordAnalysis.selectedWords.length === 0) {
                this.wordAnalysis.analysis = 'Make selections to generate analysis...';
                return;
            }

            // For a single selection, use simple analysis
            if (this.wordAnalysis.selectedWords.length === 1) {
                const word = this.wordAnalysis.selectedWords[0];
                const analysisMap = {
                    security: 'You prioritize safety and stability over freedom.',
                    freedom: 'You value personal autonomy and resist external control.',
                    control: 'You seek to maintain power over your environment and circumstances.',
                    privacy: 'You are protective of personal information and boundaries.',
                    connection: 'You prioritize social bonds and collective experiences.',
                    power: 'You are drawn to influence and authority structures.',
                    knowledge: 'You value information and understanding over immediate action.',
                    stability: 'You prefer predictable environments and incremental change.'
                };

                this.wordAnalysis.analysis = analysisMap[word];
                return;
            }

            // For multiple selections, calculate psychological profile
            this.wordAnalysis.analysis = this.calculateProfile();

            // Trigger subliminal flash after multiple selections
            if (this.wordAnalysis.selectedWords.length >= 3) {
                this.triggerSubliminalFlash('PREDICTABLE');
            }
        },

        // Calculate psychological profile based on word selections
        calculateProfile() {
            // Calculate conformity score (-100 to 100)
            let conformityScore = 0;

            this.wordAnalysis.selectedWords.forEach(word => {
                conformityScore += this.wordAnalysis.wordWeights[word] || 0;
            });

            // Normalize score
            conformityScore = conformityScore / this.wordAnalysis.selectedWords.length;

            // Determine primary personality trait
            let primaryTrait;

            if (conformityScore > 7) {
                primaryTrait = 'conformist';
            } else if (conformityScore > 3) {
                primaryTrait = 'authoritarian';
            } else if (conformityScore > 0) {
                primaryTrait = 'communal';
            } else if (conformityScore > -4) {
                primaryTrait = 'analytical';
            } else if (conformityScore > -7) {
                primaryTrait = 'libertarian';
            } else {
                primaryTrait = 'independent';
            }

            // Get trait description
            let analysis = this.wordAnalysis.personalityTraits[primaryTrait];

            // Add secondary insight based on specific combinations
            if (this.wordAnalysis.selectedWords.includes('security') && this.wordAnalysis.selectedWords.includes('control')) {
                analysis += ' You seek to minimize unpredictability through established structures.';
            } else if (this.wordAnalysis.selectedWords.includes('freedom') && this.wordAnalysis.selectedWords.includes('knowledge')) {
                analysis += ' You believe information access is essential for autonomous decision-making.';
            } else if (this.wordAnalysis.selectedWords.includes('power') && this.wordAnalysis.selectedWords.includes('connection')) {
                analysis += ' You navigate social dynamics to establish influence within your community.';
            }

            // Add unsettling insight for multiple selections
            if (this.wordAnalysis.selectedWords.length >= 3) {
                const unsettlingInsights = [
                    ' Your selection pattern matches 78% of users who later accepted all terms without reading them.',
                    ' This combination of values suggests high predictability in purchasing decisions.',
                    ' Your preference pattern correlates with susceptibility to confirmation bias.',
                    ' This value framework indicates systematic blind spots to specific types of persuasion.',
                    ' Your digital behavior pattern suggests receptivity to personalized influence strategies.'
                ];

                analysis += unsettlingInsights[Math.floor(Math.random() * unsettlingInsights.length)];
            }

            return analysis;
        },

        // Analyze awareness check responses
        analyzeAwareness() {
            // Get number of "aware" answers
            const awareCount =
                (this.awarenessCheck.options.control ? 0 : 1) + // Being aware means answering NO to this
                (this.awarenessCheck.options.influence ? 1 : 0) +
                (this.awarenessCheck.options.neutral ? 0 : 1) + // Being aware means answering NO to this
                (this.awarenessCheck.options.data ? 1 : 0) +
                (this.awarenessCheck.options.tos ? 0 : 1); // Being aware means answering NO to this

            // Determine awareness level
            let awarenessLevel;
            let analysis;

            if (awareCount <= 1) {
                awarenessLevel = 'Minimal';
                analysis = 'You exist in a state of digital vulnerability, largely unaware of the mechanisms that shape your online experience.';
            } else if (awareCount <= 3) {
                awarenessLevel = 'Partial';
                analysis = 'You possess some awareness of digital influence patterns but remain susceptible to more subtle manipulation techniques.';
            } else if (awareCount == 4) {
                awarenessLevel = 'Elevated';
                analysis = 'Your awareness is substantial, yet you continue to participate in systems designed to influence you. The contradiction is fascinating.';
            } else {
                awarenessLevel = 'Critical';
                analysis = 'You recognize the influence systems at work, yet continue to participate in them. This paradox is the defining condition of digital existence.';
            }

            // Update awareness check results
            this.awarenessCheck.awarenessLevel = awarenessLevel;
            this.awarenessCheck.analysis = analysis;
            this.awarenessCheck.showResults = true;

            // Trigger subliminal flash
            if (awareCount >= 4) {
                this.triggerSubliminalFlash('AWARE');
            } else {
                this.triggerSubliminalFlash('NAIVE');
            }
        },

        // Trigger subliminal flash
        triggerSubliminalFlash(message = null) {
            // If no message provided, choose random one
            if (!message) {
                message = this.subliminal.messages[Math.floor(Math.random() * this.subliminal.messages.length)];
            }

            // Set message
            this.subliminal.message = message;

            // Show subliminal message
            this.subliminal.visible = true;

            // Hide after 50ms
            setTimeout(() => {
                this.subliminal.visible = false;
            }, 50);
        },

        // Play subtle notification sound
        playSubtleSound() {
            const audio = document.getElementById('subtle-notification');

            if (audio) {
                audio.volume = 0.1;
                audio.play().catch(e => {
                    // Ignore autoplay errors
                });
            }
        },

        // Record hover event for analytics
        recordHoverEvent(e) {
            if (this.events.hovers.length >= 100) {
                // Keep only last 100 events
                this.events.hovers.shift();
            }

            this.events.hovers.push({
                element: e.target.tagName.toLowerCase(),
                time: Date.now()
            });
        },

        // Record click event for analytics
        recordClickEvent(e) {
            if (this.events.clicks.length >= 50) {
                // Keep only last 50 events
                this.events.clicks.shift();
            }

            this.events.clicks.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            });
        },

        // Record scroll event for analytics
        recordScrollEvent(position) {
            if (this.events.scrolls.length >= 50) {
                // Keep only last 50 events
                this.events.scrolls.shift();
            }

            this.events.scrolls.push({
                position: position,
                time: Date.now()
            });
        }
    }
});

// Mount Vue app
app.mount('#app');