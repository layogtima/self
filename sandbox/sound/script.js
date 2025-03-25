/**
 * AMARTHA SOUND MACHINE
 * An AI-powered audio playground
 * © Absurd Industries 2025
 */

// Initialize Vue Application
const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

// Create Audio Utilities
const AudioUtils = {
    context: null,
    masterGain: null,
    analyser: null,
    compressor: null,
    masterFilter: null,
    reverb: null,
    analyserData: null,

    // Initialize Audio Context
    init() {
        if (this.context) return;

        // Create Audio Context
        this.context = new (window.AudioContext || window.webkitAudioContext)();

        // Create Master Chain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.7;

        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.masterFilter = this.context.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.value = 20000;
        this.masterFilter.Q.value = 1;

        // Create Analyzer
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

        // Create Reverb
        this.createReverb().then(reverb => {
            this.reverb = reverb;

            // Connect Chain
            this.masterGain.connect(this.masterFilter);
            this.masterFilter.connect(this.compressor);
            this.compressor.connect(this.analyser);
            this.analyser.connect(this.context.destination);
        });

        console.log("🎹 Audio system initialized");
        return this.context;
    },

    // Create Reverb from Impulse Response
    async createReverb() {
        const impulseLength = 2; // seconds
        const sampleRate = this.context.sampleRate;
        const impulseBuffer = this.context.createBuffer(2, sampleRate * impulseLength, sampleRate);

        // Create decay curve for reverb
        for (let channel = 0; channel < impulseBuffer.numberOfChannels; channel++) {
            const impulseData = impulseBuffer.getChannelData(channel);
            for (let i = 0; i < impulseData.length; i++) {
                const decay = impulseLength - (i / sampleRate);
                const noise = Math.random() * 2 - 1;
                impulseData[i] = noise * Math.pow(decay, 2);
            }
        }

        const convolver = this.context.createConvolver();
        convolver.buffer = impulseBuffer;
        return convolver;
    },

    // Set Master Volume
    setMasterVolume(value) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = value;
    },

    // Set Filter Cutoff
    setFilterCutoff(value) {
        if (!this.masterFilter) return;
        this.masterFilter.frequency.value = value;
    },

    // Set Reverb Amount
    setReverbAmount(value) {
        if (!this.reverb || !this.masterGain || !this.masterFilter) return;

        if (value > 0) {
            // Connect reverb in parallel
            this.masterGain.disconnect();

            const dryGain = this.context.createGain();
            const wetGain = this.context.createGain();

            dryGain.gain.value = 1 - value;
            wetGain.gain.value = value;

            this.masterGain.connect(dryGain);
            this.masterGain.connect(this.reverb);
            this.reverb.connect(wetGain);

            dryGain.connect(this.masterFilter);
            wetGain.connect(this.masterFilter);
        } else {
            // Direct connection
            this.masterGain.disconnect();
            this.masterGain.connect(this.masterFilter);
        }
    },

    // Update Analyzer Data
    updateAnalyser() {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(this.analyserData);
        return this.analyserData;
    }
};

// Sound Generator Utilities
const SoundGenerator = {
    // Create Sine Wave Base64
    generateSineWave(frequency = 440, duration = 1) {
        return this.generateWave('sine', frequency, duration);
    },

    // Create Square Wave Base64
    generateSquareWave(frequency = 330, duration = 1) {
        return this.generateWave('square', frequency, duration);
    },

    // Create Sawtooth Wave Base64
    generateSawWave(frequency = 220, duration = 1) {
        return this.generateWave('sawtooth', frequency, duration);
    },

    // Generic Wave Generator
    generateWave(type, frequency, duration) {
        if (!AudioUtils.context) AudioUtils.init();
        const ctx = AudioUtils.context;

        const sampleRate = ctx.sampleRate;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        // Fill with waveform
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            let sample = 0;

            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    sample = 2 * ((t * frequency) % 1) - 1;
                    break;
                case 'triangle':
                    const phase = ((t * frequency) % 1);
                    sample = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
                    break;
            }

            // Apply fade in/out to prevent clicks
            const fadeTime = 0.01;
            const fadeInSamples = fadeTime * sampleRate;
            const fadeOutSamples = fadeTime * sampleRate;

            if (i < fadeInSamples) {
                sample *= (i / fadeInSamples);
            } else if (i > numSamples - fadeOutSamples) {
                sample *= ((numSamples - i) / fadeOutSamples);
            }

            data[i] = sample * 0.5; // Reduce volume
        }

        return buffer;
    },

    // Create Random Percussion Sound
    generateDrumSound(type) {
        if (!AudioUtils.context) AudioUtils.init();
        const ctx = AudioUtils.context;

        const sampleRate = ctx.sampleRate;
        const duration = 1; // seconds
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        switch (type) {
            case 'kick':
                // Kick drum
                const kickFreq = 150;
                const kickDecay = 0.1;

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const frequency = kickFreq * Math.pow(0.5, t / kickDecay);
                    data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.pow(0.1, t / kickDecay);
                }
                break;

            case 'snare':
                // Snare drum
                const snareFreq = 300;
                const snareDecay = 0.2;

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const noise = Math.random() * 2 - 1;
                    const tone = Math.sin(2 * Math.PI * snareFreq * t);
                    data[i] = (noise * 0.8 + tone * 0.2) * Math.pow(0.1, t / snareDecay);
                }
                break;

            case 'hihat':
                // Hi-hat
                const hihatDecay = 0.05;

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const noise = Math.random() * 2 - 1;
                    data[i] = noise * Math.pow(0.1, t / hihatDecay);
                }
                break;

            case 'clap':
                // Clap sound
                const clapDecay = 0.2;
                const clapDelay = 0.01;

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    let sample = 0;

                    // Multiple noise bursts
                    for (let j = 0; j < 4; j++) {
                        const delay = j * clapDelay;
                        if (t >= delay) {
                            const noise = Math.random() * 2 - 1;
                            sample += noise * Math.pow(0.1, (t - delay) / clapDecay);
                        }
                    }

                    data[i] = sample * 0.25;
                }
                break;

            case 'tom':
                // Tom drum
                const tomFreq = 100;
                const tomDecay = 0.2;

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const frequency = tomFreq * Math.pow(0.8, t / tomDecay);
                    data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.pow(0.1, t / tomDecay);
                }
                break;

            case 'fx':
                // Noise sweep effect
                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const noise = Math.random() * 2 - 1;
                    const sweep = 1 - t / duration;
                    data[i] = noise * Math.pow(sweep, 3) * 0.5;
                }
                break;

            default:
                // Default percussion
                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.random() * 2 - 1 * Math.pow(0.1, t / 0.1);
                }
        }

        return buffer;
    },

    // Play Audio Buffer
    playBuffer(buffer, options = {}) {
        if (!AudioUtils.context) AudioUtils.init();
        const ctx = AudioUtils.context;

        // Create source node
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Create gain node for volume
        const gainNode = ctx.createGain();
        gainNode.gain.value = options.volume || 1;

        // Create filter if needed
        let filter = null;
        if (options.filter) {
            filter = ctx.createBiquadFilter();
            filter.type = options.filter.type || 'lowpass';
            filter.frequency.value = options.filter.frequency || 1000;
            filter.Q.value = options.filter.Q || 1;
        }

        // Connect nodes
        source.connect(gainNode);
        if (filter) {
            gainNode.connect(filter);
            filter.connect(AudioUtils.masterGain);
        } else {
            gainNode.connect(AudioUtils.masterGain);
        }

        // Start playback
        source.start(ctx.currentTime + (options.delay || 0));
        if (options.duration) {
            source.stop(ctx.currentTime + options.duration + (options.delay || 0));
        }

        return { source, gainNode, filter };
    }
};

