// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loadingMessage = document.getElementById('loadingMessage');
const loadingSubMessage = document.getElementById('loadingSubMessage');
const webcamElement = document.getElementById('webcam');
const waveformCanvas = document.getElementById('waveform');
const startButton = document.getElementById('startButton');
const waveformSelect = document.getElementById('waveformSelect');
const reverbRange = document.getElementById('reverbRange');
const filterRange = document.getElementById('filterRange');
const noteDisplay = document.getElementById('noteDisplay');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const volumeDisplay = document.getElementById('volumeDisplay');
const gridSvg = document.getElementById('gridSvg');
const frequencyIndicator = document.getElementById('frequencyIndicator');
const volumeIndicator = document.getElementById('volumeIndicator');

// Audio variables
let audioContext;
let oscillator;
let gainNode;
let analyser;
let filterNode;
let reverbNode;
let dataArray;
let waveformContext;
let animationFrameId;
let thereminActive = false;

// Hand tracking variables
let handposeModel;
let handVisible = false;
let handX = 0;
let handY = 0;

// Current values
let currentFrequency = 0;
let currentVolume = 0;

// Notes mapping
const notes = [
    { name: 'C2', freq: 65.41 },
    { name: 'D2', freq: 73.42 },
    { name: 'E2', freq: 82.41 },
    { name: 'F2', freq: 87.31 },
    { name: 'G2', freq: 98.00 },
    { name: 'A2', freq: 110.00 },
    { name: 'B2', freq: 123.47 },
    { name: 'C3', freq: 130.81 },
    { name: 'D3', freq: 146.83 },
    { name: 'E3', freq: 164.81 },
    { name: 'F3', freq: 174.61 },
    { name: 'G3', freq: 196.00 },
    { name: 'A3', freq: 220.00 },
    { name: 'B3', freq: 246.94 },
    { name: 'C4', freq: 261.63 },
    { name: 'D4', freq: 293.66 },
    { name: 'E4', freq: 329.63 },
    { name: 'F4', freq: 349.23 },
    { name: 'G4', freq: 392.00 },
    { name: 'A4', freq: 440.00 },
    { name: 'B4', freq: 493.88 },
    { name: 'C5', freq: 523.25 },
    { name: 'D5', freq: 587.33 },
    { name: 'E5', freq: 659.25 },
    { name: 'F5', freq: 698.46 },
    { name: 'G5', freq: 783.99 },
    { name: 'A5', freq: 880.00 },
    { name: 'B5', freq: 987.77 },
    { name: 'C6', freq: 1046.50 }
];

// Generate grid lines for the SVG overlay
function generateGrid() {
    // Create horizontal lines
    for (let i = 1; i < 20; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', i * 5);
        line.setAttribute('x2', '100');
        line.setAttribute('y2', i * 5);
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '0.05');
        line.setAttribute('stroke-opacity', '0.7');
        gridSvg.appendChild(line);
    }

    // Create vertical lines
    for (let i = 1; i < 20; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', i * 5);
        line.setAttribute('y1', '0');
        line.setAttribute('x2', i * 5);
        line.setAttribute('y2', '100');
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '0.05');
        line.setAttribute('stroke-opacity', '0.7');
        gridSvg.appendChild(line);
    }

    // Create radial lines from center
    const centerX = 50;
    const centerY = 50;
    const numLines = 36;

    for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2;
        const x2 = centerX + Math.cos(angle) * 100;
        const y2 = centerY + Math.sin(angle) * 100;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centerX);
        line.setAttribute('y1', centerY);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '0.1');
        line.setAttribute('stroke-opacity', '0.5');

        gridSvg.appendChild(line);
    }
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

// Initialize handpose model
async function initHandpose() {
    loadingMessage.textContent = 'CALIBRATING HAND DETECTION';
    loadingSubMessage.textContent = 'This may take a moment...';

    try {
        handposeModel = await handpose.load();
        return true;
    } catch (error) {
        console.error('Error loading handpose model:', error);
        loadingMessage.textContent = 'ERROR';
        loadingSubMessage.textContent = 'Could not load hand detection model. Please try reloading the page.';
        throw error;
    }
}

// Create a simple reverb effect
function createReverb(audioContext, reverbAmount) {
    const convolver = audioContext.createConvolver();
    const reverbGain = audioContext.createGain();
    const dryGain = audioContext.createGain();

    // Generate impulse response for reverb
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 seconds
    const impulse = audioContext.createBuffer(2, length, sampleRate);

    // Fill buffer with decaying noise
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(0.9995, i);
        }
    }

    convolver.buffer = impulse;
    reverbGain.gain.value = reverbAmount;
    dryGain.gain.value = 1 - reverbAmount;

    return {
        input: audioContext.createGain(),
        output: audioContext.createGain(),
        reverbGain,
        convolver,
        dryGain,
        connect() {
            // Connect the reverb path
            this.input.connect(convolver);
            convolver.connect(reverbGain);
            reverbGain.connect(this.output);

            // Connect the dry path
            this.input.connect(dryGain);
            dryGain.connect(this.output);
        },
        updateReverbAmount(amount) {
            reverbGain.gain.value = amount;
            dryGain.gain.value = 1 - amount;
        }
    };
}

