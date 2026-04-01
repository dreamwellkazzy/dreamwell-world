# PHASE 0 — FOUNDATION PLAN
## Dreamwell World: Retro-Robot Junkyard Island

> **Purpose**: This plan is given to a SINGLE Claude Code session. It scaffolds the entire project — every folder, every shared type, every store slice, every config file. The three parallel Stream plans depend on this being complete before they begin.
>
> **Estimated time**: 30–60 minutes for Claude Code to execute.
>
> **Rule**: No rendering logic, no shaders, no game logic. Phase 0 is purely structural.

---

## 1. PROJECT INITIALIZATION

### 1.1 Create the project

```bash
npm create vite@latest dreamwell-world -- --template react-ts
cd dreamwell-world
```

### 1.2 Install all dependencies

```bash
# Core 3D
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

# State management
npm install zustand immer

# Physics (Rapier — runs on WASM, much better than cannon for web)
npm install @react-three/rapier

# Audio
npm install howler

# Utilities
npm install simplex-noise leva stats.js
npm install -D @types/three @types/howler
```

### 1.3 Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@world': path.resolve(__dirname, './src/world'),
      '@characters': path.resolve(__dirname, './src/characters'),
      '@physics': path.resolve(__dirname, './src/physics'),
      '@controls': path.resolve(__dirname, './src/controls'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@data': path.resolve(__dirname, './src/data'),
      '@shaders': path.resolve(__dirname, './src/shaders'),
      '@rendering': path.resolve(__dirname, './src/rendering'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  worker: {
    format: 'es',
  },
  server: {
    port: 3000,
  },
});
```

### 1.4 tsconfig.json paths

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@world/*": ["./src/world/*"],
      "@characters/*": ["./src/characters/*"],
      "@physics/*": ["./src/physics/*"],
      "@controls/*": ["./src/controls/*"],
      "@audio/*": ["./src/audio/*"],
      "@ui/*": ["./src/ui/*"],
      "@systems/*": ["./src/systems/*"],
      "@data/*": ["./src/data/*"],
      "@shaders/*": ["./src/shaders/*"],
      "@rendering/*": ["./src/rendering/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src"]
}
```

---

## 2. FOLDER STRUCTURE

Create every folder. This is the canonical structure. Each Stream plan specifies which folders it owns.