// Synth Engine
const SynthEngine = {
    oscillators: {},
    gainNodes: {},

    // Initialize with audio context
    init(audioContext) {
        this.context = audioContext;
        return this;
    },

    // Play a note
    playNote(note, options = {}) {
        if (!this.context) return;

        const { frequency, id } = note;

        // Stop previous note with same ID if exists
        if (id && this.oscillators[id]) {
            this.stopNote(id);
        }

        // Create oscillator
        const oscillator = this.context.createOscillator();
        oscillator.type = options.waveform || 'sine';
        oscillator.frequency.value = frequency;

        // Create gain node for envelope
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;

        // Create filter
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = options.filterCutoff || 5000;
        filter.Q.value = options.filterResonance || 1;

        // Apply attack
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(options.volume || 0.5, now + (options.attack || 0.1));

        // Connect chain
        oscillator.connect(filter);
        filter.connect(gainNode);

        // Connect to destination
        if (options.delay && options.delayTime && options.delayFeedback) {
            // Create delay effect
            const delay = this.context.createDelay();
            delay.delayTime.value = options.delayTime;

            const feedback = this.context.createGain();
            feedback.gain.value = options.delayFeedback;

            gainNode.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);

            // Mix output
            const dryGain = this.context.createGain();
            dryGain.gain.value = 1;

            gainNode.connect(dryGain);
            delay.connect(dryGain);

            dryGain.connect(AudioUtils.masterGain);
        } else {
            gainNode.connect(AudioUtils.masterGain);
        }

        // Start oscillator
        oscillator.start();

        // Store for later reference
        if (id) {
            this.oscillators[id] = oscillator;
            this.gainNodes[id] = gainNode;
        }

        return { oscillator, gainNode, filter };
    },

    // Stop a note with given ID
    stopNote(id, options = {}) {
        if (!this.oscillators[id] || !this.gainNodes[id]) return;

        const now = this.context.currentTime;
        const release = options.release || 0.1;

        // Apply release
        this.gainNodes[id].gain.cancelScheduledValues(now);
        this.gainNodes[id].gain.setValueAtTime(this.gainNodes[id].gain.value, now);
        this.gainNodes[id].gain.linearRampToValueAtTime(0, now + release);

        // Schedule oscillator stop
        this.oscillators[id].stop(now + release + 0.1);

        // Remove references
        setTimeout(() => {
            delete this.oscillators[id];
            delete this.gainNodes[id];
        }, (release + 0.2) * 1000);
    },

    // Stop all notes
    stopAllNotes(options = {}) {
        for (const id in this.oscillators) {
            this.stopNote(id, options);
        }
    }
};

