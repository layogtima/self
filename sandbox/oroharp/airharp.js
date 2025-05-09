
// DOM elements
const loadingScreen = document.getElementById('loadingScreen');
const loadingMessage = document.getElementById('loadingMessage');
const loadingSubMessage = document.getElementById('loadingSubMessage');
const webcamElement = document.getElementById('webcam');
const outputCanvas = document.getElementById('output');
const startButton = document.getElementById('startButton');
const scaleSelect = document.getElementById('scaleSelect');
const octaveRange = document.getElementById('octaveRange');
const reverbRange = document.getElementById('reverbRange');
const visualizerCanvas = document.getElementById('visualizer');

// Canvas contexts
const canvasCtx = outputCanvas.getContext('2d');
const visualizerCtx = visualizerCanvas.getContext('2d');

// MediaPipe tracking variables
let hands;
let camera;
let tracking = false;
let handLandmarks = [];
let filteredLandmarks = [];
let smoothingFactor = 0.5;
let lastFrameTime = 0;
let frameCount = 0;
let fpsInterval = 0;
let fps = 0;

// Audio variables
let audioContext;
let analyzer;
let dataArray;
let isAudioInitialized = false;
let lastPluckedTime = {};

// Music theory variables
const rootNote = 'C';
const scales = {
    major: [0, 2, 4, 5, 7, 9, 11], // Major scale: C D E F G A B
    minor: [0, 2, 3, 5, 7, 8, 10], // Minor scale: C D Eb F G Ab Bb
    pentatonic: [0, 2, 4, 7, 9],    // Pentatonic: C D E G A
    blues: [0, 3, 5, 6, 7, 10],     // Blues scale: C Eb F F# G Bb
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All 12 notes
};

// Finger pluck variables
const pluckThreshold = 0.04; // Distance threshold to consider a string plucked
const pluckCooldown = 300; // Minimum time (ms) between plucks of the same string
const fingerTips = [4, 8, 12, 16, 20]; // MediaPipe indices for fingertips

// Note name mappings
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// MediaPipe Hand landmark indices
const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_IP = 3;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_DIP = 7;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_DIP = 11;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_DIP = 15;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_DIP = 19;
const PINKY_TIP = 20;

// Setup tone.js synth
let synth;
let reverb;

// Create Vue App
const { createApp, ref, reactive, onMounted, watch } = Vue;

const app = createApp({
    setup() {
        // Reactive state
        const strings = reactive([]);
        const fingers = reactive([
            { x: 0, y: 0, visible: false, active: false }, // Thumb
            { x: 0, y: 0, visible: false, active: false }, // Index
            { x: 0, y: 0, visible: false, active: false }, // Middle
            { x: 0, y: 0, visible: false, active: false }, // Ring
            { x: 0, y: 0, visible: false, active: false }  // Pinky
        ]);
        const activeNotes = ref([]);
        const handStatus = ref('');

        // Initialize the app
        onMounted(() => {
            initApp();
        });

        return {
            strings,
            fingers,
            activeNotes,
            handStatus
        };
    }
}).mount('#app');


// Initialize application
async function initApp() {
    try {
        // Resize canvas to match window
        resizeCanvases();

        // Generate harp strings based on selected scale
        generateHarpStrings();

        // Set up audio
        setupAudio();

        // Setup webcam
        await setupWebcam();

        // Initialize MediaPipe Hands
        await initMediaPipeHands();

        // Set up event listeners
        setupEventListeners();

        // Hide loading screen
        loadingScreen.style.display = 'none';

    } catch (error) {
        console.error('Initialization error:', error);
        loadingMessage.textContent = 'ERROR';
        loadingSubMessage.textContent = 'Could not initialize. Please refresh the page and try again.';
    }
}

// Resize canvases to match window dimensions
function resizeCanvases() {
    outputCanvas.width = window.innerWidth;
    outputCanvas.height = window.innerHeight;

    visualizerCanvas.width = window.innerWidth;
    visualizerCanvas.height = 150;
}

// Generate harp strings based on the selected scale
function generateHarpStrings() {
    // Clear existing strings
    app.strings.length = 0;

    // Get currently selected scale
    const currentScale = scales[scaleSelect.value] || scales.pentatonic;
    const baseOctave = parseInt(octaveRange.value) || 3;

    // Calculate number of strings based on scale
    let numberOfStrings = currentScale.length;

    // Add a higher octave for more strings (except chromatic which already has 12)
    if (currentScale !== scales.chromatic) {
        numberOfStrings += currentScale.length;
    }

    // Create strings with their positions and notes
    for (let i = 0; i < numberOfStrings; i++) {
        // Calculate position (distribute evenly across the screen with margins)
        const position = 5 + (i * (90 / (numberOfStrings - 1)));

        // Calculate note (wrap around to next octave if needed)
        const scaleIndex = i % currentScale.length;
        const octaveOffset = Math.floor(i / currentScale.length);
        const semitone = currentScale[scaleIndex];
        const noteName = noteNames[semitone];
        const octave = baseOctave + octaveOffset;
        const frequency = getFrequency(semitone, octave);

        app.strings.push({
            position,
            note: `${noteName}${octave}`,
            frequency,
            active: false,
            lastPlucked: 0,
            semitone
        });
    }
}

