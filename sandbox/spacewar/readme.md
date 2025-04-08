# SPACEWAR! SPECIFICATION

## Platform-Agnostic Implementation Guide

### HISTORICAL CONTEXT

- **Original Development**: 1962 at MIT by Steve Russell, Martin Graetz, and Wayne Wiitanen
- **Original Platform**: DEC PDP-1 with Type 30 CRT display
- **Cultural Significance**: First widely-distributed digital video game, precursor to arcade gaming industry
- **Distribution Model**: Open-source avant la lettre; freely shared through academic institutions

### GAME CONCEPT & OBJECTIVES

- **Genre**: Two-player space combat simulation
- **Setting**: Deep space with central gravitational body
- **Objective**: Destroy opponent's spaceship while navigating gravitational forces
- **Victory Condition**: Last spaceship surviving

### PHYSICS SIMULATION REQUIREMENTS

#### Core Physics Components

- **Newtonian Mechanics**: Ships follow F=ma principles in frictionless 2D space
- **Gravity Simulation**: Inverse square law gravitational field from central star
  - Force equation: F = G(m₁m₂)/r²
  - Acceleration calculation: a = GM/r²
- **Conservation of Momentum**: Preserved during all ship movements and collisions
- **Toroidal Space**: Screen edges wrap (objects leaving one edge reappear on opposite side)

#### Advanced Physics (Optional in Original, Required for Complete Implementation)

- **Hyperspace Feature**: Random teleportation with probability of ship destruction
- **Realistic Orbital Mechanics**: Objects maintain elliptical orbits when not thrusting
- **Collision Detection**: Pixel-perfect or hitbox-based for ships, torpedoes, and central star

### DISPLAY SPECIFICATIONS

#### Visual Elements

- **Resolution**: Minimum 512×512 logical resolution for authentic experience
- **Coordinate System**: Origin (0,0) at center of screen, positive y upward, positive x rightward
- **Refresh Rate**: Minimum 30fps required to maintain playability
- **Display Type**: Vector or raster display capable of rendering simple geometric shapes

#### Game Objects

- **Central Star ("Sun")**
  - Represented as central circle with optional gravitational field visualization
  - Optional: Pulsating animation based on game timer
- **Player Ships**
  - "Needle" (Player 1): Thin, elongated triangle shape
  - "Wedge" (Player 2): Wider, wedge-shaped triangle
  - Both ships have distinct silhouettes for easy identification at a glance
- **Torpedoes/Missiles**
  - Simple dot/point representing projectiles
  - Optional: Small trail effect for enhanced visibility
- **Stars (Background)**
  - Optional: Random dot pattern representing distant stars
  - Optional: "Twinkling" effect for atmosphere

### CONTROL SYSTEM

#### Input Requirements

- **Minimum Controls Per Player**:
  - Rotate Clockwise
  - Rotate Counter-clockwise
  - Thrust (Accelerate)
  - Fire Torpedo
  - Hyperspace (Emergency Teleport)
- **Control Options**:
  - Dedicated control boxes with 5 switches (historical accuracy)
  - Keyboard controls
  - Gamepad/joystick support
  - Touch controls for mobile implementations

#### Control Responsiveness

- **Rotation**: Constant angular velocity when rotation input active
- **Thrust**: Constant acceleration when thrust input active
- **Fire Rate**: Limited to prevent torpedo spamming (cooldown period required)
- **Hyperspace**: Emergency evasion with cooldown and risk element

### RESOURCE MANAGEMENT

#### Fuel System

- **Thrust Fuel**: Limited resource that depletes with thrust usage
  - Optional: Visual indicator of remaining fuel
  - Optional: Fuel regeneration over time
- **Torpedo Ammunition**: Limited number of torpedoes (typically 10-31)
  - Visual indication of remaining torpedoes
  - Optional: Reload mechanism after time delay

#### Hyperspace System

- **Usage Limitation**: Increasing risk with each use
- **Cooldown Period**: Minimum time between consecutive hyperspace jumps
- **Risk Factor**: Probability calculation for ship destruction upon hyperspace exit

### GAMEPLAY PARAMETERS

#### Ship Characteristics

- **Rotation Rate**: 360° rotation in approximately 4 seconds (π/2 radians per second)
- **Thrust Power**: Acceleration of approximately 1/100th of screen height per second²
- **Inertia**: Ships continue moving in current direction until counteracted
- **Starting Positions**: Ships begin on opposite sides of the sun in stable orbit

#### Weapon Characteristics

- **Torpedo Speed**: Approximately 2x maximum ship velocity
- **Torpedo Lifespan**: Limited duration before despawning (approximately 4 seconds)
- **Fire Cooldown**: Minimum time between torpedo launches (approximately 0.25 seconds)
- **Damage Model**: Single hit destruction (no health system in original)

#### Central Star Characteristics