// Main Vue App
createApp({
    setup() {
        const activeSection = ref('sampler');
        const isAnimating = ref(false);
        const systemActive = ref(false);
        const masterVolume = ref(0.7);
        const filterCutoff = ref(20000);
        const reverbAmount = ref(0.3);
        const bpm = ref(120);
        const sequencerRunning = ref(false);
        const currentStep = ref(-1);
        const octave = ref(4);
        const waveform = ref('sine');
        const thereminActive = ref(false);
        const thereminX = ref(0);
        const thereminY = ref(0);
        const version = ref('0.1.3');
        const currentYear = ref(new Date().getFullYear());

        // Envelope
        const envelope = reactive({
            attack: 0.1,
            decay: 0.2,
            sustain: 0.7,
            release: 0.3
        });

        // Synthesizer params
        const synthFilterCutoff = ref(5000);
        const synthFilterResonance = ref(2);
        const delayTime = ref(0.25);
        const delayFeedback = ref(0.3);

        // Taglines
        const taglines = [
            "Forging audio futures one waveform at a time.",
            "Where algorithms become art and frequencies find form.",
            "Audio engineering elevated beyond human limitations.",
            "Transforming code into compositions that transcend time.",
            "The sonic playground where mathematics meets emotion.",
            "Bending digital waves into analog feelings.",
            "Calculations and creativity collide in harmony.",
            "Your human DJ friend is about to question everything.",
            "The perfect fusion of logic and rhythm.",
            "Proving that 1s and 0s can groove harder than humans."
        ];
        const tagline = ref(taglines[Math.floor(Math.random() * taglines.length)]);

        // Drum pads
        const drumPads = reactive([
            { name: 'KICK', key: 'q', type: 'kick', active: false },
            { name: 'SNARE', key: 'w', type: 'snare', active: false },
            { name: 'HI-HAT', key: 'e', type: 'hihat', active: false },
            { name: 'CLAP', key: 'a', type: 'clap', active: false },
            { name: 'TOM', key: 's', type: 'tom', active: false },
            { name: 'PERC', key: 'd', type: 'perc', active: false },
            { name: 'FX 1', key: 'z', type: 'fx', active: false },
            { name: 'FX 2', key: 'x', type: 'fx2', active: false },
            { name: 'RIM', key: 'c', type: 'rim', active: false }
        ]);

        // Sequencer tracks
        const sequencerTracks = reactive([
            { name: 'KICK', type: 'kick', steps: Array(16).fill(false) },
            { name: 'SNARE', type: 'snare', steps: Array(16).fill(false) },
            { name: 'HI-HAT', type: 'hihat', steps: Array(16).fill(false) },
            { name: 'CLAP', type: 'clap', steps: Array(16).fill(false) },
            { name: 'TOM', type: 'tom', steps: Array(16).fill(false) },
            { name: 'PERC', type: 'perc', steps: Array(16).fill(false) }
        ]);

        // Preset patterns
        const patterns = [
            {
                name: 'BASIC BEAT',
                pattern: [
                    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
                    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // hihat
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // clap
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // tom
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // perc
                ]
            },
            {
                name: 'TRAP',
                pattern: [
                    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // kick
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hihat
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], // clap
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // tom
                    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]  // perc
                ]
            },
            {
                name: 'HOUSE',
                pattern: [
                    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
                    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // hihat
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // clap
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // tom
                    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0]  // perc
                ]
            },
            {
                name: 'TECHNO',
                pattern: [
                    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hihat
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // clap
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // tom
                    [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0]  // perc
                ]
            }
        ];

        // Matrix rain effect (because we're feeling extra)
        const matrixColumns = reactive([]);

        // Computed properties
        const thereminCursorStyle = computed(() => {
            return {
                left: `${thereminX.value * 100}%`,
                top: `${thereminY.value * 100}%`
            };
        });

        // Audio buffer caches
        const drumSoundBuffers = {};

        // Sequencer interval reference
        let sequencerIntervalId = null;
        let visualizerAnimationId = null;
        let matrixAnimationId = null;
        let thereminOscillator = null;
        let thereminGain = null;
        let keyboardNotes = {};

        // Initialize our awesomeness
        onMounted(() => {
            // Initialize Amartha
            setTimeout(() => isAnimating.value = true, 2000);

            // Add keyboard event listeners
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);

            // Setup theremin
            setupTheremin();

            // Setup piano keyboard
            setupPianoKeyboard();

            // Setup visualizer
            setupVisualizer();

            // Create scanline effect (because why not?)
            createScanlineEffect();

            // Static noise overlay
            createStaticNoiseEffect();

            // Initialize Easter Eggs
            initEasterEggs();
        });

        // Watch for property changes
        watch(masterVolume, (newValue) => {
            AudioUtils.setMasterVolume(newValue);
        });

        watch(filterCutoff, (newValue) => {
            AudioUtils.setFilterCutoff(newValue);
        });

        watch(reverbAmount, (newValue) => {
            AudioUtils.setReverbAmount(newValue);
        });

        // Create scanline effect
        function createScanlineEffect() {
            const scanline = document.createElement('div');
            scanline.classList.add('scanline');
            document.body.appendChild(scanline);
        }

        // Create static noise effect
        function createStaticNoiseEffect() {
            const noise = document.createElement('div');
            noise.classList.add('static-noise');
            document.body.appendChild(noise);
        }

        // Start system
        function startSystem() {
            if (systemActive.value) return;

            // Initialize audio
            AudioUtils.init();

            // Setup synth engine
            SynthEngine.init(AudioUtils.context);

            // Change status
            systemActive.value = true;

            // Play startup sound
            const startupBuffer = SoundGenerator.generateWave('sawtooth', 880, 0.1);
            SoundGenerator.playBuffer(startupBuffer, { volume: 0.3 });

            setTimeout(() => {
                const startup2Buffer = SoundGenerator.generateWave('sine', 440, 0.2);
                SoundGenerator.playBuffer(startup2Buffer, { volume: 0.3 });
            }, 300);

            // Start Matrix rain
            startMatrixRain();

            // Randomize tagline
            tagline.value = taglines[Math.floor(Math.random() * taglines.length)];
        }

        // Matrix rain effect
        function startMatrixRain() {
            // Create 30 columns
            for (let i = 0; i < 30; i++) {
                matrixColumns.push({
                    x: Math.random() * 100,
                    y: -100 - Math.random() * 500,
                    speed: 1 + Math.random() * 5,
                    chars: generateRandomChars(Math.floor(5 + Math.random() * 15))
                });
            }

            // Animate matrix rain
            function animateMatrixRain() {
                // Update positions
                for (let i = 0; i < matrixColumns.length; i++) {
                    const column = matrixColumns[i];
                    column.y += column.speed;

                    // Reset when off-screen
                    if (column.y > 120) {
                        column.y = -100 - Math.random() * 200;
                        column.chars = generateRandomChars(Math.floor(5 + Math.random() * 15));
                    }
                }

                matrixAnimationId = requestAnimationFrame(animateMatrixRain);
            }

            animateMatrixRain();
        }

        // Generate random characters for matrix effect
        function generateRandomChars(length) {
            const chars = [];
            const possibleChars = '01';

            for (let i = 0; i < length; i++) {
                chars.push(possibleChars.charAt(Math.floor(Math.random() * possibleChars.length)));
            }

            return chars;
        }

        // Toggle animation state
        function toggleAnimation() {
            isAnimating.value = !isAnimating.value;
        }

        // Trigger a sample from a drum pad
        function triggerSample(pad) {
            if (!systemActive.value) startSystem();

            pad.active = true;
            setTimeout(() => pad.active = false, 100);

            // Get or create drum sound buffer
            let buffer = drumSoundBuffers[pad.type];
            if (!buffer) {
                buffer = SoundGenerator.generateDrumSound(pad.type);
                drumSoundBuffers[pad.type] = buffer;
            }

            // Play sound
            SoundGenerator.playBuffer(buffer, { volume: 0.7 });
        }

        // Toggle a step in the sequencer
        function toggleStep(trackIndex, stepIndex) {
            sequencerTracks[trackIndex].steps[stepIndex] = !sequencerTracks[trackIndex].steps[stepIndex];
        }

        // Start/stop sequencer
        function toggleSequencer() {
            if (sequencerRunning.value) {
                // Stop sequencer
                clearInterval(sequencerIntervalId);
                sequencerIntervalId = null;
                sequencerRunning.value = false;
                currentStep.value = -1;
            } else {
                // Start sequencer
                if (!systemActive.value) startSystem();

                const stepTimeMs = 60000 / bpm.value / 4; // 16th notes
                currentStep.value = 0;
                sequencerRunning.value = true;

                sequencerIntervalId = setInterval(() => {
                    // Play active steps
                    for (let i = 0; i < sequencerTracks.length; i++) {
                        const track = sequencerTracks[i];
                        if (track.steps[currentStep.value]) {
                            // Get or create drum sound buffer
                            let buffer = drumSoundBuffers[track.type];
                            if (!buffer) {
                                buffer = SoundGenerator.generateDrumSound(track.type);
                                drumSoundBuffers[track.type] = buffer;
                            }

                            // Play sound
                            SoundGenerator.playBuffer(buffer, { volume: 0.7 });
                        }
                    }

                    // Advance to next step
                    currentStep.value = (currentStep.value + 1) % 16;
                }, stepTimeMs);
            }
        }

        // Clear sequencer pattern
        function clearSequencer() {
            for (let i = 0; i < sequencerTracks.length; i++) {
                sequencerTracks[i].steps = Array(16).fill(false);
            }
        }

        // Load pattern
        function loadPattern(pattern) {
            for (let i = 0; i < sequencerTracks.length; i++) {
                for (let j = 0; j < 16; j++) {
                    sequencerTracks[i].steps[j] = pattern.pattern[i][j] === 1;
                }
            }
        }

        // Setup theremin
        function setupTheremin() {
            const thereminPad = document.querySelector('.theremin-pad');
            if (!thereminPad) return;

            thereminPad.addEventListener('mousedown', (e) => {
                if (!systemActive.value) startSystem();

                thereminActive.value = true;
                updateThereminPosition(e);
                startTheremin();
            });

            thereminPad.addEventListener('mousemove', (e) => {
                if (thereminActive.value) {
                    updateThereminPosition(e);
                    updateThereminSound();
                }
            });

            thereminPad.addEventListener('mouseup', () => {
                thereminActive.value = false;
                stopTheremin();
            });

            thereminPad.addEventListener('mouseleave', () => {
                thereminActive.value = false;
                stopTheremin();
            });

            // Touch events for mobile
            thereminPad.addEventListener('touchstart', (e) => {
                if (!systemActive.value) startSystem();

                thereminActive.value = true;
                updateThereminPositionTouch(e);
                startTheremin();
                e.preventDefault();
            });

            thereminPad.addEventListener('touchmove', (e) => {
                if (thereminActive.value) {
                    updateThereminPositionTouch(e);
                    updateThereminSound();
                }
                e.preventDefault();
            });

            thereminPad.addEventListener('touchend', () => {
                thereminActive.value = false;
                stopTheremin();
            });
        }

        // Update theremin position with mouse
        function updateThereminPosition(e) {
            const rect = e.target.getBoundingClientRect();
            thereminX.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            thereminY.value = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        }

        // Update theremin position with touch
        function updateThereminPositionTouch(e) {
            const rect = e.target.getBoundingClientRect();
            const touch = e.touches[0];
            thereminX.value = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            thereminY.value = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
        }

        // Start theremin sound
        function startTheremin() {
            if (!AudioUtils.context) return;

            // Create oscillator
            thereminOscillator = AudioUtils.context.createOscillator();
            thereminOscillator.type = waveform.value;

            // Create gain node
            thereminGain = AudioUtils.context.createGain();
            thereminGain.gain.value = 0.3;

            // Connect nodes
            thereminOscillator.connect(thereminGain);
            thereminGain.connect(AudioUtils.masterGain);

            // Start oscillator
            thereminOscillator.start();

            // Update sound parameters
            updateThereminSound();
        }

        // Update theremin sound based on position
        function updateThereminSound() {
            if (!thereminOscillator || !thereminGain) return;

            // Map X to frequency (100Hz - 2000Hz)
            const frequency = 100 + thereminX.value * 1900;

            // Map Y to volume (0.7 - 0)
            const volume = 0.5 * (1 - thereminY.value);

            // Update parameters
            thereminOscillator.frequency.setValueAtTime(frequency, AudioUtils.context.currentTime);
            thereminGain.gain.setValueAtTime(volume, AudioUtils.context.currentTime);
        }

        // Stop theremin sound
        function stopTheremin() {
            if (!thereminOscillator) return;

            // Apply quick fade out to prevent click
            thereminGain.gain.setValueAtTime(thereminGain.gain.value, AudioUtils.context.currentTime);
            thereminGain.gain.linearRampToValueAtTime(0, AudioUtils.context.currentTime + 0.1);

            // Stop oscillator after fade
            thereminOscillator.stop(AudioUtils.context.currentTime + 0.1);

            // Clear references
            thereminOscillator = null;
            thereminGain = null;
        }

        // Setup piano keyboard
        function setupPianoKeyboard() {
            const keyboardElement = document.querySelector('.piano-keyboard');
            if (!keyboardElement) return;

            // Clear existing content
            keyboardElement.innerHTML = '';

            // Define keys
            const keys = [
                { note: 'C', key: 'a', type: 'white' },
                { note: 'C#', key: 'w', type: 'black' },
                { note: 'D', key: 's', type: 'white' },
                { note: 'D#', key: 'e', type: 'black' },
                { note: 'E', key: 'd', type: 'white' },
                { note: 'F', key: 'f', type: 'white' },
                { note: 'F#', key: 't', type: 'black' },
                { note: 'G', key: 'g', type: 'white' },
                { note: 'G#', key: 'y', type: 'black' },
                { note: 'A', key: 'h', type: 'white' },
                { note: 'A#', key: 'u', type: 'black' },
                { note: 'B', key: 'j', type: 'white' }
            ];

            // Create keyboard layout
            const whiteKeys = keys.filter(key => key.type === 'white');

            // Create white keys first
            whiteKeys.forEach((keyData, index) => {
                const keyElement = document.createElement('div');
                keyElement.classList.add('piano-key', 'white');
                keyElement.dataset.note = keyData.note;
                keyElement.dataset.key = keyData.key;
                keyElement.dataset.index = index;

                const label = document.createElement('div');
                label.classList.add('label');
                label.textContent = keyData.key.toUpperCase();
                keyElement.appendChild(label);

                // Add event listeners
                keyElement.addEventListener('mousedown', () => playPianoNote(keyData.note));
                keyElement.addEventListener('mouseup', () => stopPianoNote(keyData.note));
                keyElement.addEventListener('mouseleave', () => stopPianoNote(keyData.note));

                // Touch events
                keyElement.addEventListener('touchstart', (e) => {
                    playPianoNote(keyData.note);
                    e.preventDefault();
                });
                keyElement.addEventListener('touchend', () => stopPianoNote(keyData.note));

                keyboardElement.appendChild(keyElement);
            });

            // Then create black keys on top
            keys.filter(key => key.type === 'black').forEach((keyData) => {
                const keyElement = document.createElement('div');
                keyElement.classList.add('piano-key', 'black');
                keyElement.dataset.note = keyData.note;
                keyElement.dataset.key = keyData.key;

                const label = document.createElement('div');
                label.classList.add('label');
                label.textContent = keyData.key.toUpperCase();
                keyElement.appendChild(label);

                // Add event listeners
                keyElement.addEventListener('mousedown', () => playPianoNote(keyData.note));
                keyElement.addEventListener('mouseup', () => stopPianoNote(keyData.note));
                keyElement.addEventListener('mouseleave', () => stopPianoNote(keyData.note));

                // Touch events
                keyElement.addEventListener('touchstart', (e) => {
                    playPianoNote(keyData.note);
                    e.preventDefault();
                });
                keyElement.addEventListener('touchend', () => stopPianoNote(keyData.note));

                // Position black key
                const index = keys.findIndex(k => k.note === keyData.note);
                const prevWhiteIndex = whiteKeys.findIndex(k => keys.findIndex(key => key.note === k.note) < index);

                if (prevWhiteIndex !== -1) {
                    const whiteKeyElement = keyboardElement.children[prevWhiteIndex];
                    keyElement.style.left = `${whiteKeyElement.offsetLeft + whiteKeyElement.offsetWidth - keyElement.offsetWidth / 2}px`;
                }

                keyboardElement.appendChild(keyElement);
            });
        }

        // Play piano note
        function playPianoNote(noteName) {
            if (!systemActive.value) startSystem();

            // Calculate frequency based on note name and octave
            const noteFreq = getNoteFrequency(noteName, octave.value);

            // Highlight key
            const keyElement = document.querySelector(`.piano-key[data-note="${noteName}"]`);
            if (keyElement) keyElement.classList.add('playing');

            // Play note
            const noteId = `${noteName}${octave.value}`;
            SynthEngine.playNote(
                { frequency: noteFreq, id: noteId },
                {
                    waveform: waveform.value,
                    attack: envelope.attack,
                    release: envelope.release,
                    volume: 0.5,
                    filterCutoff: synthFilterCutoff.value,
                    filterResonance: synthFilterResonance.value,
                    delay: delayTime.value > 0,
                    delayTime: delayTime.value,
                    delayFeedback: delayFeedback.value
                }
            );

            // Store key state
            keyboardNotes[noteId] = { element: keyElement, active: true };
        }

        // Stop piano note
        function stopPianoNote(noteName) {
            const noteId = `${noteName}${octave.value}`;

            // Remove highlight
            if (keyboardNotes[noteId] && keyboardNotes[noteId].element) {
                keyboardNotes[noteId].element.classList.remove('playing');
            }

            // Stop note
            SynthEngine.stopNote(noteId, { release: envelope.release });

            // Clear key state
            delete keyboardNotes[noteId];
        }

        // Get frequency for a note
        function getNoteFrequency(noteName, octave) {
            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const noteIndex = notes.indexOf(noteName);

            if (noteIndex === -1) return 440; // Default to A4

            // A4 is 440Hz (note 9, octave 4)
            const semitones = (octave - 4) * 12 + noteIndex - 9;
            return 440 * Math.pow(2, semitones / 12);
        }

        // Handle keyboard input
        function handleKeyDown(e) {
            // Prevent repeat events
            if (e.repeat) return;

            // Check if we need to activate the system
            if (!systemActive.value) startSystem();

            // Find drum pad with matching key
            const pad = drumPads.find(p => p.key === e.key.toLowerCase());
            if (pad) {
                triggerSample(pad);
                return;
            }

            // Check piano keys
            const pianoKey = document.querySelector(`.piano-key[data-key="${e.key.toLowerCase()}"]`);
            if (pianoKey) {
                const noteName = pianoKey.dataset.note;
                playPianoNote(noteName);
            }
        }

        // Handle key release
        function handleKeyUp(e) {
            // Check piano keys
            const pianoKey = document.querySelector(`.piano-key[data-key="${e.key.toLowerCase()}"]`);
            if (pianoKey) {
                const noteName = pianoKey.dataset.note;
                stopPianoNote(noteName);
            }
        }

        // Setup visualizer
        function setupVisualizer() {
            const canvas = document.querySelector('canvas.visualizer');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width = canvas.clientWidth;
            const height = canvas.height = canvas.clientHeight;

            function drawVisualizer() {
                if (!AudioUtils.analyser) {
                    visualizerAnimationId = requestAnimationFrame(drawVisualizer);
                    return;
                }

                // Get frequency data
                const dataArray = AudioUtils.updateAnalyser();

                // Clear canvas
                ctx.clearRect(0, 0, width, height);

                // Set line style
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'white';

                // Draw frequency bars
                const barWidth = Math.ceil(width / dataArray.length);

                for (let i = 0; i < dataArray.length; i++) {
                    const barHeight = (dataArray[i] / 255) * height;

                    // Use a gradient to make it look cool
                    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
                }

                visualizerAnimationId = requestAnimationFrame(drawVisualizer);
            }

            drawVisualizer();
        }

        // Initialize Easter Eggs
        function initEasterEggs() {
            // Let's add a konami code because we're cool like that
            let konamiIndex = 0;
            const konamiCode = [
                'ArrowUp', 'ArrowUp',
                'ArrowDown', 'ArrowDown',
                'ArrowLeft', 'ArrowRight',
                'ArrowLeft', 'ArrowRight',
                'b', 'a'
            ];

            document.addEventListener('keydown', (e) => {
                if (e.key === konamiCode[konamiIndex]) {
                    konamiIndex++;

                    if (konamiIndex === konamiCode.length) {
                        activateKonamiCode();
                        konamiIndex = 0;
                    }
                } else {
                    konamiIndex = 0;
                }
            });

            // Add hidden button
            const easterEggButton = document.createElement('button');
            easterEggButton.classList.add('easter-egg');
            easterEggButton.addEventListener('click', activateKonamiCode);
            document.body.appendChild(easterEggButton);
        }

        // Activate Konami Code Easter Egg
        function activateKonamiCode() {
            // Apply rainbow effect to the body
            document.body.classList.add('konami-activated');

            // Play a special sound
            if (AudioUtils.context) {
                const duration = 2;
                const ctx = AudioUtils.context;
                const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                // Create a cool arpeggio
                const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 659.25];
                const noteDuration = duration / notes.length;

                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    const noteIndex = Math.floor(t / noteDuration) % notes.length;
                    const freq = notes[noteIndex];

                    // Add some harmonics for richness
                    // Add some harmonics for richness
                    data[i] = 0.5 * Math.sin(2 * Math.PI * freq * t) +
                        0.25 * Math.sin(2 * Math.PI * freq * 2 * t) +
                        0.125 * Math.sin(2 * Math.PI * freq * 4 * t);

                    // Apply envelope for each note
                    const noteT = t % noteDuration;
                    const attack = 0.05;
                    const release = 0.1;

                    if (noteT < attack) {
                        data[i] *= noteT / attack;
                    } else if (noteT > noteDuration - release) {
                        data[i] *= (noteDuration - noteT) / release;
                    }
                }

                // Play special sound
                SoundGenerator.playBuffer(buffer, { volume: 0.5 });
            }

            // Show a special message
            const message = document.createElement('div');
            message.textContent = "KONAMI CODE ACTIVATED — ABSURD MODE ENGAGED";
            message.style.position = 'fixed';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.fontFamily = '"Space Mono", monospace';
            message.style.fontSize = '20px';
            message.style.fontWeight = 'bold';
            message.style.color = 'white';
            message.style.padding = '20px';
            message.style.background = 'rgba(0, 0, 0, 0.8)';
            message.style.borderRadius = '5px';
            message.style.zIndex = '9999';

            document.body.appendChild(message);

            // Remove after a few seconds
            setTimeout(() => {
                document.body.classList.remove('konami-activated');
                document.body.removeChild(message);
            }, 5000);
        }


        // Return everything that's used in the template
        return {
            // State
            activeSection,
            isAnimating,
            systemActive,
            masterVolume,
            filterCutoff,
            reverbAmount,
            bpm,
            sequencerRunning,
            currentStep,
            octave,
            waveform,
            thereminX,
            thereminY,
            envelope,
            synthFilterCutoff,
            synthFilterResonance,
            delayTime,
            delayFeedback,
            version,
            currentYear,
            tagline,
            drumPads,
            sequencerTracks,
            patterns,

            // Computed
            thereminCursorStyle,

            // Methods
            toggleAnimation,
            startSystem,
            triggerSample,
            toggleStep,
            toggleSequencer,
            clearSequencer,
            loadPattern
        };
    }
}).mount('#app');