// Initialize audio context and theremin components
async function initAudio() {
    try {
        // Create audio context - fix for older browsers
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Make sure the audio context is running (important for Chrome)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Create oscillator for sound generation
        oscillator = audioContext.createOscillator();
        oscillator.type = waveformSelect.value; // Get selected waveform
        oscillator.frequency.value = 440; // Default to A4

        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0; // Start silent

        // Create filter node
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = parseFloat(filterRange.value);
        filterNode.Q.value = 1;

        // Create reverb
        reverbNode = createReverb(audioContext, parseFloat(reverbRange.value));
        reverbNode.connect();

        // Create analyser for waveform visualization
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Connect nodes: oscillator -> gain -> filter -> reverb -> analyser -> output
        oscillator.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(reverbNode.input);
        reverbNode.output.connect(analyser);
        analyser.connect(audioContext.destination);

        // Start the oscillator (it will be audible only when gain > 0)
        oscillator.start();

        // Setup the waveform canvas
        waveformContext = waveformCanvas.getContext('2d');
        waveformCanvas.width = waveformCanvas.offsetWidth;
        waveformCanvas.height = waveformCanvas.offsetHeight;

        // Start visualizing the waveform
        drawWaveform();

        console.log('Audio initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing audio:', error);
        return false;
    }
}

// Draw waveform visualization
function drawWaveform() {
    if (!analyser) return;

    animationFrameId = requestAnimationFrame(drawWaveform);

    // Get waveform data
    analyser.getByteTimeDomainData(dataArray);

    const width = waveformCanvas.width;
    const height = waveformCanvas.height;

    // Clear previous drawing
    waveformContext.clearRect(0, 0, width, height);

    // Draw the new waveform
    waveformContext.lineWidth = 1.5;
    waveformContext.strokeStyle = 'white';
    waveformContext.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
            waveformContext.moveTo(x, y);
        } else {
            waveformContext.lineTo(x, y);
        }

        x += sliceWidth;
    }

    waveformContext.lineTo(width, height / 2);
    waveformContext.stroke();
}

// Process detected hands
function processHand(hand) {
    if (!thereminActive) return;

    // Remove existing hand markers
    document.querySelectorAll('.hand-marker').forEach(marker => marker.remove());

    if (!hand) {
        // If no hand is detected, set volume to 0
        if (gainNode) {
            gainNode.gain.value = 0;
            currentVolume = 0;
            updateDisplays();
        }
        frequencyIndicator.style.display = 'none';
        volumeIndicator.style.display = 'none';
        handVisible = false;
        return;
    }

    // Get webcam dimensions for scaling
    const videoWidth = webcamElement.videoWidth;
    const videoHeight = webcamElement.videoHeight;
    const displayWidth = webcamElement.offsetWidth;
    const displayHeight = webcamElement.offsetHeight;

    // Calculate scale factors
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;

    // Get palm position (index 0 in landmarks)
    const palm = hand.landmarks[0];
    handX = palm[0] * scaleX;
    handY = palm[1] * scaleY;
    handVisible = true;

    // Create a hand marker
    const marker = document.createElement('div');
    marker.className = 'hand-marker';
    marker.style.left = `${handX}px`;
    marker.style.top = `${handY}px`;
    document.body.appendChild(marker);

    // Update indicators
    frequencyIndicator.style.display = 'block';
    frequencyIndicator.style.left = `${handX}px`;
    frequencyIndicator.style.top = `${handY - 30}px`;

    volumeIndicator.style.display = 'block';
    volumeIndicator.style.left = `${handX - 50}px`;
    volumeIndicator.style.top = `${handY}px`;

    // Update theremin parameters
    updateThereminParameters();
}