- **Gravitational Constant**: Tunable parameter affecting gameplay difficulty
  - Low value: Easier navigation, less orbital strategy
  - High value: More challenging navigation, more orbital strategy required
- **Collision Effect**: Instant destruction of ships upon contact
- **Optional Visual Effects**: Star pulsation, gravitational field visualization

### AUDIO SPECIFICATIONS

#### Sound Effects (Optional in Original)

- **Thrust Sound**: Low rumble or white noise during thrust activation
- **Torpedo Launch**: Short percussive sound
- **Explosion**: Noise burst with brief decay
- **Hyperspace Activation**: Distinctive "teleport" sound
- **Background Ambience**: Optional low humming or cosmic background

#### Audio Implementation

- **Stereo Positioning**: Sound effects positioned according to visual location
- **Volume Scaling**: Effects volume decreases with distance from event
- **Optional**: Doppler effect simulation for moving objects

### SOFTWARE ARCHITECTURE

#### Core Components

- **Game Loop**: Fixed-time or variable-time step, minimum 30 updates per second
- **Physics Engine**: 2D vector-based kinematics system with gravity simulation
- **Rendering System**: Simple vector or sprite-based rendering pipeline
- **Input Handler**: Low-latency input processing system
- **Collision Detection**: Efficient algorithm for detecting object intersections

#### Data Structures

- **Game Object Representation**: Position and velocity vectors, orientation scalar
- **World State**: Collection of all active game objects with relevant properties
- **Player State**: Tracking of resources, score, and status per player

#### Algorithms

- **Gravity Calculation**: N-body simulation (simplified with central mass)
- **Collision Detection**: Spatial partitioning or simple distance-based checks
- **Trajectory Prediction**: Optional visualization of projected paths

### USER INTERFACE

#### Essential Elements

- **Score Display**: Current score for each player
- **Resource Indicators**: Fuel and torpedo counts for each player
- **Ship Status**: Visual indication of hyperspace cooldown, destruction state

#### Optional Elements

- **Player Names/Identifiers**: Text labels for each player
- **Match Timer**: Countdown or elapsed time display
- **Game Settings**: Visual indication of current physics parameters

### GAME MODES & VARIATIONS

#### Core Game Modes

- **Standard Duel**: Classic two-player competitive mode
- **Spacewar 2**: No central star, pure ship vs. ship combat
- **Gravity Well**: Exaggerated gravitational effects for challenging gameplay

#### Optional Extensions

- **Single Player Mode**: AI opponent with adjustable difficulty
- **Tournament Mode**: Multiple rounds with score tracking
- **Time Attack**: Survival-based scoring instead of purely combat-based

### NETWORKING SPECIFICATIONS (For Multiplayer Implementations)

#### Architecture Options

- **Peer-to-Peer**: Direct connection between two players
- **Client-Server**: Central server coordinates game state
- **Split-Screen Local**: No networking required, shared display

#### Synchronization Requirements

- **State Updates**: Minimum 10 updates per second for smooth gameplay
- **Input Latency**: Maximum 100ms input-to-display latency for playability
- **Conflict Resolution**: Authoritative physics calculation to prevent desynchronization

### PLATFORM-SPECIFIC CONSIDERATIONS

#### Desktop Implementation

- **Windowed Mode**: Minimum 800×800 pixel window
- **Input Options**: Keyboard, gamepad, or custom controllers
- **Performance Target**: 60fps on modest hardware

#### Mobile Implementation

- **Touch Controls**: On-screen directional controls and action buttons
- **Screen Orientation**: Landscape orientation strongly recommended
- **Power Optimization**: Reduced physics simulation when app backgrounded

#### Web Implementation

- **Canvas Rendering**: HTML5 Canvas for vector graphics rendering
- **Input Handling**: Keyboard, touch, and gamepad API support
- **Browser Compatibility**: Support for all modern browsers

#### Specialized Hardware

- **Arcade Cabinet**: Optional dedicated control panel design
- **Custom Controllers**: Specifications for authentic switch-based controllers
- **VR Implementation**: Optional stereoscopic rendering and motion controls

### ACCESSIBILITY CONSIDERATIONS

#### Visual Accessibility

- **High Contrast Mode**: Enhanced visibility of game elements
- **Colorblind Options**: Alternative color schemes
- **Screen Reader Support**: Text descriptions of game state

#### Control Accessibility

- **Customizable Controls**: Remappable inputs for all actions
- **Alternative Control Schemes**: Single-hand or adaptive controller support
- **Variable Difficulty**: Adjustable physics parameters for different skill levels

### TECHNICAL IMPLEMENTATION NOTES

#### Essential Algorithms

- **Numerical Integration**: Verlet or RK4 recommended for physics accuracy
- **Efficient Collision Detection**: Spatial hashing or quadtree for larger implementations
- **Random Number Generation**: For hyperspace and star field generation