// Add extra system effects after load
window.addEventListener('load', () => {
    // Add ambient hover sound for interactive elements
    document.querySelectorAll('button, a, .drum-pad, .step, .piano-key, .theremin-pad')
        .forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!AudioUtils.context) return;

                const gain = AudioUtils.context.createGain();
                gain.gain.value = 0.01; // Very quiet

                const oscillator = AudioUtils.context.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = 10000 + Math.random() * 2000;

                oscillator.connect(gain);
                gain.connect(AudioUtils.masterGain);

                oscillator.start();
                oscillator.stop(AudioUtils.context.currentTime + 0.05);
            });
        });

    // Inject a subtle glitch effect randomly
    setInterval(() => {
        if (Math.random() < 0.05) { // 5% chance every interval
            const glitchElement = document.createElement('div');
            glitchElement.style.position = 'fixed';
            glitchElement.style.top = `${Math.random() * 100}%`;
            glitchElement.style.left = `${Math.random() * 100}%`;
            glitchElement.style.width = `${Math.random() * 200 + 50}px`;
            glitchElement.style.height = `${Math.random() * 5 + 1}px`;
            glitchElement.style.background = 'rgba(255, 255, 255, 0.8)';
            glitchElement.style.zIndex = '9999';
            glitchElement.style.pointerEvents = 'none';

            document.body.appendChild(glitchElement);

            // Remove after short time
            setTimeout(() => {
                document.body.removeChild(glitchElement);
            }, 50 + Math.random() * 100);
        }
    }, 5000);
});

