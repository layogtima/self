// Game variables
let canvas, ctx;
let player = {
    x: 0,
    y: 0,
    radius: 15,
    color: "rgba(180, 130, 255, 0.8)",
    particles: [],
    trail: [],
    absorbedElements: 0,
};
let elements = [];
let environmentParticles = [];
let lastTime = 0;
let ambientHue = 240; // Start with blue
let audioCtx, masterGain;
let activeOscillators = [];
let isAudioInitialized = false;

// Start with intro screen
document
    .getElementById("begin-button")
    .addEventListener("click", function () {
        document.getElementById("intro-screen").classList.add("fade-out");
        setTimeout(initGame, 500);
    });

function initGame() {
    // Set up canvas
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Set player initial position
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Create initial elements to absorb
    createElements(15);

    // Listen for mouse/touch movement
    canvas.addEventListener("mousemove", movePlayer);
    canvas.addEventListener("touchmove", moveTouchPlayer);
    canvas.addEventListener("click", initAudio);
    canvas.addEventListener("touchstart", initAudio);

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function initAudio() {
    if (isAudioInitialized) return;

    // Initialize Web Audio API
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);

    // Create ambient drone
    createDrone();

    isAudioInitialized = true;

    // Remove event listeners once audio is initialized
    canvas.removeEventListener("click", initAudio);
    canvas.removeEventListener("touchstart", initAudio);
}

function createDrone() {
    // Create base drone note
    const baseFreq = 55; // A1
    const harmonics = [1, 2, 3, 5, 8];

    harmonics.forEach((harmonic, i) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();

        // Different waveform for each harmonic
        osc.type = ["sine", "triangle", "sine", "sine", "triangle"][i];
        osc.frequency.value = baseFreq * harmonic;

        // Lower volume for higher harmonics
        oscGain.gain.value = 0.15 / (i + 1);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start();
        activeOscillators.push({ oscillator: osc, gain: oscGain });
    });
}

function playAbsorptionSound(element) {
    if (!isAudioInitialized) return;

    // Create a short ping sound
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();

    // Use element properties to determine sound properties
    const hue = element.hue;
    const baseNote = 220; // A3

    // Map hue (0-360) to a musical scale
    const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
    const noteIndex = Math.floor((hue / 360) * scale.length);
    const interval = scale[noteIndex];

    // Calculate frequency using equal temperament
    const frequency = baseNote * Math.pow(2, interval / 12);

    osc.frequency.value = frequency;
    osc.type = "sine";

    // Short attack and release
    oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 2
    );

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 2);
}

