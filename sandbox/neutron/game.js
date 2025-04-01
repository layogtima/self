// Sound effects
const sounds = {
    paddle: new Audio(),
    wall: new Audio(),
    score: new Audio(),
    gameOver: new Audio(),
    start: new Audio()
};

// Create oscillator-based sounds
function createOscillatorSound(type, frequency, duration, volume = 0.2) {
    return function () {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();

        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        // Stop after duration
        setTimeout(() => {
            oscillator.stop();
        }, duration * 1000);
    };
}

// Setup our sound functions
const playSounds = {
    paddle: createOscillatorSound('sine', 440, 0.1),
    wall: createOscillatorSound('triangle', 300, 0.1),
    score: createOscillatorSound('sine', 660, 0.2),
    gameOver: createOscillatorSound('sawtooth', 150, 1.0, 0.3),
    start: createOscillatorSound('square', 523.25, 0.3, 0.2) // C5
};

// Create the Vue app
const { createApp, ref, onMounted, computed, watch } = Vue;

createApp({
    setup() {
        // Game state
        const gameState = ref('start'); // start, playing, gameOver
        const score = ref(0);
        const highScore = ref(localStorage.getItem('neutronBounceHighScore') || 0);
        const level = ref(1);

        // Canvas dimensions
        const canvasWidth = ref(window.innerWidth);
        const canvasHeight = ref(window.innerHeight);

        // Player paddle
        const paddleWidth = ref(150);
        const paddleHeight = ref(15);
        const paddleX = ref(canvasWidth.value / 2 - paddleWidth.value / 2);
        const paddleY = ref(canvasHeight.value - 50);

        // Ball properties
        const ballSize = ref(20);
        const ballX = ref(canvasWidth.value / 2 - ballSize.value / 2);
        const ballY = ref(canvasHeight.value / 2 - ballSize.value / 2);
        const initialBallSpeed = 6;
        const ballSpeedX = ref(initialBallSpeed);
        const ballSpeedY = ref(-initialBallSpeed);
        const maxBallSpeed = 18;

        // Trail effect
        const trails = ref([]);

        // Computer opponent
        const computerPaddleWidth = ref(150);
        const computerPaddleHeight = ref(15);
        const computerPaddleX = ref(canvasWidth.value / 2 - computerPaddleWidth.value / 2);
        const computerPaddleY = ref(30);
        const computerDifficulty = ref(0.1); // 0 to 1, higher is harder

        // Speed boost zones
        const speedBoosts = ref([]);

        // Handle window resize
        const handleResize = () => {
            canvasWidth.value = window.innerWidth;
            canvasHeight.value = window.innerHeight;
            resetGame();
        };

        // Mouse movement
        const mouseX = ref(0);
        const handleMouseMove = (e) => {
            mouseX.value = e.clientX;
            paddleX.value = Math.max(0, Math.min(canvasWidth.value - paddleWidth.value, mouseX.value - paddleWidth.value / 2));
        };

        // Touch movement
        const handleTouchMove = (e) => {
            e.preventDefault();
            mouseX.value = e.touches[0].clientX;
            paddleX.value = Math.max(0, Math.min(canvasWidth.value - paddleWidth.value, mouseX.value - paddleWidth.value / 2));
        };

        // Create speed boost zones
        const createSpeedBoosts = () => {
            speedBoosts.value = [];
            const numBoosts = Math.min(level.value, 5);
            for (let i = 0; i < numBoosts; i++) {
                speedBoosts.value.push({
                    x: Math.random() * (canvasWidth.value - 100) + 50,
                    y: Math.random() * (canvasHeight.value - 200) + 100,
                    width: 40,
                    height: 40,
                    type: Math.random() > 0.3 ? 'speed' : 'slow'
                });
            }
        };

        // Update the game state
        const updateGame = () => {
            if (gameState.value !== 'playing') return;

            // Move the ball
            ballX.value += ballSpeedX.value;
            ballY.value += ballSpeedY.value;

            // Add trail effect
            if (Math.random() > 0.7) {
                trails.value.push({
                    x: ballX.value + ballSize.value / 2,
                    y: ballY.value + ballSize.value / 2,
                    size: ballSize.value * (0.3 + Math.random() * 0.4),
                    opacity: 0.7
                });
            }

            // Update trails
            trails.value.forEach((trail, index) => {
                trail.size *= 0.95;
                trail.opacity *= 0.95;
                if (trail.size < 1 || trail.opacity < 0.1) {
                    trails.value.splice(index, 1);
                }
            });

            // Wall collision
            if (ballX.value <= 0 || ballX.value + ballSize.value >= canvasWidth.value) {
                ballSpeedX.value = -ballSpeedX.value;
                playSounds.wall();
            }

            // Computer paddle movement (AI)
            const targetX = ballX.value + ballSize.value / 2 - computerPaddleWidth.value / 2;
            const difficulty = Math.min(0.3 + level.value * 0.05, 0.9); // Increase difficulty with level
            computerPaddleX.value += (targetX - computerPaddleX.value) * difficulty;

            // Keep computer paddle within bounds
            computerPaddleX.value = Math.max(0, Math.min(canvasWidth.value - computerPaddleWidth.value, computerPaddleX.value));

            // Paddle collision - Player
            if (
                ballY.value + ballSize.value >= paddleY.value &&
                ballY.value <= paddleY.value + paddleHeight.value &&
                ballX.value + ballSize.value >= paddleX.value &&
                ballX.value <= paddleX.value + paddleWidth.value
            ) {
                // Calculate reflection angle based on where the ball hits the paddle
                const hitPosition = (ballX.value + ballSize.value / 2) - (paddleX.value + paddleWidth.value / 2);
                const normalizedHitPosition = hitPosition / (paddleWidth.value / 2);

                // Reflect with angle
                ballSpeedX.value = normalizedHitPosition * (5 + level.value * 0.5);

                // Ensure minimum X speed
                if (Math.abs(ballSpeedX.value) < 2) {
                    ballSpeedX.value = ballSpeedX.value > 0 ? 2 : -2;
                }

                // Maintain ball speed (with slight increase)
                const currentSpeed = Math.sqrt(ballSpeedX.value * ballSpeedX.value + ballSpeedY.value * ballSpeedY.value);
                const targetSpeed = Math.min(initialBallSpeed + level.value * 0.5, maxBallSpeed);
                const speedRatio = targetSpeed / currentSpeed;

                ballSpeedX.value *= speedRatio;
                ballSpeedY.value = -Math.abs(ballSpeedY.value * speedRatio);

                playSounds.paddle();

                // Increase score
                score.value += 10;
            }

            // Paddle collision - Computer
            if (
                ballY.value <= computerPaddleY.value + computerPaddleHeight.value &&
                ballY.value + ballSize.value >= computerPaddleY.value &&
                ballX.value + ballSize.value >= computerPaddleX.value &&
                ballX.value <= computerPaddleX.value + computerPaddleWidth.value
            ) {
                // Calculate reflection angle based on where the ball hits the paddle
                const hitPosition = (ballX.value + ballSize.value / 2) - (computerPaddleX.value + computerPaddleWidth.value / 2);
                const normalizedHitPosition = hitPosition / (computerPaddleWidth.value / 2);

                // Reflect with angle
                ballSpeedX.value = normalizedHitPosition * (4 + level.value * 0.4);

                // Ensure minimum X speed
                if (Math.abs(ballSpeedX.value) < 2) {
                    ballSpeedX.value = ballSpeedX.value > 0 ? 2 : -2;
                }

                // Maintain ball speed
                const currentSpeed = Math.sqrt(ballSpeedX.value * ballSpeedX.value + ballSpeedY.value * ballSpeedY.value);
                const targetSpeed = Math.min(initialBallSpeed + level.value * 0.5, maxBallSpeed);
                const speedRatio = targetSpeed / currentSpeed;

                ballSpeedX.value *= speedRatio;
                ballSpeedY.value = Math.abs(ballSpeedY.value * speedRatio);

                playSounds.wall();
            }

            // Speed boost collision
            speedBoosts.value.forEach((boost, index) => {
                if (
                    ballX.value < boost.x + boost.width &&
                    ballX.value + ballSize.value > boost.x &&
                    ballY.value < boost.y + boost.height &&
                    ballY.value + ballSize.value > boost.y
                ) {
                    if (boost.type === 'speed') {
                        // Speed up
                        const speedMultiplier = 1.5;
                        ballSpeedX.value *= speedMultiplier;
                        ballSpeedY.value *= speedMultiplier;
                        playSounds.score();
                        score.value += 25;
                    } else {
                        // Slow down
                        const slowMultiplier = 0.7;
                        ballSpeedX.value *= slowMultiplier;
                        ballSpeedY.value *= slowMultiplier;
                        playSounds.wall();
                    }

                    // Remove the boost
                    speedBoosts.value.splice(index, 1);
                }
            });

            // Check if ball goes out of bounds
            if (ballY.value <= 0) {
                // Player scores!
                playSounds.score();
                score.value += 50;

                // Level up after every 200 points
                if (score.value >= level.value * 200) {
                    level.value++;
                    createSpeedBoosts();
                }

                // Reset ball position
                resetBall();
            } else if (ballY.value >= canvasHeight.value) {
                // Game over
                playSounds.gameOver();
                gameState.value = 'gameOver';

                // Update high score
                if (score.value > highScore.value) {
                    highScore.value = score.value;
                    localStorage.setItem('neutronBounceHighScore', highScore.value);
                }
            }
        };

        // Animation frame
        const animate = () => {
            updateGame();
            requestAnimationFrame(animate);
        };

        // Reset ball to center
        const resetBall = () => {
            ballX.value = canvasWidth.value / 2 - ballSize.value / 2;
            ballY.value = canvasHeight.value / 2 - ballSize.value / 2;

            // Random angle, but avoid horizontal directions
            const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // Between -45 and 45 degrees
            const speed = initialBallSpeed + level.value * 0.5;

            ballSpeedX.value = Math.sin(angle) * speed;
            ballSpeedY.value = -Math.cos(angle) * speed; // Start going up

            // Clear trails
            trails.value = [];
        };

        // Reset game
        const resetGame = () => {
            score.value = 0;
            level.value = 1;

            paddleX.value = canvasWidth.value / 2 - paddleWidth.value / 2;
            paddleY.value = canvasHeight.value - 50;

            computerPaddleX.value = canvasWidth.value / 2 - computerPaddleWidth.value / 2;

            createSpeedBoosts();
            resetBall();
        };

        // Start game
        const startGame = () => {
            gameState.value = 'playing';
            resetGame();
            playSounds.start();
        };

        // Initialize
        onMounted(() => {
            window.addEventListener('resize', handleResize);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });

            createSpeedBoosts();
            animate();
        });

        return {
            gameState,
            score,
            highScore,
            level,
            canvasWidth,
            canvasHeight,
            paddleWidth,
            paddleHeight,
            paddleX,
            paddleY,
            ballSize,
            ballX,
            ballY,
            trails,
            computerPaddleWidth,
            computerPaddleHeight,
            computerPaddleX,
            computerPaddleY,
            speedBoosts,
            mouseX,
            startGame
        };
    },
    template: `
      <div class="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center">
        <!-- Start Screen -->
        <div v-if="gameState === 'start'" class="flex flex-col items-center justify-center z-10">
          <h1 class="text-6xl font-bold mb-8 glow animate-glow">NEUTRON BOUNCE</h1>
          <p class="text-lg mb-12 opacity-80">A MONO-inspired retro arcade experience</p>
          <button @click="startGame" class="px-8 py-3 text-2xl font-bold bg-transparent border-2 border-neon-blue text-neon-blue neon-border hover:bg-neon-blue hover:text-black transition-all duration-300">
            START GAME
          </button>
          <p class="mt-8 text-sm opacity-60">Use your mouse or touch to move the paddle</p>
          <p class="mt-2 text-sm opacity-60">High Score: {{ highScore }}</p>
        </div>
        
        <!-- Game Over Screen -->
        <div v-if="gameState === 'gameOver'" class="flex flex-col items-center justify-center z-10">
          <h1 class="text-5xl font-bold mb-4 text-neon-pink">GAME OVER</h1>
          <p class="text-2xl mb-2">Score: {{ score }}</p>
          <p class="text-xl mb-8">High Score: {{ highScore }}</p>
          <button @click="startGame" class="px-6 py-2 text-xl font-bold bg-transparent border-2 border-neon-pink text-neon-pink neon-border hover:bg-neon-pink hover:text-black transition-all duration-300">
            PLAY AGAIN
          </button>
        </div>
        
        <!-- Game Elements -->
        <div v-if="gameState === 'playing'" class="absolute top-0 left-0 w-full h-screen">
          <!-- Score Display -->
          <div class="absolute top-4 left-4 text-xl">
            <span class="opacity-70">SCORE:</span> {{ score }}
          </div>
          
          <!-- Level Display -->
          <div class="absolute top-4 right-4 text-xl">
            <span class="opacity-70">LEVEL:</span> {{ level }}
          </div>
          
          <!-- Ball Trails -->
          <div v-for="(trail, index) in trails" :key="'trail-'+index" class="ball-trail"
            :style="{ 
              left: trail.x + 'px', 
              top: trail.y + 'px', 
              width: trail.size + 'px', 
              height: trail.size + 'px',
              opacity: trail.opacity
            }">
          </div>
          
          <!-- Speed Boosts -->
          <div v-for="(boost, index) in speedBoosts" :key="'boost-'+index" 
            class="absolute transform rotate-45"
            :class="{ 'bg-neon-blue': boost.type === 'speed', 'bg-neon-pink': boost.type === 'slow' }"
            :style="{ 
              left: boost.x + 'px', 
              top: boost.y + 'px', 
              width: boost.width + 'px', 
              height: boost.height + 'px',
              opacity: '0.7'
            }">
          </div>
          
          <!-- The Ball -->
          <div class="absolute bg-white rounded-full neon-border"
            :style="{ 
              left: ballX + 'px', 
              top: ballY + 'px', 
              width: ballSize + 'px', 
              height: ballSize + 'px' 
            }">
          </div>
          
          <!-- Player Paddle -->
          <div class="absolute bg-neon-blue rounded-sm neon-border"
            :style="{ 
              left: paddleX + 'px', 
              top: paddleY + 'px', 
              width: paddleWidth + 'px', 
              height: paddleHeight + 'px' 
            }">
          </div>
          
          <!-- Computer Paddle -->
          <div class="absolute bg-neon-pink rounded-sm neon-border"
            :style="{ 
              left: computerPaddleX + 'px', 
              top: computerPaddleY + 'px', 
              width: computerPaddleWidth + 'px', 
              height: computerPaddleHeight + 'px' 
            }">
          </div>
          
          <!-- Custom Mouse Cursor -->
          <div class="absolute w-8 h-8 pointer-events-none"
            :style="{ 
              left: mouseX + 'px', 
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }">
            <div class="w-full h-full border-2 border-white rounded-full opacity-50"></div>
            <div class="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    `
}).mount('#app');