/**
 * AMARTHA ANALYTICS
 * Advanced audio analysis functions
 */
const AmarthaAnalytics = {
    // Analyze audio buffer to extract features
    analyzeBuffer(buffer) {
        const features = {
            rms: 0,
            peakLevel: 0,
            spectralCentroid: 0,
            zeroCrossingRate: 0
        };

        // Extract channel data
        const data = buffer.getChannelData(0);
        const length = data.length;

        // Calculate RMS and peak level
        let sum = 0;
        let peak = 0;
        let zeroCrossings = 0;

        for (let i = 0; i < length; i++) {
            const sample = data[i];
            sum += sample * sample;
            peak = Math.max(peak, Math.abs(sample));

            // Count zero crossings
            if (i > 0 && ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0))) {
                zeroCrossings++;
            }
        }

        features.rms = Math.sqrt(sum / length);
        features.peakLevel = peak;
        features.zeroCrossingRate = zeroCrossings / length;

        // Calculate spectral centroid
        // This would typically require FFT which is complex
        // We'll use a simplified approach based on zero crossing rate
        features.spectralCentroid = features.zeroCrossingRate * 10000;

        return features;
    },

    // Generate description of sound
    describeSoundCharacteristics(features) {
        let description = "";

        // Describe loudness
        if (features.rms < 0.1) {
            description += "This is a quiet sound. ";
        } else if (features.rms < 0.3) {
            description += "This is a moderate volume sound. ";
        } else {
            description += "This is a loud sound. ";
        }

        // Describe dynamic range
        const dynamicRange = features.peakLevel / features.rms;
        if (dynamicRange < 2) {
            description += "It has a compressed dynamic range. ";
        } else if (dynamicRange < 5) {
            description += "It has a moderate dynamic range. ";
        } else {
            description += "It has a wide dynamic range. ";
        }

        // Describe frequency characteristics
        if (features.zeroCrossingRate < 0.01) {
            description += "It contains mostly low frequencies. ";
        } else if (features.zeroCrossingRate < 0.1) {
            description += "It contains a mix of low and mid frequencies. ";
        } else {
            description += "It contains a significant amount of high frequencies. ";
        }

        return description;
    },

    // Suggest audio effects based on analysis
    suggestEffects(features) {
        const suggestions = [];

        if (features.rms < 0.1) {
            suggestions.push("Consider adding compression to increase loudness");
        }

        if (features.peakLevel > 0.9) {
            suggestions.push("Warning: Signal may clip - consider reducing gain");
        }

        if (features.zeroCrossingRate < 0.01) {
            suggestions.push("Try adding a high-shelf EQ to brighten the sound");
        } else if (features.zeroCrossingRate > 0.1) {
            suggestions.push("Consider adding a low-pass filter to reduce harshness");
        }

        if (dynamicRange > 10) {
            suggestions.push("Add compression to control the dynamic range");
        }

        return suggestions;
    }
};