// Get frequency for a note
function getFrequency(semitone, octave) {
    // A4 is 440Hz (semitone 9, octave 4)
    return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
}

// Setup Web Audio API
function setupAudio() {
    try {
        // Initialize Tone.js
        Tone.start();

        // Create synth
        synth = new Tone.PolySynth(Tone.Synth).toDestination();

        // Set synth options for a harp-like sound
        synth.set({
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.3,
                release: 2
            }
        });

        // Create reverb
        reverb = new Tone.Reverb({
            decay: 5,
            wet: parseFloat(reverbRange.value)
        }).toDestination();

        // Connect synth to reverb
        synth.connect(reverb);

        // Set up analyzer for visualizer
        analyzer = new Tone.Analyser('waveform', 256);
        synth.connect(analyzer);

        // Start audio visualization loop
        visualizeAudio();

        isAudioInitialized = true;
    } catch (error) {
        console.error('Error setting up audio:', error);
    }
}

// Audio visualization loop
function visualizeAudio() {
    if (!analyzer) return;

    // Get waveform data
    const data = analyzer.getValue();

    // Clear canvas
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    // Set line style
    visualizerCtx.lineWidth = 2;
    visualizerCtx.strokeStyle = 'rgba(127, 255, 212, 0.7)';
    visualizerCtx.beginPath();

    // Draw waveform
    const sliceWidth = visualizerCanvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = v * visualizerCanvas.height / 2;

        if (i === 0) {
            visualizerCtx.moveTo(x, y);
        } else {
            visualizerCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
    visualizerCtx.stroke();

    // Continue visualization loop
    requestAnimationFrame(visualizeAudio);
}

// Setup webcam
async function setupWebcam() {
    loadingMessage.textContent = 'ACTIVATING VISUAL SENSORS';
    loadingSubMessage.textContent = 'Please allow camera access';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        webcamElement.srcObject = stream;

        return new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                webcamElement.play();
                resolve();
            };
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
        loadingMessage.textContent = 'ERROR';
        loadingSubMessage.textContent = 'Could not access webcam. Please ensure you have a webcam connected and have granted permission.';
        throw error;
    }
}

// Initialize MediaPipe Hands
function initMediaPipeHands() {
    loadingMessage.textContent = 'CALIBRATING HAND DETECTION';
    loadingSubMessage.textContent = 'Loading MediaPipe Hands...';

    return new Promise((resolve) => {
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(handleResults);

        loadingSubMessage.textContent = 'Setting up camera...';

        // Setup the camera
        camera = new Camera(webcamElement, {
            onFrame: async () => {
                await hands.send({ image: webcamElement });
            },
            width: 1280,
            height: 720
        });

        resolve(true);
    });
}

// Toggle hand tracking
function toggleTracking() {
    tracking = !tracking;

    if (tracking) {
        // Make sure audio is initialized on user interaction
        if (!isAudioInitialized) {
            setupAudio();
        }

        startButton.textContent = 'SILENCE THE HARP';
        startButton.classList.add('bg-orokin-gold/20');

        // Start the camera
        camera.start();

        // Start FPS counter
        startFpsCounter();

        // Update hand status
        app.handStatus = 'AWAITING HAND DETECTION';
    } else {
        startButton.textContent = 'INITIATE HARMONICS';
        startButton.classList.remove('bg-orokin-gold/20');

        // Stop the camera
        camera.stop();

        // Reset values
        app.fingers.forEach(finger => {
            finger.visible = false;
            finger.active = false;
        });

        app.strings.forEach(string => {
            string.active = false;
        });

        app.activeNotes = [];
        app.handStatus = '';

        // Stop FPS counter
        stopFpsCounter();
    }
}

// Start FPS counter
function startFpsCounter() {
    lastFrameTime = performance.now();
    frameCount = 0;
    fpsInterval = setInterval(updateFps, 1000);
}

// Update FPS counter
function updateFps() {
    // Nothing to update in UI but keep track for debugging
    console.log(`FPS: ${fps}`);
}

// Stop FPS counter
function stopFpsCounter() {
    clearInterval(fpsInterval);
}