// Update theremin parameters (frequency and volume)
function updateThereminParameters() {
    if (!audioContext || !oscillator || !gainNode || !handVisible) return;

    // Get window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Map X position to frequency (horizontal axis controls pitch)
    const normalizedX = handX / width; // 0 to 1
    const minFreq = 65.41; // C2
    const maxFreq = 1046.50; // C6

    // Exponential mapping for more natural pitch control
    const frequency = minFreq * Math.pow(maxFreq / minFreq, normalizedX);

    // Map Y position to volume (vertical axis controls volume)
    // Lower hand = louder (inverted)
    const normalizedY = 1 - (handY / height);
    const volume = Math.pow(normalizedY, 1.5) * 0.5; // Max volume 0.5

    // Apply changes with smoothing
    const now = audioContext.currentTime;
    oscillator.frequency.setTargetAtTime(frequency, now, 0.08);
    gainNode.gain.setTargetAtTime(volume, now, 0.1);

    // Update current values
    currentFrequency = frequency;
    currentVolume = volume;

    // Update displays
    updateDisplays();
}

// Update displays with current values
function updateDisplays() {
    // Update note display
    if (currentFrequency > 0) {
        const note = getNote(currentFrequency);
        noteDisplay.textContent = note;
    } else {
        noteDisplay.textContent = '-';
    }

    // Update frequency display
    frequencyDisplay.textContent = currentFrequency.toFixed(2);

    // Update volume display
    volumeDisplay.textContent = Math.round(currentVolume * 200); // 0-100%
}

// Get closest note name for a frequency
function getNote(frequency) {
    if (!frequency) return '-';

    let closestNote = notes[0];
    let smallestDifference = Math.abs(frequency - notes[0].freq);

    for (let i = 1; i < notes.length; i++) {
        const difference = Math.abs(frequency - notes[i].freq);
        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestNote = notes[i];
        }
    }

    return closestNote.name;
}

// Toggle theremin on/off
async function toggleTheremin() {
    thereminActive = !thereminActive;

    if (thereminActive) {
        startButton.textContent = 'TERMINATE';
        startButton.classList.add('border-white');

        // Initialize audio on user gesture
        if (!audioContext) {
            const success = await initAudio();
            if (!success) {
                console.error("Failed to initialize audio");
                thereminActive = false;
                startButton.textContent = 'RETRY';
                return;
            }
        } else if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    } else {
        startButton.textContent = 'INITIATE';
        startButton.classList.remove('border-white');

        // Reset values when stopping
        if (gainNode) {
            gainNode.gain.value = 0;
        }
        currentVolume = 0;
        currentFrequency = 0;

        // Update displays
        updateDisplays();
    }
}

// Handle waveform changes
waveformSelect.addEventListener('change', () => {
    if (oscillator) {
        oscillator.type = waveformSelect.value;
    }
});

// Handle filter changes
filterRange.addEventListener('input', () => {
    if (filterNode) {
        filterNode.frequency.value = filterRange.value;
    }
});

// Handle reverb changes
reverbRange.addEventListener('input', () => {
    if (reverbNode) {
        reverbNode.updateReverbAmount(parseFloat(reverbRange.value));
    }
});

// Main detection loop
async function detectHands() {
    if (!handposeModel || !webcamElement || !webcamElement.videoWidth) {
        requestAnimationFrame(detectHands);
        return;
    }

    try {
        // Detect hands (only process the first one found)
        const hands = await handposeModel.estimateHands(webcamElement);
        const hand = hands.length > 0 ? hands[0] : null;

        // Process the hand
        processHand(hand);

        // Continue the detection loop
        requestAnimationFrame(detectHands);
    } catch (error) {
        console.error('Error detecting hands:', error);
        // Continue the detection loop even if there's an error
        requestAnimationFrame(detectHands);
    }
}

// Handle window resize
function handleResize() {
    if (waveformCanvas) {
        waveformCanvas.width = waveformCanvas.offsetWidth;
        waveformCanvas.height = waveformCanvas.offsetHeight;
    }
}

// Start button event
startButton.addEventListener('click', async () => {
    try {
        await toggleTheremin();
    } catch (error) {
        console.error('Error toggling theremin:', error);
        loadingMessage.textContent = 'ERROR';
        loadingSubMessage.textContent = 'Could not initialize audio. Please try again.';
    }
});

// Initialize app
async function init() {
    try {
        // Generate grid
        generateGrid();

        // Setup webcam
        await setupWebcam();

        // Load handpose model
        await initHandpose();

        // Add window resize listener
        window.addEventListener('resize', handleResize);

        // Start detection loop
        detectHands();

        // Hide loading screen
        loadingScreen.style.display = 'none';

    } catch (error) {
        console.error('Initialization error:', error);
        loadingMessage.textContent = 'ERROR';
        loadingSubMessage.textContent = 'Could not initialize. Please refresh the page and try again.';
    }
}

// Start initialization
init();

// Cleanup function for when the page is unloaded
function cleanup() {
    if (oscillator) {
        oscillator.stop();
    }

    if (audioContext) {
        audioContext.close();
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    window.removeEventListener('resize', handleResize);
}

// Add event listener for page unload
window.addEventListener('beforeunload', cleanup);