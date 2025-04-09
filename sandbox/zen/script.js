
const { createApp, ref, onMounted, onUnmounted, nextTick, watch } = Vue; // Added watch

const app = createApp({
    setup() {
        // Refs, state, basic audio setup 
        const canvas = ref(null);
        let ctx = null;
        let animationFrameId = null;
        let motes = [];
        const numMotes = 150;
        const mouse = {
            x: null,
            y: null,
            radius: 150,
            interactingMoteIds: new Set(),
        };
        let audioCtx = null;
        let masterGain = null;
        let reverbNode = null;
        let reverbGain = null;
        let userInteracted = ref(false);
        let isAudioReady = false;

        // --- Helper Functions (With Clamping/Checks) ---

        // Added more checks and clamping here
        function getPitchFromScale(
            value,
            maxInput,
            baseFreq = 110,
            octaveRange = 3
        ) {
            // Guard against invalid maxInput
            if (!maxInput || maxInput <= 0) return baseFreq;

            // Clamp normalized value to prevent issues at edges/outside bounds
            let normalizedValue = 1 - value / maxInput;
            normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // Clamp between 0 and 1

            const totalSteps = (pentatonicSteps.length - 1) * octaveRange;
            let stepIndex = Math.floor(normalizedValue * totalSteps);
            stepIndex = Math.max(0, Math.min(totalSteps - 1, stepIndex)); // Clamp index too

            const octave = Math.floor(stepIndex / (pentatonicSteps.length - 1));
            const noteInOctave = stepIndex % (pentatonicSteps.length - 1);

            const semitones = octave * 12 + pentatonicSteps[noteInOctave];
            const calculatedFreq = baseFreq * Math.pow(2, semitones / 12);

            // Final check for sanity
            return isFinite(calculatedFreq) && calculatedFreq > 0
                ? calculatedFreq
                : baseFreq;
        }

        // Added checks and clamping here
        function mapValueToGain(
            value,
            maxInput,
            minGain = 0.001,
            maxGain = 0.05
        ) {
            // Guard against invalid maxInput
            if (!maxInput || maxInput <= 0) return minGain;

            // Clamp normalized value
            let normalizedValue = value / maxInput;
            normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // Clamp 0 to 1

            const calculatedGain =
                minGain + normalizedValue * (maxGain - minGain);

            // Final check
            return isFinite(calculatedGain) && calculatedGain >= 0
                ? calculatedGain
                : minGain;
        }

        const pentatonicSteps = [0, 2, 4, 7, 9, 12]; // C Major Pentatonic + Octave

        // Pseudo Reverb Impulse 
        function createPseudoReverbImpulse(duration = 1.5, decay = 1.0) {
            if (!audioCtx) return null;
            const sampleRate = audioCtx.sampleRate;
            const length = sampleRate * duration;
            const impulse = audioCtx.createBuffer(2, length, sampleRate); // Stereo
            const impulseL = impulse.getChannelData(0);
            const impulseR = impulse.getChannelData(1);

            for (let i = 0; i < length; i++) {
                // Exponential decay noise
                impulseL[i] =
                    (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
                impulseR[i] =
                    (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
            return impulse;
        }

        // --- Mote Class (With updateSound/update Fixes) ---
        class Mote {
            constructor(x, y, canvasWidth, canvasHeight, id) {
                // Visuals/Basic Physics
                this.id = id;
                this.x = x;
                this.y = y;
                this.size = Math.random() * 2.5 + 0.8;
                this.baseAlpha = Math.random() * 0.4 + 0.2;
                this.alpha = this.baseAlpha;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.canvasWidth = canvasWidth;
                this.canvasHeight = canvasHeight;
                this.maxSpeed = 1.5;
                this.baseColorVal = Math.floor(Math.random() * 55 + 200);
                // Audio components 
                this.oscillator = null;
                this.gainNode = null;
                this.isConnected = false;
                this.currentGain = 0; // Store the *target* gain we are aiming for
            }

            // startSound / stopSound 
            startSound() {
                if (
                    !isAudioReady ||
                    this.oscillator ||
                    !audioCtx ||
                    !masterGain ||
                    !reverbNode ||
                    !reverbGain
                )
                    return;
                try {
                    this.oscillator = audioCtx.createOscillator();
                    this.gainNode = audioCtx.createGain();
                    this.oscillator.type = "sine";
                    // Set initial freq/gain, checking values
                    const initialFreq = getPitchFromScale(
                        this.y,
                        this.canvasHeight
                    );
                    const initialGain = 0; // Start silent
                    this.currentGain = initialGain;

                    this.oscillator.frequency.setValueAtTime(
                        initialFreq,
                        audioCtx.currentTime
                    );
                    this.gainNode.gain.setValueAtTime(
                        initialGain,
                        audioCtx.currentTime
                    );

                    this.oscillator.connect(this.gainNode);
                    this.gainNode.connect(masterGain);
                    this.gainNode.connect(reverbGain);

                    this.oscillator.start();
                    this.isConnected = true;
                } catch (error) {
                    console.error("Error starting mote sound:", error);
                    this.stopSound();
                }
            }
            stopSound() {
                try {
                    if (this.gainNode) {
                        this.gainNode.gain.cancelScheduledValues(
                            audioCtx ? audioCtx.currentTime : 0
                        ); // Stop ramps
                    }
                    if (this.oscillator) {
                        this.oscillator.stop();
                        this.oscillator.disconnect();
                    }
                    if (this.gainNode) {
                        this.gainNode.disconnect();
                    }
                } catch (error) {
                    /* console.warn("Minor error stopping sound:", error.message); */
                } finally {
                    this.oscillator = null;
                    this.gainNode = null;
                    this.isConnected = false;
                }
            }

            updateSound() {
                if (
                    !this.isConnected ||
                    !this.oscillator ||
                    !this.gainNode ||
                    !audioCtx
                )
                    return;

                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const targetFreq = getPitchFromScale(this.y, this.canvasHeight);
                const targetGain = mapValueToGain(
                    speed,
                    this.maxSpeed,
                    0.001,
                    0.035
                ); // Recalculated via safer func

                // *** Sanity Check before setting targets ***
                if (isFinite(targetFreq) && targetFreq > 0) {
                    this.oscillator.frequency.setTargetAtTime(
                        targetFreq,
                        audioCtx.currentTime,
                        0.1
                    );
                } else {
                    console.warn(
                        `Invalid target Freq (${targetFreq}) calc for Mote ${this.id}`
                    );
                    // Option: Just leave frequency as it is? Or set a default? Let's leave it.
                    // this.oscillator.frequency.setTargetAtTime(220, audioCtx.currentTime, 0.1);
                }

                // Gain already has a floor in mapValueToGain, ensure finite before setting
                const safeTargetGain = Math.max(0.0001, targetGain); // Keep the zero-check just in case

                if (isFinite(safeTargetGain)) {
                    // Only ramp if the target actually changed significantly to avoid scheduling overhead
                    if (Math.abs(this.currentGain - safeTargetGain) > 0.0001) {
                        this.gainNode.gain.setTargetAtTime(
                            safeTargetGain,
                            audioCtx.currentTime,
                            0.08
                        );
                        this.currentGain = safeTargetGain; // Update the target we are aiming for
                    }
                } else {
                    console.warn(
                        `Invalid target Gain (${targetGain} -> ${safeTargetGain}) calc for Mote ${this.id}`
                    );
                    // Option: leave gain, or ramp down? Let's leave it for now.
                    // this.gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.1);
                    // this.currentGain = 0.0001;
                }
            }

            triggerInteractionSound() {
                if (
                    !isAudioReady ||
                    !this.gainNode ||
                    !audioCtx ||
                    !this.isConnected
                )
                    return;
                const now = audioCtx.currentTime;
                // Calculate peak gain based on current *target* gain
                const peakGain = this.currentGain + 0.1;

                // Ensure peakGain is also finite before using it
                if (isFinite(peakGain) && peakGain > this.currentGain) {
                    // Get the actual current gain value before cancelling/ramping
                    const actualCurrentGain = this.gainNode.gain.value;

                    this.gainNode.gain.cancelScheduledValues(now);
                    this.gainNode.gain.setValueAtTime(actualCurrentGain, now); // Start from actual current value
                    this.gainNode.gain.linearRampToValueAtTime(
                        peakGain,
                        now + 0.02
                    );
                    // Set target back to the *intended* base gain for this mote
                    this.gainNode.gain.setTargetAtTime(
                        this.currentGain,
                        now + 0.03,
                        0.1
                    );
                } else {
                    console.warn(
                        `Invalid peakGain (${peakGain}) for interaction on Mote ${this.id}`
                    );
                }
            }

            // Mote.update with epsilon for distance**
            update(mouseX, mouseY, influenceRadius) {
                const wasInteracting = mouse.interactingMoteIds.has(this.id);
                let isInteracting = false;

                if (mouseX !== null && mouseY !== null) {
                    const dx = this.x - mouseX;
                    const dy = this.y - mouseY;
                    // Add a tiny value to prevent division by exact zero ***
                    const distance = Math.sqrt(dx * dx + dy * dy) + 1e-5; // 0.00001

                    const maxDistance = influenceRadius;

                    if (distance < maxDistance) {
                        isInteracting = true;
                        // Recalculate force direction using safe distance
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (1 - distance / maxDistance) * 0.15;

                        // Apply force only if finite (should always be now)
                        if (isFinite(forceDirectionX) && isFinite(forceDirectionY)) {
                            this.vx += forceDirectionX * force;
                            this.vy += forceDirectionY * force;
                        }

                        this.alpha = Math.max(
                            0.1,
                            this.baseAlpha * (distance / maxDistance)
                        );
                        if (!wasInteracting && this.isConnected) {
                            this.triggerInteractionSound(); // Check inside handles finite check now
                            mouse.interactingMoteIds.add(this.id);
                        }
                    }
                }

                if (!isInteracting) {
                    this.alpha += (this.baseAlpha - this.alpha) * 0.05;
                    if (wasInteracting) {
                        mouse.interactingMoteIds.delete(this.id);
                    }
                }

                // Movement, Speed Cap, Screen Wrap (same)
                this.vx *= 0.985;
                this.vy *= 0.985;
                // Speed cap should be safe now as vx/vy won't explode
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > this.maxSpeed && this.maxSpeed > 0) {
                    // Added check for maxSpeed > 0
                    this.vx = (this.vx / speed) * this.maxSpeed;
                    this.vy = (this.vy / speed) * this.maxSpeed;
                }
                this.x += this.vx;
                this.y += this.vy;
                // Screen wrap...
                if (this.x > this.canvasWidth + this.size) this.x = -this.size;
                else if (this.x < -this.size)
                    this.x = this.canvasWidth + this.size;
                if (this.y > this.canvasHeight + this.size) this.y = -this.size;
                else if (this.y < -this.size)
                    this.y = this.canvasHeight + this.size;

                // Update sound based on potentially updated state
                if (this.isConnected) {
                    this.updateSound();
                } // Checks inside handles finite check now
            }

            // Draw method 
            draw(ctx) {
                const colorVal = Math.floor(this.baseColorVal);
                ctx.fillStyle = `rgba(${colorVal}, ${colorVal}, ${colorVal}, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        } // End Mote Class

        // --- Initialization & Control (InitAudio, UnlockAudio, InitMotes) ---
        function initAudio() {
            if (audioCtx) return;
            try {
                console.log("Amartha preparing the orchestra...");
                audioCtx = new (window.AudioContext ||
                    window.webkitAudioContext)();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 0.6;
                reverbNode = audioCtx.createConvolver();
                reverbGain = audioCtx.createGain();
                reverbGain.gain.value = 0.6;
                const impulse = createPseudoReverbImpulse(1.5, 1.0);
                if (impulse && reverbNode) reverbNode.buffer = impulse;
                else console.warn("Failed to create reverb buffer");

                // Connect nodes checking they exist
                if (reverbGain && reverbNode) reverbGain.connect(reverbNode);
                if (reverbNode && masterGain) reverbNode.connect(masterGain); // Reverb through master gain
                if (masterGain && audioCtx)
                    masterGain.connect(audioCtx.destination);

                isAudioReady = true;
                console.log(
                    "Audio Context ready. Waiting for user interaction..."
                );
            } catch (e) {
                console.error("Web Audio API failed!", e);
                isAudioReady = false;
            }
        }

        function unlockAudio() {
            /* ... relies on isAudioReady ... */
            if (!isAudioReady && !audioCtx) initAudio(); // Try init again if failed first time maybe? No, rely on initial success.
            if (!audioCtx) {
                console.error("Cannot unlock, AudioContext not available.");
                return;
            }

            if (audioCtx.state === "suspended") {
                audioCtx
                    .resume()
                    .then(() => {
                        console.log("Audio Context Resumed! Let the music begin.");
                        userInteracted.value = true; // Trigger reactive change to hide prompt
                        // Now start sounds for motes that exist
                        motes.forEach((mote) => {
                            if (!mote.isConnected) mote.startSound();
                        });
                    })
                    .catch((e) =>
                        console.error("Audio Context resume failed: ", e)
                    );
            } else if (audioCtx.state === "running") {
                userInteracted.value = true; // Hide prompt anyway
                motes.forEach((mote) => {
                    if (!mote.isConnected) mote.startSound();
                }); // Ensure sounds start if missed
            }
        }

        function initMotes(width, height) {
            motes.forEach((mote) => mote.stopSound()); // Crucial: stop sounds first
            motes = [];
            mouse.interactingMoteIds.clear();
            if (!width || !height) return; // Don't init if dimensions are invalid

            for (let i = 0; i < numMotes; i++) {
                motes.push(
                    new Mote(
                        Math.random() * width,
                        Math.random() * height,
                        width,
                        height,
                        i
                    )
                );
            }
            // Only start if audio context exists and user has interacted
            if (userInteracted.value && isAudioReady) {
                motes.forEach((mote) => mote.startSound());
            }
            console.log(
                `Initialized ${numMotes} motes for a ${width}x${height} canvas.`
            );
        }

        // --- Animation Loop ---
        function animate() {
            if (!ctx || !canvas.value) {
                return;
            }
            ctx.fillStyle = "rgba(10, 10, 15, 0.1)";
            ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
            motes.forEach((mote) => {
                mote.update(mouse.x, mouse.y, mouse.radius);
                mote.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(animate);
        }

        // --- Event Handlers (Resize checks width/height) ---
        function resizeCanvas() {
            /* ... Added checks for valid dimensions ... */
            if (canvas.value) {
                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;
                if (
                    (canvas.value.width !== newWidth ||
                        canvas.value.height !== newHeight) &&
                    newWidth > 0 &&
                    newHeight > 0
                ) {
                    // Add checks
                    canvas.value.width = newWidth;
                    canvas.value.height = newHeight;
                    console.log(`Resized canvas. Re-initializing motes.`);
                    initMotes(newWidth, newHeight); // Resets motes with new bounds
                }
            }
        }
        function handleMouseMove(event) {
            if (!userInteracted.value) {
                unlockAudio();
            }
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }
        function handleMouseLeave() {
            mouse.x = null;
            mouse.y = null;
            mouse.interactingMoteIds.clear();
        }

        // Touch Handlers
        function handleTouchStart(event) {
            // Prevent potential scrolling/zooming interference
            event.preventDefault();
            if (event.touches.length > 0) {
                if (!userInteracted.value) {
                    unlockAudio(); // Also unlock audio on first touch
                }
                // Update mouse coords immediately on touch
                mouse.x = event.touches[0].clientX;
                mouse.y = event.touches[0].clientY;
                // Note: We don't strictly need to manage interactingMoteIds here
                // because interaction is based purely on proximity in Mote.update,
                // which uses the non-null mouse.x/y triggered by touchstart/touchmove.
            }
        }

        function handleTouchMove(event) {
            // Prevent potential scrolling/zooming interference
            event.preventDefault();
            if (event.touches.length > 0) {
                // Continuously update mouse coords as finger moves
                mouse.x = event.touches[0].clientX;
                mouse.y = event.touches[0].clientY;
            }
        }

        function handleTouchEnd(event) {
            // Allow default behaviour like clicks? No, we captured start/move
            // event.preventDefault(); // Might not be needed here

            // Stop the interaction influence when finger lifts
            mouse.x = null;
            mouse.y = null;
            mouse.interactingMoteIds.clear(); // Clear just in case
        }


        // --- Vue Lifecycle Hooks ---
        const promptElement = ref(null); // Ref for the prompt div
        onMounted(() => {
            // We need to querySelect the prompt *after* mount if not using ref()
            // Simpler way: Use v-show/v-if driven by userInteracted
            nextTick(() => {
                // Ensure DOM is ready
                if (canvas.value) {
                    ctx = canvas.value.getContext("2d");
                    if (ctx) {
                        canvas.value.width = window.innerWidth;
                        canvas.value.height = window.innerHeight;
                        initAudio(); // Try to set up audio context early
                        if (canvas.value.width > 0 && canvas.value.height > 0) {
                            initMotes(canvas.value.width, canvas.value.height);
                        } else {
                            console.warn(
                                "Initial canvas dimensions invalid, skipping mote init."
                            );
                        }
                        window.addEventListener("resize", resizeCanvas);
                        window.addEventListener("mousemove", handleMouseMove);
                        document.body.addEventListener(
                            "mouseleave",
                            handleMouseLeave
                        );

                        window.addEventListener('touchstart', handleTouchStart, { passive: false });
                        window.addEventListener('touchmove', handleTouchMove, { passive: false });
                        window.addEventListener('touchend', handleTouchEnd, { passive: false });
                        window.addEventListener('touchcancel', handleTouchEnd, { passive: false }); // Treat cancel like end

                        animate();
                    } else {
                        console.error("Failed to get 2D context.");
                    }
                } else {
                    console.error("Canvas ref null on mount.");
                }
            });
        });
        onUnmounted(() => {
            /* ... ensure audio context closed ... */
            console.log("Amartha signing off: Cleaning up.");
            cancelAnimationFrame(animationFrameId);
            motes.forEach((mote) => mote.stopSound());
            if (audioCtx && audioCtx.state !== "closed") {
                audioCtx
                    .close()
                    .then(() => console.log("AudioContext closed."))
                    .catch((e) => console.warn("Error closing AC:", e));
            }

            // Remove ALL event listeners
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener("mouseleave", handleMouseLeave);

            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        });

        // Expose needed things
        return { canvas, unlockAudio, userInteracted }; // userInteracted will now control the prompt visibility
    }, // End setup
}); // End App

// ** REPLACED custom directive with v-show based on ref **
app.directive("show-prompt", {
    // Custom directive for simple visibility toggle
    updated(el, binding) {
        // Use updated hook to react to value change
        if (binding.value === true) {
            el.classList.add("hidden");
        } else {
            el.classList.remove("hidden");
        }
    },
    mounted(el, binding) {
        // Handle initial state
        if (binding.value === true) {
            el.classList.add("hidden");
        } else {
            el.classList.remove("hidden");
        }
    },
});

app.mount("#app");