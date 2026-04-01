import * as THREE from 'three';

// -- Robot Configuration --
export interface RobotConfig {
  id: string;
  name: string;
  role: RobotRole;
  bodyColor: string;
  accentColor: string;
  screenColor: string;
  eyeColor: string;
  bodyShape: BodyShape;
  headShape: HeadShape;
  accessories: AccessoryType[];
  scale: number;
  personality: PersonalityTraits;
}

export type RobotRole =
  | 'sentinel'
  | 'einstein'
  | 'treasurer'
  | 'scribe'
  | 'postmaster'
  | 'scout'
  | 'oracle'
  | 'diplomat'
  | 'mernz'
  | 'player';

export type BodyShape = 'standard' | 'stocky' | 'slim' | 'round' | 'tall';
export type HeadShape = 'box' | 'rounded_box' | 'cylinder' | 'dome' | 'wide';

export type AccessoryType =
  | 'antenna_single'
  | 'antenna_double'
  | 'antenna_dish'
  | 'goggles'
  | 'lab_coat'
  | 'wire_hair'
  | 'top_hat'
  | 'headphones'
  | 'backpack'
  | 'jetpack'
  | 'tool_belt'
  | 'scarf'
  | 'monocle'
  | 'cape';

export interface PersonalityTraits {
  voicePitch: number;
  talkSpeed: number;
  idleAnimation: IdleAnimationType;
  walkSpeed: number;
}

export type IdleAnimationType = 'fidget' | 'look_around' | 'tap_desk' | 'wave' | 'tinker';

// -- Robot Geometry Parts --
export interface RobotPartDimensions {
  body: { width: number; height: number; depth: number; cornerRadius: number };
  head: { width: number; height: number; depth: number; cornerRadius: number };
  screen: { width: number; height: number; inset: number };
  eye: { radius: number; spacing: number; offsetY: number };
  arm: { length: number; radius: number; segmentCount: number };
  leg: { length: number; radius: number; segmentCount: number };
  foot: { width: number; height: number; depth: number };
  hand: { width: number; height: number; depth: number };
}

// -- Animation --
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
  duration: number;
  loop: boolean;
  blendDuration: number;
}

// -- NPC --
export interface NPCDef {
  id: string;
  robotConfig: RobotConfig;
  position: THREE.Vector3Tuple;
  rotation: number;
  patrolPath?: THREE.Vector3Tuple[];
  patrolMode: PatrolMode;
  interactionRadius: number;
  dialogueId: string;
  associatedStructure?: string;
  schedule?: NPCSchedule[];
}

export type PatrolMode = 'static' | 'patrol_loop' | 'patrol_bounce' | 'wander';

export interface NPCSchedule {
  startHour: number;
  endHour: number;
  behavior: PatrolMode;
  position?: THREE.Vector3Tuple;
}

// -- Player --
export interface PlayerState {
  position: THREE.Vector3Tuple;
  rotation: number;
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