```
src/
├── main.tsx                          # Entry point
├── App.tsx                           # Root component — mounts Canvas + UI
├── shared/                           # ⚠️ SHARED — written ONLY in Phase 0
│   ├── types/
│   │   ├── world.types.ts            # Terrain, island, chunk, structure types
│   │   ├── character.types.ts        # Robot, NPC, player, accessory types
│   │   ├── physics.types.ts          # Collider, body, raycast types
│   │   ├── interaction.types.ts      # Dialogue, quest, collectible types
│   │   ├── audio.types.ts            # Sound, music, ambient types
│   │   ├── ui.types.ts               # HUD, menu, notification types
│   │   ├── camera.types.ts           # Camera mode, follow target types
│   │   ├── events.types.ts           # Event bus message types
│   │   └── index.ts                  # Re-exports everything
│   ├── constants/
│   │   ├── world.constants.ts        # Island dimensions, chunk sizes, LOD distances
│   │   ├── character.constants.ts    # Robot body part dimensions, color palettes
│   │   ├── physics.constants.ts      # Gravity, friction, movement speeds
│   │   ├── colors.constants.ts       # The Dreamwell warm color palette
│   │   └── index.ts
│   ├── store/
│   │   ├── useGameStore.ts           # Root Zustand store (all slices combined)
│   │   ├── slices/
│   │   │   ├── worldSlice.ts         # Island loading state, active chunks, time of day
│   │   │   ├── playerSlice.ts        # Player position, rotation, velocity, inventory
│   │   │   ├── npcSlice.ts           # NPC positions, states, dialogue progress
│   │   │   ├── questSlice.ts         # Active quests, completion, collectibles
│   │   │   ├── uiSlice.ts            # Menu state, dialogue open, HUD visibility
│   │   │   ├── audioSlice.ts         # Music volume, SFX volume, ambient state
│   │   │   ├── cameraSlice.ts        # Camera mode, target, transition state
│   │   │   └── settingsSlice.ts      # Quality preset, controls config, accessibility
│   │   └── index.ts
│   ├── events/
│   │   ├── EventBus.ts               # Typed pub/sub event bus (no file collisions)
│   │   └── index.ts
│   └── utils/
│       ├── math.utils.ts             # Lerp, clamp, remap, noise helpers
│       ├── color.utils.ts            # Hex to THREE.Color, palette interpolation
│       └── index.ts
│
├── world/                            # 🔒 OWNED BY STREAM 1
│   ├── Island.tsx                    # Root island component
│   ├── terrain/
│   │   ├── TerrainGenerator.ts       # Procedural heightmap from noise
│   │   ├── TerrainMesh.tsx           # R3F terrain mesh component
│   │   ├── TerrainMaterial.ts        # Custom shader material (splatmap)
│   │   └── TerrainChunk.tsx          # LOD-aware terrain chunk
│   ├── water/
│   │   ├── WaterSurface.tsx          # Animated water plane
│   │   ├── WaterMaterial.ts          # Custom water shader
│   │   └── Foam.tsx                  # Shore foam particles
│   ├── vegetation/
│   │   ├── GrassField.tsx            # Instanced grass with wind + player push
│   │   ├── Trees.tsx                 # Low-poly procedural trees
│   │   ├── Bushes.tsx                # Scattered bush instances
│   │   └── Vines.tsx                 # Hanging vines on structures
│   ├── sky/
│   │   ├── Skybox.tsx                # Gradient sky with clouds
│   │   ├── Sun.tsx                   # Directional light + sun disc
│   │   └── Atmosphere.tsx            # Fog, haze, golden hour
│   ├── structures/
│   │   ├── PlaybookStation.tsx       # The Playbook Station building
│   │   ├── StockMarket.tsx           # Rustic influencer stock market
│   │   ├── Junkyard.tsx              # Junkyard area with scrap piles
│   │   ├── DriveinCinema.tsx         # Drive-in cinema with big screen
│   │   ├── SchoolBus.tsx             # Broken-down school bus (enterable)
│   │   ├── WorkshopHut.tsx           # Small NPC workshop buildings
│   │   └── StructureBase.tsx         # Shared structure component logic
│   ├── props/
│   │   ├── CRTMonitors.tsx           # Stacked CRT monitors (scattered)
│   │   ├── WiringClusters.tsx        # Exposed wiring / cable bundles
│   │   ├── RetroElectronics.tsx      # Old keyboards, circuit boards
│   │   ├── Furniture.tsx             # Desks, chairs, shelves
│   │   ├── Debris.tsx                # Scattered junk, tires, crates
│   │   └── SignPosts.tsx             # Directional signs, labels
│   ├── lighting/
│   │   ├── WorldLighting.tsx         # Main directional + ambient lights
│   │   ├── PointLights.tsx           # Desk lamps, screen glows
│   │   └── Shadows.tsx               # Shadow map configuration
│   └── index.ts
│
├── shaders/                          # 🔒 OWNED BY STREAM 1
│   ├── terrain.vert.glsl
│   ├── terrain.frag.glsl
│   ├── water.vert.glsl
│   ├── water.frag.glsl
│   ├── grass.vert.glsl
│   ├── grass.frag.glsl
│   ├── filmGrain.frag.glsl
│   └── vignette.frag.glsl
│
├── rendering/                        # 🔒 OWNED BY STREAM 1
│   ├── QualityManager.ts            # Dynamic FPS-based quality scaling
│   ├── ChunkManager.ts              # Frustum culling, LOD switching
│   ├── PostProcessing.tsx           # Film grain, vignette (CSS-based like Coastal World)
│   └── index.ts
│
├── characters/                       # 🔒 OWNED BY STREAM 2
│   ├── player/
│   │   ├── PlayerEntity.tsx          # Player robot mesh + animations
│   │   ├── PlayerAnimations.ts       # Walk, run, idle, interact animation states
│   │   └── PlayerAccessories.ts      # Equippable items (antenna, goggles, etc.)
│   ├── npc/
│   │   ├── NPCEntity.tsx             # NPC robot mesh + behavior
│   │   ├── NPCFactory.ts             # Creates NPCs from config data
│   │   ├── NPCBehavior.ts            # Idle, patrol, interact state machine
│   │   └── NPCAnimations.ts          # NPC-specific animation states
│   ├── robot/
│   │   ├── RobotBuilder.ts           # Procedural robot geometry generator
│   │   ├── RobotParts.ts             # Head, body, arms, legs, screen face
│   │   ├── RobotMaterials.ts         # Metal, chrome, screen glow materials
│   │   ├── RobotExpressions.ts       # Screen face expressions (eyes, mouth)
│   │   └── RobotConfigs.ts           # Pre-defined robot types (Sentinel, Oracle, etc.)
│   └── index.ts
│
├── physics/                          # 🔒 OWNED BY STREAM 2
│   ├── PhysicsWorld.tsx              # Rapier physics provider wrapper
│   ├── ColliderFactory.ts            # Creates colliders from structure data
│   ├── RaycastManager.ts             # Ground detection, interaction raycasts
│   └── index.ts
│
├── controls/                         # 🔒 OWNED BY STREAM 2
│   ├── PlayerController.tsx          # Keyboard + mouse movement controller
│   ├── TouchController.tsx           # Mobile touch controls
│   ├── CameraController.tsx          # Third-person camera with collision
│   ├── InteractionController.tsx     # Proximity-based interaction detection
│   └── index.ts
│
├── audio/                            # 🔒 OWNED BY STREAM 2
│   ├── AudioManager.ts               # Howler-based audio manager
│   ├── SpatialAudio.tsx              # 3D positioned sounds in scene
│   ├── PhonemeEngine.ts              # Robot voice phoneme synth
│   ├── MusicManager.ts               # Background music with crossfade
│   └── index.ts
│
├── ui/                               # 🔒 OWNED BY STREAM 3
│   ├── HUD.tsx                        # Health? Coins, minimap, compass
│   ├── DialogueBox.tsx                # NPC dialogue with typewriter effect
│   ├── MainMenu.tsx                   # Start screen, settings, credits
│   ├── PauseMenu.tsx                  # Pause overlay
│   ├── SettingsPanel.tsx              # Quality, audio, controls settings
│   ├── Notifications.tsx             # Toast notifications / guidance
│   ├── VirtualPhone.tsx              # In-game phone UI (map, inventory, quests)
│   ├── Minimap.tsx                    # Top-corner minimap
│   ├── InteractionPrompt.tsx         # "Press E to interact" prompt
│   ├── LoadingScreen.tsx             # Loading screen with progress bar
│   ├── CinemaScreen.tsx              # Drive-in cinema video UI
│   └── index.ts
│
├── systems/                          # 🔒 OWNED BY STREAM 3
│   ├── QuestSystem.ts                # Quest lifecycle manager
│   ├── InventorySystem.ts            # Collectible items tracking
│   ├── ProgressionSystem.ts          # Unlock tracking, completion %
│   ├── SaveSystem.ts                 # localStorage save/load
│   ├── NotificationSystem.ts         # Queued notification manager
│   ├── InteractionSystem.ts          # Proximity triggers, zone detection
│   └── index.ts
│
├── data/                             # 🔒 OWNED BY STREAM 3
│   ├── npcs.data.ts                  # All NPC definitions (name, dialogue, position)
│   ├── quests.data.ts                # Quest definitions and requirements
│   ├── structures.data.ts            # Structure metadata (name, type, position)
│   ├── collectibles.data.ts          # Collectible item definitions
│   ├── dialogues.data.ts             # All dialogue trees
│   └── index.ts
│
├── assets/                           # Shared static assets
│   ├── textures/
│   │   ├── noise.png                 # Perlin noise texture (pre-baked)
│   │   ├── grain.png                 # Film grain overlay texture
│   │   └── palette.png               # Color palette reference
│   ├── audio/
│   │   ├── music/
│   │   ├── sfx/
│   │   └── ambient/
│   └── fonts/
│       └── retro-mono.woff2          # Retro monospace font for UI
│
└── styles/
    ├── global.css                     # CSS reset, film grain overlay, vignette
    └── ui.css                         # UI component styles (CSS-only animations)
```

---

## 3. SHARED TYPE DEFINITIONS

### 3.1 `src/shared/types/world.types.ts`