#### Optimization Approaches

- **Vector Math Optimization**: Precomputed values for common calculations
- **Render Culling**: Only draw objects within viewport boundaries
- **Physics Simplification**: Distance thresholds for gravitational calculations

#### Debugging Features

- **Trajectory Visualization**: Optional display of projected paths
- **State Inspector**: Developer tool for examining object properties
- **Physics Parameter Tuning**: Runtime adjustment of game constants

### HISTORICAL ACCURACY NOTES

#### Authentic Features

- **CRT Simulation**: Optional phosphor persistence effect
- **PDP-1 Limitations**: Authentic physics simplifications
- **Original Control Scheme**: Option for traditional 5-switch control method

#### Preservation Considerations

- **Code Comments**: Educational annotations explaining historical significance
- **Version Control**: Documentation of any deviations from original implementation
- **Historical Context**: Optional in-game information about Spacewar!'s development

---

## APPENDIX A: ORIGINAL PDP-1 TECHNICAL SPECIFICATIONS

- **Memory**: 4K of 18-bit words (expandable to 64K)
- **Clock Speed**: 5 microsecond cycle time (200kHz)
- **Display**: Type 30 CRT, 1024×1024 addressable points
- **Input Devices**: Paper tape reader, typewriter, light pen, toggle switches
- **Size and Power**: Room-sized, substantial power requirements
- **Cost (1960s)**: Approximately $120,000 ($1M+ in 2024 currency)

## APPENDIX B: REFERENCE IMPLEMENTATION PSEUDOCODE

```
// Core game loop pseudocode
function gameLoop():
    while gameRunning:
        processInput()
        updatePhysics()
        detectCollisions()
        renderFrame()
        wait(frameTime)

// Physics update pseudocode
function updatePhysics():
    for each ship:
        // Apply gravity from central star
        distance = calculateDistance(ship, star)
        forceDirection = normalize(star.position - ship.position)
        gravitationalForce = G * star.mass * ship.mass / (distance^2)
        ship.acceleration = forceDirection * gravitationalForce / ship.mass

        // Apply thrust if active
        if ship.thrustActive and ship.fuel > 0:
            thrustDirection = vectorFromAngle(ship.orientation)
            ship.acceleration += thrustDirection * ship.thrustPower
            ship.fuel -= fuelConsumptionRate

        // Update velocity and position
        ship.velocity += ship.acceleration * deltaTime
        ship.position += ship.velocity * deltaTime

        // Handle screen wrapping
        wrapPositionToroidal(ship)

    // Update torpedoes
    for each torpedo:
        torpedo.lifespan -= deltaTime
        if torpedo.lifespan <= 0:
            removeTorpedo(torpedo)

        // Apply gravity to torpedoes
        distance = calculateDistance(torpedo, star)
        forceDirection = normalize(star.position - torpedo.position)
        gravitationalForce = G * star.mass * torpedo.mass / (distance^2)
        torpedo.acceleration = forceDirection * gravitationalForce / torpedo.mass

        torpedo.velocity += torpedo.acceleration * deltaTime
        torpedo.position += torpedo.velocity * deltaTime
        wrapPositionToroidal(torpedo)

// Collision detection pseudocode
function detectCollisions():
    for each ship:
        // Check ship-star collision
        if distance(ship, star) < (ship.radius + star.radius):
            destroyShip(ship)

        // Check ship-torpedo collisions
        for each torpedo:
            if torpedo.owner != ship and distance(ship, torpedo) < (ship.radius + torpedo.radius):
                destroyShip(ship)
                removeTorpedo(torpedo)
```

## APPENDIX C: SUGGESTED PARAMETER VALUES

| Parameter               | Suggested Value | Notes                                |
| ----------------------- | --------------- | ------------------------------------ |
| Gravity Constant (G)    | 100.0           | Adjustable for difficulty            |
| Ship Rotation Rate      | π/2 rad/sec     | Complete rotation in ~4 seconds      |
| Ship Thrust Power       | 0.05 units/s²   | Moderate acceleration                |
| Ship Initial Fuel       | 100 units       | ~20 seconds of continuous thrust     |
| Torpedo Speed           | 2.0 units/s     | Relative to ship's maximum speed     |
| Torpedo Lifespan        | 4.0 seconds     | Prevents permanent torpedo fields    |
| Torpedo Cooldown        | 0.25 seconds    | Limits fire rate to 4 per second     |
| Hyperspace Cooldown     | 5.0 seconds     | Prevents hyperspace abuse            |
| Hyperspace Death Chance | 0.25            | 1 in 4 chance of destruction per use |

---

_© This document is provided as a complete platform-agnostic specification for implementing Spacewar!, the seminal 1962 computer game. It may be freely used, modified, and distributed in the spirit of the original game's open sharing philosophy._
