/**
 * QUBIT - Quantum Computing Interface
 * © Absurd Industries 2025
 * Brought to you by the same deranged minds that made your DJ friend question his life choices
 */

// Initialize Vue application
const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

// Create application
createApp({
    setup() {
        // System state
        const isSystemActive = ref(false);
        const activeModule = ref('qubits');
        const coherenceLevel = ref(99.8);
        const version = ref('0.2.5-alpha');

        // Taglines
        const taglines = [
            "Harnessing quantum superposition for computational advantage.",
            "Where wave functions collapse with elegant precision.",
            "Manipulating qubits since the future isn't written yet.",
            "Entangling possibilities across probability space.",
            "The interface between classical intuition and quantum reality.",
            "Where Schrödinger's cat is simultaneously employed and on vacation.",
            "Defying classical computing limits with quantum wizardry.",
            "Exploring the multiverse, one quantum gate at a time.",
            "Making uncertainty a computational feature, not a bug.",
            "Absurd Industries' answer to 'Why solve it classically?'"
        ];

        const currentTagline = ref(taglines[Math.floor(Math.random() * taglines.length)]);

        // Qubit management
        const qubits = reactive([]);
        const selectedQubit = ref(null);
        const entanglements = reactive([]);
        const entanglementA = ref(0);
        const entanglementB = ref(1);

        // Quantum gates
        const quantumGates = [
            { name: 'X', description: 'Bit Flip', matrix: [[0, 1], [1, 0]] },
            { name: 'Y', description: 'Y Rotation', matrix: [[0, '-i'], ['i', 0]] },
            { name: 'Z', description: 'Phase Flip', matrix: [[1, 0], [0, -1]] },
            { name: 'H', description: 'Hadamard', matrix: [[1, 1], [1, -1]] },
            { name: 'S', description: 'Phase', matrix: [[1, 0], [0, 'i']] },
            { name: 'T', description: 'π/8', matrix: [[1, 0], [0, 'exp(iπ/4)']] },
            { name: 'CNOT', description: 'Controlled-NOT', controlled: true },
            { name: 'CZ', description: 'Controlled-Z', controlled: true },
            { name: 'SWAP', description: 'Swap Qubits', controlled: true }
        ];

        // Circuit design
        const circuit = reactive({
            wires: [],
            steps: []
        });

        const circuitResults = reactive([]);
        const circuitName = ref('');

        // Algorithms
        const algorithms = [
            {
                id: 'grover',
                name: 'Grover\'s Algorithm',
                description: 'Quantum search algorithm with quadratic speedup.',
                category: 'Search',
                qubits: 4,
                fullDescription: 'Grover\'s algorithm provides a quadratic speedup for unstructured search problems. It can find a specific element in an unsorted database of N items in approximately √N steps, compared to the classical O(N) time.',
                applications: [
                    'Database searching',
                    'Solving NP-complete problems',
                    'Cryptographic attacks',
                    'Optimization problems'
                ],
                pseudocode: `function Grover(N, Oracle)
  // Initialize qubits
  |ψ⟩ = |0⟩^n
  
  // Apply Hadamard to all qubits
  |ψ⟩ = H^⨂n |ψ⟩
  
  // Repeat √N times
  repeat O(√N) times:
    // Apply oracle
    |ψ⟩ = Oracle |ψ⟩
    
    // Apply diffusion operator
    |ψ⟩ = H^⨂n |ψ⟩
    |ψ⟩ = (2|0⟩⟨0| - I) |ψ⟩
    |ψ⟩ = H^⨂n |ψ⟩
  
  // Measure all qubits
  return measure |ψ⟩`
            },
            {
                id: 'shor',
                name: 'Shor\'s Algorithm',
                description: 'Efficient algorithm for integer factorization.',
                category: 'Factoring',
                qubits: 7,
                fullDescription: 'Shor\'s algorithm efficiently factors large integers, which has significant implications for cryptography. It can factor an integer N in O((log N)³) time, exponentially faster than the best known classical algorithm.',
                applications: [
                    'Breaking RSA encryption',
                    'Number theory',
                    'Cryptography',
                    'Quantum supremacy demonstrations'
                ],
                pseudocode: `function Shor(N)
  // Choose random a < N
  a = random(1, N-1)
  
  // Check if a and N share factors
  if gcd(a, N) ≠ 1:
    return gcd(a, N)
  
  // Find the period r using quantum subroutine
  r = QuantumPeriodFinding(a, N)
  
  // Check if r is even and a^(r/2) ≠ -1 (mod N)
  if r is even and a^(r/2) ≠ -1 (mod N):
    return gcd(a^(r/2) + 1, N) or gcd(a^(r/2) - 1, N)
  else:
    // Try again with different a
    return Shor(N)`
            },
            {
                id: 'qft',
                name: 'Quantum Fourier Transform',
                description: 'Quantum version of the discrete Fourier transform.',
                category: 'Transform',
                qubits: 3,
                fullDescription: 'The Quantum Fourier Transform (QFT) is a linear transformation on quantum bits, performing the Fourier transform of the quantum state\'s amplitudes. It\'s a fundamental building block in many quantum algorithms like Shor\'s and phase estimation.',
                applications: [
                    'Phase estimation',
                    'Period finding',
                    'Shor\'s algorithm',
                    'Quantum signal processing'
                ],
                pseudocode: `function QFT(|x⟩)
  n = number of qubits
  |ψ⟩ = |x⟩
  
  for j = 0 to n-1:
    // Apply Hadamard to qubit j
    |ψ⟩ = H_j |ψ⟩
    
    // Apply controlled rotations
    for k = j+1 to n-1:
      |ψ⟩ = CPHASE(2π/2^(k-j))_{j,k} |ψ⟩
  
  // Swap qubits to correct output order
  |ψ⟩ = SWAP_QUBITS |ψ⟩
  
  return |ψ⟩`
            },
            {
                id: 'teleport',
                name: 'Quantum Teleportation',
                description: 'Protocol for transmitting quantum states.',
                category: 'Communication',
                qubits: 3,
                fullDescription: 'Quantum teleportation is a protocol that transmits a quantum state from one location to another, using a shared entangled state and classical communication. It "teleports" the quantum information without violating the no-cloning theorem.',
                applications: [
                    'Quantum networking',
                    'Secure quantum communication',
                    'Distributed quantum computing',
                    'Quantum error correction'
                ],
                pseudocode: `function Teleport(|ψ⟩, Alice, Bob)
  // |ψ⟩ is the state to teleport
  // Create Bell pair and share between Alice and Bob
  |β⟩ = (|00⟩ + |11⟩)/√2
  
  // Alice entangles her qubit with the Bell pair
  CNOT(|ψ⟩, Alice)
  H(|ψ⟩)
  
  // Alice measures her qubits
  m1, m2 = measure(|ψ⟩, Alice)
  
  // Alice sends classical bits to Bob
  send(m1, m2, Alice → Bob)
  
  // Bob applies corrections based on measurements
  if m2 == 1: X(Bob)
  if m1 == 1: Z(Bob)
  
  // Bob now has |ψ⟩`
            }
        ];

        const selectedAlgorithm = ref(null);
        const algorithmResults = reactive({
            running: false,
            data: null,
            type: null,
            name: '',
            input: '',
            output: '',
            qubits: 0,
            gates: 0,
            iterations: 0,
            successRate: 0,
            solution: null,
            factors: [],
            amplitudes: []
        });

        // Circuit presets
        const circuitPresets = [
            {
                name: 'Bell State',
                description: 'Creates a maximally entangled state between two qubits.',
                wires: [null, null],
                steps: [
                    {
                        gates: [
                            { name: 'H' },
                            null
                        ]
                    },
                    {
                        gates: [
                            { control: true },
                            { target: true }
                        ]
                    }
                ]
            },
            {
                name: 'Quantum Teleportation',
                description: 'Teleports a quantum state from one qubit to another.',
                wires: [null, null, null],
                steps: [
                    {
                        gates: [
                            null,
                            { name: 'H' },
                            null
                        ]
                    },
                    {
                        gates: [
                            null,
                            { control: true },
                            { target: true }
                        ]
                    },
                    {
                        gates: [
                            { control: true },
                            { target: true },
                            null
                        ]
                    },
                    {
                        gates: [
                            { name: 'H' },
                            null,
                            null
                        ]
                    },
                    {
                        gates: [
                            { name: 'M' },
                            { name: 'M' },
                            null
                        ]
                    }
                ]
            },
            {
                name: 'Quantum Fourier Transform',
                description: 'Performs a QFT on 3 qubits.',
                wires: [null, null, null],
                steps: [
                    {
                        gates: [
                            { name: 'H' },
                            null,
                            null
                        ]
                    },
                    {
                        gates: [
                            null,
                            { name: 'H' },
                            null
                        ]
                    },
                    {
                        gates: [
                            { control: true },
                            null,
                            { target: true }
                        ]
                    },
                    {
                        gates: [
                            null,
                            { control: true },
                            { target: true }
                        ]
                    },
                    {
                        gates: [
                            null,
                            { name: 'H' },
                            null
                        ]
                    }
                ]
            }
        ];

        // Gate selector for circuit design
        const gateSelector = reactive({
            show: false,
            wireIndex: 0,
            stepIndex: 0,
            selectedGate: null,
            controlMode: false,
            controlQubit: 0,
            targetQubit: 1
        });

        // Simulation parameters
        const simulationParams = reactive({
            coherenceTime: 50,
            gateFidelity: 0.998,
            measurementFidelity: 0.99,
            environmentalNoise: 0.01
        });

        // Console and logs
        const systemLogs = reactive([]);
        const consoleCommand = ref('');

        // Error correction simulation
        const errorCorrection = reactive({
            errorType: 'bit-flip',
            errorRate: 0.1,
            codeType: 'repetition',
            results: null
        });

        // Bloch sphere vector for selected qubit
        const blochVector = computed(() => {
            if (selectedQubit.value === null || !qubits[selectedQubit.value]) {
                return { theta: 0, phi: 0, length: 0 };
            }

            const qubit = qubits[selectedQubit.value];
            return {
                theta: qubit.theta,
                phi: qubit.phi,
                length: 1 // Unit vector on Bloch sphere
            };
        });

        // Decoherence curve for visualization
        const decoherenceCurve = computed(() => {
            // Calculate exponential decay curve
            const points = [];
            const decay = simulationParams.coherenceTime / 100;

            for (let t = 0; t <= 100; t++) {
                const x = t;
                const y = 100 * Math.exp(-t / decay);
                points.push(`${x},${100 - y}`);
            }

            return `M0,100 L${points.join(' L')}`;
        });

        // Initialize system
        function initSystem() {
            // Add initial qubits
            addQubit();
            addQubit();

            // Initialize circuit with empty wires
            circuit.wires = [null, null];

            // Add initial step
            addCircuitStep();

            // Add system initialization log
            addSystemLog('Quantum system initialized', 'success');
            addSystemLog('Coherence level: ' + coherenceLevel.value.toFixed(2) + '%', 'info');

            // Start coherence decay simulation
            startCoherenceSimulation();
        }

        // Activate quantum system
        function activateSystem() {
            if (isSystemActive.value) return;

            isSystemActive.value = true;

            // Add startup logs
            addSystemLog('QUBIT Interface v' + version.value + ' starting...', 'info');

            // Simulate initialization sequence
            setTimeout(() => {
                addSystemLog('Initializing quantum registers...', 'info');
            }, 500);

            setTimeout(() => {
                addSystemLog('Calibrating quantum gates...', 'info');
            }, 1000);

            setTimeout(() => {
                addSystemLog('Establishing coherence...', 'info');
            }, 1500);

            setTimeout(() => {
                addSystemLog('Quantum system online!', 'success');
                initSystem();
            }, 2000);

            // Randomize tagline
            currentTagline.value = taglines[Math.floor(Math.random() * taglines.length)];
        }

        // Toggle system state
        function toggleSystem() {
            if (isSystemActive.value) {
                addSystemLog('QUBIT Interface shutting down...', 'warning');
                setTimeout(() => {
                    isSystemActive.value = false;
                    addSystemLog('System offline', 'info');
                }, 1000);
            } else {
                activateSystem();
            }
        }

        // Quantum Qubit Management
        function addQubit() {
            // Create a new qubit in |0⟩ state
            const newQubit = {
                alpha: 1, // Amplitude of |0⟩
                beta: 0,  // Amplitude of |1⟩
                theta: 0, // Bloch sphere theta
                phi: 0,   // Bloch sphere phi
                coherence: 1.0, // Coherence level
                entangled: false
            };

            qubits.push(newQubit);

            // If this is the first qubit, select it
            if (qubits.length === 1) {
                selectedQubit.value = 0;
            }

            // Log
            addSystemLog(`Qubit ${qubits.length - 1} initialized to |0⟩ state`, 'info');

            return qubits.length - 1;
        }

        // Reset a qubit to |0⟩ state
        function resetQubit(index) {
            const qubit = qubits[index];

            // Break any entanglements involving this qubit
            const entanglementsToBreak = [];
            entanglements.forEach((pair, i) => {
                if (pair.includes(index)) {
                    entanglementsToBreak.push(i);
                }
            });

            // Remove entanglements in reverse order to avoid index shifting
            for (let i = entanglementsToBreak.length - 1; i >= 0; i--) {
                breakEntanglement(entanglementsToBreak[i]);
            }

            // Reset state
            qubit.alpha = 1;
            qubit.beta = 0;
            qubit.theta = 0;
            qubit.phi = 0;
            qubit.coherence = 1.0;
            qubit.entangled = false;

            // Log
            addSystemLog(`Qubit ${index} reset to |0⟩ state`, 'info');
        }

        // Clear all qubits
        function clearQubits() {
            // Clear entanglements
            entanglements.splice(0, entanglements.length);

            // Clear qubits
            qubits.splice(0, qubits.length);

            // Add initial qubits back
            addQubit();
            addQubit();

            // Select first qubit
            selectedQubit.value = 0;

            // Log
            addSystemLog('All qubits reset', 'warning');
        }

        // Format quantum state for display
        function formatQuantumState(alpha, beta) {
            // Format complex numbers with proper notation
            const formatComplex = (num) => {
                if (Math.abs(num) < 0.0001) return '0';
                return num.toFixed(2);
            };

            // Round to 2 decimal places for display
            const a = formatComplex(alpha);
            const b = formatComplex(beta);

            if (b === '0') {
                return `${a}|0⟩`;
            } else if (a === '0') {
                return `${b}|1⟩`;
            } else {
                return `${a}|0⟩ + ${b}|1⟩`;
            }
        }

        // Apply a quantum gate to a qubit
        function applyGate(gate) {
            if (selectedQubit.value === null) {
                addSystemLog('No qubit selected', 'error');
                return;
            }

            const qubit = qubits[selectedQubit.value];

            // Apply the gate based on its type
            switch (gate.name) {
                case 'X': // Bit flip
                    // |0⟩ -> |1⟩, |1⟩ -> |0⟩
                    [qubit.alpha, qubit.beta] = [qubit.beta, qubit.alpha];
                    qubit.theta = Math.PI - qubit.theta;
                    qubit.phi = (qubit.phi + Math.PI) % (2 * Math.PI);
                    break;

                case 'Y': // Y rotation
                    // |0⟩ -> i|1⟩, |1⟩ -> -i|0⟩
                    [qubit.alpha, qubit.beta] = [qubit.beta, -qubit.alpha];
                    qubit.theta = Math.PI - qubit.theta;
                    qubit.phi = (qubit.phi + Math.PI / 2) % (2 * Math.PI);
                    break;

                case 'Z': // Phase flip
                    // |0⟩ -> |0⟩, |1⟩ -> -|1⟩
                    qubit.beta = -qubit.beta;
                    qubit.phi = (qubit.phi + Math.PI) % (2 * Math.PI);
                    break;

                case 'H': // Hadamard
                    // |0⟩ -> (|0⟩ + |1⟩)/√2, |1⟩ -> (|0⟩ - |1⟩)/√2
                    const alpha = qubit.alpha;
                    const beta = qubit.beta;
                    qubit.alpha = (alpha + beta) / Math.sqrt(2);
                    qubit.beta = (alpha - beta) / Math.sqrt(2);

                    // Update Bloch sphere coordinates
                    qubit.theta = Math.PI / 2;
                    qubit.phi = 0;
                    break;

                case 'S': // Phase gate
                    // |0⟩ -> |0⟩, |1⟩ -> i|1⟩
                    qubit.beta = qubit.beta * Math.complex(0, 1);
                    qubit.phi = (qubit.phi + Math.PI / 2) % (2 * Math.PI);
                    break;

                case 'T': // π/8 gate
                    // |0⟩ -> |0⟩, |1⟩ -> e^(iπ/4)|1⟩
                    qubit.beta = qubit.beta * Math.complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4));
                    qubit.phi = (qubit.phi + Math.PI / 4) % (2 * Math.PI);
                    break;
            }

            // For controlled gates, we need to handle specially
            if (gate.controlled) {
                // Show controlled gate selector
                gateSelector.controlMode = true;
                gateSelector.selectedGate = gate;
                gateSelector.show = true;
            }

            // Log
            addSystemLog(`Applied ${gate.name} gate to Qubit ${selectedQubit.value}`, 'info');
        }

        // Create entanglement between qubits
        function entangleQubits() {
            if (entanglementA.value === entanglementB.value) {
                addSystemLog('Cannot entangle a qubit with itself', 'error');
                return;
            }

            // Check if qubits are already entangled
            for (const pair of entanglements) {
                if ((pair[0] === entanglementA.value && pair[1] === entanglementB.value) ||
                    (pair[0] === entanglementB.value && pair[1] === entanglementA.value)) {
                    addSystemLog('Qubits are already entangled', 'warning');
                    return;
                }
            }

            // Create entanglement
            entanglements.push([entanglementA.value, entanglementB.value]);

            // Mark qubits as entangled
            qubits[entanglementA.value].entangled = true;
            qubits[entanglementB.value].entangled = true;

            // Apply a Bell state to these qubits (|00⟩ + |11⟩)/√2
            // This is simplified for visualization purposes
            qubits[entanglementA.value].alpha = 1 / Math.sqrt(2);
            qubits[entanglementA.value].beta = 1 / Math.sqrt(2);
            qubits[entanglementB.value].alpha = 1 / Math.sqrt(2);
            qubits[entanglementB.value].beta = 1 / Math.sqrt(2);

            // Set Bloch sphere coordinates
            qubits[entanglementA.value].theta = Math.PI / 2;
            qubits[entanglementA.value].phi = 0;
            qubits[entanglementB.value].theta = Math.PI / 2;
            qubits[entanglementB.value].phi = 0;

            // Log
            addSystemLog(`Entangled Qubit ${entanglementA.value} with Qubit ${entanglementB.value}`, 'success');
        }

        // Break entanglement between qubits
        function breakEntanglement(index) {
            const pair = entanglements[index];

            // Reset the qubits to |0⟩ state
            resetQubit(pair[0]);
            resetQubit(pair[1]);

            // Remove the entanglement
            entanglements.splice(index, 1);

            // Log
            addSystemLog(`Entanglement between Qubit ${pair[0]} and Qubit ${pair[1]} broken`, 'warning');
        }

        // Circuit Designer Functions
        function addCircuitWire() {
            circuit.wires.push(null);

            // Add null gate to each step for the new wire
            circuit.steps.forEach(step => {
                step.gates.push(null);
            });

            // Log
            addSystemLog('Added new wire to circuit', 'info');
        }

        function addCircuitStep() {
            // Create empty gates for all wires
            const gates = Array(circuit.wires.length).fill(null);

            circuit.steps.push({ gates });

            // Log
            addSystemLog('Added new step to circuit', 'info');
        }

        function clearCircuit() {
            // Reset circuit to initial state
            circuit.wires = [null, null];
            circuit.steps = [{
                gates: Array(2).fill(null)
            }];

            // Clear results
            circuitResults.splice(0, circuitResults.length);

            // Log
            addSystemLog('Circuit cleared', 'warning');
        }

        function showGateSelector(wireIndex, stepIndex) {
            gateSelector.show = true;
            gateSelector.wireIndex = wireIndex;
            gateSelector.stepIndex = stepIndex;
            gateSelector.controlMode = false;
        }

        function closeGateSelector() {
            gateSelector.show = false;
            gateSelector.controlMode = false;
            gateSelector.selectedGate = null;
        }

        function addGateToCircuit(gate) {
            // If it's a controlled gate, show control selector
            if (gate.controlled) {
                gateSelector.controlMode = true;
                gateSelector.selectedGate = gate;
                return;
            }

            // Add single gate
            circuit.steps[gateSelector.stepIndex].gates[gateSelector.wireIndex] = {
                name: gate.name
            };

            // Close selector
            closeGateSelector();
        }

        function addControlledGateToCircuit() {
            // Add control qubit
            circuit.steps[gateSelector.stepIndex].gates[gateSelector.controlQubit] = {
                control: true
            };

            // Add target qubit
            circuit.steps[gateSelector.stepIndex].gates[gateSelector.targetQubit] = {
                target: true,
                name: gateSelector.selectedGate.name
            };

            // Close selector
            closeGateSelector();
        }

        function runCircuit() {
            // Check if circuit is empty
            if (circuit.steps.length === 0 || circuit.wires.length === 0) {
                addSystemLog('Cannot run empty circuit', 'error');
                return;
            }

            // Simulate circuit execution
            addSystemLog('Running quantum circuit...', 'info');

            // Clear previous results
            circuitResults.splice(0, circuitResults.length);

            // Simulate results (simplified for this demo)
            setTimeout(() => {
                // Generate sample results based on circuit complexity
                const numSteps = circuit.steps.length;
                const numWires = circuit.wires.length;
                const complexity = numSteps * numWires;

                // Generate some sample states and probabilities
                const numStates = Math.min(2 ** numWires, 8); // Cap at 8 states for display

                for (let i = 0; i < numStates; i++) {
                    // Generate binary representation of state
                    const state = i.toString(2).padStart(numWires, '0');

                    // Calculate probability based on complexity
                    let probability = Math.random();
                    if (i === 0) {
                        // Make the first state more likely
                        probability = 0.3 + 0.4 * Math.random();
                    } else {
                        probability = (1 - 0.4) * Math.random() / (numStates - 1);
                    }

                    // Add to results
                    circuitResults.push({ state: `|${state}⟩`, probability });
                }

                // Normalize probabilities to sum to 1
                const totalProb = circuitResults.reduce((sum, result) => sum + result.probability, 0);
                circuitResults.forEach(result => {
                    result.probability /= totalProb;
                });

                // Sort by probability
                circuitResults.sort((a, b) => b.probability - a.probability);

                addSystemLog('Circuit execution complete', 'success');
            }, 1000);
        }

        function saveCurrentCircuit() {
            if (!circuitName.value) {
                addSystemLog('Please provide a name for the circuit', 'warning');
                return;
            }

            // Generate a deep copy of the circuit
            const circuitCopy = JSON.parse(JSON.stringify(circuit));

            // Create new preset
            const newPreset = {
                name: circuitName.value,
                description: 'User created circuit',
                wires: circuitCopy.wires,
                steps: circuitCopy.steps
            };

            // Check if a preset with this name already exists
            const existingIndex = circuitPresets.findIndex(p => p.name === circuitName.value);
            if (existingIndex !== -1) {
                // Replace existing preset
                circuitPresets[existingIndex] = newPreset;
                addSystemLog(`Updated circuit "${circuitName.value}"`, 'success');
            } else {
                // Add new preset
                circuitPresets.push(newPreset);
                addSystemLog(`Saved circuit "${circuitName.value}"`, 'success');
            }

            // Clear name field
            circuitName.value = '';
        }

        function loadCircuitPreset(preset) {
            // Create deep copy of preset
            const presetCopy = JSON.parse(JSON.stringify(preset));

            // Load into circuit
            circuit.wires = presetCopy.wires;
            circuit.steps = presetCopy.steps;

            // Log
            addSystemLog(`Loaded circuit "${preset.name}"`, 'info');
        }

        // Algorithm functions
        function selectAlgorithm(algo) {
            selectedAlgorithm.value = algo;
            addSystemLog(`Selected algorithm: ${algo.name}`, 'info');
        }

        function loadAlgorithmCircuit() {
            if (!selectedAlgorithm.value) return;

            // Clear current circuit
            clearCircuit();

            // Create appropriate circuit based on algorithm
            switch (selectedAlgorithm.value.id) {
                case 'grover':
                    // Setup Grover's circuit (simplified)
                    circuit.wires = [null, null, null]; // 3 qubits

                    // Initialize with Hadamard gates
                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            { name: 'H' },
                            { name: 'H' }
                        ]
                    });

                    // Oracle
                    circuit.steps.push({
                        gates: [
                            { control: true },
                            { control: true },
                            { target: true, name: 'Z' }
                        ]
                    });

                    // Diffusion operator (simplified)
                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            { name: 'H' },
                            { name: 'H' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { name: 'X' },
                            { name: 'X' },
                            { name: 'X' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { control: true },
                            { control: true },
                            { target: true, name: 'Z' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { name: 'X' },
                            { name: 'X' },
                            { name: 'X' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            { name: 'H' },
                            { name: 'H' }
                        ]
                    });
                    break;

                case 'qft':
                    // Setup QFT circuit
                    circuit.wires = [null, null, null]; // 3 qubits

                    // QFT implementation
                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            null,
                            null
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { control: true },
                            { target: true, name: 'S' },
                            null
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { control: true },
                            null,
                            { target: true, name: 'T' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            null,
                            { name: 'H' },
                            null
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            null,
                            { control: true },
                            { target: true, name: 'S' }
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            null,
                            null,
                            { name: 'H' }
                        ]
                    });
                    break;

                case 'teleport':
                    // Load the teleportation circuit
                    loadCircuitPreset(circuitPresets.find(p => p.name === 'Quantum Teleportation'));
                    break;

                case 'shor':
                    // Shor's is too complex for a simple demo, create a placeholder
                    circuit.wires = [null, null, null, null, null, null, null]; // 7 qubits

                    // Add initialization steps
                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            { name: 'H' },
                            { name: 'H' },
                            null,
                            null,
                            null,
                            null
                        ]
                    });

                    // Add modular exponentiation (placeholder)
                    circuit.steps.push({
                        gates: [
                            { control: true },
                            null,
                            null,
                            { target: true },
                            null,
                            null,
                            null
                        ]
                    });

                    // Add more complex steps (simplified)
                    circuit.steps.push({
                        gates: [
                            null,
                            { control: true },
                            null,
                            null,
                            { target: true },
                            null,
                            null
                        ]
                    });

                    // QFT
                    circuit.steps.push({
                        gates: [
                            { name: 'H' },
                            { name: 'H' },
                            { name: 'H' },
                            null,
                            null,
                            null,
                            null
                        ]
                    });

                    circuit.steps.push({
                        gates: [
                            { control: true },
                            { target: true, name: 'S' },
                            null,
                            null,
                            null,
                            null,
                            null
                        ]
                    });
                    break;
            }

            addSystemLog(`Loaded circuit for ${selectedAlgorithm.value.name}`, 'success');
        }

        function runAlgorithm() {
            if (!selectedAlgorithm.value) {
                addSystemLog('No algorithm selected', 'error');
                return;
            }

            // Start simulation
            algorithmResults.running = true;
            algorithmResults.data = null;

            addSystemLog(`Running ${selectedAlgorithm.value.name}...`, 'info');

            // Simulate algorithm execution with a delay
            setTimeout(() => {
                // Generate results based on algorithm type
                switch (selectedAlgorithm.value.id) {
                    case 'grover':
                        // Generate search results
                        algorithmResults.type = 'search';
                        algorithmResults.name = selectedAlgorithm.value.name;
                        algorithmResults.input = 'Unsorted database with N=16 items';

                        // Random solution
                        const solution = Math.floor(Math.random() * 16);
                        algorithmResults.solution = solution;
                        algorithmResults.output = `Found item at index ${solution}`;

                        // Stats
                        algorithmResults.qubits = 4;  // log₂(16)
                        algorithmResults.gates = 28;
                        algorithmResults.iterations = Math.floor(Math.sqrt(16));
                        algorithmResults.successRate = 98.5;
                        break;

                    case 'shor':
                        // Generate factoring results
                        algorithmResults.type = 'factoring';
                        algorithmResults.name = selectedAlgorithm.value.name;

                        // Choose a composite number
                        const composites = [15, 21, 35, 39, 51, 57, 65, 77, 91, 119];
                        const number = composites[Math.floor(Math.random() * composites.length)];

                        // Find factors (pre-computed for demo)
                        const factorMap = {
                            15: [3, 5],
                            21: [3, 7],
                            35: [5, 7],
                            39: [3, 13],
                            51: [3, 17],
                            57: [3, 19],
                            65: [5, 13],
                            77: [7, 11],
                            91: [7, 13],
                            119: [7, 17]
                        };

                        algorithmResults.input = number.toString();
                        algorithmResults.factors = factorMap[number];
                        algorithmResults.output = `Factors: ${factorMap[number].join(' × ')}`;

                        // Stats
                        algorithmResults.qubits = 7;
                        algorithmResults.gates = 42;
                        algorithmResults.iterations = 1;
                        algorithmResults.successRate = 99.2;
                        break;

                    case 'qft':
                        // Generate QFT results
                        algorithmResults.type = 'superposition';
                        algorithmResults.name = selectedAlgorithm.value.name;
                        algorithmResults.input = '|000⟩';
                        algorithmResults.output = 'Transformed state in superposition';

                        // Generate amplitudes for all states
                        const amplitudes = [];
                        for (let i = 0; i < 16; i++) {
                            let amp = 0.25;
                            if (i < 8) {
                                amp += 0.05 * (8 - i); // Higher amplitude for lower states
                            }
                            amplitudes.push(amp);
                        }

                        // Normalize
                        const total = amplitudes.reduce((sum, a) => sum + a, 0);
                        algorithmResults.amplitudes = amplitudes.map(a => a / total);

                        // Stats
                        algorithmResults.qubits = 3;
                        algorithmResults.gates = 15;
                        algorithmResults.iterations = 1;
                        algorithmResults.successRate = 100;
                        break;

                    case 'teleport':
                        // Generate teleportation results
                        algorithmResults.type = 'teleport';
                        algorithmResults.name = selectedAlgorithm.value.name;
                        algorithmResults.input = 'Qubit |ψ⟩ = α|0⟩ + β|1⟩';
                        algorithmResults.output = 'State successfully teleported';

                        // Stats
                        algorithmResults.qubits = 3;
                        algorithmResults.gates = 12;
                        algorithmResults.iterations = 1;
                        algorithmResults.successRate = 100;
                        break;
                }

                // Complete simulation
                algorithmResults.running = false;
                algorithmResults.data = true;

                addSystemLog(`${selectedAlgorithm.value.name} completed successfully`, 'success');
            }, 3000);
        }

        // System logs
        function addSystemLog(message, type = 'info') {
            const now = new Date();
            const timestamp = [
                now.getHours().toString().padStart(2, '0'),
                now.getMinutes().toString().padStart(2, '0'),
                now.getSeconds().toString().padStart(2, '0')
            ].join(':');

            systemLogs.unshift({ message, type, timestamp });

            // Cap logs at 50 entries
            if (systemLogs.length > 50) {
                systemLogs.pop();
            }
        }

        function clearLogs() {
            systemLogs.splice(0, systemLogs.length);
            addSystemLog('System logs cleared', 'info');
        }

        // Console commands
        function executeCommand() {
            const cmd = consoleCommand.value.trim().toLowerCase();

            if (!cmd) return;

            // Log the command
            addSystemLog(`$ ${cmd}`, 'info');

            // Process command
            if (cmd === 'help') {
                addSystemLog('Available commands:', 'info');
                addSystemLog('  help - Show this help message', 'info');
                addSystemLog('  status - Show system status', 'info');
                addSystemLog('  reset - Reset quantum system', 'info');
                addSystemLog('  run - Run current circuit', 'info');
                addSystemLog('  clear - Clear the console', 'info');
                addSystemLog('  noise [value] - Set environmental noise (0-0.1)', 'info');
                addSystemLog('  coherence [value] - Set coherence time (1-100)', 'info');
            } else if (cmd === 'status') {
                addSystemLog(`System: ${isSystemActive.value ? 'ONLINE' : 'OFFLINE'}`, 'info');
                addSystemLog(`Qubits: ${qubits.length}`, 'info');
                addSystemLog(`Coherence: ${coherenceLevel.value.toFixed(2)}%`, 'info');
                addSystemLog(`Gate Fidelity: ${(simulationParams.gateFidelity * 100).toFixed(2)}%`, 'info');
                addSystemLog(`Environmental Noise: ${(simulationParams.environmentalNoise * 100).toFixed(2)}%`, 'info');
            } else if (cmd === 'reset') {
                // Reset the system
                clearQubits();
                clearCircuit();
                clearLogs();
                addSystemLog('Quantum system reset complete', 'success');
            } else if (cmd === 'run') {
                // Run the current circuit
                runCircuit();
            } else if (cmd === 'clear') {
                // Clear logs
                clearLogs();
            } else if (cmd.startsWith('noise ')) {
                // Set noise level
                const value = parseFloat(cmd.split(' ')[1]);
                if (!isNaN(value) && value >= 0 && value <= 0.1) {
                    simulationParams.environmentalNoise = value;
                    addSystemLog(`Environmental noise set to ${(value * 100).toFixed(2)}%`, 'success');
                } else {
                    addSystemLog('Invalid noise value. Range: 0-0.1', 'error');
                }
            } else if (cmd.startsWith('coherence ')) {
                // Set coherence time
                const value = parseInt(cmd.split(' ')[1]);
                if (!isNaN(value) && value >= 1 && value <= 100) {
                    simulationParams.coherenceTime = value;
                    addSystemLog(`Coherence time set to ${value} μs`, 'success');
                } else {
                    addSystemLog('Invalid coherence value. Range: 1-100', 'error');
                }
            } else {
                // Unknown command
                addSystemLog(`Unknown command: ${cmd}`, 'error');
                addSystemLog('Type "help" for available commands', 'info');
            }

            // Clear command input
            consoleCommand.value = '';
        }

        // Apply simulation parameters
        function applySimulationParams() {
            addSystemLog('Applying quantum simulation parameters...', 'info');

            // Effect on coherence level
            const newCoherence = 100 - (simulationParams.environmentalNoise * 300) +
                (simulationParams.coherenceTime / 2) * (simulationParams.gateFidelity * 10);

            // Clamp to 0-100
            coherenceLevel.value = Math.max(0, Math.min(100, newCoherence));

            addSystemLog(`Parameters applied. Coherence: ${coherenceLevel.value.toFixed(2)}%`, 'success');
        }

        // Run error correction simulation
        function runErrorCorrectionSim() {
            addSystemLog(`Running error correction simulation with ${errorCorrection.codeType} code...`, 'info');

            // Simulate processing
            setTimeout(() => {
                // Generate results based on error correction parameters
                const results = {
                    detectionRate: 0,
                    correctionRate: 0,
                    codewords: [],
                    errorPatterns: []
                };

                // Calculate detection and correction rates based on code and error types
                switch (errorCorrection.codeType) {
                    case 'none':
                        results.detectionRate = 0;
                        results.correctionRate = 0;
                        break;

                    case 'repetition':
                        if (errorCorrection.errorType === 'bit-flip') {
                            results.detectionRate = 0.95 - errorCorrection.errorRate * 0.5;
                            results.correctionRate = 0.9 - errorCorrection.errorRate;
                        } else {
                            // Repetition code can't correct phase errors
                            results.detectionRate = 0.1;
                            results.correctionRate = 0;
                        }
                        break;

                    case 'shor':
                        results.detectionRate = 0.98 - errorCorrection.errorRate * 0.3;
                        results.correctionRate = 0.95 - errorCorrection.errorRate * 0.7;
                        break;

                    case 'steane':
                        if (errorCorrection.errorType === 'phase-flip' || errorCorrection.errorType === 'random') {
                            results.detectionRate = 0.97 - errorCorrection.errorRate * 0.4;
                            results.correctionRate = 0.92 - errorCorrection.errorRate * 0.6;
                        } else {
                            results.detectionRate = 0.96 - errorCorrection.errorRate * 0.4;
                            results.correctionRate = 0.93 - errorCorrection.errorRate * 0.5;
                        }
                        break;
                }

                // Ensure values stay in valid range
                results.detectionRate = Math.max(0, Math.min(1, results.detectionRate));
                results.correctionRate = Math.max(0, Math.min(results.detectionRate, results.correctionRate));

                // Generate codewords based on the code type
                switch (errorCorrection.codeType) {
                    case 'none':
                        results.codewords = [
                            { logical: '0', physical: '0' },
                            { logical: '1', physical: '1' },
                            { logical: '+', physical: '+' }
                        ];
                        break;

                    case 'repetition':
                        results.codewords = [
                            { logical: '0', physical: '000' },
                            { logical: '1', physical: '111' },
                            { logical: '+', physical: '(|000⟩+|111⟩)/√2' }
                        ];
                        break;

                    case 'steane':
                        results.codewords = [
                            { logical: '0', physical: '|0000000⟩+|1010101⟩+...' },
                            { logical: '1', physical: '|1111111⟩+|0101010⟩+...' },
                            { logical: '+', physical: 'Superposition of 16 states' }
                        ];
                        break;

                    case 'shor':
                        results.codewords = [
                            { logical: '0', physical: '(|000⟩+|111⟩)⊗³/2√2' },
                            { logical: '1', physical: '(|000⟩-|111⟩)⊗³/2√2' },
                            { logical: '+', physical: 'Complex superposition' }
                        ];
                        break;
                }

                // Generate error patterns
                results.errorPatterns = [
                    { name: 'No Error', rate: 1 - errorCorrection.errorRate },
                    { name: 'Bit Flip (X)', rate: errorCorrection.errorType === 'bit-flip' ? errorCorrection.errorRate : errorCorrection.errorRate * 0.3 },
                    { name: 'Phase Flip (Z)', rate: errorCorrection.errorType === 'phase-flip' ? errorCorrection.errorRate : errorCorrection.errorRate * 0.3 },
                    { name: 'Both (Y)', rate: errorCorrection.errorType === 'random' ? errorCorrection.errorRate * 0.4 : errorCorrection.errorRate * 0.1 }
                ];

                // Normalize error pattern rates
                const totalRate = results.errorPatterns.reduce((sum, pattern) => sum + pattern.rate, 0);
                results.errorPatterns.forEach(pattern => {
                    pattern.rate /= totalRate;
                });

                // Store results
                errorCorrection.results = results;

                addSystemLog('Error correction simulation complete', 'success');
            }, 1500);
        }

        // Coherence simulation
        let coherenceSimulationInterval = null;

        function startCoherenceSimulation() {
            if (coherenceSimulationInterval) {
                clearInterval(coherenceSimulationInterval);
            }

            // Simulate quantum coherence decay over time
            coherenceSimulationInterval = setInterval(() => {
                // Only run if system is active
                if (!isSystemActive.value) return;

                // Calculate decay based on parameters
                const decayRate = 0.01 * simulationParams.environmentalNoise;
                const recoveryRate = 0.005 * (simulationParams.coherenceTime / 50);

                // Random fluctuation
                const fluctuation = (Math.random() * 0.2 - 0.1) * simulationParams.environmentalNoise;

                // Apply decay and recovery
                coherenceLevel.value = Math.max(70, Math.min(99.99,
                    coherenceLevel.value - decayRate + recoveryRate + fluctuation
                ));

                // Apply decoherence to qubits
                qubits.forEach(qubit => {
                    if (qubit.coherence > 0.5) {
                        qubit.coherence -= 0.0001 * simulationParams.environmentalNoise;
                        qubit.coherence = Math.max(0.5, qubit.coherence);
                    }
                });
            }, 100);
        }

        // Clean up when component is destroyed
        onBeforeUnmount(() => {
            if (coherenceSimulationInterval) {
                clearInterval(coherenceSimulationInterval);
            }
        });

        // Initialize on mount
        onMounted(() => {
            // Add initial system logs
            addSystemLog('QUBIT Quantum Interface v' + version.value, 'info');
            addSystemLog('System ready. Initialize when ready.', 'info');

            // Create scanline effect
            createScanlineEffect();

            // Create noise overlay
            createNoiseOverlay();

            // Initialize Matrix Rain effect
            initMatrixRain();

            // Add keyboard shortcuts
            document.addEventListener('keydown', handleKeyDown);
        });

        function handleKeyDown(e) {
            // Only handle if system is active
            if (!isSystemActive.value) return;

            // Ctrl+Enter to run circuit
            if (e.ctrlKey && e.key === 'Enter') {
                if (activeModule.value === 'circuits') {
                    runCircuit();
                } else if (activeModule.value === 'algorithms' && selectedAlgorithm.value) {
                    runAlgorithm();
                }
            }

            // Escape to close gate selector
            if (e.key === 'Escape' && gateSelector.show) {
                closeGateSelector();
            }
        }

        function createScanlineEffect() {
            const scanline = document.createElement('div');
            scanline.classList.add('scanline');
            document.body.appendChild(scanline);
        }

        function createNoiseOverlay() {
            const noise = document.createElement('div');
            noise.classList.add('noise-overlay');
            document.body.appendChild(noise);
        }

        function initMatrixRain() {
            // This would be implemented to create the Matrix-style digital rain effect
            // Not fully implemented in this demo for simplicity
        }

        // Return everything needed by the template
        return {
            // State
            isSystemActive,
            activeModule,
            coherenceLevel,
            version,
            currentTagline,
            qubits,
            selectedQubit,
            entanglements,
            entanglementA,
            entanglementB,
            quantumGates,
            circuit,
            circuitResults,
            circuitName,
            circuitPresets,
            gateSelector,
            algorithms,
            selectedAlgorithm,
            algorithmResults,
            simulationParams,
            systemLogs,
            consoleCommand,
            errorCorrection,

            // Computed
            blochVector,
            decoherenceCurve,

            // Methods
            toggleSystem,
            activateSystem,
            addQubit,
            resetQubit,
            clearQubits,
            formatQuantumState,
            applyGate,
            entangleQubits,
            breakEntanglement,
            addCircuitWire,
            addCircuitStep,
            clearCircuit,
            showGateSelector,
            closeGateSelector,
            addGateToCircuit,
            addControlledGateToCircuit,
            runCircuit,
            saveCurrentCircuit,
            loadCircuitPreset,
            selectAlgorithm,
            loadAlgorithmCircuit,
            runAlgorithm,
            executeCommand,
            clearLogs,
            applySimulationParams,
            runErrorCorrectionSim
        };
    }
}).mount('#app');