```ts
import * as THREE from 'three';

// ── Island ──────────────────────────────────────────────────────
export interface IslandConfig {
  id: string;
  name: string;
  seed: number;                        // Noise seed for terrain generation
  size: { width: number; depth: number };
  heightScale: number;
  position: THREE.Vector3Tuple;        // [x, y, z] world position
  biome: BiomeType;
}

export type BiomeType = 'junkyard' | 'workshop' | 'market' | 'cinema' | 'docks';

// ── Terrain ─────────────────────────────────────────────────────
export interface TerrainChunkData {
  id: string;
  gridX: number;
  gridZ: number;
  heightmap: Float32Array;
  splatmap: Float32Array;              // RGBA channels for texture blending
  resolution: number;
  lod: number;                         // 0 = highest detail
}

export interface TerrainConfig {
  chunkSize: number;                   // World units per chunk
  chunkResolution: number;             // Vertices per side at LOD 0
  lodDistances: number[];              // Distance thresholds for LOD switching
  noiseOctaves: number;
  noiseLacunarity: number;
  noisePersistence: number;
}

// ── Structures ──────────────────────────────────────────────────
export interface StructureDef {
  id: string;
  type: StructureType;
  name: string;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  scale: THREE.Vector3Tuple;
  enterable: boolean;                  // Can the player walk inside?
  interactionRadius: number;           // Distance at which interaction prompt appears
  boundingBox: {
    min: THREE.Vector3Tuple;
    max: THREE.Vector3Tuple;
  };
  metadata?: Record<string, unknown>;  // Structure-specific data
}

export type StructureType =
  | 'playbook_station'
  | 'stock_market'
  | 'junkyard'
  | 'drivein_cinema'
  | 'school_bus'
  | 'workshop_hut'
  | 'dock'
  | 'lighthouse';

// ── Props ───────────────────────────────────────────────────────
export interface PropDef {
  id: string;
  type: PropType;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  scale: THREE.Vector3Tuple;
  variant?: number;                    // Visual variant index
  interactive: boolean;
}

export type PropType =
  | 'crt_monitor'
  | 'wiring_cluster'
  | 'retro_keyboard'
  | 'circuit_board'
  | 'desk'
  | 'chair'
  | 'shelf'
  | 'tire'
  | 'crate'
  | 'barrel'
  | 'sign_post'
  | 'lamp_post'
  | 'antenna'
  | 'satellite_dish'
  | 'toolbox'
  | 'generator';

// ── Lighting ────────────────────────────────────────────────────
export interface TimeOfDay {
  hour: number;                        // 0–24
  sunAngle: number;
  sunColor: string;                    // Hex color
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  shadowOpacity: number;
}

// ── Quality ─────────────────────────────────────────────────────
export type QualityPreset = 'ultra' | 'high' | 'medium' | 'low' | 'very-low';

export interface QualitySettings {
  preset: QualityPreset;
  renderScale: number;                 // 0.5 – 2.0
  shadowMapSize: number;               // 512 – 4096
  grassDensity: number;                // 0 – 1
  grassRenderDistance: number;
  npcRenderDistance: number;
  enablePostProcessing: boolean;
  enableParticles: boolean;
  maxChunksLoaded: number;
}
```

### 3.2 `src/shared/types/character.types.ts`

```ts
import * as THREE from 'three';

// ── Robot Configuration ─────────────────────────────────────────
export interface RobotConfig {
  id: string;
  name: string;                        // Display name (e.g. "Sentinel", "Oracle")
  role: RobotRole;
  bodyColor: string;                   // Hex — main body plate color
  accentColor: string;                 // Hex — trim, buttons, dials
  screenColor: string;                 // Hex — face screen background glow
  eyeColor: string;                    // Hex — eye dots/shapes on screen
  bodyShape: BodyShape;
  headShape: HeadShape;
  accessories: AccessoryType[];
  scale: number;                       // Uniform scale multiplier
  personality: PersonalityTraits;
}

export type RobotRole =
  | 'sentinel'     // Sentinel — dark blue, watches over the junkyard
  | 'einstein'     // Einstein — gold, scientist, bushy wire hair
  | 'treasurer'    // Treasurer — teal/green, ornate, manages stock market
  | 'scribe'       // Scribe — yellow/orange, small, writer
  | 'postmaster'   // Postmaster — red, surrounded by screens
  | 'scout'        // Scout — orange, outdoorsy, explorer
  | 'oracle'       // Oracle — dark, glowing eyes, mystic
  | 'diplomat'     // Diplomat — white/cream, smooth, negotiator
  | 'mernz'        // Mernz — purple, teacher, classroom
  | 'player';      // The player's robot

export type BodyShape = 'standard' | 'stocky' | 'slim' | 'round' | 'tall';
export type HeadShape = 'box' | 'rounded_box' | 'cylinder' | 'dome' | 'wide';

export type AccessoryType =
  | 'antenna_single'
  | 'antenna_double'
  | 'antenna_dish'
  | 'goggles'
  | 'lab_coat'
  | 'wire_hair'          // Einstein's bushy wire hair
  | 'top_hat'
  | 'headphones'
  | 'backpack'
  | 'jetpack'
  | 'tool_belt'
  | 'scarf'
  | 'monocle'
  | 'cape';

export interface PersonalityTraits {
  voicePitch: number;                  // 0.5 – 2.0 (multiplier)
  talkSpeed: number;                   // Characters per second
  idleAnimation: IdleAnimationType;
  walkSpeed: number;                   // World units per second
}

export type IdleAnimationType = 'fidget' | 'look_around' | 'tap_desk' | 'wave' | 'tinker';

// ── Robot Geometry Parts ────────────────────────────────────────
export interface RobotPartDimensions {
  body: { width: number; height: number; depth: number; cornerRadius: number };
  head: { width: number; height: number; depth: number; cornerRadius: number };
  screen: { width: number; height: number; inset: number };  // Face screen on head
  eye: { radius: number; spacing: number; offsetY: number };
  arm: { length: number; radius: number; segmentCount: number };
  leg: { length: number; radius: number; segmentCount: number };
  foot: { width: number; height: number; depth: number };
  hand: { width: number; height: number; depth: number };
}

// ── Animation ───────────────────────────────────────────────────
export type AnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'interact'
  | 'talk'
  | 'wave'
  | 'sit'
  | 'tinker'
  | 'look_around'
  | 'surprise'
  | 'celebrate';

export interface AnimationConfig {
  state: AnimationState;
  duration: number;                    // Seconds per loop
  loop: boolean;
  blendDuration: number;               // Crossfade time in seconds
}

// ── NPC ─────────────────────────────────────────────────────────
export interface NPCDef {
  id: string;
  robotConfig: RobotConfig;
  position: THREE.Vector3Tuple;        // Spawn position
  rotation: number;                    // Y rotation in radians
  patrolPath?: THREE.Vector3Tuple[];   // Optional patrol waypoints
  patrolMode: PatrolMode;
  interactionRadius: number;
  dialogueId: string;                  // Reference to dialogue tree
  associatedStructure?: string;        // Structure ID this NPC belongs to
  schedule?: NPCSchedule[];            // Time-based behavior
}

export type PatrolMode = 'static' | 'patrol_loop' | 'patrol_bounce' | 'wander';

export interface NPCSchedule {
  startHour: number;
  endHour: number;
  behavior: PatrolMode;
  position?: THREE.Vector3Tuple;
}

// ── Player ──────────────────────────────────────────────────────
export interface PlayerState {
  position: THREE.Vector3Tuple;
  rotation: number;                    // Y rotation
  velocity: THREE.Vector3Tuple;
  isGrounded: boolean;
  isRunning: boolean;
  isInteracting: boolean;
  currentAnimation: AnimationState;
  robotConfig: RobotConfig;
  inventory: InventoryItem[];
  equippedAccessories: AccessoryType[];
  coins: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  type: 'collectible' | 'key_item' | 'accessory' | 'currency';
}
```

