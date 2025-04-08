
// Game constants
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const G = 300; // Gravity constant
const SHIP_SIZE = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.025;
const TORPEDO_SIZE = 1;
const STAR_RADIUS = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.02;
const ROTATION_SPEED = 4; // Radians per second
const THRUST_POWER = 50;
const MAX_SPEED = 500;
const TORPEDO_SPEED = 100;
const TORPEDO_LIFETIME = 2; // Seconds
const MAX_TORPEDOES = 10;
const TORPEDO_COOLDOWN = 2; // Seconds
const HYPERSPACE_COOLDOWN = 3; // Seconds
const HYPERSPACE_DEATH_CHANCE = 0.3; // 30% chance of death

const AI_STATES = {
    ORBIT: 'orbit',
    ATTACK: 'attack',
    EVADE: 'evade',
    REPOSITION: 'reposition'
};

// Game state
let gameRunning = false;
let lastTime = 0;
let stars = [];

// Audio context and sounds
let audioContext;
let sounds = {};

// Game objects
const star = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    radius: STAR_RADIUS,
    mass: 10000,
    pulseRate: 0.5, // Pulse rate in seconds
    pulseTime: 0,
};

const player1 = {
    x: GAME_WIDTH / 2 - 150,
    y: GAME_HEIGHT / 2,
    vx: 0,
    vy: -100, // Initial orbit velocity
    rotation: Math.PI / 2,
    radius: SHIP_SIZE / 2,
    fuel: 100,
    torpedoes: MAX_TORPEDOES,
    torpedoCooldown: 0,
    hyperspaceCooldown: 0,
    isThrusting: false,
    isRotatingLeft: false,
    isRotatingRight: false,
    isAlive: true,
    type: "needle",
};

const player2 = {
    x: GAME_WIDTH / 2 + 150,
    y: GAME_HEIGHT / 2,
    vx: 0,
    vy: 100, // Initial orbit velocity
    rotation: -Math.PI / 2,
    radius: SHIP_SIZE / 2,
    fuel: 100,
    torpedoes: MAX_TORPEDOES,
    torpedoCooldown: 0,
    hyperspaceCooldown: 0,
    isThrusting: false,
    isRotatingLeft: false,
    isRotatingRight: false,
    isAlive: true,
    type: "wedge",
};

let torpedoes = [];
let explosions = [];

// Get canvas and context
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");
const effectCanvas = document.getElementById("effectCanvas");
const effectCtx = effectCanvas.getContext("2d");

// Resize canvases to fill screen
gameCanvas.width = GAME_WIDTH;
gameCanvas.height = GAME_HEIGHT;
effectCanvas.width = GAME_WIDTH;
effectCanvas.height = GAME_HEIGHT;

