# STREAM 2 — CHARACTERS, PHYSICS & INTERACTION
## Dreamwell World: Retro-Robot Junkyard Island

> **Prerequisites**: Phase 0 must be complete. All shared types, constants, store slices, and placeholder components must exist and compile.
>
> **File Ownership**: This stream ONLY touches files in:
> - `src/characters/**`
> - `src/physics/**`
> - `src/controls/**`
> - `src/audio/**`
>
> **DO NOT** modify any files in `src/shared/`, `src/world/`, `src/shaders/`, `src/rendering/`, `src/ui/`, `src/systems/`, `src/data/`.
>
> **Communication with other streams**: Use the shared Zustand store (`useGameStore`) and `EventBus` for cross-stream data. Import types from `@shared/types` and constants from `@shared/constants`.
>
> **Estimated build time**: 2–4 hours with Claude Code Agent Teams.
>
> **Agent Teams suggestion**: Within this Stream, you can spawn Agent Teams:
> - Agent A: Robot Builder (characters/robot/) — must run first, other agents depend on robot geometry
> - Agent B: Player entity + controls (characters/player/, controls/)
> - Agent C: NPC system (characters/npc/)
> - Agent D: Audio system (audio/)
>
> Run Agent A first, then B/C/D in parallel.

---

## ROBOT DESIGN DIRECTIVE

The robots in Dreamwell World are NOT sleek modern robots. They are:

**Blocky, analog, retro toaster-bots with character and personality.**

Reference the character images: Sentinel (dark blue), Einstein (gold with wire hair), Treasurer (teal, ornate), Scribe (yellow/orange, small), Postmaster (red, surrounded by screens), Scout (orange, outdoorsy), Oracle (dark, glowing eyes), Diplomat (white/cream), Mernz (purple, teacher).

Key visual traits:
- **Body**: Rectangular box torso. Wider than deep. Visible panel lines, buttons, and dials on the chest. Think "vintage appliance meets robot."
- **Head**: Slightly smaller box (or rounded box) sitting on the body. The front face IS a screen — a dark rectangle with simple glowing eyes and optional mouth. Like a CRT monitor for a face.
- **Eyes**: Two simple glowing dots/ovals on the screen face. Color varies by character. They blink occasionally and change shape with emotion (happy = ^_^, surprised = O_O, etc.)
- **Arms**: Cylindrical tubes with simple box/cube hands. Arms hang at sides, animate with walk/idle.
- **Legs**: Slightly thicker cylinders ending in box feet. Simple walk cycle = alternating leg swing.
- **Accessories**: Some robots have things attached: antennas, wire hair, lab coats (flat planes draped), goggles, backpacks, tool belts, hats.
- **Colors**: Each robot has a distinct body color + chrome/metallic accents. The screen face has a colored glow matching their personality.
- **Scale**: ~1.2 units tall (about waist-high on a realistic human scale, giving them a toy-like quality).

