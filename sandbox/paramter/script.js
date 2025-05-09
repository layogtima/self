// Initialize Vue app
const { createApp, ref, computed, watch, onMounted } = Vue;

createApp({
    setup() {
        // State
        const currentPhase = ref(0); // 0: intro, 1: parameter selection, 2: simulation, 3: ethical decision, 4: collision, 5: results
        const realityId = ref(0);
        const availableParameters = ref([
            {
                id: 'gravity',
                name: 'Gravitational Constant',
                description: 'Controls the force that attracts objects with mass towards each other. Affects planetary formation, star life cycles, and the large-scale structure of the universe.'
            },
            {
                id: 'light',
                name: 'Speed of Light',
                description: 'Defines the maximum speed at which information can travel through the universe. Changes to this constant would fundamentally alter causality and time dilation effects.'
            },
            {
                id: 'quantum',
                name: 'Planck Constant',
                description: 'Governs quantum behaviors at the subatomic level. Modifications would transform the very foundation of matter, energy, and atomic stability.'
            },
            {
                id: 'nuclear',
                name: 'Weak Nuclear Force',
                description: 'Responsible for radioactive decay and nuclear fusion in stars. Adjusting this parameter would change how elements form and transform throughout the cosmos.'
            }
        ]);
        const selectedParameter = ref(null);
        const parameterValue = ref(50); // 0-100 scale, 50 is current reality
        const currentScenarioIndex = ref(0);
        const ethicalScore = ref(50);
        const showCollapseWarning = ref(false);
        const isGlitching = ref(false);

        // Colliding reality data
        const collidingRealityId = ref('');
        const collidingParameter = ref(null);
        const collidingParameterValue = ref(0);
        const collidingRealitySummary = ref('');
        const yourRealitySummary = ref('');

        // Consequences tracking
        // Consequences tracking
        const finalConsequences = ref([]);
        const finalAssessment = ref('');
        const ethicalAlignmentDescription = ref('');

        // Synth setup for Tone.js
        let synth;

        // Initialize Tone.js synth
        const initializeSynth = async () => {
            await Tone.start();
            synth = new Tone.PolySynth(Tone.Synth).toDestination();
            synth.volume.value = -10; // Set volume
        };

        // Scenario data for each parameter
        const scenarios = {
            'gravity': [
                {
                    title: "Gravity Weakens",
                    description: "As the gravitational constant decreases, matter begins to disperse more easily. Stars burn brighter but die faster, unable to maintain fusion pressure for long periods. Planets form, but they're larger, less dense, with wispy atmospheres extending far into space.",
                    backgroundClass: "bg-distorted",
                    visualClass: "gravity-low",
                    consequenceText: "Star lifespans decreased by 40%. Planetary bodies formed with low density and expanded atmospheres."
                },
                {
                    title: "Gravity Intensifies",
                    description: "The increased gravitational constant causes matter to clump aggressively. Stars collapse under their own weight before fusion can properly begin. Planets are smaller, denser, with crushing gravity that prevents complex life from developing skeletal structures.",
                    backgroundClass: "bg-void",
                    visualClass: "gravity-high",
                    consequenceText: "Star formation failed in 78% of cases. Planets formed with extreme density and overwhelming surface gravity."
                }
            ],
            'light': [
                {
                    title: "Light Slows",
                    description: "The reduced speed of light reshapes spacetime itself. Causality becomes strange - effect sometimes preceding cause at quantum scales. The observable universe shrinks dramatically, as distant light may never reach observers. Stars appear closer than they are.",
                    backgroundClass: "bg-distorted",
                    visualClass: "light-low",
                    consequenceText: "Observable universe radius reduced by 87%. Causality violations observed in 12% of quantum interactions."
                },
                {
                    title: "Light Accelerates",
                    description: "As the speed of light increases, relativistic effects diminish. Time dilation becomes negligible, and the universe appears to age uniformly. The observable universe expands enormously, revealing previously invisible galaxies and structures.",
                    backgroundClass: "bg-cosmic",
                    visualClass: "light-high",
                    consequenceText: "Observable universe expanded 340%. Relativistic effects reduced to negligible levels."
                }
            ],
            'quantum': [
                {
                    title: "Quantum Uncertainty Decreases",
                    description: "As the Planck constant decreases, quantum behaviors become more predictable. Electron positions stabilize, atomic structures become rigid and less reactive. Chemistry simplifies, but life struggles to form complex molecules necessary for adaptation.",
                    backgroundClass: "bg-distorted",
                    visualClass: "quantum-low",
                    consequenceText: "Chemical reactions reduced to 23% of original diversity. Biological evolution slowed by factor of 15."
                },
                {
                    title: "Quantum Uncertainty Increases",
                    description: "The increased Planck constant causes extreme quantum fluctuations. Atoms struggle to maintain stable configurations, and matter exists in probabilistic clouds rather than defined structures. Reality itself appears to flicker in and out of existence.",
                    backgroundClass: "bg-cosmic",
                    visualClass: "quantum-high",
                    consequenceText: "Stable matter configurations reduced by 67%. Reality coherence fluctuates between 32-89%."
                }
            ],
            'nuclear': [
                {
                    title: "Weak Nuclear Force Diminishes",
                    description: "With a weakened nuclear force, radioactive decay slows dramatically. Stars struggle to produce heavier elements, resulting in a universe primarily composed of hydrogen and helium. Complex chemistry becomes impossible without carbon and heavier elements.",
                    backgroundClass: "bg-distorted",
                    visualClass: "nuclear-low",
                    consequenceText: "Heavy element production decreased by 94%. Stellar nucleosynthesis limited to elements lighter than lithium."
                },
                {
                    title: "Weak Nuclear Force Strengthens",
                    description: "The intensified weak nuclear force accelerates radioactive decay and stellar fusion. Stars burn through their fuel at incredible rates, rapidly producing heavy elements before exploding. Stable isotopes become rare, with most matter in constant decay.",
                    backgroundClass: "bg-void",
                    visualClass: "nuclear-high",
                    consequenceText: "Average stellar lifespan reduced to 2.3 million years. 87% of elements exist only in unstable isotope form."
                }
            ]
        };

        // Ethical dilemmas
        const ethicalDilemmas = [
            {
                description: "An intelligent civilization has evolved in this reality variant that thrives in the altered conditions. However, maintaining these parameters is causing instability in adjacent reality branches.",
                options: [
                    {
                        text: "Preserve this unique civilization by strengthening the parameter boundaries, potentially destabilizing neighboring realities.",
                        value: 30,
                        consequence: "Maintained unique civilization at cost of destabilizing 17 adjacent reality branches."
                    },
                    {
                        text: "Adjust parameters to reduce interference with other realities, knowing this civilization will evolve differently but more sustainably.",
                        value: 70,
                        consequence: "Modified parameters to protect multiverse stability. Original civilization evolved along alternative path."
                    }
                ]
            },
            {
                description: "Your parameter adjustments have created conditions where consciousness manifests in fundamentally different ways - existing as patterns in energy rather than biological structures.",
                options: [
                    {
                        text: "Further optimize parameters to maximize the diversity of consciousness types, accepting increased reality instability.",
                        value: 40,
                        consequence: "Consciousness diversity increased by 215%. Reality stability operating at 64% of baseline."
                    },
                    {
                        text: "Stabilize parameters to ensure the long-term survival of these consciousness patterns, even if it limits their potential diversity.",
                        value: 60,
                        consequence: "Consciousness patterns stabilized for projected 8.7 billion year duration. Diversity potential capped at current levels."
                    }
                ]
            },
            {
                description: "This parameter configuration has enabled time to flow non-linearly in certain regions of space. Future events can influence the past, creating causality loops.",
                options: [
                    {
                        text: "Preserve these causality-violation zones as they enable unprecedented information processing and intelligence emergence.",
                        value: 20,
                        consequence: "Causality violation zones preserved. Timeline fractured into 34 semi-stable branches with information exchange between them."
                    },
                    {
                        text: "Restore linear time flow throughout the universe to prevent paradoxes, even though it eliminates the emergent intelligence in these regions.",
                        value: 80,
                        consequence: "Causality restored to linear progression. Emergent intelligence patterns in temporal violation zones dissipated."
                    }
                ]
            }
        ];

        // Computed properties
        const currentScenario = computed(() => {
            if (!selectedParameter.value) return null;

            const paramScenarios = scenarios[selectedParameter.value.id];
            return parameterValue.value < 50 ? paramScenarios[0] : paramScenarios[1];
        });

        const currentDilemma = computed(() => {
            // Randomly select a dilemma
            const dilemmaIndex = Math.floor(Math.random() * ethicalDilemmas.length);
            return ethicalDilemmas[dilemmaIndex];
        });

        // Methods
        const generateRealityId = () => {
            // Generate a unique ID that looks scientific/technical
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let id = '';
            for (let i = 0; i < 4; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            id += '-';
            for (let i = 0; i < 6; i++) {
                id += Math.floor(Math.random() * 10);
            }
            return id;
        };

        const startExperience = async () => {
            // Transition to parameter selection phase
            await initializeSynth();
            playNote('C4', '8n');
            currentPhase.value = 1;
        };

        const selectParameter = (param) => {
            selectedParameter.value = param;
            parameterValue.value = 50; // Reset to neutral
            playNote('E4', '16n');
        };

        const onParameterChange = () => {
            // Play note based on parameter value
            const value = parameterValue.value;
            let note;

            if (value < 20) note = 'C3';
            else if (value < 40) note = 'E3';
            else if (value < 60) note = 'G4';
            else if (value < 80) note = 'B4';
            else note = 'D5';

            playNote(note, '32n', -20); // Quieter notes for slider movement
        };

        const confirmParameterChange = async () => {
            // Apply parameter change and transition to simulation phase
            playNote(['C4', 'E4', 'G4'], '4n');
            currentPhase.value = 2;

            // Occasionally trigger reality collision (20% chance)
            if (Math.random() < 0.2) {
                setTimeout(() => {
                    triggerRealityCollision();
                }, 10000); // 10 seconds after parameter change
            }

            // Store the consequence for final report
            const consequence = currentScenario.value.consequenceText;
            if (!finalConsequences.value.includes(consequence)) {
                finalConsequences.value.push(consequence);
            }
        };

        const revertParameter = () => {
            // Go back to parameter selection
            playNote(['C4', 'G3'], '8n');
            currentPhase.value = 1;
        };

        const continueStory = () => {
            // Move to ethical decision phase
            playNote(['E4', 'A4'], '8n');
            currentPhase.value = 3;

            // Occasionally show instability warning
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    showCollapseWarning.value = true;
                    playNote(['C3', 'F3'], '8n');
                }, 5000);
            }
        };

        const selectEthicalOption = (option) => {
            // Record ethical choice and proceed
            ethicalScore.value = option.value;
            playNote(['G4', 'B4', 'D5'], '4n');

            // Add consequence to final report
            if (!finalConsequences.value.includes(option.consequence)) {
                finalConsequences.value.push(option.consequence);
            }

            // Set ethical alignment description
            if (ethicalScore.value < 40) {
                ethicalAlignmentDescription.value = "You prioritize diversity and unique outcomes over stability and predictability.";
            } else if (ethicalScore.value < 60) {
                ethicalAlignmentDescription.value = "You balance innovation and stability, seeking sustainable solutions.";
            } else {
                ethicalAlignmentDescription.value = "You value order and predictability over chaotic but potentially transformative outcomes.";
            }

            // 50% chance to go to collision event, otherwise to final report
            if (Math.random() < 0.5) {
                triggerRealityCollision();
            } else {
                prepareFinalReport();
            }
        };

        const triggerRealityCollision = () => {
            // Generate a colliding reality
            collidingRealityId.value = generateRealityId();

            // Select a random parameter for the collision
            const paramIndex = Math.floor(Math.random() * availableParameters.value.length);
            collidingParameter.value = availableParameters.value[paramIndex];

            // Random value for colliding parameter
            collidingParameterValue.value = Math.floor(Math.random() * 100);

            // Generate descriptions
            const yourScenario = currentScenario.value;
            yourRealitySummary.value = yourScenario.description.split('.')[0] + '.';

            const collidingScenarios = scenarios[collidingParameter.value.id];
            const collidingScenario = collidingParameterValue.value < 50 ? collidingScenarios[0] : collidingScenarios[1];
            collidingRealitySummary.value = collidingScenario.description.split('.')[0] + '.';

            // Trigger glitch effect
            isGlitching.value = true;

            // Play dissonant chord
            playNote(['C3', 'F#3', 'B3'], '2n');

            // Transition to collision phase
            currentPhase.value = 4;

            // Turn off glitch after a moment
            setTimeout(() => {
                isGlitching.value = false;
            }, 3000);
        };

        const resolveCollision = () => {
            // Play resolution chord
            playNote(['C4', 'E4', 'G4', 'B4'], '2n');

            // Add collision consequence
            finalConsequences.value.push(`Reality collision with Variant #${collidingRealityId.value} successfully contained. Boundary reinforced.`);

            // Proceed to final report
            prepareFinalReport();
        };

        const prepareFinalReport = () => {
            // Generate final assessment based on choices
            if (ethicalScore.value < 40) {
                if (parameterValue.value < 30 || parameterValue.value > 70) {
                    finalAssessment.value = "Your radical parameter adjustments combined with prioritizing diversity has created a highly unstable but extraordinarily unique reality variant. It may not last long, but it will be unlike any other configuration in the multiverse.";
                } else {
                    finalAssessment.value = "Your moderate parameter changes paired with a preference for diversity has produced an interesting variant with unusual properties while maintaining reasonable stability.";
                }
            } else if (ethicalScore.value < 60) {
                finalAssessment.value = "Your balanced approach to both parameter adjustment and ethical choices has created a sustainable reality variant with novel properties. This configuration shows promising long-term stability while enabling unique developments.";
            } else {
                if (parameterValue.value < 30 || parameterValue.value > 70) {
                    finalAssessment.value = "Your extreme parameter changes contrast with your conservative ethical choices, creating tension in this reality variant. Unexpected emergent properties may develop as the system seeks equilibrium.";
                } else {
                    finalAssessment.value = "Your cautious approach to both parameter adjustment and ethical dilemmas has created a highly stable reality variant with predictable outcomes. While less unique than other configurations, this variant will likely persist for an extended duration.";
                }
            }

            // Transition to final report
            currentPhase.value = 5;
        };

        const dismissWarning = () => {
            showCollapseWarning.value = false;
            playNote('G4', '16n');
        };

        const restartExperience = () => {
            // Reset all values and start over
            currentPhase.value = 0;
            realityId.value = generateRealityId();
            selectedParameter.value = null;
            parameterValue.value = 50;
            currentScenarioIndex.value = 0;
            ethicalScore.value = 50;
            finalConsequences.value = [];
            playNote(['C4', 'E4', 'G4'], '8n');
        };

        const shareExperience = () => {
            // Generate shareable text
            const shareText = `I engineered Reality Variant #${realityId.value} by modifying the ${selectedParameter.value.name} in PARAMETER SPACE. Discover your own universe at parameter.space`;

            // Attempt to use Web Share API
            if (navigator.share) {
                navigator.share({
                    title: 'PARAMETER SPACE - My Reality Variant',
                    text: shareText,
                    url: 'https://parameter.space'
                });
            } else {
                // Fallback - copy to clipboard
                navigator.clipboard.writeText(shareText)
                    .then(() => {
                        alert('Share text copied to clipboard!');
                    });
            }

            playNote(['E4', 'G4', 'B4', 'D5'], '4n');
        };

        const playNote = (notes, duration, volume = -10) => {
            if (!synth) return;

            // Temporarily adjust volume if needed
            const originalVolume = synth.volume.value;
            synth.volume.value = volume;

            // Play the note(s)
            synth.triggerAttackRelease(notes, duration);

            // Reset volume if it was changed
            if (volume !== originalVolume) {
                setTimeout(() => {
                    synth.volume.value = originalVolume;
                }, Tone.Time(duration).toMilliseconds());
            }
        };

        onMounted(() => {
            // Initialize audio context
            window.addEventListener('click', () => {
                if (Tone.context.state !== 'running') {
                    Tone.context.resume();
                }
            });
        });

        return {
            currentPhase,
            realityId,
            availableParameters,
            selectedParameter,
            parameterValue,
            currentScenario,
            ethicalScore,
            showCollapseWarning,
            isGlitching,
            collidingRealityId,
            collidingParameter,
            collidingParameterValue,
            collidingRealitySummary,
            yourRealitySummary,
            finalConsequences,
            finalAssessment,
            ethicalAlignmentDescription,
            currentDilemma,
            startExperience,
            selectParameter,
            onParameterChange,
            confirmParameterChange,
            revertParameter,
            continueStory,
            selectEthicalOption,
            dismissWarning,
            resolveCollision,
            restartExperience,
            shareExperience
        };
    }
}).mount('#app');