### 3.3 `src/shared/types/physics.types.ts`

```ts
import * as THREE from 'three';

export interface ColliderDef {
  id: string;
  type: ColliderShape;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  size: THREE.Vector3Tuple;            // For box: [w,h,d], sphere: [r,0,0], capsule: [r,h,0]
  isTrigger: boolean;                  // Trigger zones don't block movement
  layer: CollisionLayer;
  tag?: string;                        // For identifying in callbacks
}

export type ColliderShape = 'box' | 'sphere' | 'capsule' | 'trimesh' | 'heightfield';

export type CollisionLayer =
  | 'terrain'
  | 'structure'
  | 'prop'
  | 'npc'
  | 'player'
  | 'trigger'
  | 'water';

export interface RaycastResult {
  hit: boolean;
  point: THREE.Vector3Tuple;
  normal: THREE.Vector3Tuple;
  distance: number;
  colliderId: string;
  layer: CollisionLayer;
}

export interface PhysicsConfig {
  gravity: THREE.Vector3Tuple;         // [0, -9.81, 0]
  fixedTimestep: number;               // 1/60
  maxSubSteps: number;
  playerCapsuleRadius: number;
  playerCapsuleHeight: number;
}
```

### 3.4 `src/shared/types/interaction.types.ts`

```ts
// ── Dialogue ────────────────────────────────────────────────────
export interface DialogueTree {
  id: string;
  npcId: string;
  nodes: DialogueNode[];
  startNodeId: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;                     // NPC name
  text: string;
  emotion?: string;                    // Triggers expression change on robot
  responses?: DialogueResponse[];      // Player choices
  nextNodeId?: string;                 // Auto-advance (if no responses)
  action?: DialogueAction;             // Side effect when this node is shown
}

export interface DialogueResponse {
  text: string;
  nextNodeId: string;
  condition?: string;                  // Optional condition to show this option
}

export interface DialogueAction {
  type: 'give_item' | 'start_quest' | 'complete_quest' | 'unlock_area' | 'play_animation' | 'give_coins';
  payload: Record<string, unknown>;
}

// ── Quests ──────────────────────────────────────────────────────
export interface QuestDef {
  id: string;
  name: string;
  description: string;
  giver: string;                       // NPC ID
  type: QuestType;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisiteQuests?: string[];       // Must be completed first
  associatedStructure?: string;        // Tied to a specific structure
}

export type QuestType = 'fetch' | 'talk' | 'explore' | 'collect' | 'deliver' | 'discover';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'collect' | 'visit' | 'talk_to' | 'interact' | 'find';
  target: string;                      // Item ID, NPC ID, or zone ID
  requiredCount: number;
  currentCount: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'coins' | 'item' | 'accessory' | 'unlock';
  id: string;
  quantity?: number;
}

// ── Collectibles ────────────────────────────────────────────────
export interface CollectibleDef {
  id: string;
  name: string;
  type: 'coin' | 'gear' | 'chip' | 'blueprint' | 'tape';
  position: THREE.Vector3Tuple;
  respawns: boolean;
  respawnTime?: number;                // Seconds
  value?: number;
}

// ── Interaction Zones ───────────────────────────────────────────
export interface InteractionZone {
  id: string;
  type: 'enter_trigger' | 'proximity' | 'action_prompt';
  position: THREE.Vector3Tuple;
  radius: number;
  linkedEntity: string;                // NPC ID, structure ID, or collectible ID
  linkedEntityType: 'npc' | 'structure' | 'collectible' | 'zone';
  promptText?: string;                 // "Press E to enter" etc.
  onEnter?: string;                    // Event name to fire
  onExit?: string;
}
```

### 3.5 `src/shared/types/audio.types.ts`

```ts
export interface SoundDef {
  id: string;
  src: string;                         // Path to audio file
  type: SoundType;
  volume: number;                      // 0 – 1
  loop: boolean;
  spatial: boolean;                    // 3D positioned?
  falloffDistance?: number;
  maxDistance?: number;
}

export type SoundType = 'sfx' | 'music' | 'ambient' | 'voice' | 'ui';

export interface AmbienceZone {
  id: string;
  position: [number, number, number];
  radius: number;
  sounds: string[];                    // SoundDef IDs
  fadeDistance: number;                 // Distance over which volume fades
}

export interface PhonemeConfig {
  pitch: number;                       // Base frequency
  pitchVariation: number;              // Random variation range
  speed: number;                       // Phonemes per second
  vowelDuration: number;
  consonantDuration: number;
}
```

### 3.6 `src/shared/types/ui.types.ts`

```ts
export interface NotificationData {
  id: string;
  type: 'info' | 'quest' | 'achievement' | 'warning' | 'guide';
  title: string;
  message: string;
  icon?: string;
  duration: number;                    // Milliseconds, 0 = persistent
  action?: { label: string; event: string };
}

export interface MenuState {
  isMainMenuOpen: boolean;
  isPaused: boolean;
  isSettingsOpen: boolean;
  isPhoneOpen: boolean;
  isDialogueOpen: boolean;
  isInventoryOpen: boolean;
  activePhoneTab: PhoneTab;
}

export type PhoneTab = 'map' | 'quests' | 'inventory' | 'settings' | 'characters';

export interface MinimapConfig {
  size: number;                        // Pixels
  zoom: number;
  showNPCs: boolean;
  showQuests: boolean;
  showStructures: boolean;
  iconSize: number;
}

export interface LoadingProgress {
  phase: 'initializing' | 'terrain' | 'structures' | 'characters' | 'audio' | 'ready';
  progress: number;                    // 0 – 1
  message: string;
}
```

### 3.7 `src/shared/types/camera.types.ts`

```ts
import * as THREE from 'three';

export type CameraMode = 'follow' | 'orbit' | 'cinematic' | 'fixed' | 'interior';

export interface CameraState {
  mode: CameraMode;
  position: THREE.Vector3Tuple;
  lookAt: THREE.Vector3Tuple;
  fov: number;
  nearPlane: number;
  farPlane: number;
  followDistance: number;
  followHeight: number;
  followSmoothing: number;             // 0 – 1 (lerp factor)
  isTransitioning: boolean;
  transitionDuration: number;
}
```

### 3.8 `src/shared/types/events.types.ts`

