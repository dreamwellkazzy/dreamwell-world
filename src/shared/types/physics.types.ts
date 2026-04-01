import * as THREE from 'three';

export interface ColliderDef {
  id: string;
  type: ColliderShape;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  size: THREE.Vector3Tuple;
  isTrigger: boolean;
  layer: CollisionLayer;
  tag?: string;
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
  gravity: THREE.Vector3Tuple;
  fixedTimestep: number;
  maxSubSteps: number;
  playerCapsuleRadius: number;
  playerCapsuleHeight: number;
}