//AI Control
function controlAI(player, otherPlayer, deltaTime) {
    // Calculate distance to other player
    const dx = otherPlayer.x - player.x;
    const dy = otherPlayer.y - player.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Calculate distance to star
    const dxStar = star.x - player.x;
    const dyStar = star.y - player.y;
    const distToStar = Math.sqrt(dxStar * dxStar + dyStar * dyStar);

    // Calculate angle to player
    const angleToPlayer = Math.atan2(dy, dx);

    // Calculate relative angle (how much we need to rotate)
    let relativeAngle = angleToPlayer - player.rotation;

    // Normalize angle between -PI and PI
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

    // Reset controls
    player.isRotatingLeft = false;
    player.isRotatingRight = false;
    player.isThrusting = false;

    // Determine state based on distances and positions
    let state = AI_STATES.ORBIT;

    // Too close to star? Evade!
    if (distToStar < star.radius * 2.5) {
        state = AI_STATES.EVADE;
    }
    // Player in range and we have torpedoes? Attack!
    else if (distToPlayer < GAME_WIDTH / 3 && player.torpedoes > 0) {
        state = AI_STATES.ATTACK;
    }
    // Low fuel? Orbit conservatively
    else if (player.fuel < 30) {
        state = AI_STATES.ORBIT;
    }
    // No torpedoes? Reposition to get some distance
    else if (player.torpedoes === 0) {
        state = AI_STATES.REPOSITION;
    }

    // Execute behavior based on state
    switch (state) {
        case AI_STATES.ORBIT:
            // Aim perpendicular to star to maintain orbit
            const angleToStar = Math.atan2(dyStar, dxStar);
            const orbitAngle = angleToStar + Math.PI / 2;

            // Calculate relative orbit angle
            let relOrbitAngle = orbitAngle - player.rotation;
            while (relOrbitAngle > Math.PI) relOrbitAngle -= Math.PI * 2;
            while (relOrbitAngle < -Math.PI) relOrbitAngle += Math.PI * 2;

            // Rotate ship to maintain orbit
            if (relOrbitAngle > 0.1) player.isRotatingRight = true;
            else if (relOrbitAngle < -0.1) player.isRotatingLeft = true;

            // Apply occasional thrust to maintain orbit
            if (Math.random() < 0.03 && player.fuel > 10) player.isThrusting = true;
            break;

        case AI_STATES.ATTACK:
            // Aim at player
            if (relativeAngle > 0.1) player.isRotatingRight = true;
            else if (relativeAngle < -0.1) player.isRotatingLeft = true;
            else {
                // If aimed correctly, fire torpedo
                if (player.torpedoCooldown <= 0 && Math.abs(relativeAngle) < 0.3) {
                    fireTorpedo(player);
                }
            }

            // Thrust occasionally to adjust position
            if (Math.random() < 0.1 && player.fuel > 5) player.isThrusting = true;
            break;

        case AI_STATES.EVADE:
            // Turn away from star
            const evadeAngle = Math.atan2(-dyStar, -dxStar);
            let relEvadeAngle = evadeAngle - player.rotation;

            while (relEvadeAngle > Math.PI) relEvadeAngle -= Math.PI * 2;
            while (relEvadeAngle < -Math.PI) relEvadeAngle += Math.PI * 2;

            if (relEvadeAngle > 0.1) player.isRotatingRight = true;
            else if (relEvadeAngle < -0.1) player.isRotatingLeft = true;
            else player.isThrusting = true;

            // Emergency hyperspace if very close to star and cooldown is ready
            if (distToStar < star.radius * 1.5 && player.hyperspaceCooldown <= 0) {
                hyperspace(player);
            }
            break;

        case AI_STATES.REPOSITION:
            // Move to a position opposite the player from the star
            const angleStarToPlayer = Math.atan2(otherPlayer.y - star.y, otherPlayer.x - star.x);
            const targetAngle = angleStarToPlayer + Math.PI;

            // Calculate position opposite from player
            const targetX = star.x + Math.cos(targetAngle) * (GAME_WIDTH / 4);
            const targetY = star.y + Math.sin(targetAngle) * (GAME_WIDTH / 4);

            // Calculate angle to target
            const dxTarget = targetX - player.x;
            const dyTarget = targetY - player.y;
            const angleToTarget = Math.atan2(dyTarget, dxTarget);

            // Calculate relative angle
            let relTargetAngle = angleToTarget - player.rotation;
            while (relTargetAngle > Math.PI) relTargetAngle -= Math.PI * 2;
            while (relTargetAngle < -Math.PI) relTargetAngle += Math.PI * 2;

            // Rotate towards target
            if (relTargetAngle > 0.1) player.isRotatingRight = true;
            else if (relTargetAngle < -0.1) player.isRotatingLeft = true;
            else player.isThrusting = true && player.fuel > 0;
            break;
    }

    // Random chance to use hyperspace when in danger (torpedoes nearby)
    const nearbyTorpedo = torpedoes.some(t => {
        if (t.owner === player) return false;

        const dx = player.x - t.x;
        const dy = player.y - t.y;
        const distSq = dx * dx + dy * dy;

        return distSq < (SHIP_SIZE * 10) * (SHIP_SIZE * 10);
    });

    if (nearbyTorpedo && player.hyperspaceCooldown <= 0 && Math.random() < 0.4) {
        hyperspace(player);
    }
}

// Create starfield
function createStars() {
    const numStars = Math.floor((GAME_WIDTH * GAME_HEIGHT) / 10000);
    stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 1.5 + 0.5,
            brightness: Math.random() * 0.8 + 0.2,
        });
    }
}

