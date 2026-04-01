import type { NPCDef } from '@shared/types';
import type { NPCState } from '@shared/store/slices/npcSlice';

// ---------------------------------------------------------------------------
// Module-level state maps keyed by NPC id
// ---------------------------------------------------------------------------

/** Current waypoint index for patrol_loop / patrol_bounce */
const waypointIndex = new Map<string, number>();

/** Patrol direction for patrol_bounce: 1 = forward, -1 = backward */
const patrolDirection = new Map<string, 1 | -1>();

/** Current wander target position */
const wanderTarget = new Map<string, [number, number, number]>();

/** Time remaining before picking a new wander target */
const wanderTimer = new Map<string, number>();

/** Tracks the previous behavioral state for transition detection */
const prevBehaviorState = new Map<string, 'idle' | 'patrol' | 'interact' | 'talk'>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WALK_SPEED_DEFAULT = 2.0;
const WANDER_RADIUS = 5;
const WANDER_MIN_INTERVAL = 3;
const WANDER_MAX_INTERVAL = 8;
const WAYPOINT_ARRIVAL_THRESHOLD = 0.3;
const ROTATION_LERP_SPEED = 5.0;

function distanceXZ(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

function lerpAngle(current: number, target: number, t: number): number {
  let diff = target - current;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

function angleToward(
  from: [number, number, number],
  to: [number, number, number],
): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

function randomWanderInterval(): number {
  return WANDER_MIN_INTERVAL + Math.random() * (WANDER_MAX_INTERVAL - WANDER_MIN_INTERVAL);
}

function pickWanderTarget(spawn: [number, number, number]): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * WANDER_RADIUS;
  return [
    spawn[0] + Math.cos(angle) * radius,
    spawn[1],
    spawn[2] + Math.sin(angle) * radius,
  ];
}

// ---------------------------------------------------------------------------
// Main update function
// ---------------------------------------------------------------------------

/**
 * Compute the next partial state update for a single NPC each frame.
 *
 * Priority-based state transitions:
 * 1. If player is near AND npc.isTalking -> Talk
 * 2. If player within interactionRadius -> Interact
 * 3. If has patrol path -> Patrol
 * 4. Else -> Idle
 */
export function updateNPCBehavior(
  npc: NPCState,
  def: NPCDef,
  playerPos: [number, number, number],
  delta: number,
): Partial<NPCState> {
  const id = npc.id;
  const playerDist = distanceXZ(npc.position, playerPos);
  const walkSpeed = def.robotConfig.personality.walkSpeed ?? WALK_SPEED_DEFAULT;

  // ----- Priority 1: Talk -----
  if (npc.isTalking && playerDist <= def.interactionRadius * 1.5) {
    prevBehaviorState.set(id, 'talk');
    const targetRot = angleToward(npc.position, playerPos);
    return {
      rotation: lerpAngle(npc.rotation, targetRot, ROTATION_LERP_SPEED * delta),
      currentAnimation: 'talk',
    };
  }

  // ----- Priority 2: Interact (player within interaction radius) -----
  if (playerDist <= def.interactionRadius) {
    prevBehaviorState.set(id, 'interact');
    const targetRot = angleToward(npc.position, playerPos);
    return {
      rotation: lerpAngle(npc.rotation, targetRot, ROTATION_LERP_SPEED * delta),
      currentAnimation: 'wave',
    };
  }

  // ----- Priority 3: Patrol -----
  if (def.patrolMode !== 'static' && (def.patrolPath || def.patrolMode === 'wander')) {
    prevBehaviorState.set(id, 'patrol');

    switch (def.patrolMode) {
      case 'patrol_loop':
        return updatePatrolLoop(id, npc, def, walkSpeed, delta);

      case 'patrol_bounce':
        return updatePatrolBounce(id, npc, def, walkSpeed, delta);

      case 'wander':
        return updateWander(id, npc, def, walkSpeed, delta);

      default:
        break;
    }
  }

  // ----- Priority 4: Idle -----
  prevBehaviorState.set(id, 'idle');
  return {
    currentAnimation: 'idle',
  };
}

// ---------------------------------------------------------------------------
// Patrol: Loop
// ---------------------------------------------------------------------------

function updatePatrolLoop(
  id: string,
  npc: NPCState,
  def: NPCDef,
  walkSpeed: number,
  delta: number,
): Partial<NPCState> {
  const path = def.patrolPath!;
  if (path.length === 0) return { currentAnimation: 'idle' };

  if (!waypointIndex.has(id)) waypointIndex.set(id, 0);
  let idx = waypointIndex.get(id)!;

  const target = path[idx];
  const dist = distanceXZ(npc.position, target);

  if (dist < WAYPOINT_ARRIVAL_THRESHOLD) {
    idx = (idx + 1) % path.length;
    waypointIndex.set(id, idx);
    return { currentAnimation: 'walk' };
  }

  return moveToward(npc, target, walkSpeed, delta);
}

// ---------------------------------------------------------------------------
// Patrol: Bounce
// ---------------------------------------------------------------------------

function updatePatrolBounce(
  id: string,
  npc: NPCState,
  def: NPCDef,
  walkSpeed: number,
  delta: number,
): Partial<NPCState> {
  const path = def.patrolPath!;
  if (path.length === 0) return { currentAnimation: 'idle' };

  if (!waypointIndex.has(id)) waypointIndex.set(id, 0);
  if (!patrolDirection.has(id)) patrolDirection.set(id, 1);

  let idx = waypointIndex.get(id)!;
  let dir = patrolDirection.get(id)!;

  const target = path[idx];
  const dist = distanceXZ(npc.position, target);

  if (dist < WAYPOINT_ARRIVAL_THRESHOLD) {
    idx += dir;
    if (idx >= path.length) {
      dir = -1;
      idx = path.length - 2;
    } else if (idx < 0) {
      dir = 1;
      idx = 1;
    }
    // Clamp for safety
    idx = Math.max(0, Math.min(idx, path.length - 1));
    waypointIndex.set(id, idx);
    patrolDirection.set(id, dir);
    return { currentAnimation: 'walk' };
  }

  return moveToward(npc, target, walkSpeed, delta);
}

// ---------------------------------------------------------------------------
// Patrol: Wander
// ---------------------------------------------------------------------------

function updateWander(
  id: string,
  npc: NPCState,
  def: NPCDef,
  walkSpeed: number,
  delta: number,
): Partial<NPCState> {
  // Initialize or decrement timer
  if (!wanderTimer.has(id)) {
    wanderTimer.set(id, randomWanderInterval());
    wanderTarget.set(id, [...def.position]);
  }

  let timer = wanderTimer.get(id)!;
  timer -= delta;

  if (timer <= 0 || !wanderTarget.has(id)) {
    wanderTarget.set(id, pickWanderTarget(def.position));
    wanderTimer.set(id, randomWanderInterval());
  } else {
    wanderTimer.set(id, timer);
  }

  const target = wanderTarget.get(id)!;
  const dist = distanceXZ(npc.position, target);

  if (dist < WAYPOINT_ARRIVAL_THRESHOLD) {
    return { currentAnimation: 'idle' };
  }

  return moveToward(npc, target, walkSpeed * 0.6, delta);
}

// ---------------------------------------------------------------------------
// Shared movement helper
// ---------------------------------------------------------------------------

function moveToward(
  npc: NPCState,
  target: [number, number, number],
  speed: number,
  delta: number,
): Partial<NPCState> {
  const dx = target[0] - npc.position[0];
  const dz = target[2] - npc.position[2];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.01) {
    return { currentAnimation: 'walk' };
  }

  const nx = dx / dist;
  const nz = dz / dist;
  const step = Math.min(speed * delta, dist);

  const newPos: [number, number, number] = [
    npc.position[0] + nx * step,
    npc.position[1], // Y will be set by terrain snapping in NPCEntity
    npc.position[2] + nz * step,
  ];

  const targetRot = Math.atan2(nx, nz);
  const newRot = lerpAngle(npc.rotation, targetRot, ROTATION_LERP_SPEED * delta);

  return {
    position: newPos,
    rotation: newRot,
    currentAnimation: 'walk',
  };
}