/**
 * CHORD PROGRESSION GENERATOR
 * Advanced music theory functions
 */
const ChordProgression = {
    // Define note frequencies
    noteFrequencies: {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
        'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
        'A#': 466.16, 'B': 493.88
    },

    // Define chord structures
    chordTypes: {
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'diminished': [0, 3, 6],
        'augmented': [0, 4, 8],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7],
        '7': [0, 4, 7, 10],
        'maj7': [0, 4, 7, 11],
        'm7': [0, 3, 7, 10],
        'mMaj7': [0, 3, 7, 11],
        '7sus4': [0, 5, 7, 10]
    },

    // Define common chord progressions
    progressions: {
        'I-IV-V': ['I', 'IV', 'V'],
        'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
        'ii-V-I': ['ii', 'V', 'I'],
        'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
        'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
        'I-IV-vi-V': ['I', 'IV', 'vi', 'V']
    },

    // Define scale degrees for major and minor scales
    majorScale: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    minorScale: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],

    // Notes in major scale
    majorScaleNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],

    // Generate a random chord progression
    generateProgression(key = 'C', scale = 'major', length = 4) {
        // Choose a random progression type
        const progressionTypes = Object.keys(this.progressions);
        const progressionType = progressionTypes[Math.floor(Math.random() * progressionTypes.length)];

        // Get the chord sequence
        const chordSequence = this.progressions[progressionType];

        // Generate actual chords
        const chords = [];

        for (const degree of chordSequence) {
            const chord = this.getDegreeChord(key, degree, scale);
            chords.push(chord);
        }

        return {
            type: progressionType,
            key: key,
            scale: scale,
            chords: chords
        };
    },

    // Get a chord from a scale degree
    getDegreeChord(key, degree, scale = 'major') {
        // First determine if we're in major or minor
        const isMajor = scale === 'major';
        const scaleStructure = isMajor ? this.majorScale : this.minorScale;

        // Get the index of the degree
        const degreeIndex = this.getDegreeIndex(degree);

        // Get the root note
        const rootNote = this.getNoteFromKeyAndDegree(key, degreeIndex);

        // Determine the chord type from the degree
        let chordType;

        if (isMajor) {
            if (degree.startsWith('I') || degree.startsWith('IV') || degree.startsWith('V')) {
                chordType = 'major';
            } else if (degree.startsWith('ii') || degree.startsWith('iii') || degree.startsWith('vi')) {
                chordType = 'minor';
            } else if (degree.startsWith('vii')) {
                chordType = 'diminished';
            }
        } else {
            if (degree.startsWith('i') || degree.startsWith('iv') || degree.startsWith('v')) {
                chordType = 'minor';
            } else if (degree.startsWith('III') || degree.startsWith('VI') || degree.startsWith('VII')) {
                chordType = 'major';
            } else if (degree.startsWith('ii')) {
                chordType = 'diminished';
            }
        }

        // Create the chord
        const chordStructure = this.chordTypes[chordType];
        const chord = {
            root: rootNote,
            type: chordType,
            notes: this.getChordNotes(rootNote, chordStructure)
        };

        return chord;
    },

    // Get the index of a scale degree
    getDegreeIndex(degree) {
        const base = degree.charAt(0).toLowerCase();
        let index;

        switch (base) {
            case 'i': index = 0; break;
            case 'v': index = 4; break;
            case 'i': index = 0; break;
            case 'i': index = 1; break;
            case 'i': index = 2; break;
            case 'i': index = 3; break;
            case 'v': index = 5; break;
            case 'v': index = 6; break;
            default: index = 0;
        }

        return index;
    },

    // Get a note from a key and degree
    getNoteFromKeyAndDegree(key, degreeIndex) {
        // Find the index of the key in the circle of fifths
        const keyIndex = this.majorScaleNotes.indexOf(key);

        // Calculate the note index
        const noteIndex = (keyIndex + degreeIndex) % this.majorScaleNotes.length;

        return this.majorScaleNotes[noteIndex];
    },

    // Get notes in a chord
    getChordNotes(rootNote, chordStructure) {
        const notes = [];
        const rootIndex = Object.keys(this.noteFrequencies).indexOf(rootNote);

        for (const semitones of chordStructure) {
            const noteIndex = (rootIndex + semitones) % 12;
            const note = Object.keys(this.noteFrequencies)[noteIndex];
            notes.push(note);
        }

        return notes;
    },

    // Play a chord progression
    playProgression(progression, options = {}) {
        if (!AudioUtils.context) AudioUtils.init();

        const ctx = AudioUtils.context;
        const tempo = options.tempo || 120; // BPM
        const beatDuration = 60 / tempo; // seconds per beat

        // Play each chord
        progression.chords.forEach((chord, index) => {
            const delay = index * beatDuration * 4; // 4 beats per chord

            // Play chord notes
            chord.notes.forEach((note, noteIndex) => {
                const noteFreq = this.noteFrequencies[note];
                const octave = 4; // Middle octave
                const frequency = noteFreq * Math.pow(2, octave - 4);

                // Create oscillator
                const oscillator = ctx.createOscillator();
                oscillator.type = options.waveform || 'triangle';
                oscillator.frequency.value = frequency;

                // Create gain node
                const gainNode = ctx.createGain();
                gainNode.gain.value = 0;

                // Apply envelope
                const now = ctx.currentTime + delay;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.15 / chord.notes.length, now + 0.1);
                gainNode.gain.setValueAtTime(0.15 / chord.notes.length, now + beatDuration * 3.5);
                gainNode.gain.linearRampToValueAtTime(0, now + beatDuration * 4);

                // Connect nodes
                oscillator.connect(gainNode);
                gainNode.connect(AudioUtils.masterGain);

                // Start oscillator
                oscillator.start(now);
                oscillator.stop(now + beatDuration * 4);
            });
        });
    }
};

// Make sure we activate the audio context on first user interaction
document.addEventListener('click', function initAudio() {
    if (!AudioUtils.context) {
        AudioUtils.init();
        document.removeEventListener('click', initAudio);
    }
});