// Initialize Audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Simplified sound creator functions that don't rely on complex references
        sounds = {
            // Simplified thrust sound handler
            playThrust: function (isOn) {
                if (!audioContext) return;

                // Stop any existing oscillator
                if (this.thrustOscillator) {
                    try {
                        this.thrustOscillator.stop();
                    } catch (e) {
                        // Ignore errors on stop
                    }
                    this.thrustOscillator = null;
                }

                // Create new sound if turned on
                if (isOn) {
                    const oscillator = audioContext.createOscillator();
                    const gain = audioContext.createGain();

                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 100;

                    gain.gain.value = 0.1;

                    oscillator.connect(gain);
                    gain.connect(audioContext.destination);

                    oscillator.start();
                    this.thrustOscillator = oscillator;
                }
            },

            // One-shot torpedo sound
            playTorpedo: function () {
                if (!audioContext) return;

                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.type = 'square';
                oscillator.frequency.value = 300;

                gain.gain.value = 0.2;
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start();
                setTimeout(() => {
                    try {
                        oscillator.stop();
                    } catch (e) {
                        // Ignore errors on stop
                    }
                }, 200);
            },

            // One-shot explosion sound
            playExplosion: function () {
                if (!audioContext) return;

                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 100;

                gain.gain.value = 0.5;

                // Create a rapid pitch drop
                oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start();
                setTimeout(() => {
                    try {
                        oscillator.stop();
                    } catch (e) {
                        // Ignore errors on stop
                    }
                }, 500);
            },

            // One-shot hyperspace sound
            playHyperspace: function () {
                if (!audioContext) return;

                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.type = 'sawtooth';

                gain.gain.value = 0.2;

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                // Frequency sweep
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.2);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.4);

                // Amplitude envelope
                gain.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

                oscillator.start();
                setTimeout(() => {
                    try {
                        oscillator.stop();
                    } catch (e) {
                        // Ignore errors on stop
                    }
                }, 400);
            }
        };

    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        // Create dummy sound functions that do nothing
        sounds = {
            playThrust: function () { },
            playTorpedo: function () { },
            playExplosion: function () { },
            playHyperspace: function () { }
        };
    }
}

// Play thrust sound
function playThrustSound(player) {
    if (!audioContext) return;

    try {
        const thrustSound = player === player1 ? sounds.thrust1 : sounds.thrust2;

        if (player.isThrusting && player.fuel > 0) {
            if (thrustSound && thrustSound.source && !thrustSound.source.started) {
                thrustSound.source.start();
                thrustSound.source.started = true;
            }
        } else {
            if (thrustSound && thrustSound.source && thrustSound.source.started) {
                thrustSound.source.stop();

                // Create a new sound with local function scope to avoid reference errors
                const createLocalThrustSound = function () {
                    const noise = audioContext.createBufferSource();
                    const bufferSize = audioContext.sampleRate * 1; // 1 second buffer
                    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const data = buffer.getChannelData(0);

                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }

                    noise.buffer = buffer;
                    noise.loop = true;

                    const lowpass = audioContext.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.value = 400;

                    const gain = audioContext.createGain();
                    gain.gain.value = 0.15;

                    noise.connect(lowpass);
                    lowpass.connect(gain);
                    gain.connect(audioContext.destination);

                    return { source: noise, gain: gain };
                };

                if (player === player1) {
                    sounds.thrust1 = createLocalThrustSound();
                } else {
                    sounds.thrust2 = createLocalThrustSound();
                }
            }
        }
    } catch (e) {
        console.error("Audio error:", e);
        // Safe recovery - recreate both sound objects
        sounds.thrust1 = initAudio.createThrustSound ?
            initAudio.createThrustSound() :
            { source: { started: false } };
        sounds.thrust2 = initAudio.createThrustSound ?
            initAudio.createThrustSound() :
            { source: { started: false } };
    }
}

// Play torpedo sound
function playTorpedoSound() {
    if (!audioContext) return;

    const sound = sounds.torpedo();
    sound.oscillator.start();
    setTimeout(() => {
        sound.oscillator.stop();
    }, 200);
}

// Play explosion sound
function playExplosionSound() {
    if (!audioContext) return;

    const sound = sounds.explosion();
    sound.source.start();
    setTimeout(() => {
        sound.source.stop();
    }, 500);
}

// Play hyperspace sound
function playHyperspaceSound() {
    if (!audioContext) return;

    const sound = sounds.hyperspace();
    sound.oscillator.start();
    setTimeout(() => {
        sound.oscillator.stop();
    }, 400);
}

