import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier, type RapierContext } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import type { RaycastResult, CollisionLayer } from '@shared/types';
import { getCollisionGroup } from './ColliderFactory';

// ---------------------------------------------------------------------------
// Module-level references for non-React code (e.g. RaycastManager)
// ---------------------------------------------------------------------------

type RapierWorld = RapierContext['world'];
type RapierModule = RapierContext['rapier'];

let rapierWorld: RapierWorld | null = null;
let rapierModule: RapierModule | null = null;

export function setRapierRefs(
  world: RapierWorld | null,
  rapier: RapierModule | null,
): void {
  rapierWorld = world;
  rapierModule = rapier;
}

export function getRapierWorld() {
  return rapierWorld;
}

export function getRapierModule() {
  return rapierModule;
}

// ---------------------------------------------------------------------------
// Performance stats (readable from outside React)
// ---------------------------------------------------------------------------

export interface PhysicsStats {
  stepTimeMs: number;
  numBodies: number;
  numColliders: number;
}

const stats: PhysicsStats = { stepTimeMs: 0, numBodies: 0, numColliders: 0 };

export function getPhysicsStats(): Readonly<PhysicsStats> {
  return stats;
}

// ---------------------------------------------------------------------------
// Reusable helpers for raycasting — cached vectors to avoid per-frame alloc
// ---------------------------------------------------------------------------

const _origin = new THREE.Vector3();
const _direction = new THREE.Vector3();

const NO_HIT: RaycastResult = {
  hit: false,
  point: [0, 0, 0],
  normal: [0, 1, 0],
  distance: 0,
  colliderId: '',
  layer: 'terrain',
};

/**
 * Cast a ray through the Rapier world.
 *
 * Must be called from within a component rendered inside `<Physics>` (it uses
 * the module-level world ref set by `<PhysicsWorld />`).
 */
export function castRay(
  origin: [number, number, number],
  direction: [number, number, number],
  maxDistance: number,
  excludeLayers?: CollisionLayer[],
): RaycastResult {
  const world = rapierWorld;
  const rapier = rapierModule;
  if (!world || !rapier) return { ...NO_HIT };

  _origin.set(origin[0], origin[1], origin[2]);
  _direction.set(direction[0], direction[1], direction[2]).normalize();

  const ray = new rapier.Ray(
    { x: _origin.x, y: _origin.y, z: _origin.z },
    { x: _direction.x, y: _direction.y, z: _direction.z },
  );

  // Build a filter mask from excluded layers
  let filterMask = 0xffff;
  if (excludeLayers) {
    for (const layer of excludeLayers) {
      filterMask &= ~getCollisionGroup(layer);
    }
  }

  // castRayAndGetNormal returns null when nothing is hit
  const hit = world.castRayAndGetNormal(ray, maxDistance, true, undefined, filterMask);

  if (!hit) return { ...NO_HIT };

  const hitPoint = ray.pointAt(hit.timeOfImpact);
  const collider = world.getCollider(hit.collider.handle);
  const handle = collider ? String(collider.handle) : '';

  return {
    hit: true,
    point: [hitPoint.x, hitPoint.y, hitPoint.z],
    normal: [hit.normal.x, hit.normal.y, hit.normal.z],
    distance: hit.timeOfImpact,
    colliderId: handle,
    layer: 'terrain', // actual layer resolution would need user-data lookup
  };
}

// ---------------------------------------------------------------------------
// usePhysicsQuery — convenience hook for components inside <Physics>
// ---------------------------------------------------------------------------

export interface PhysicsQueryAPI {
  castRay: typeof castRay;
  overlapTest: (
    position: [number, number, number],
    radius: number,
    layers?: CollisionLayer[],
  ) => string[];
}

export function usePhysicsQuery(): PhysicsQueryAPI {
  const overlapTest = useCallback(
    (
      position: [number, number, number],
      radius: number,
      layers?: CollisionLayer[],
    ): string[] => {
      const world = rapierWorld;
      const rapier = rapierModule;
      if (!world || !rapier) return [];

      let filterMask = 0xffff;
      if (layers) {
        filterMask = 0;
        for (const layer of layers) {
          filterMask |= getCollisionGroup(layer);
        }
      }

      const shape = new rapier.Ball(radius);
      const shapePos = { x: position[0], y: position[1], z: position[2] };
      const shapeRot = { x: 0, y: 0, z: 0, w: 1 };

      const results: string[] = [];
      world.intersectionsWithShape(shapePos, shapeRot, shape, (collider) => {
        results.push(String(collider.handle));
        return true; // continue iteration
      }, undefined, filterMask);

      return results;
    },
    [],
  );

  return useMemo(
    () => ({
      castRay,
      overlapTest,
    }),
    [overlapTest],
  );
}

// ---------------------------------------------------------------------------
// PhysicsWorld — R3F component that syncs module refs and tracks perf
// ---------------------------------------------------------------------------

export function PhysicsWorld(): React.JSX.Element | null {
  const { world, rapier } = useRapier();
  const showFPS = useGameStore((s) => s.showFPS);
  const stepStart = useRef(0);

  // Sync module-level references on mount / when world changes
  useEffect(() => {
    setRapierRefs(world, rapier);
    return () => {
      setRapierRefs(null, null);
    };
  }, [world, rapier]);

  // Track physics perf each frame (lightweight — just reads counters)
  useFrame(() => {
    if (!world) return;

    const now = performance.now();
    if (stepStart.current > 0) {
      stats.stepTimeMs = now - stepStart.current;
    }
    stepStart.current = now;

    stats.numBodies = world.bodies.len();
    stats.numColliders = world.colliders.len();
  });

  // No visual output — debug overlay is handled by the UI layer reading
  // getPhysicsStats() when showFPS is on.
  return null;
}