ALL of this is built from THREE.js primitives: `BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `PlaneGeometry`. No external models.

---

## TASK 1: ROBOT BUILDER SYSTEM

### 1.1 Robot Parts (`src/characters/robot/RobotParts.ts`)

A library of functions that create individual robot body parts as Three.js `Group` objects.

**Each function returns a `THREE.Group`** containing the meshes for that part.

```ts
// Function signatures:
createBody(config: RobotConfig): THREE.Group
createHead(config: RobotConfig): THREE.Group
createScreen(config: RobotConfig): THREE.Group   // The face screen on the head
createEyes(config: RobotConfig): THREE.Group      // Emissive eye shapes on screen
createArm(config: RobotConfig, side: 'left' | 'right'): THREE.Group
createLeg(config: RobotConfig, side: 'left' | 'right'): THREE.Group
createAccessory(type: AccessoryType, config: RobotConfig): THREE.Group
```

**Body details**:
- Main torso: `BoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH)` with slightly rounded edges (use `RoundedBoxGeometry` from drei, or manually chamfer edges)
- Chest panel: Slightly inset darker rectangle on the front face (a thinner box placed on the surface)
- Buttons: 2-3 tiny cylinders on the chest panel in accent color
- Dials: 1-2 tiny cylinders with a line indicator
- Side vents: Small horizontal grooves (thin box cutouts or overlaid lines)
- Material: `MeshStandardMaterial` with `metalness: 0.6`, `roughness: 0.4`, color from config

**Head details**:
- Main head: Box slightly smaller than body
- The FRONT FACE of the head is the screen: a recessed plane with emissive material
- Screen bezel: A darker border frame around the screen (thin box frame)
- Optional antenna mount point on top (small cylinder base)
- Material: Same as body but slightly different roughness

**Screen / Face**:
- Background: Dark emissive plane (#111 base with screen color glow at low intensity)
- Eyes: Two small circles (or rounded rectangles) that glow brightly
  - Create as small `PlaneGeometry` with emissive material
  - Default expression: two dots, slightly oval
  - Eye positions configurable (spacing, offsetY from center)
- Mouth (optional): Small horizontal line or curve below eyes
- The screen should have a subtle scanline effect: very faint horizontal lines across it (a semi-transparent striped plane overlaid)

**Arms**:
- Upper arm: `CylinderGeometry(ARM_RADIUS, ARM_RADIUS, ARM_LENGTH * 0.5)`
- Forearm: Same, connected via small sphere joint
- Hand: Small `BoxGeometry(0.08, 0.06, 0.06)` 
- Arms positioned at body sides, hanging down in default pose
- Chrome/accent color on joints

**Legs**:
- Upper leg: `CylinderGeometry(LEG_RADIUS, LEG_RADIUS, LEG_LENGTH * 0.5)`
- Lower leg: Same
- Foot: `BoxGeometry(0.1, 0.04, 0.12)` — flat rectangular feet
- Legs positioned under body
- Chrome on joints

**Accessories** (each is its own function):
- `antenna_single`: Thin cylinder + small sphere on top, mounted on head
- `antenna_double`: Two thin cylinders in V-shape
- `antenna_dish`: Small cone/dish shape on head
- `wire_hair`: Multiple thin, randomly curved cylinders coming off the top of the head (Einstein's signature). Use randomized height and slight curl.
- `lab_coat`: Two flat white planes draped from shoulders, reaching to knee level. Slightly angled outward.
- `goggles`: Two cylinders (lens frames) + strap (thin box) across the head front. Goggles sit above the screen.
- `backpack`: Box on the back of the body
- `jetpack`: Two cylinders on the back with small cone nozzles
- `tool_belt`: Thin box belt around the body's midsection with tiny tool shapes
- `scarf`: Curved plane draped around the neck area
- `monocle`: Single small cylinder frame near one eye
- `top_hat`: Cylinder + wider cylinder brim on top of head
- `headphones`: Two sphere ear cups connected by a curved thin cylinder band over the head
- `cape`: Large plane hanging from the back of the shoulders, slight drape

### 1.2 Robot Materials (`src/characters/robot/RobotMaterials.ts`)

Material factory functions.

```ts
createBodyMaterial(color: string): THREE.MeshStandardMaterial
// metalness: 0.6, roughness: 0.35, color from param

createChromeMaterial(): THREE.MeshStandardMaterial
// metalness: 0.9, roughness: 0.1, color: PALETTE.CHROME

createScreenMaterial(glowColor: string): THREE.MeshStandardMaterial
// color: '#111111', emissive: glowColor, emissiveIntensity: 0.3

createEyeMaterial(eyeColor: string): THREE.MeshStandardMaterial
// color: eyeColor, emissive: eyeColor, emissiveIntensity: 1.0

createAccessoryMaterial(color: string, type: 'metal' | 'fabric' | 'glass'): THREE.MeshStandardMaterial
// Varies based on type: metal = high metalness, fabric = low metalness + high roughness, glass = transparent
```

### 1.3 Robot Expressions (`src/characters/robot/RobotExpressions.ts`)

Animated face expressions on the screen.

**Requirements**:
- Define expression presets as eye shape + position configurations:
  ```ts
  type Expression = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry' | 'thinking' | 'talking' | 'blink';
  ```
- Each expression defines:
  - Eye scale (X, Y) — e.g., surprised = wider, happy = squished vertically
  - Eye position offset — e.g., looking left = both eyes shift left
  - Eye shape (circle, oval, half-circle for happy ^_^, X for frustrated)
  - Mouth shape (none, line, smile curve, O shape)
- Blink system: periodic random blinks (eyes scale to thin line briefly, ~150ms)
  - Blink interval: random between 2–6 seconds
- Talking animation: mouth shape oscillates open/closed in sync with phoneme timing
- Smooth transitions between expressions using lerp on scale/position
- Export a function: `updateExpression(mesh: THREE.Group, expression: Expression, delta: number)`
- Export a hook: `useRobotExpression(expression: Expression)` that returns animated uniform values

### 1.4 Robot Configs (`src/characters/robot/RobotConfigs.ts`)

Pre-defined robot configurations for all NPC types.

```ts
import { RobotConfig } from '@shared/types';
import { PALETTE } from '@shared/constants/colors.constants';