```ts
// ── Typed Event Bus Messages ────────────────────────────────────
// Each stream can EMIT and LISTEN to these events.
// No stream owns the event bus — it's shared infrastructure.

export type GameEvent =
  | { type: 'PLAYER_MOVED'; position: [number, number, number] }
  | { type: 'PLAYER_ENTERED_ZONE'; zoneId: string }
  | { type: 'PLAYER_EXITED_ZONE'; zoneId: string }
  | { type: 'PLAYER_INTERACTED'; targetId: string; targetType: 'npc' | 'structure' | 'collectible' }
  | { type: 'NPC_DIALOGUE_STARTED'; npcId: string; dialogueId: string }
  | { type: 'NPC_DIALOGUE_ENDED'; npcId: string }
  | { type: 'QUEST_STARTED'; questId: string }
  | { type: 'QUEST_OBJECTIVE_UPDATED'; questId: string; objectiveId: string }
  | { type: 'QUEST_COMPLETED'; questId: string }
  | { type: 'ITEM_COLLECTED'; itemId: string; itemType: string }
  | { type: 'STRUCTURE_ENTERED'; structureId: string }
  | { type: 'STRUCTURE_EXITED'; structureId: string }
  | { type: 'CAMERA_MODE_CHANGED'; mode: string }
  | { type: 'QUALITY_CHANGED'; preset: string }
  | { type: 'NOTIFICATION_SHOW'; notification: import('./ui.types').NotificationData }
  | { type: 'AUDIO_PLAY'; soundId: string }
  | { type: 'AUDIO_STOP'; soundId: string }
  | { type: 'TIME_OF_DAY_CHANGED'; hour: number }
  | { type: 'LOADING_PROGRESS'; progress: number; phase: string }
  | { type: 'GAME_READY' }
  | { type: 'CINEMA_PLAY'; videoUrl?: string }
  | { type: 'CINEMA_STOP' };
```

### 3.9 `src/shared/types/index.ts`

```ts
export * from './world.types';
export * from './character.types';
export * from './physics.types';
export * from './interaction.types';
export * from './audio.types';
export * from './ui.types';
export * from './camera.types';
export * from './events.types';
```

---

## 4. SHARED CONSTANTS

### 4.1 `src/shared/constants/colors.constants.ts`

```ts
// ── Dreamwell World Color Palette ───────────────────────────────
// Inspired by the Midjourney prompts: warm cinematic, golden hour,
// aged wood, rust, amber, with pops of teal and purple.

export const PALETTE = {
  // ── Warm Neutrals (terrain, structures) ──
  AGED_WOOD:        '#8B6914',
  RUST:             '#A0522D',
  WARM_SAND:        '#D4A574',
  DARK_EARTH:       '#3E2723',
  CONCRETE_AGED:    '#6D6359',
  OXIDIZED_COPPER:  '#4A7C6F',

  // ── Accent Colors (robots, highlights) ──
  SENTINEL_BLUE:    '#2C3E6B',
  EINSTEIN_GOLD:    '#B8860B',
  TREASURER_TEAL:   '#2E8B7A',
  SCRIBE_AMBER:     '#D4940A',
  POSTMASTER_RED:   '#B22222',
  SCOUT_ORANGE:     '#CC7722',
  ORACLE_DARK:      '#1A1A2E',
  DIPLOMAT_CREAM:   '#F5E6CC',
  MERNZ_PURPLE:     '#7B2D8E',

  // ── Chrome & Metal ──
  CHROME:           '#C0C0C0',
  DARK_CHROME:      '#708090',
  BRUSHED_STEEL:    '#A8A8A8',

  // ── Screen / Glow Colors ──
  SCREEN_GREEN:     '#39FF14',
  SCREEN_AMBER:     '#FFB000',
  SCREEN_CYAN:      '#00D4FF',
  SCREEN_WARM:      '#FF6B35',

  // ── Environment ──
  SKY_GOLDEN:       '#FFD27F',
  SKY_DUSK:         '#2E1B4A',
  WATER_SHALLOW:    '#5B8C7A',
  WATER_DEEP:       '#1A3A3A',
  GRASS_WARM:       '#6B8E23',
  GRASS_DRY:        '#9B8B5E',
  FOG_WARM:         '#D4A574',

  // ── UI ──
  UI_BG:            '#1A1612',
  UI_PANEL:         '#2A241E',
  UI_TEXT:           '#E8D5B7',
  UI_ACCENT:        '#D4940A',
  UI_BORDER:        '#4A3F32',
} as const;
```

### 4.2 `src/shared/constants/world.constants.ts`

```ts
export const WORLD = {
  // ── Island Dimensions ──
  ISLAND_SIZE: 200,                    // 200x200 world units
  CHUNK_SIZE: 50,                      // 50x50 per terrain chunk
  CHUNK_RESOLUTION: 64,               // 64x64 vertices at LOD 0

  // ── Terrain Generation ──
  HEIGHT_SCALE: 15,                    // Max terrain height
  NOISE_OCTAVES: 6,
  NOISE_LACUNARITY: 2.0,
  NOISE_PERSISTENCE: 0.5,
  WATER_LEVEL: 0.5,                   // Normalized height for water plane

  // ── LOD ──
  LOD_DISTANCES: [60, 120, 200],      // Switch LOD at these distances
  MAX_CHUNKS_LOADED: 16,

  // ── Rendering ──
  SHADOW_MAP_SIZE: 2048,
  SHADOW_CAMERA_SIZE: 80,
  FAR_PLANE: 500,
  FOG_NEAR: 80,
  FOG_FAR: 300,

  // ── Grass ──
  GRASS_DENSITY: 0.7,
  GRASS_RENDER_DISTANCE: 40,
  GRASS_BLADE_HEIGHT: 0.4,
  GRASS_BLADE_WIDTH: 0.05,

  // ── Time (visual only, not real-time) ──
  DEFAULT_HOUR: 16.5,                 // 4:30 PM — golden hour
} as const;
```

### 4.3 `src/shared/constants/character.constants.ts`

```ts
export const CHARACTER = {
  // ── Player Movement ──
  WALK_SPEED: 4.0,
  RUN_SPEED: 7.5,
  TURN_SPEED: 8.0,
  JUMP_FORCE: 5.0,
  GRAVITY: -20.0,

  // ── Physics Capsule ──
  CAPSULE_RADIUS: 0.35,
  CAPSULE_HEIGHT: 1.2,

  // ── Camera ──
  CAMERA_FOLLOW_DISTANCE: 6,
  CAMERA_FOLLOW_HEIGHT: 3.5,
  CAMERA_SMOOTHING: 0.08,
  CAMERA_MIN_DISTANCE: 3,
  CAMERA_MAX_DISTANCE: 12,

  // ── Interaction ──
  INTERACTION_DISTANCE: 2.5,
  NPC_RENDER_DISTANCE: 60,
  NPC_ANIMATION_DISTANCE: 30,

  // ── Robot Part Dimensions (base, before scale) ──
  BODY_WIDTH: 0.6,
  BODY_HEIGHT: 0.7,
  BODY_DEPTH: 0.4,
  HEAD_WIDTH: 0.5,
  HEAD_HEIGHT: 0.4,
  HEAD_DEPTH: 0.35,
  SCREEN_WIDTH: 0.38,
  SCREEN_HEIGHT: 0.28,
  ARM_RADIUS: 0.07,
  ARM_LENGTH: 0.5,
  LEG_RADIUS: 0.08,
  LEG_LENGTH: 0.4,
} as const;
```