/**
 * Complex number helper for quantum calculations
 * Not a full implementation, just what we need for this demo
 */
Math.complex = function (real, imag) {
    return { real, imag };
};

// Add some extra flair - quantum particles that follow the mouse
document.addEventListener('DOMContentLoaded', () => {
    // Only run this if we have a modern browser
    if (!window.requestAnimationFrame) return;

    const particlesContainer = document.createElement('div');
    particlesContainer.style.position = 'fixed';
    particlesContainer.style.inset = '0';
    particlesContainer.style.pointerEvents = 'none';
    particlesContainer.style.zIndex = '9000';
    document.body.appendChild(particlesContainer);

    const particles = [];
    const maxParticles = 15;

    let mouseX = 0;
    let mouseY = 0;
    let mouseSpeed = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Calculate mouse speed
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);

        lastMouseX = mouseX;
        lastMouseY = mouseY;

        // Create particles based on mouse speed
        if (mouseSpeed > 5) {
            createParticle();
        }
    });

    function createParticle() {
        // Only create if we're under the limit
        if (particles.length >= maxParticles) return;

        // Create particle element
        const particle = document.createElement('div');
        particle.classList.add('quantum-particle');

        // Random size
        const size = 2 + Math.random() * 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random offset from mouse
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;

        // Position
        particle.style.left = `${mouseX + offsetX}px`;
        particle.style.top = `${mouseY + offsetY}px`;

        // Random velocity
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() - 0.5) * 2 - 1; // Bias upward

        // Random color (quantum-themed)
        const colors = ['#36F9F6', '#BD93F9', '#FF79C6', '#50FA7B'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;

        // Add to DOM
        particlesContainer.appendChild(particle);

        // Store particle data
        particles.push({
            element: particle,
            x: mouseX + offsetX,
            y: mouseY + offsetY,
            vx,
            vy,
            size,
            life: 100,
            color
        });
    }

    function updateParticles() {
        // Update each particle
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity
            p.vy += 0.02;

            // Apply friction
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Decrease life
            p.life -= 1;

            // Update DOM element
            p.element.style.left = `${p.x}px`;
            p.element.style.top = `${p.y}px`;

            // Fade out based on life
            p.element.style.opacity = Math.min(1, p.life / 50);

            // Remove dead particles
            if (p.life <= 0) {
                particlesContainer.removeChild(p.element);
                particles.splice(i, 1);
            }
        }

        // Continue animation loop
        requestAnimationFrame(updateParticles);
    }

    // Start animation loop
    updateParticles();

    // Quantum Easter Egg - Konami Code
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        // Check if key matches the next key in the Konami Code
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;

            // If the full code is entered
            if (konamiIndex === konamiCode.length) {
                activateQuantumEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateQuantumEasterEgg() {
        // Create a quantum explosion effect
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const explosion = document.createElement('div');
                explosion.classList.add('quantum-particle');

                // Size
                const size = 2 + Math.random() * 8;
                explosion.style.width = `${size}px`;
                explosion.style.height = `${size}px`;

                // Position (center of screen)
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;

                // Random angle and distance
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                explosion.style.left = `${x}px`;
                explosion.style.top = `${y}px`;

                // Random color (quantum-themed)
                const colors = ['#36F9F6', '#BD93F9', '#FF79C6', '#50FA7B', '#FFB86C'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                explosion.style.backgroundColor = color;

                // Add to DOM
                particlesContainer.appendChild(explosion);

                // Animate outward
                const vx = (Math.random() - 0.5) * 10;
                const vy = (Math.random() - 0.5) * 10;
                let px = x;
                let py = y;
                let life = 100;

                function animateParticle() {
                    // Update position
                    px += vx;
                    py += vy;

                    // Apply gravity
                    vy += 0.05;

                    // Decrease life
                    life -= 1;

                    // Update DOM element
                    explosion.style.left = `${px}px`;
                    explosion.style.top = `${py}px`;

                    // Fade out
                    explosion.style.opacity = life / 100;

                    // Continue or end animation
                    if (life > 0) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        particlesContainer.removeChild(explosion);
                    }
                }

                animateParticle();
            }, Math.random() * 500);
        }

        // Display easter egg message
        const message = document.createElement('div');
        message.textContent = "QUANTUM SUPERPOSITION ACTIVATED";
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#36F9F6';
        message.style.fontFamily = "'Space Mono', monospace";
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '0 0 10px rgba(54, 249, 246, 0.8)';
        message.style.zIndex = '10000';
        document.body.appendChild(message);

        // Apply quantum effect to body
        document.body.classList.add('quantum-easter-egg');

        // Play quantum sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const masterGain = audioContext.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioContext.destination);

        // Create oscillators for a cool quantum sound
        for (let i = 0; i < 5; i++) {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][i % 4];
            oscillator.frequency.value = 220 * (1 + i * 0.5);

            gain.gain.value = 0;

            oscillator.connect(gain);
            gain.connect(masterGain);

            oscillator.start();

            // Fade in
            gain.gain.linearRampToValueAtTime(0.2 / (i + 1), audioContext.currentTime + 0.1);

            // Frequency sweep
            oscillator.frequency.linearRampToValueAtTime(
                oscillator.frequency.value * 2,
                audioContext.currentTime + 1
            );

            // Fade out
            gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);

            // Stop
            oscillator.stop(audioContext.currentTime + 2);
        }

        // Remove message and effect after a while
        setTimeout(() => {
            document.body.removeChild(message);
            document.body.classList.remove('quantum-easter-egg');
        }, 3000);
    }
});

// Add a subtle quantum breathing effect to quantum elements
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const quantumElements = document.querySelectorAll('.quantum-gate, .bloch-sphere, .qubit-register .qubit');
        quantumElements.forEach(element => {
            element.classList.add('animate-quantum-breathing');
        });
    }, 1000);
});