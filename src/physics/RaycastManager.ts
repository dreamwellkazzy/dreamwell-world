import * as THREE from 'three';
import { getRapierWorld, getRapierModule } from './PhysicsWorld';
import { getCollisionGroup } from './ColliderFactory';
import type { RaycastResult, CollisionLayer } from '@shared/types';

// ---------------------------------------------------------------------------
// Cached objects to avoid per-frame allocation
// ---------------------------------------------------------------------------

const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _toTarget = new THREE.Vector3();

/** Safe default returned when the Rapier world is not yet initialised. */
const NO_HIT: Readonly<RaycastResult> = Object.freeze({
  hit: false,
  point: [0, 0, 0] as [number, number, number],
  normal: [0, 1, 0] as [number, number, number],
  distance: 0,
  colliderId: '',
  layer: 'terrain' as CollisionLayer,
});

// ---------------------------------------------------------------------------
// groundCheck
// ---------------------------------------------------------------------------

/**
 * Cast a ray straight down from `position` and return the first hit.
 *
 * If the physics world is not yet available, returns a synthetic hit at y = 0
 * so that systems relying on ground detection have a safe fallback.
 *
 * @param position  Origin of the ray (usually the player / NPC feet).
 * @param distance  Maximum ray length (default 10).
 */
export function groundCheck(
  position: [number, number, number],
  distance = 10,
): RaycastResult {
  const world = getRapierWorld();
  const rapier = getRapierModule();

  if (!world || !rapier) {
    // Safe fallback: pretend ground is at y = 0
    return {
      hit: true,
      point: [position[0], 0, position[2]],
      normal: [0, 1, 0],
      distance: position[1],
      colliderId: '',
      layer: 'terrain',
    };
  }

  const ray = new rapier.Ray(
    { x: position[0], y: position[1], z: position[2] },
    { x: 0, y: -1, z: 0 },
  );

  const hit = world.castRayAndGetNormal(ray, distance, true);

  if (!hit) {
    return { ...NO_HIT };
  }

  const hitPoint = ray.pointAt(hit.timeOfImpact);

  return {
    hit: true,
    point: [hitPoint.x, hitPoint.y, hitPoint.z],
    normal: [hit.normal.x, hit.normal.y, hit.normal.z],
    distance: hit.timeOfImpact,
    colliderId: String(hit.collider.handle),
    layer: 'terrain',
  };
}

// ---------------------------------------------------------------------------
// interactionRaycast
// ---------------------------------------------------------------------------

/**
 * Cast a ray from `origin` along `direction` to detect interactable objects.
 *
 * The ray ignores the **terrain** layer so that small objects on the ground
 * aren't occluded by the terrain collider beneath them.
 *
 * @param origin    Starting point of the ray.
 * @param direction Direction (will be normalised internally).
 * @param distance  Maximum ray length (default 3).
 */
export function interactionRaycast(
  origin: [number, number, number],
  direction: [number, number, number],
  distance = 3,
): RaycastResult {
  const world = getRapierWorld();
  const rapier = getRapierModule();

  if (!world || !rapier) {
    return { ...NO_HIT };
  }

  _dir.set(direction[0], direction[1], direction[2]).normalize();

  const ray = new rapier.Ray(
    { x: origin[0], y: origin[1], z: origin[2] },
    { x: _dir.x, y: _dir.y, z: _dir.z },
  );

  // Filter out terrain so we interact with props / NPCs / triggers
  const interactMask =
    getCollisionGroup('prop') |
    getCollisionGroup('npc') |
    getCollisionGroup('trigger') |
    getCollisionGroup('structure');

  const hit = world.castRayAndGetNormal(ray, distance, true, undefined, interactMask);

  if (!hit) {
    return { ...NO_HIT };
  }

  const hitPoint = ray.pointAt(hit.timeOfImpact);

  return {
    hit: true,
    point: [hitPoint.x, hitPoint.y, hitPoint.z],
    normal: [hit.normal.x, hit.normal.y, hit.normal.z],
    distance: hit.timeOfImpact,
    colliderId: String(hit.collider.handle),
    layer: 'prop', // proper layer detection would need collider user-data
  };
}

// ---------------------------------------------------------------------------
// lineOfSight
// ---------------------------------------------------------------------------

/**
 * Returns `true` when a straight line between `from` and `to` is **not**
 * obstructed by any solid collider (terrain or structure).
 *
 * Useful for NPC awareness, audio occlusion, etc.
 *
 * When the physics world hasn't loaded yet, this optimistically returns `true`.
 *
 * @param from  Start point.
 * @param to    End point.
 */
export function lineOfSight(
  from: [number, number, number],
  to: [number, number, number],
): boolean {
  const world = getRapierWorld();
  const rapier = getRapierModule();

  if (!world || !rapier) {
    return true; // optimistic fallback
  }

  _origin.set(from[0], from[1], from[2]);
  _toTarget.set(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const totalDist = _toTarget.length();

  if (totalDist === 0) return true;

  _toTarget.normalize();

  const ray = new rapier.Ray(
    { x: _origin.x, y: _origin.y, z: _origin.z },
    { x: _toTarget.x, y: _toTarget.y, z: _toTarget.z },
  );

  // Only check against solid geometry (terrain + structure)
  const solidMask =
    getCollisionGroup('terrain') | getCollisionGroup('structure');

  const hit = world.castRay(ray, totalDist, true, undefined, solidMask);

  // If castRay returns null no hit was found → line of sight is clear
  return hit === null;
}