### 4.4 `src/shared/constants/physics.constants.ts`

```ts
export const PHYSICS = {
  GRAVITY: [0, -20, 0] as [number, number, number],
  FIXED_TIMESTEP: 1 / 60,
  MAX_SUBSTEPS: 4,
  GROUND_FRICTION: 0.8,
  AIR_FRICTION: 0.02,
  SLOPE_LIMIT: 45,                     // Degrees
  STEP_HEIGHT: 0.3,                    // Max step-up height
} as const;
```

---

## 5. EVENT BUS

### 5.1 `src/shared/events/EventBus.ts`

```ts
import { GameEvent } from '../types/events.types';

type EventHandler<T extends GameEvent['type']> = (
  event: Extract<GameEvent, { type: T }>
) => void;

class EventBusImpl {
  private handlers: Map<string, Set<Function>> = new Map();

  on<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  emit<T extends GameEvent['type']>(event: Extract<GameEvent, { type: T }>): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  off<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const EventBus = new EventBusImpl();
```

---

## 6. ZUSTAND STORE

### 6.1 `src/shared/store/slices/worldSlice.ts`

```ts
import { StateCreator } from 'zustand';
import { QualityPreset, QualitySettings, TimeOfDay } from '../../types';

export interface WorldSlice {
  // ── State ──
  isLoaded: boolean;
  loadingProgress: number;
  loadingPhase: string;
  activeChunkIds: string[];
  timeOfDay: number;                   // Hour (0–24)
  qualityPreset: QualityPreset;
  qualitySettings: QualitySettings;

  // ── Actions ──
  setLoaded: (loaded: boolean) => void;
  setLoadingProgress: (progress: number, phase: string) => void;
  setActiveChunks: (chunkIds: string[]) => void;
  setTimeOfDay: (hour: number) => void;
  setQualityPreset: (preset: QualityPreset) => void;
}

export const createWorldSlice: StateCreator<WorldSlice> = (set) => ({
  isLoaded: false,
  loadingProgress: 0,
  loadingPhase: 'initializing',
  activeChunkIds: [],
  timeOfDay: 16.5,
  qualityPreset: 'high',
  qualitySettings: {
    preset: 'high',
    renderScale: 1.0,
    shadowMapSize: 2048,
    grassDensity: 0.7,
    grassRenderDistance: 40,
    npcRenderDistance: 60,
    enablePostProcessing: true,
    enableParticles: true,
    maxChunksLoaded: 16,
  },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setLoadingProgress: (progress, phase) => set({ loadingProgress: progress, loadingPhase: phase }),
  setActiveChunks: (chunkIds) => set({ activeChunkIds: chunkIds }),
  setTimeOfDay: (hour) => set({ timeOfDay: hour }),
  setQualityPreset: (preset) => set({ qualityPreset: preset }),
});
```

### 6.2 `src/shared/store/slices/playerSlice.ts`

```ts
import { StateCreator } from 'zustand';
import { AnimationState, InventoryItem, AccessoryType, RobotConfig } from '../../types';
import { PALETTE } from '../../constants/colors.constants';

export interface PlayerSlice {
  // ── State ──
  playerPosition: [number, number, number];
  playerRotation: number;
  playerVelocity: [number, number, number];
  isGrounded: boolean;
  isRunning: boolean;
  isInteracting: boolean;
  currentAnimation: AnimationState;
  playerRobotConfig: RobotConfig;
  inventory: InventoryItem[];
  equippedAccessories: AccessoryType[];
  coins: number;

  // ── Actions ──
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (rot: number) => void;
  setPlayerVelocity: (vel: [number, number, number]) => void;
  setGrounded: (grounded: boolean) => void;
  setRunning: (running: boolean) => void;
  setInteracting: (interacting: boolean) => void;
  setAnimation: (anim: AnimationState) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  addCoins: (amount: number) => void;
  equipAccessory: (accessory: AccessoryType) => void;
  unequipAccessory: (accessory: AccessoryType) => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  playerPosition: [0, 2, 0],
  playerRotation: 0,
  playerVelocity: [0, 0, 0],
  isGrounded: false,
  isRunning: false,
  isInteracting: false,
  currentAnimation: 'idle',
  playerRobotConfig: {
    id: 'player',
    name: 'Player',
    role: 'player',
    bodyColor: PALETTE.SCOUT_ORANGE,
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
  },
  inventory: [],
  equippedAccessories: [],
  coins: 0,

  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
  setGrounded: (grounded) => set({ isGrounded: grounded }),
  setRunning: (running) => set({ isRunning: running }),
  setInteracting: (interacting) => set({ isInteracting: interacting }),
  setAnimation: (anim) => set({ currentAnimation: anim }),
  addItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),
  removeItem: (itemId) => set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),
  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
  equipAccessory: (acc) => set((s) => ({
    equippedAccessories: [...s.equippedAccessories, acc],
  })),
  unequipAccessory: (acc) => set((s) => ({
    equippedAccessories: s.equippedAccessories.filter((a) => a !== acc),
  })),
});
```

### 6.3 `src/shared/store/slices/npcSlice.ts`

```ts
import { StateCreator } from 'zustand';

export interface NPCState {
  id: string;
  position: [number, number, number];
  rotation: number;
  currentAnimation: string;
  isActive: boolean;                   // Within render distance
  isTalking: boolean;
  dialogueProgress: number;            // Index in dialogue tree
}

export interface NPCSlice {
  npcs: Record<string, NPCState>;
  activeDialogueNpcId: string | null;

  setNPCState: (id: string, state: Partial<NPCState>) => void;
  setActiveDialogueNpc: (id: string | null) => void;
  initNPCs: (npcs: Record<string, NPCState>) => void;
}

export const createNPCSlice: StateCreator<NPCSlice> = (set) => ({
  npcs: {},
  activeDialogueNpcId: null,

  setNPCState: (id, state) =>
    set((s) => ({
      npcs: {
        ...s.npcs,
        [id]: { ...s.npcs[id], ...state },
      },
    })),
  setActiveDialogueNpc: (id) => set({ activeDialogueNpcId: id }),
  initNPCs: (npcs) => set({ npcs }),
});
```

### 6.4 `src/shared/store/slices/questSlice.ts`