// Update game state
function update(deltaTime) {
    // Update star pulse
    star.pulseTime += deltaTime;
    if (star.pulseTime > star.pulseRate) {
        star.pulseTime = 0;
    }

    // Update player 1
    updatePlayer(player1, deltaTime);

    // Update player 2
    updatePlayer(player2, deltaTime);

    // Update torpedoes
    updateTorpedoes(deltaTime);

    // Update explosions
    updateExplosions(deltaTime);

    // Check for game over
    if ((!player1.isAlive || !player2.isAlive) && gameRunning) {
        setTimeout(() => {
            document.getElementById("gameOverMessage").textContent =
                !player1.isAlive && !player2.isAlive
                    ? "MUTUAL DESTRUCTION"
                    : !player1.isAlive
                        ? "WEDGE VICTORIOUS"
                        : "NEEDLE VICTORIOUS";
            document.getElementById("gameOverScreen").style.display = "flex";
            gameRunning = false;
        }, 1500);
    }
}

// Update player
function updatePlayer(player, deltaTime) {
    if (!player.isAlive) return;

    // Add this line to control AI for player2
    if (player === player2) {
        controlAI(player, player1, deltaTime);
    }

    // Update cooldowns
    if (player.torpedoCooldown > 0) {
        player.torpedoCooldown -= deltaTime;
    }

    if (player.hyperspaceCooldown > 0) {
        player.hyperspaceCooldown -= deltaTime;
    }

    // Apply rotation
    if (player.isRotatingLeft) {
        player.rotation -= ROTATION_SPEED * deltaTime;
    }
    if (player.isRotatingRight) {
        player.rotation += ROTATION_SPEED * deltaTime;
    }

    // Apply thrust
    if (player.isThrusting && player.fuel > 0) {
        const thrustX = Math.cos(player.rotation) * THRUST_POWER * deltaTime;
        const thrustY = Math.sin(player.rotation) * THRUST_POWER * deltaTime;

        player.vx += thrustX;
        player.vy += thrustY;

        // Limit speed
        const speed = Math.sqrt(
            player.vx * player.vx + player.vy * player.vy
        );
        if (speed > MAX_SPEED) {
            player.vx = (player.vx / speed) * MAX_SPEED;
            player.vy = (player.vy / speed) * MAX_SPEED;
        }

        // Consume fuel
        player.fuel = Math.max(0, player.fuel - 10 * deltaTime);
        updatePlayerInfo();

        // Play thrust sound
        if (player === player1) {
            sounds.playThrust(true);
        }
    } else {
        if (player === player1) {
            sounds.playThrust(false);
        }
    }

    // Apply gravity from star
    const dx = star.x - player.x;
    const dy = star.y - player.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist < star.radius + player.radius) {
        // Collision with star
        destroyShip(player);
        return;
    }

    const force = (G * star.mass) / distSq;
    const ax = (dx / dist) * force;
    const ay = (dy / dist) * force;

    player.vx += ax * deltaTime;
    player.vy += ay * deltaTime;

    // Update position
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    // Wrap around screen edges
    if (player.x < 0) player.x = GAME_WIDTH;
    if (player.x > GAME_WIDTH) player.x = 0;
    if (player.y < 0) player.y = GAME_HEIGHT;
    if (player.y > GAME_HEIGHT) player.y = 0;
}

// Update torpedoes
function updateTorpedoes(deltaTime) {
    // Update existing torpedoes
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];

        // Apply gravity from star
        const dx = star.x - torpedo.x;
        const dy = star.y - torpedo.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < star.radius) {
            // Torpedo hit star
            torpedoes.splice(i, 1);
            continue;
        }

        const force = (G * star.mass) / distSq;
        const ax = (dx / dist) * force;
        const ay = (dy / dist) * force;

        torpedo.vx += ax * deltaTime;
        torpedo.vy += ay * deltaTime;

        // Update position
        torpedo.x += torpedo.vx * deltaTime;
        torpedo.y += torpedo.vy * deltaTime;

        if (!torpedo.trail) torpedo.trail = [];
        torpedo.trail.push({ x: torpedo.x, y: torpedo.y });
        if (torpedo.trail.length > 10) torpedo.trail.shift();

        // Wrap around screen edges
        if (torpedo.x < 0) torpedo.x = GAME_WIDTH;
        if (torpedo.x > GAME_WIDTH) torpedo.x = 0;
        if (torpedo.y < 0) torpedo.y = GAME_HEIGHT;
        if (torpedo.y > GAME_HEIGHT) torpedo.y = 0;

        // Check collisions with players
        if (player1.isAlive && torpedo.owner !== player1) {
            const dx = player1.x - torpedo.x;
            const dy = player1.y - torpedo.y;
            const distSq = dx * dx + dy * dy;

            if (
                distSq <
                (player1.radius + TORPEDO_SIZE) * (player1.radius + TORPEDO_SIZE)
            ) {
                destroyShip(player1);
                torpedoes.splice(i, 1);
                continue;
            }
        }

        if (player2.isAlive && torpedo.owner !== player2) {
            const dx = player2.x - torpedo.x;
            const dy = player2.y - torpedo.y;
            const distSq = dx * dx + dy * dy;

            if (
                distSq <
                (player2.radius + TORPEDO_SIZE) * (player2.radius + TORPEDO_SIZE)
            ) {
                destroyShip(player2);
                torpedoes.splice(i, 1);
                continue;
            }
        }

        // Update lifetime
        torpedo.lifetime -= deltaTime;
        if (torpedo.lifetime <= 0) {
            torpedoes.splice(i, 1);
        }
    }
}