export const ROBOT_CONFIGS: Record<string, RobotConfig> = {
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'sentinel',
    bodyColor: PALETTE.SENTINEL_BLUE,
    accentColor: PALETTE.DARK_CHROME,
    screenColor: PALETTE.SCREEN_GREEN,
    eyeColor: '#FFFFFF',
    bodyShape: 'standard',
    headShape: 'box',
    accessories: ['antenna_single'],
    scale: 1.0,
    personality: {
      voicePitch: 0.8,
      talkSpeed: 25,
      idleAnimation: 'look_around',
      walkSpeed: 2.5,
    },
  },
  einstein: {
    id: 'einstein',
    name: 'Einstein',
    role: 'einstein',
    bodyColor: PALETTE.EINSTEIN_GOLD,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_AMBER,
    eyeColor: '#FFFFFF',
    bodyShape: 'slim',
    headShape: 'rounded_box',
    accessories: ['wire_hair', 'lab_coat', 'monocle'],
    scale: 0.95,
    personality: {
      voicePitch: 1.2,
      talkSpeed: 35,
      idleAnimation: 'tinker',
      walkSpeed: 1.8,
    },
  },
  treasurer: {
    id: 'treasurer',
    name: 'Treasurer',
    role: 'treasurer',
    bodyColor: PALETTE.TREASURER_TEAL,
    accentColor: PALETTE.EINSTEIN_GOLD,
    screenColor: PALETTE.SCREEN_CYAN,
    eyeColor: '#FFD700',
    bodyShape: 'stocky',
    headShape: 'wide',
    accessories: ['top_hat', 'monocle'],
    scale: 1.1,
    personality: {
      voicePitch: 0.7,
      talkSpeed: 20,
      idleAnimation: 'fidget',
      walkSpeed: 2.0,
    },
  },
  scribe: {
    id: 'scribe',
    name: 'Scribe',
    role: 'scribe',
    bodyColor: PALETTE.SCRIBE_AMBER,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_AMBER,
    eyeColor: '#FFFFFF',
    bodyShape: 'slim',
    headShape: 'rounded_box',
    accessories: ['headphones'],
    scale: 0.85,
    personality: {
      voicePitch: 1.4,
      talkSpeed: 40,
      idleAnimation: 'tap_desk',
      walkSpeed: 3.0,
    },
  },
  postmaster: {
    id: 'postmaster',
    name: 'Postmaster',
    role: 'postmaster',
    bodyColor: PALETTE.POSTMASTER_RED,
    accentColor: PALETTE.DARK_CHROME,
    screenColor: PALETTE.SCREEN_WARM,
    eyeColor: '#FFFFFF',
    bodyShape: 'round',
    headShape: 'box',
    accessories: ['antenna_double', 'backpack'],
    scale: 1.05,
    personality: {
      voicePitch: 0.9,
      talkSpeed: 28,
      idleAnimation: 'look_around',
      walkSpeed: 2.2,
    },
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    role: 'scout',
    bodyColor: PALETTE.SCOUT_ORANGE,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_AMBER,
    eyeColor: '#FFFFFF',
    bodyShape: 'standard',
    headShape: 'rounded_box',
    accessories: ['goggles', 'tool_belt', 'scarf'],
    scale: 1.0,
    personality: {
      voicePitch: 1.1,
      talkSpeed: 32,
      idleAnimation: 'look_around',
      walkSpeed: 3.5,
    },
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    role: 'oracle',
    bodyColor: PALETTE.ORACLE_DARK,
    accentColor: PALETTE.DARK_CHROME,
    screenColor: '#3300FF',
    eyeColor: '#FF6600',
    bodyShape: 'tall',
    headShape: 'dome',
    accessories: ['cape', 'antenna_dish'],
    scale: 1.15,
    personality: {
      voicePitch: 0.5,
      talkSpeed: 18,
      idleAnimation: 'look_around',
      walkSpeed: 1.5,
    },
  },
  diplomat: {
    id: 'diplomat',
    name: 'Diplomat',
    role: 'diplomat',
    bodyColor: PALETTE.DIPLOMAT_CREAM,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_CYAN,
    eyeColor: '#333333',
    bodyShape: 'slim',
    headShape: 'rounded_box',
    accessories: ['top_hat'],
    scale: 1.0,
    personality: {
      voicePitch: 1.0,
      talkSpeed: 22,
      idleAnimation: 'wave',
      walkSpeed: 2.0,
    },
  },
  mernz: {
    id: 'mernz',
    name: 'Mernz',
    role: 'mernz',
    bodyColor: PALETTE.MERNZ_PURPLE,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_AMBER,
    eyeColor: '#FFFFFF',
    bodyShape: 'standard',
    headShape: 'box',
    accessories: ['antenna_single', 'backpack'],
    scale: 1.0,
    personality: {
      voicePitch: 1.3,
      talkSpeed: 30,
      idleAnimation: 'fidget',
      walkSpeed: 2.5,
    },
  },
};