```ts
import { StateCreator } from 'zustand';

export interface QuestProgress {
  questId: string;
  status: 'available' | 'active' | 'completed';
  objectiveProgress: Record<string, number>; // objectiveId -> count
}

export interface QuestSlice {
  quests: Record<string, QuestProgress>;
  activeQuestId: string | null;
  completedQuestIds: string[];

  startQuest: (questId: string) => void;
  updateObjective: (questId: string, objectiveId: string, count: number) => void;
  completeQuest: (questId: string) => void;
  setActiveQuest: (questId: string | null) => void;
}

export const createQuestSlice: StateCreator<QuestSlice> = (set) => ({
  quests: {},
  activeQuestId: null,
  completedQuestIds: [],

  startQuest: (questId) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: { questId, status: 'active', objectiveProgress: {} },
      },
      activeQuestId: questId,
    })),
  updateObjective: (questId, objectiveId, count) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: {
          ...s.quests[questId],
          objectiveProgress: {
            ...s.quests[questId]?.objectiveProgress,
            [objectiveId]: count,
          },
        },
      },
    })),
  completeQuest: (questId) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: { ...s.quests[questId], status: 'completed' },
      },
      completedQuestIds: [...s.completedQuestIds, questId],
    })),
  setActiveQuest: (questId) => set({ activeQuestId: questId }),
});
```

### 6.5 `src/shared/store/slices/uiSlice.ts`

```ts
import { StateCreator } from 'zustand';
import { MenuState, NotificationData, PhoneTab, LoadingProgress } from '../../types';

export interface UISlice {
  // ── Menu State ──
  isMainMenuOpen: boolean;
  isPaused: boolean;
  isSettingsOpen: boolean;
  isPhoneOpen: boolean;
  isDialogueOpen: boolean;
  isInventoryOpen: boolean;
  activePhoneTab: PhoneTab;

  // ── Notifications ──
  notifications: NotificationData[];

  // ── Loading ──
  loading: LoadingProgress;

  // ── Interaction Prompt ──
  interactionPrompt: { visible: boolean; text: string; targetId: string } | null;

  // ── Actions ──
  setMainMenu: (open: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSettings: (open: boolean) => void;
  setPhone: (open: boolean) => void;
  setDialogue: (open: boolean) => void;
  setInventory: (open: boolean) => void;
  setPhoneTab: (tab: PhoneTab) => void;
  pushNotification: (notification: NotificationData) => void;
  dismissNotification: (id: string) => void;
  setLoading: (loading: LoadingProgress) => void;
  setInteractionPrompt: (prompt: { visible: boolean; text: string; targetId: string } | null) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isMainMenuOpen: true,
  isPaused: false,
  isSettingsOpen: false,
  isPhoneOpen: false,
  isDialogueOpen: false,
  isInventoryOpen: false,
  activePhoneTab: 'map',
  notifications: [],
  loading: { phase: 'initializing', progress: 0, message: 'Starting up...' },
  interactionPrompt: null,

  setMainMenu: (open) => set({ isMainMenuOpen: open }),
  setPaused: (paused) => set({ isPaused: paused }),
  setSettings: (open) => set({ isSettingsOpen: open }),
  setPhone: (open) => set({ isPhoneOpen: open }),
  setDialogue: (open) => set({ isDialogueOpen: open }),
  setInventory: (open) => set({ isInventoryOpen: open }),
  setPhoneTab: (tab) => set({ activePhoneTab: tab }),
  pushNotification: (notification) =>
    set((s) => ({ notifications: [...s.notifications, notification] })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),
});
```

### 6.6 `src/shared/store/slices/audioSlice.ts`

```ts
import { StateCreator } from 'zustand';

export interface AudioSlice {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  isMuted: boolean;
  currentMusicTrack: string | null;

  setMasterVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setAmbientVolume: (vol: number) => void;
  toggleMute: () => void;
  setCurrentMusic: (track: string | null) => void;
}

export const createAudioSlice: StateCreator<AudioSlice> = (set) => ({
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  ambientVolume: 0.5,
  isMuted: false,
  currentMusicTrack: null,

  setMasterVolume: (vol) => set({ masterVolume: vol }),
  setMusicVolume: (vol) => set({ musicVolume: vol }),
  setSfxVolume: (vol) => set({ sfxVolume: vol }),
  setAmbientVolume: (vol) => set({ ambientVolume: vol }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setCurrentMusic: (track) => set({ currentMusicTrack: track }),
});
```

### 6.7 `src/shared/store/slices/cameraSlice.ts`

```ts
import { StateCreator } from 'zustand';
import { CameraMode } from '../../types';

export interface CameraSlice {
  cameraMode: CameraMode;
  cameraPosition: [number, number, number];
  cameraLookAt: [number, number, number];
  cameraFov: number;
  followDistance: number;
  followHeight: number;
  isTransitioning: boolean;

  setCameraMode: (mode: CameraMode) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setCameraLookAt: (target: [number, number, number]) => void;
  setCameraFov: (fov: number) => void;
  setFollowDistance: (dist: number) => void;
  setFollowHeight: (height: number) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraMode: 'follow',
  cameraPosition: [0, 5, 10],
  cameraLookAt: [0, 0, 0],
  cameraFov: 55,
  followDistance: 6,
  followHeight: 3.5,
  isTransitioning: false,

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setCameraLookAt: (target) => set({ cameraLookAt: target }),
  setCameraFov: (fov) => set({ cameraFov: fov }),
  setFollowDistance: (dist) => set({ followDistance: dist }),
  setFollowHeight: (height) => set({ followHeight: height }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
});
```

### 6.8 `src/shared/store/slices/settingsSlice.ts`

```ts
import { StateCreator } from 'zustand';

export interface SettingsSlice {
  controlScheme: 'keyboard' | 'touch';
  invertY: boolean;
  mouseSensitivity: number;
  showFPS: boolean;
  showMinimap: boolean;
  language: string;

  setControlScheme: (scheme: 'keyboard' | 'touch') => void;
  setInvertY: (invert: boolean) => void;
  setMouseSensitivity: (sens: number) => void;
  setShowFPS: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  controlScheme: 'keyboard',
  invertY: false,
  mouseSensitivity: 0.5,
  showFPS: false,
  showMinimap: true,
  language: 'en',

  setControlScheme: (scheme) => set({ controlScheme: scheme }),
  setInvertY: (invert) => set({ invertY: invert }),
  setMouseSensitivity: (sens) => set({ mouseSensitivity: sens }),
  setShowFPS: (show) => set({ showFPS: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
});
```

### 6.9 `src/shared/store/useGameStore.ts` (combined store)

```ts
import { create } from 'zustand';
import { createWorldSlice, WorldSlice } from './slices/worldSlice';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createNPCSlice, NPCSlice } from './slices/npcSlice';
import { createQuestSlice, QuestSlice } from './slices/questSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createAudioSlice, AudioSlice } from './slices/audioSlice';
import { createCameraSlice, CameraSlice } from './slices/cameraSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';

export type GameStore = WorldSlice &
  PlayerSlice &
  NPCSlice &
  QuestSlice &
  UISlice &
  AudioSlice &
  CameraSlice &
  SettingsSlice;

export const useGameStore = create<GameStore>()((...args) => ({
  ...createWorldSlice(...args),
  ...createPlayerSlice(...args),
  ...createNPCSlice(...args),
  ...createQuestSlice(...args),
  ...createUISlice(...args),
  ...createAudioSlice(...args),
  ...createCameraSlice(...args),
  ...createSettingsSlice(...args),
}));
```