// Play a note
function playNote(noteInfo) {
    if (!isAudioInitialized) return;

    const now = Tone.now();
    const duration = "8n"; // Eighth note duration

    // Play the note
    synth.triggerAttackRelease(noteInfo.note, duration, now);

    // Add to active notes (Vue reactivity)
    const currentNotes = [...app.activeNotes];
    if (!currentNotes.includes(noteInfo.note)) {
        currentNotes.push(noteInfo.note);
        app.activeNotes = currentNotes;

        // Remove note after duration
        setTimeout(() => {
            const updatedNotes = [...app.activeNotes];
            const index = updatedNotes.indexOf(noteInfo.note);
            if (index > -1) {
                updatedNotes.splice(index, 1);
                app.activeNotes = updatedNotes;
            }
        }, Tone.Time(duration).toMilliseconds());
    }
}

// Apply smoothing to landmark positions
function smoothLandmarks(newLandmarks) {
    if (!filteredLandmarks.length) {
        return JSON.parse(JSON.stringify(newLandmarks));
    }

    const smoothed = [];

    for (let i = 0; i < newLandmarks.length; i++) {
        const newPoint = newLandmarks[i];
        const oldPoint = filteredLandmarks[i];

        const smoothedPoint = {
            x: oldPoint.x * smoothingFactor + newPoint.x * (1 - smoothingFactor),
            y: oldPoint.y * smoothingFactor + newPoint.y * (1 - smoothingFactor),
            z: oldPoint.z * smoothingFactor + newPoint.z * (1 - smoothingFactor)
        };

        smoothed.push(smoothedPoint);
    }

    return smoothed;
}

// Check if a finger is plucking a string
function checkStringPluck() {
    const now = Date.now();

    // Check each fingertip against each string
    fingerTips.forEach((tipIndex, fingerIndex) => {
        if (!filteredLandmarks[tipIndex]) return;

        const fingerX = filteredLandmarks[tipIndex].x;
        const fingerY = filteredLandmarks[tipIndex].y;

        // Update finger position in Vue
        app.fingers[fingerIndex].x = fingerX;
        app.fingers[fingerIndex].y = fingerY;
        app.fingers[fingerIndex].visible = true;

        // Default to not active
        app.fingers[fingerIndex].active = false;

        // Check each string
        app.strings.forEach((string, stringIndex) => {
            // Calculate string position in normalized coordinates
            const stringX = string.position / 100;

            // Distance from finger to string (X-axis only)
            const distance = Math.abs(fingerX - stringX);

            // Check if finger is close enough to string
            if (distance < pluckThreshold) {
                // Check cooldown to prevent rapid retriggering
                if (!lastPluckedTime[`${fingerIndex}-${stringIndex}`] ||
                    (now - lastPluckedTime[`${fingerIndex}-${stringIndex}`] > pluckCooldown)) {

                    // Pluck the string!
                    string.active = true;
                    app.fingers[fingerIndex].active = true;

                    // Play the note
                    playNote(string);

                    // Update last plucked time
                    lastPluckedTime[`${fingerIndex}-${stringIndex}`] = now;

                    // Reset string active state after animation
                    setTimeout(() => {
                        string.active = false;
                    }, 300);
                }
            }
        });
    });
}

// Handle MediaPipe hand tracking results
function handleResults(results) {
    // Calculate FPS
    const now = performance.now();
    const delta = now - lastFrameTime;
    frameCount++;

    if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastFrameTime = now;
    }

    // Clear the canvas
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    canvasCtx.save();

    // Process hand if tracking is active
    if (tracking && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Get the first hand
        const landmarks = results.multiHandLandmarks[0];
        handLandmarks = landmarks;

        // Apply smoothing
        filteredLandmarks = smoothLandmarks(landmarks);

        // Update hand status in UI
        app.handStatus = 'HAND DETECTED';

        // Check for string plucks
        checkStringPluck();
    } else if (tracking) {
        // No hand detected
        app.handStatus = 'AWAITING HAND DETECTION';

        // Hide all fingers
        app.fingers.forEach(finger => {
            finger.visible = false;
            finger.active = false;
        });
    }

    canvasCtx.restore();
}

// Set up event listeners
function setupEventListeners() {
    // Start/stop tracking button
    startButton.addEventListener('click', toggleTracking);

    // Scale selection
    scaleSelect.addEventListener('change', () => {
        generateHarpStrings();
    });

    // Octave range
    octaveRange.addEventListener('input', () => {
        generateHarpStrings();
    });

    // Reverb range
    reverbRange.addEventListener('input', () => {
        if (reverb) {
            reverb.wet.value = parseFloat(reverbRange.value);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvases();
    });
}

// Start initialization when the page loads
window.addEventListener('load', () => {
    // This will be triggered by onMounted in Vue
});