// Update explosions
function updateExplosions(deltaTime) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].lifetime -= deltaTime;
        if (explosions[i].lifetime <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Fire torpedo from ship
function fireTorpedo(player) {
    if (
        !player.isAlive ||
        player.torpedoCooldown > 0 ||
        player.torpedoes <= 0
    )
        return;

    const torpedoX =
        player.x + Math.cos(player.rotation) * (player.radius + 5);
    const torpedoY =
        player.y + Math.sin(player.rotation) * (player.radius + 5);

    torpedoes.push({
        x: torpedoX,
        y: torpedoY,
        vx: player.vx + Math.cos(player.rotation) * TORPEDO_SPEED,
        vy: player.vy + Math.sin(player.rotation) * TORPEDO_SPEED,
        lifetime: TORPEDO_LIFETIME,
        owner: player,
        trail: [{ x: torpedoX, y: torpedoY }]  // Add this line to track positions
    });

    player.torpedoes--;
    player.torpedoCooldown = TORPEDO_COOLDOWN;

    sounds.playTorpedo();
    updatePlayerInfo();
}

// Hyperspace jump
function hyperspace(player) {
    if (!player.isAlive || player.hyperspaceCooldown > 0) return;

    // Set cooldown
    player.hyperspaceCooldown = HYPERSPACE_COOLDOWN;

    // Play sound
    sounds.playHyperspace();

    // Random chance of destruction
    if (Math.random() < HYPERSPACE_DEATH_CHANCE) {
        destroyShip(player);
        return;
    }

    // Teleport to random location (not too close to star or other player)
    let newX,
        newY,
        validPosition = false;

    while (!validPosition) {
        newX = Math.random() * (GAME_WIDTH - 100) + 50;
        newY = Math.random() * (GAME_HEIGHT - 100) + 50;

        // Check distance from star
        const dxStar = newX - star.x;
        const dyStar = newY - star.y;
        const distStar = Math.sqrt(dxStar * dxStar + dyStar * dyStar);

        // Check distance from other player
        const otherPlayer = player === player1 ? player2 : player1;
        const dxPlayer = newX - otherPlayer.x;
        const dyPlayer = newY - otherPlayer.y;
        const distPlayer = Math.sqrt(
            dxPlayer * dxPlayer + dyPlayer * dyPlayer
        );

        if (distStar > star.radius * 3 && distPlayer > SHIP_SIZE * 5) {
            validPosition = true;
        }
    }

    player.x = newX;
    player.y = newY;
    player.vx *= 0.5; // Reduce velocity
    player.vy *= 0.5;

    // Add hyperspace effect
    addHyperspaceEffect(newX, newY);
}

// Destroy ship
function destroyShip(player) {
    player.isAlive = false;

    // Create explosion
    explosions.push({
        x: player.x,
        y: player.y,
        size: 0,
        maxSize: player.radius * 5,
        growRate: player.radius * 10,
        lifetime: 1,
        color: "#fff",
    });

    // Play explosion sound
    sounds.playExplosion();
}

// Add hyperspace effect
function addHyperspaceEffect(x, y) {
    explosions.push({
        x: x,
        y: y,
        size: SHIP_SIZE * 3,
        maxSize: SHIP_SIZE * 3,
        growRate: 0,
        lifetime: 0.3,
        color: "#66ffff",
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Set green phosphor effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#33ff33";
    ctx.strokeStyle = "#33ff33";
    ctx.fillStyle = "#33ff33";

    // Draw starfield
    drawStars();

    // Draw central star
    drawStar();

    // Draw torpedoes
    drawTorpedoes();

    // Draw players
    if (player1.isAlive) drawPlayer(player1);
    if (player2.isAlive) drawPlayer(player2);

    // Draw effects
    drawEffects();
}

// Draw starfield
function drawStars() {
    ctx.shadowBlur = 0;
    for (const star of stars) {
        ctx.fillStyle = `rgba(51, 255, 51, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 10;
}

// Draw central star
function drawStar() {
    const pulseScale =
        1 + Math.sin((star.pulseTime / star.pulseRate) * Math.PI * 2) * 0.1;
    const currentRadius = star.radius * pulseScale;

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(star.x, star.y, currentRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.fillStyle = "#33ff33";
    ctx.shadowBlur = 10;
}

// Draw player ship
function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);

    // Draw ship based on type
    if (player.type === "needle") {
        // Needle ship (thin and pointy)
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE / 2, -SHIP_SIZE / 2);
        ctx.lineTo(-SHIP_SIZE / 3, 0);
        ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
        ctx.closePath();
        ctx.stroke();

        // Draw thruster flame if thrusting
        if (player.isThrusting && player.fuel > 0) {
            ctx.beginPath();
            const flameSize = (SHIP_SIZE / 2) * (0.8 + Math.random() * 0.4);
            ctx.moveTo(-SHIP_SIZE / 3, 0);
            ctx.lineTo(-SHIP_SIZE - flameSize, -SHIP_SIZE / 4);
            ctx.lineTo(-SHIP_SIZE - flameSize * 1.5, 0);
            ctx.lineTo(-SHIP_SIZE - flameSize, SHIP_SIZE / 4);
            ctx.closePath();
            ctx.fillStyle = "#ffffaa";
            ctx.fill();
        }
    } else {
        // Wedge ship (wider and more triangular)
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE / 2, -SHIP_SIZE * 0.8);
        ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE * 0.8);
        ctx.closePath();
        ctx.stroke();

        // Draw thruster flame if thrusting
        if (player.isThrusting && player.fuel > 0) {
            ctx.beginPath();
            const flameSize = (SHIP_SIZE / 2) * (0.8 + Math.random() * 0.4);
            ctx.moveTo(-SHIP_SIZE / 2, 0);
            ctx.lineTo(-SHIP_SIZE - flameSize, -SHIP_SIZE / 3);
            ctx.lineTo(-SHIP_SIZE - flameSize * 1.5, 0);
            ctx.lineTo(-SHIP_SIZE - flameSize, SHIP_SIZE / 3);
            ctx.closePath();
            ctx.fillStyle = "#ffffaa";
            ctx.fill();
        }
    }

    ctx.restore();
}

// Draw torpedoes
function drawTorpedoes() {
    for (const torpedo of torpedoes) {
        // Draw the torpedo trail
        if (torpedo.trail && torpedo.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(torpedo.trail[0].x, torpedo.trail[0].y);

            for (let i = 1; i < torpedo.trail.length; i++) {
                ctx.lineTo(torpedo.trail[i].x, torpedo.trail[i].y);
            }

            ctx.strokeStyle = torpedo.owner === player1 ? "#ffff33" : "#ff33ff";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#33ff33";
        }

        // Draw the torpedo itself
        ctx.beginPath();
        ctx.arc(torpedo.x, torpedo.y, TORPEDO_SIZE, 0, Math.PI * 2);
        ctx.fillStyle = torpedo.owner === player1 ? "#ffff33" : "#ff33ff";
        ctx.fill();
        ctx.fillStyle = "#33ff33";
    }
}

// Draw effects (explosions and hyperspace)
function drawEffects() {
    effectCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (const explosion of explosions) {
        const size =
            explosion.size < explosion.maxSize
                ? explosion.size + explosion.growRate * (explosion.lifetime / 1)
                : explosion.maxSize * (explosion.lifetime / 1);

        // Create radial gradient
        const gradient = effectCtx.createRadialGradient(
            explosion.x,
            explosion.y,
            0,
            explosion.x,
            explosion.y,
            size
        );

        gradient.addColorStop(0, explosion.color);
        gradient.addColorStop(0.7, `${explosion.color}80`);
        gradient.addColorStop(1, "transparent");

        effectCtx.fillStyle = gradient;
        effectCtx.beginPath();
        effectCtx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2);
        effectCtx.fill();
    }
}

// Update player info display
function updatePlayerInfo() {
    document.getElementById("player1Fuel").textContent = Math.floor(
        player1.fuel
    );
    document.getElementById("player1Torpedoes").textContent =
        player1.torpedoes;
    document.getElementById("player2Fuel").textContent = Math.floor(
        player2.fuel
    );
    document.getElementById("player2Torpedoes").textContent =
        player2.torpedoes;
}

// Create CRT effect
function createCRTEffect() {
    // Add scanlines and flicker - already in CSS

    // Add motion blur after each frame
    effectCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
    effectCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

// Handle keyboard input
function setupControls() {
    const keys = {};

    window.addEventListener("keydown", (e) => {
        keys[e.key] = true;

        // Player 1 controls
        player1.isRotatingLeft = keys["a"] || keys["A"];
        player1.isRotatingRight = keys["d"] || keys["D"];
        player1.isThrusting = keys["w"] || keys["W"];

        // Player 2 controls
        player2.isRotatingLeft = keys["ArrowLeft"];
        player2.isRotatingRight = keys["ArrowRight"];
        player2.isThrusting = keys["ArrowUp"];

        // Fire torpedoes
        if ((keys[" "] || keys["Spacebar"]) && player1.torpedoCooldown <= 0) {
            fireTorpedo(player1);
        }

        if (keys["Enter"] && player2.torpedoCooldown <= 0) {
            fireTorpedo(player2);
        }

        // Hyperspace
        if ((keys["q"] || keys["Q"]) && player1.hyperspaceCooldown <= 0) {
            hyperspace(player1);
        }

        if (keys["Shift"] && player2.hyperspaceCooldown <= 0) {
            hyperspace(player2);
        }
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key] = false;

        // Player 1 controls
        player1.isRotatingLeft = keys["a"] || keys["A"];
        player1.isRotatingRight = keys["d"] || keys["D"];
        player1.isThrusting = keys["w"] || keys["W"];

        // Player 2 controls
        player2.isRotatingLeft = keys["ArrowLeft"];
        player2.isRotatingRight = keys["ArrowRight"];
        player2.isThrusting = keys["ArrowUp"];
    });
}

// Game loop
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;

    if (gameRunning) {
        update(deltaTime);
        draw();
        createCRTEffect();
    }

    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    if (!gameRunning) {
        // Reset game state
        player1.x = GAME_WIDTH / 2 - 150;
        player1.y = GAME_HEIGHT / 2;
        player1.vx = 0;
        player1.vy = -100;
        player1.rotation = Math.PI / 2;
        player1.fuel = 100;
        player1.torpedoes = MAX_TORPEDOES;
        player1.torpedoCooldown = 0;
        player1.hyperspaceCooldown = 0;
        player1.isThrusting = false;
        player1.isRotatingLeft = false;
        player1.isRotatingRight = false;
        player1.isAlive = true;

        player2.x = GAME_WIDTH / 2 + 150;
        player2.y = GAME_HEIGHT / 2;
        player2.vx = 0;
        player2.vy = 100;
        player2.rotation = -Math.PI / 2;
        player2.fuel = 100;
        player2.torpedoes = MAX_TORPEDOES;
        player2.torpedoCooldown = 0;
        player2.hyperspaceCooldown = 0;
        player2.isThrusting = false;
        player2.isRotatingLeft = false;
        player2.isRotatingRight = false;
        player2.isAlive = true;

        torpedoes = [];
        explosions = [];

        updatePlayerInfo();

        // Hide start screen and game over screen
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("gameOverScreen").style.display = "none";

        // Start game
        gameRunning = true;
    }
}

// Initialize game
function init() {
    createStars();
    initAudio();
    setupControls();
    updatePlayerInfo();

    // Start button
    document.getElementById("startButton").addEventListener("click", () => {
        startGame();
        if (audioContext && audioContext.state === "suspended") {
            audioContext.resume();
        }
    });

    // Restart button
    document
        .getElementById("restartButton")
        .addEventListener("click", () => {
            startGame();
        });

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start the game when document is loaded
window.addEventListener("load", init);