---

## 7. UTILITY FILES

### 7.1 `src/shared/utils/math.utils.ts`

```ts
import * as THREE from 'three';

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const lerpV3 = (
  a: THREE.Vector3Tuple,
  b: THREE.Vector3Tuple,
  t: number
): THREE.Vector3Tuple => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const distanceV3 = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple): number =>
  Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2);

export const randomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const randomInt = (min: number, max: number): number =>
  Math.floor(randomRange(min, max + 1));
```

### 7.2 `src/shared/utils/color.utils.ts`

```ts
import * as THREE from 'three';

export const hexToThreeColor = (hex: string): THREE.Color => new THREE.Color(hex);

export const lerpColor = (a: string, b: string, t: number): THREE.Color => {
  const colorA = new THREE.Color(a);
  const colorB = new THREE.Color(b);
  return colorA.lerp(colorB, t);
};

export const darken = (hex: string, amount: number): string => {
  const color = new THREE.Color(hex);
  color.multiplyScalar(1 - amount);
  return '#' + color.getHexString();
};

export const lighten = (hex: string, amount: number): string => {
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color('#ffffff'), amount);
  return '#' + color.getHexString();
};
```

---

## 8. ROOT COMPONENTS

### 8.1 `src/App.tsx`

```tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Stats } from '@react-three/drei';
import { useGameStore } from '@shared/store/useGameStore';

// These will be implemented by Stream 1, 2, 3 respectively.
// For Phase 0, they're placeholder components that render null.
import { Island } from '@world/Island';
import { PlayerEntity } from '@characters/player/PlayerEntity';
import { CameraController } from '@controls/CameraController';
import { PhysicsWorld } from '@physics/PhysicsWorld';
import { HUD } from '@ui/HUD';
import { LoadingScreen } from '@ui/LoadingScreen';
import { PostProcessing } from '@rendering/PostProcessing';

function Scene() {
  return (
    <Physics gravity={[0, -20, 0]}>
      <ambientLight intensity={0.3} color="#FFD27F" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        color="#FFE4B5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      <Island />
      <PlayerEntity />
      <CameraController />
    </Physics>
  );
}

export default function App() {
  const showFPS = useGameStore((s) => s.showFPS);
  const isLoaded = useGameStore((s) => s.isLoaded);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1A1612' }}>
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 5, 10] }}
        gl={{
          antialias: true,
          toneMapping: 3,          // ACESFilmicToneMapping
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#D4A574', 80, 300]} />
        <color attach="background" args={['#2E1B4A']} />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>

        <PostProcessing />
        {showFPS && <Stats />}
      </Canvas>

      {/* HTML UI Overlay */}
      {!isLoaded && <LoadingScreen />}
      <HUD />
    </div>
  );
}
```

### 8.2 `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 8.3 `src/styles/global.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1A1612;
  font-family: 'Courier New', monospace;
  color: #E8D5B7;
  -webkit-font-smoothing: antialiased;
}

/* ── Film Grain Overlay (CSS-only, off main thread) ────────── */
.film-grain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  animation: grain 0.5s steps(6) infinite;
}

@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  30% { transform: translate(3%, -15%); }
  50% { transform: translate(12%, 9%); }
  70% { transform: translate(9%, 4%); }
  90% { transform: translate(-1%, 7%); }
}

/* ── Vignette (CSS-only, off main thread) ──────────────────── */
.vignette {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9997;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(26, 22, 18, 0.4) 80%,
    rgba(26, 22, 18, 0.8) 100%
  );
}

/* ── UI Base Styles ────────────────────────────────────────── */
button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
}

button:focus-visible {
  outline: 2px solid #D4940A;
  outline-offset: 2px;
}
```

---

## 9. PLACEHOLDER COMPONENTS

Create minimal placeholder files for every component that `App.tsx` imports, so the project compiles and runs immediately after Phase 0. Each placeholder renders `null` or a minimal element. The Streams will replace these.

### Placeholders to create (one-liner each):

```
src/world/Island.tsx                    → export const Island = () => null;
src/world/index.ts                      → export * from './Island';
src/characters/player/PlayerEntity.tsx  → export const PlayerEntity = () => null;
src/characters/index.ts                → export * from './player/PlayerEntity';
src/controls/CameraController.tsx      → export const CameraController = () => null;
src/controls/index.ts                  → export * from './CameraController';
src/physics/PhysicsWorld.tsx           → export const PhysicsWorld = () => null;
src/physics/index.ts                   → export * from './PhysicsWorld';
src/rendering/PostProcessing.tsx       → export const PostProcessing = () => null;
src/rendering/index.ts                 → export * from './PostProcessing';
src/ui/HUD.tsx                         → export const HUD = () => null;
src/ui/LoadingScreen.tsx               → export const LoadingScreen = () => <div style={{position:'fixed',inset:0,background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,color:'#E8D5B7',fontSize:'1.5rem'}}>Loading Dreamwell World...</div>;
src/ui/index.ts                        → export * from './HUD'; export * from './LoadingScreen';
src/audio/index.ts                     → // Audio placeholder
src/systems/index.ts                   → // Systems placeholder
src/data/index.ts                      → // Data placeholder
```

---

## 10. VERIFICATION

After all files are created, run:

```bash
cd dreamwell-world
npm run dev
```

**Expected result**: The app opens at `localhost:3000`, shows a dark warm-toned canvas with fog, a directional light casting warm golden light, and the "Loading Dreamwell World..." overlay. No errors in console. The project compiles cleanly with TypeScript.

**Then verify types compile**:

```bash
npx tsc --noEmit
```

Should produce zero errors.

---

## 11. FINAL CHECKLIST

- [ ] Vite + React + TypeScript project created
- [ ] All dependencies installed
- [ ] Folder structure created (every directory from Section 2)
- [ ] All shared types written (Section 3)
- [ ] All constants written (Section 4)
- [ ] Event bus created (Section 5)
- [ ] All Zustand store slices created and combined (Section 6)
- [ ] Utility files created (Section 7)
- [ ] App.tsx and main.tsx written (Section 8)
- [ ] Global CSS with film grain + vignette written (Section 8.3)
- [ ] All placeholder components created (Section 9)
- [ ] `npm run dev` launches successfully with no errors
- [ ] `npx tsc --noEmit` produces zero errors

---

> **IMPORTANT**: After Phase 0 is confirmed working, you can open 3 separate tmux panes and give each one its respective Stream plan. Each Stream will replace the placeholder components with full implementations. No Stream touches any file in `src/shared/` — that's frozen after Phase 0.
