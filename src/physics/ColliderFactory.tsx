import type { ColliderDef, ColliderShape, CollisionLayer } from '@shared/types';

// ---------------------------------------------------------------------------
// Collision group bitmasks
// ---------------------------------------------------------------------------

const COLLISION_GROUPS: Record<CollisionLayer, number> = {
  terrain:   0x0001,
  structure: 0x0002,
  prop:      0x0004,
  npc:       0x0008,
  player:    0x0010,
  trigger:   0x0020,
  water:     0x0040,
};

/**
 * Collision masks — defines which layers each layer can interact with.
 *
 * - player  : terrain | structure | prop | trigger | water
 * - npc     : terrain | structure
 * - prop    : terrain | structure | player
 * - trigger : player only
 * - terrain : everything except trigger
 * - structure: everything except trigger
 * - water   : player only
 */
const COLLISION_MASKS: Record<CollisionLayer, number> = {
  player:    0x0067, // terrain | structure | prop | trigger | water
  npc:       0x0003, // terrain | structure
  prop:      0x0013, // terrain | structure | player
  trigger:   0x0010, // player
  terrain:   0x005f, // all except trigger
  structure: 0x005f, // all except trigger
  water:     0x0010, // player
};

/** Return the membership bitmask for a collision layer. */
export function getCollisionGroup(layer: CollisionLayer): number {
  return COLLISION_GROUPS[layer];
}

/** Return the filter bitmask (what this layer collides with). */
export function getCollisionMask(layer: CollisionLayer): number {
  return COLLISION_MASKS[layer];
}

/**
 * Combine membership + filter into the packed u32 that Rapier expects.
 *
 * Rapier interaction groups pack two u16 values:
 *   bits 16..31 = memberships (which groups this collider belongs to)
 *   bits  0..15 = filter      (which groups this collider interacts with)
 */
export function interactionGroupsFromLayer(layer: CollisionLayer): number {
  const membership = getCollisionGroup(layer);
  const filter = getCollisionMask(layer);
  return (membership << 16) | filter;
}

// ---------------------------------------------------------------------------
// Collider props generation
// ---------------------------------------------------------------------------

export type ColliderType = 'cuboid' | 'ball' | 'capsule';

export interface ColliderProps {
  /** The React Three Rapier collider component type to render. */
  colliderType: ColliderType;
  /** Shape args passed to the collider component (half-extents, radius, etc.) */
  args: number[];
  /** World-space position. */
  position: [number, number, number];
  /** Euler rotation in radians. */
  rotation: [number, number, number];
  /** Whether this collider is a sensor / trigger. */
  sensor: boolean;
  /** Packed Rapier interaction groups (membership << 16 | filter). */
  collisionGroups: number;
}

/**
 * Map a `ColliderShape` from the game's data model to the React Three Rapier
 * collider component type and generate the shape arguments.
 */
function resolveShape(
  shape: ColliderShape,
  size: [number, number, number],
): { colliderType: ColliderType; args: number[] } {
  switch (shape) {
    case 'box':
      // CuboidCollider expects half-extents [hx, hy, hz]
      return { colliderType: 'cuboid', args: [size[0] / 2, size[1] / 2, size[2] / 2] };

    case 'sphere':
      // BallCollider expects [radius]. Use X as diameter.
      return { colliderType: 'ball', args: [size[0] / 2] };

    case 'capsule':
      // CapsuleCollider expects [halfHeight, radius].
      // size[1] = total height, size[0] = diameter
      return {
        colliderType: 'capsule',
        args: [size[1] / 2, size[0] / 2],
      };

    case 'trimesh':
    case 'heightfield':
      // Trimesh and heightfield need actual mesh data; fall back to a box
      // that encloses the declared size as a placeholder.
      return { colliderType: 'cuboid', args: [size[0] / 2, size[1] / 2, size[2] / 2] };

    default: {
      const _exhaustive: never = shape;
      return { colliderType: 'cuboid', args: [0.5, 0.5, 0.5] };
    }
  }
}

/**
 * Convert a `ColliderDef` into props that can be spread onto the matching
 * React Three Rapier collider component.
 */
export function createColliderProps(def: ColliderDef): ColliderProps {
  const { colliderType, args } = resolveShape(def.type, def.size);

  return {
    colliderType,
    args,
    position: def.position,
    rotation: def.rotation,
    sensor: def.isTrigger,
    collisionGroups: interactionGroupsFromLayer(def.layer),
  };
}

// ---------------------------------------------------------------------------
// ColliderFromDef — React component that renders a Rapier collider from a def
// ---------------------------------------------------------------------------

import React from 'react';
import {
  CuboidCollider,
  BallCollider,
  CapsuleCollider,
} from '@react-three/rapier';

/**
 * Renders the correct `@react-three/rapier` collider primitive for a given
 * `ColliderDef`. Drop this inside a `<RigidBody>` or directly inside
 * `<Physics>` (as a fixed / kinematic collider).
 */
export const ColliderFromDef: React.FC<{ def: ColliderDef }> = React.memo(
  ({ def }) => {
    const props = createColliderProps(def);

    const shared = {
      position: props.position,
      rotation: props.rotation,
      sensor: props.sensor,
      collisionGroups: props.collisionGroups,
      name: def.id,
    };

    switch (props.colliderType) {
      case 'cuboid':
        return (
          <CuboidCollider
            args={props.args as [number, number, number]}
            {...shared}
          />
        );
      case 'ball':
        return (
          <BallCollider
            args={props.args as [number]}
            {...shared}
          />
        );
      case 'capsule':
        return (
          <CapsuleCollider
            args={props.args as [number, number]}
            {...shared}
          />
        );
      default:
        return null;
    }
  },
);

ColliderFromDef.displayName = 'ColliderFromDef';