// Player default config
export const PLAYER_DEFAULT_CONFIG: RobotConfig = {
  id: 'player',
  name: 'You',
  role: 'player',
  bodyColor: '#CC7722',
  accentColor: PALETTE.CHROME,
  screenColor: PALETTE.SCREEN_AMBER,
  eyeColor: '#FFFFFF',
  bodyShape: 'standard',
  headShape: 'rounded_box',
  accessories: [],
  scale: 1.0,
  personality: {
    voicePitch: 1.0,
    talkSpeed: 30,
    idleAnimation: 'fidget',
    walkSpeed: 4.0,
  },
};
```

### 1.5 Robot Builder (`src/characters/robot/RobotBuilder.ts`)

The main assembly function that builds a complete robot from config.

```ts
export function buildRobot(config: RobotConfig): THREE.Group {
  const robot = new THREE.Group();
  robot.name = `robot_${config.id}`;

  // Build parts
  const body = createBody(config);
  const head = createHead(config);
  const screen = createScreen(config);
  const eyes = createEyes(config);
  const leftArm = createArm(config, 'left');
  const rightArm = createArm(config, 'right');
  const leftLeg = createLeg(config, 'left');
  const rightLeg = createLeg(config, 'right');

  // Position parts relative to body center
  head.position.y = BODY_HEIGHT / 2 + HEAD_HEIGHT / 2 + 0.02; // Slight gap
  screen.position.z = HEAD_DEPTH / 2 + 0.001; // Flush with head front
  // ... (position all parts)

  // Add accessories
  config.accessories.forEach(acc => {
    const accessory = createAccessory(acc, config);
    robot.add(accessory);
  });

  // Assemble
  head.add(screen);
  head.add(eyes);
  robot.add(body);
  robot.add(head);
  robot.add(leftArm);
  robot.add(rightArm);
  robot.add(leftLeg);
  robot.add(rightLeg);

  // Apply scale
  robot.scale.setScalar(config.scale);

  // Store references for animation
  robot.userData = {
    head, body, leftArm, rightArm, leftLeg, rightLeg, eyes, screen,
    config,
  };

  return robot;
}
```

---

## TASK 2: PLAYER ENTITY

### 2.1 Player Entity Component (`src/characters/player/PlayerEntity.tsx`)

R3F component for the player's robot.

**Requirements**:
- Build robot mesh using `RobotBuilder` with player config from store
- Wrap in Rapier `<RigidBody>` with capsule collider for physics
- Position syncs with store: `setPlayerPosition()` every frame
- Animation state drives procedural animation (see 2.2)
- Robot faces the movement direction (smooth rotation)
- Cast shadow
- Player mesh is hidden when camera is too close (prevent clipping)

### 2.2 Player Animations (`src/characters/player/PlayerAnimations.ts`)

Procedural animation system (no skeletal animation — pure transform manipulation).

**Requirements**:
All animation is done by transforming the robot parts (stored in `robot.userData`):

**Idle**:
- Subtle body bob: `body.position.y += sin(time * 2) * 0.02`
- Arms slight sway: `leftArm.rotation.x = sin(time * 1.5) * 0.05`
- Head slight look around: `head.rotation.y = sin(time * 0.5) * 0.1`
- Periodic blink (handled by expression system)
- Occasional fidget: every 5-10 seconds, play a small movement burst

**Walk**:
- Legs alternate swing: `leftLeg.rotation.x = sin(time * walkFreq) * 0.6`; right leg is opposite phase
- Arms swing opposite to legs: `leftArm.rotation.x = -sin(time * walkFreq) * 0.4`
- Body slight bounce: `body.position.y += abs(sin(time * walkFreq * 2)) * 0.03`
- Head stays relatively stable (slight bob)
- Walk frequency scales with speed

**Run** (same as walk but amplified):
- Larger leg swing angle (0.8 rad)
- Larger arm swing (0.6 rad)
- More aggressive bounce
- Higher frequency
- Body tilts forward slightly: `body.rotation.x = 0.1`

**Interact**:
- Body leans forward slightly
- One arm extends forward (reaching)
- Head tilts down

**Talk**:
- Body stays still
- Slight head movements (random small rotations)
- Arms gesture occasionally (one arm lifts slightly every few seconds)
- Expression changes to 'talking'

**Wave**:
- One arm raises up and sweeps side to side
- Head tilts to one side
- Expression = happy

Export: `updatePlayerAnimation(robot: THREE.Group, state: AnimationState, delta: number, time: number)`

### 2.3 Player Accessories (`src/characters/player/PlayerAccessories.ts`)

Equipment system for the player.

**Requirements**:
- When accessories are equipped (via store `equippedAccessories`), add the corresponding geometry to the player's robot group
- When unequipped, remove it
- Visual-only (no gameplay effect for V1, but the system is there for future expansion)
- React to store changes using Zustand subscription

---

## TASK 3: NPC SYSTEM

### 3.1 NPC Entity (`src/characters/npc/NPCEntity.tsx`)

R3F component for a single NPC robot.

**Requirements**:
- Accept `NPCDef` as props
- Build robot mesh using `RobotBuilder` with NPC's `robotConfig`
- Position at spawn location, snapped to terrain Y (read from `getHeightAtPosition` imported from world — since we can't import world files, use the EventBus or a global function registered on `window.__dreamwell` by Stream 1)
  - **IMPORTANT**: To avoid cross-stream file imports, Stream 1 should register `getHeightAtPosition` on a global like `window.__dreamwellTerrain = { getHeightAtPosition }`. Stream 2 reads from this global. This is the ONLY place cross-stream communication happens outside the store/events.
- Run behavior state machine (see 3.3)
- Animate based on current behavior state
- When player is within `interactionRadius`, emit event and show interaction possibility
- When player interacts, emit `NPC_DIALOGUE_STARTED` event with npcId
- Expression changes based on dialogue state
- Only animate if within `NPC_ANIMATION_DISTANCE` of camera (performance)
- Only render if within `npcRenderDistance` quality setting
- Cast shadow only if within 20 units of camera

### 3.2 NPC Factory (`src/characters/npc/NPCFactory.ts`)

Creates and manages all NPCs.

**Requirements**:
- Accept an array of `NPCDef` (will be provided by Stream 3's data files, imported via store or passed as props)
- For V1, define the NPC definitions HERE (since data/ is owned by Stream 3, but we need NPC positions):

```ts
// NPC spawn definitions — positions match structure placements from Stream 1
export const NPC_DEFINITIONS: NPCDef[] = [
  {
    id: 'sentinel',
    robotConfig: ROBOT_CONFIGS.sentinel,
    position: [-28, 0, -28],       // Near sentinel's workshop
    rotation: 0.4,
    patrolMode: 'patrol_loop',
    patrolPath: [[-28, 0, -28], [-25, 0, -32], [-32, 0, -30], [-28, 0, -28]],
    interactionRadius: 3,
    dialogueId: 'sentinel_intro',
    associatedStructure: 'workshop_hut_sentinel',
  },
  {
    id: 'einstein',
    robotConfig: ROBOT_CONFIGS.einstein,
    position: [32, 0, -58],        // Inside playbook station
    rotation: -0.3,
    patrolMode: 'static',
    interactionRadius: 3,
    dialogueId: 'einstein_intro',
    associatedStructure: 'playbook_station',
  },
  {
    id: 'treasurer',
    robotConfig: ROBOT_CONFIGS.treasurer,
    position: [70, 0, 12],         // At the stock market podium
    rotation: 0.5,
    patrolMode: 'static',
    interactionRadius: 4,
    dialogueId: 'treasurer_intro',
    associatedStructure: 'stock_market',
  },
  {
    id: 'scribe',
    robotConfig: ROBOT_CONFIGS.scribe,
    position: [-8, 0, 55],         // Junkyard edge
    rotation: 0,
    patrolMode: 'wander',
    interactionRadius: 2.5,
    dialogueId: 'scribe_intro',
    associatedStructure: 'junkyard',
  },
  {
    id: 'postmaster',
    robotConfig: ROBOT_CONFIGS.postmaster,
    position: [18, 0, 42],         // Near school bus
    rotation: -0.7,
    patrolMode: 'patrol_bounce',
    patrolPath: [[18, 0, 42], [14, 0, 38], [18, 0, 42]],
    interactionRadius: 3,
    dialogueId: 'postmaster_intro',
    associatedStructure: 'school_bus',
  },
  {
    id: 'scout',
    robotConfig: ROBOT_CONFIGS.scout,
    position: [-60, 0, -18],       // Near drive-in cinema
    rotation: 0.8,
    patrolMode: 'patrol_loop',
    patrolPath: [[-60, 0, -18], [-55, 0, -25], [-65, 0, -22], [-60, 0, -18]],
    interactionRadius: 3,
    dialogueId: 'scout_intro',
    associatedStructure: 'drivein_cinema',
  },
  {
    id: 'oracle',
    robotConfig: ROBOT_CONFIGS.oracle,
    position: [52, 0, -38],        // Oracle's den
    rotation: -0.6,
    patrolMode: 'static',
    interactionRadius: 3.5,
    dialogueId: 'oracle_intro',
    associatedStructure: 'workshop_hut_oracle',
  },
  {
    id: 'diplomat',
    robotConfig: ROBOT_CONFIGS.diplomat,
    position: [0, 0, 0],           // Island center — the greeter
    rotation: 0,
    patrolMode: 'wander',
    interactionRadius: 4,
    dialogueId: 'diplomat_intro',
  },
  {
    id: 'mernz',
    robotConfig: ROBOT_CONFIGS.mernz,
    position: [-15, 0, 65],        // Deep junkyard
    rotation: 0,
    patrolMode: 'static',
    interactionRadius: 3,
    dialogueId: 'mernz_intro',
    associatedStructure: 'junkyard',
  },
];
```

- Initialize all NPCs into the Zustand store via `initNPCs()`
- Render NPCEntity components for each NPC
- Handle NPC lifecycle (activate/deactivate based on distance)

### 3.3 NPC Behavior (`src/characters/npc/NPCBehavior.ts`)

Simple state machine for NPC AI.

**States**:
- **Idle**: Stand in place, play idle animation, occasional expression changes
- **Patrol**: Follow defined patrol path at walk speed
  - `patrol_loop`: Walk waypoints in order, loop back to start
  - `patrol_bounce`: Walk forward, reverse at end
  - `wander`: Random short walks within a radius of spawn point
- **Interact**: When player is within range and facing the NPC
  - Turn to face the player
  - Switch to talk animation
  - Wait for dialogue trigger
- **Talk**: During active dialogue
  - Face player
  - Play talk animation
  - Expression syncs with dialogue emotion

**Requirements**:
- State transitions are priority-based:
  1. If player is near AND interacting → Talk
  2. If player is near → Interact (turn to face)
  3. If has patrol path → Patrol
  4. Else → Idle
- Movement uses simple lerp toward target waypoint (no pathfinding needed — island is open)
- Respect terrain height: NPCs walk on the terrain surface
- Smooth rotation toward movement direction
- Export: `updateNPCBehavior(npc: NPCState, def: NPCDef, playerPos: [number,number,number], delta: number): Partial<NPCState>`

### 3.4 NPC Animations (`src/characters/npc/NPCAnimations.ts`)

Same procedural animation system as player, adapted for NPCs.

**Requirements**:
- Reuse the core animation functions from `PlayerAnimations` where possible
- NPCs have additional idle variants (see `IdleAnimationType`):
  - `fidget`: Random small body movements
  - `look_around`: Head rotates left/right slowly
  - `tap_desk`: One arm taps downward rhythmically (for NPCs near desks)
  - `wave`: Arm raises and waves (greeting when player approaches)
  - `tinker`: Both arms move in small circular motions (working on something)
- Walk speed comes from NPC's personality config (slower/faster NPCs)
- NPC animation speed scaled by personality `talkSpeed`

---

## TASK 4: CONTROLS

### 4.1 Player Controller (`src/controls/PlayerController.tsx`)

Keyboard and mouse controls for player movement.

**Requirements**:
- **WASD / Arrow Keys**: Movement relative to camera facing direction
  - W/Up: Forward
  - S/Down: Backward
  - A/Left: Strafe left
  - D/Right: Strafe right
- **Shift**: Hold to run (1.8x speed multiplier)
- **Space**: Jump (only when grounded)
- **E**: Interact with nearest interactable
- **Escape**: Toggle pause menu
- **M**: Toggle minimap
- **P**: Toggle phone UI
- **Mouse**: Controls camera orbit (only when right-click held, or always in certain modes)

**Implementation**:
- Use `useFrame` to apply velocity to the Rapier rigid body each frame
- Calculate movement direction based on camera yaw (camera-relative movement)
- Apply gravity when not grounded
- Ground detection via Rapier raycast downward from player capsule
- Smooth acceleration/deceleration (don't snap to full speed instantly)
- Update store: position, rotation, velocity, isGrounded, isRunning, currentAnimation
- Emit `PLAYER_MOVED` event periodically (every 10 frames, not every frame)

**State machine for input → animation**:
- No input + grounded → 'idle'
- Movement input + grounded + no shift → 'walk'
- Movement input + grounded + shift → 'run'
- Airborne → keep current animation
- E pressed near interactable → 'interact'

### 4.2 Touch Controller (`src/controls/TouchController.tsx`)

Mobile touch controls.

**Requirements**:
- Virtual joystick in bottom-left (for movement)
- Interaction button in bottom-right
- Jump button
- Auto-detect mobile via screen size + touch capability
- Same underlying logic as keyboard controller, different input mapping
- Use a transparent overlay `<div>` with touch event handlers
- The joystick is a CSS-drawn circle with an inner draggable circle

### 4.3 Camera Controller (`src/controls/CameraController.tsx`)

Third-person camera.

**Requirements** (Reference: Coastal World had a third-person follow camera):
- **Follow mode** (default):
  - Camera positioned behind and above the player
  - Distance: `followDistance` from store (default 6)
  - Height: `followHeight` from store (default 3.5)
  - Smooth follow: lerp toward target position each frame (smoothing factor 0.08)
  - Camera looks at player position + slight Y offset (look at chest, not feet)
  - Mouse drag (right-click) orbits the camera around the player (adjust yaw/pitch)
  - Scroll wheel adjusts follow distance (clamped between min/max)
  - Camera collides with terrain: raycast from player to camera position, if terrain is hit, move camera closer
  - Camera collides with structures: same raycast logic

- **Interior mode**:
  - When player enters a structure, camera pulls inside with a wider FOV
  - Fixed position or constrained orbit within the structure bounds
  - Smooth transition from follow → interior (animated over 0.5s)

- **Cinematic mode** (for cutscenes/transitions):
  - Camera moves along a predefined spline
  - Smooth interpolation between key positions

- Implementation: Use R3F `useFrame` + `useThree` to directly control the camera
- Update store with camera state

### 4.4 Interaction Controller (`src/controls/InteractionController.tsx`)

Manages proximity-based interactions.

**Requirements**:
- Every frame, check distance from player to all interactable entities (NPCs, structures, collectibles)
- When within interaction radius:
  - Set `interactionPrompt` in UI store (shows "Press E to interact" or similar)
  - Highlight the target (emit event for visual feedback)
- When E is pressed:
  - Determine closest interactable
  - Fire appropriate event: `PLAYER_INTERACTED`, `NPC_DIALOGUE_STARTED`, `STRUCTURE_ENTERED`, `ITEM_COLLECTED`
- Optimization: Only check entities within a rough distance first (use squared distance to avoid sqrt)
- Sort candidates by distance, interact with closest

---

## TASK 5: PHYSICS

### 5.1 Physics World (`src/physics/PhysicsWorld.tsx`)

Rapier physics setup.

**Requirements**:
- The `<Physics>` provider is already in `App.tsx` from Phase 0
- This component manages additional physics configuration:
  - Debug mode toggle (show collider wireframes when `showFPS` is true in dev)
  - Performance monitoring of physics step time
- Export utilities for physics queries (raycasts, overlap tests)

### 5.2 Collider Factory (`src/physics/ColliderFactory.ts`)

Creates Rapier colliders from structure/prop definitions.

**Requirements**:
- Accept `ColliderDef` and create appropriate Rapier colliders
- Support box, sphere, capsule, and heightfield shapes
- Trigger colliders for zone detection (entry/exit events)
- Layer-based collision filtering (player collides with terrain + structures, not with triggers)

### 5.3 Raycast Manager (`src/physics/RaycastManager.ts`)

Utility for physics queries.

**Requirements**:
- Ground detection: raycast downward from a position, return hit point and normal
- Interaction raycast: raycast forward from player in look direction
- Line-of-sight checks: raycast between two points, return if obstructed
- Use Rapier's `castRay` API
- Cache ray objects for reuse (avoid allocation per frame)

---

## TASK 6: AUDIO

### 6.1 Audio Manager (`src/audio/AudioManager.ts`)

Central audio system using Howler.js.

**Requirements**:
- Singleton audio manager
- Load/unload sound definitions
- Play, pause, stop, volume control for individual sounds
- Global volume from store (master, music, sfx, ambient)
- Mute toggle from store
- Fade in/out support
- Sound pooling for frequently played SFX (footsteps, UI clicks)
- Listen to EventBus `AUDIO_PLAY` / `AUDIO_STOP` events

### 6.2 Spatial Audio (`src/audio/SpatialAudio.tsx`)

3D positioned sounds in the scene.

**Requirements**:
- Component that positions a Howler sound at a 3D location
- Volume attenuates with distance from camera/listener
- Panning based on left/right position relative to camera
- Use Howler's spatial audio features or manual distance-based volume
- Used for: ambient zones (water, wind, birds), NPC talking sounds, structure ambient (electronics hum, stock market chatter)

### 6.3 Phoneme Engine (`src/audio/PhonemeEngine.ts`)

Robot voice synthesis for NPC dialogue (inspired by Coastal World's approach).

**Requirements** (Reference: Coastal World invented a language where each word produces specific phoneme sounds):
- When an NPC speaks, generate a sequence of simple tone beeps that roughly match the text
- Rules:
  - Vowels (a, e, i, o, u) = longer tone, higher pitch
  - Consonants = shorter tone, lower pitch
  - Spaces = short silence
  - Punctuation:
    - Period = descending pitch + longer pause
    - Question mark = ascending pitch at end
    - Exclamation = sharp high tone
    - Comma = medium pause
- Each NPC has a base pitch from their personality `voicePitch`
- Add small random pitch variation per phoneme (±10%)
- Use Web Audio API (`AudioContext`, `OscillatorNode`) for real-time synthesis
- Play phonemes in sequence matching the typewriter text display speed
- Export: `speakText(text: string, config: PhonemeConfig): Promise<void>`
- Export: `stopSpeaking(): void`

### 6.4 Music Manager (`src/audio/MusicManager.ts`)

Background music with crossfade.

**Requirements**:
- Play ambient music tracks
- Crossfade between tracks when changing areas/moods
- Respect music volume setting
- For V1, we won't have actual music files — create placeholder functions that are ready for audio assets
- When music files are available, they'll go in `src/assets/audio/music/`

---

## COMPLETION CRITERIA

When Stream 2 is complete:

- [ ] Player robot renders with correct colors and proportions
- [ ] Player moves with WASD, runs with Shift, jumps with Space
- [ ] Camera follows player smoothly in third-person
- [ ] Camera collides with terrain (doesn't clip through hills)
- [ ] Mouse right-drag orbits camera around player
- [ ] All 9 NPC robots render at their positions on the island
- [ ] Each NPC has correct colors, accessories, and unique appearance
- [ ] NPCs run idle behaviors (patrol, wander, stand)
- [ ] NPCs turn to face player when approached
- [ ] "Press E to interact" prompt appears near NPCs (via store → UI reads it)
- [ ] E key triggers interaction events
- [ ] Robot expressions work (blinking, expression changes)
- [ ] Procedural walk/run/idle animations play correctly
- [ ] Physics prevents player from walking through terrain and structures
- [ ] Phoneme engine generates robot speech sounds
- [ ] Touch controls work on mobile
- [ ] No TypeScript errors
- [ ] Performance: NPCs beyond render distance are culled

---

> After Stream 2 is complete, you can walk around the island, see all NPC robots, approach them, and trigger interactions. But there's no dialogue UI, no quest tracking, no menus yet — that's Stream 3.