function adjustDrone() {
    if (!isAudioInitialized || activeOscillators.length === 0) return;

    // Slowly adjust drone based on player's absorbed elements
    const absorptionRatio = Math.min(player.absorbedElements / 50, 1);

    // Shift base frequency based on absorption
    const baseFreqShift = 55 + absorptionRatio * 22; // Shift up by up to a fifth

    activeOscillators.forEach((oscObj, i) => {
        const harmonic = [1, 2, 3, 5, 8][i];
        oscObj.oscillator.frequency.setTargetAtTime(
            baseFreqShift * harmonic,
            audioCtx.currentTime,
            3 // Transition time constant
        );
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function movePlayer(e) {
    player.x = e.clientX;
    player.y = e.clientY;
}

function moveTouchPlayer(e) {
    e.preventDefault();
    player.x = e.touches[0].clientX;
    player.y = e.touches[0].clientY;
}

function createElements(count) {
    for (let i = 0; i < count; i++) {
        elements.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 4,
            hue: Math.random() * 360,
            opacity: 0.6 + Math.random() * 0.4,
            pulseSpeed: 0.5 + Math.random() * 1.5,
            pulseAmount: 0.2 + Math.random() * 0.3,
            pulseOffset: Math.random() * Math.PI * 2,
            driftX: (Math.random() - 0.5) * 0.2,
            driftY: (Math.random() - 0.5) * 0.2,
        });
    }
}

function createEnvironmentParticle(x, y, hue) {
    environmentParticles.push({
        x,
        y,
        radius: 1 + Math.random() * 3,
        hue,
        opacity: 0.3 + Math.random() * 0.4,
        velocityX: (Math.random() - 0.5) * 0.7,
        velocityY: (Math.random() - 0.5) * 0.7,
        life: 1,
        decay: 0.003 + Math.random() * 0.005,
    });
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clear canvas with a fade effect
    ctx.fillStyle = `rgba(1, 11, 20, 0.3)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update ambient environment
    updateEnvironment(deltaTime);

    // Update and draw trails
    updateTrails(deltaTime);

    // Update and draw elements
    updateElements(deltaTime);

    // Update and draw environment particles
    updateEnvironmentParticles(deltaTime);

    // Update and draw player
    updatePlayer(deltaTime);

    // Continue the loop
    requestAnimationFrame(gameLoop);
}

function updateEnvironment(deltaTime) {
    // Slowly shift ambient hue based on absorption
    ambientHue = (ambientHue + deltaTime * 0.003) % 360;

    // Occasionally create ambient particles
    if (Math.random() < 0.1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        createEnvironmentParticle(x, y, ambientHue);
    }
}

function updatePlayer(deltaTime) {
    // Add player position to trail
    if (deltaTime % 5 === 0) {
        player.trail.push({
            x: player.x,
            y: player.y,
            radius: player.radius * 0.8,
            opacity: 0.3,
            life: 1,
        });

        // Limit trail length
        if (player.trail.length > 30) {
            player.trail.shift();
        }
    }

    // Draw player glow
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        player.radius * 0.2,
        player.x,
        player.y,
        player.radius * 3
    );
    gradient.addColorStop(0, player.color);
    gradient.addColorStop(1, "rgba(100, 50, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.arc(player.x, player.y, player.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw player core
    ctx.beginPath();
    ctx.fillStyle = player.color;
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw player particles
    player.particles.forEach((particle, index) => {
        particle.life -= 0.01;
        particle.radius *= 0.99;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        if (particle.life <= 0) {
            player.particles.splice(index, 1);
            return;
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 75%, ${particle.life})`;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Check for element absorption
    elements.forEach((element, index) => {
        const dx = element.x - player.x;
        const dy = element.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Pull elements towards player when close
        const pullRadius = player.radius * 10;
        if (distance < pullRadius) {
            const pullForce = 0.03 * (1 - distance / pullRadius);
            element.x -= dx * pullForce;
            element.y -= dy * pullForce;
        }

        // Absorb element when touching
        if (distance < player.radius + element.radius) {
            // Create particle effect for absorption
            for (let i = 0; i < 8; i++) {
                player.particles.push({
                    x: element.x,
                    y: element.y,
                    radius: element.radius * (0.5 + Math.random() * 0.5),
                    velocityX: (Math.random() - 0.5) * 2,
                    velocityY: (Math.random() - 0.5) * 2,
                    hue: element.hue,
                    life: 0.8 + Math.random() * 0.4,
                });
            }

            // Play sound for absorption
            playAbsorptionSound(element);

            // Grow player slightly
            player.radius += 0.1;
            player.radius = Math.min(player.radius, 30);

            // Shift player color slightly towards absorbed element
            const hslMatch = player.color.match(/\d+/g);
            if (hslMatch && hslMatch.length >= 1) {
                const currentHue = parseInt(hslMatch[0]);
                const newHue = currentHue * 0.95 + element.hue * 0.05;
                player.color = `hsla(${newHue}, 100%, 75%, 0.8)`;
            }

            // Remove absorbed element and add a new one
            elements.splice(index, 1);
            createElements(1);

            // Track absorption
            player.absorbedElements++;

            // Update drone sound
            adjustDrone();
        }
    });
}

function updateTrails(deltaTime) {
    // Draw player trail
    player.trail.forEach((trail, index) => {
        trail.opacity -= 0.003;

        if (trail.opacity <= 0) {
            player.trail.splice(index, 1);
            return;
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(260, 100%, 75%, ${trail.opacity})`;
        ctx.arc(
            trail.x,
            trail.y,
            trail.radius * trail.opacity,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function updateElements(deltaTime) {
    elements.forEach((element) => {
        // Apply drift
        element.x += element.driftX;
        element.y += element.driftY;

        // Wrap around screen edges
        if (element.x < -element.radius)
            element.x = canvas.width + element.radius;
        if (element.x > canvas.width + element.radius)
            element.x = -element.radius;
        if (element.y < -element.radius)
            element.y = canvas.height + element.radius;
        if (element.y > canvas.height + element.radius)
            element.y = -element.radius;

        // Calculate pulsing radius
        const pulse = Math.sin(
            Date.now() * 0.001 * element.pulseSpeed + element.pulseOffset
        );
        const pulsingRadius =
            element.radius * (1 + pulse * element.pulseAmount);

        // Draw element glow
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            element.x,
            element.y,
            pulsingRadius * 0.2,
            element.x,
            element.y,
            pulsingRadius * 2.5
        );
        gradient.addColorStop(
            0,
            `hsla(${element.hue}, 100%, 70%, ${element.opacity})`
        );
        gradient.addColorStop(1, `hsla(${element.hue}, 100%, 70%, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(element.x, element.y, pulsingRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw element core
        ctx.beginPath();
        ctx.fillStyle = `hsla(${element.hue}, 100%, 75%, ${element.opacity})`;
        ctx.arc(element.x, element.y, pulsingRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateEnvironmentParticles(deltaTime) {
    environmentParticles.forEach((particle, index) => {
        particle.life -= particle.decay;

        if (particle.life <= 0) {
            environmentParticles.splice(index, 1);
            return;
        }

        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${particle.opacity * particle.life
            })`;
        ctx.arc(
            particle.x,
            particle.y,
            particle.radius * particle.life,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}