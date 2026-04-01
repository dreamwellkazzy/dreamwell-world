import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { CHARACTER } from '@shared/constants';
import { EventBus } from '@shared/events';
import { buildRobot } from '@characters/robot/RobotBuilder';
import { updateExpression } from '@characters/robot/RobotExpressions';
import { updatePlayerAnimation } from './PlayerAnimations';
import { usePlayerAccessories } from './PlayerAccessories';
import { getHeightAtPosition } from '@world/terrain/TerrainGenerator';

const RESPAWN_THRESHOLD = -50;
const SPAWN_X = 0;
const SPAWN_Z = 0;

// ---------------------------------------------------------------------------
// Module-level rigid body reference (for PlayerController access)
// ---------------------------------------------------------------------------

let rigidBodyRef: RapierRigidBody | null = null;

/**
 * Returns the player's Rapier RigidBody, or null if the player
 * has not mounted yet. Used by the PlayerController to apply forces.
 */
export function getPlayerRigidBody(): RapierRigidBody | null {
  return rigidBodyRef;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _tempVec3 = new THREE.Vector3();

/** Frame-rate-independent smooth lerp for angles. */
function lerpAngle(current: number, target: number, speed: number, delta: number): number {
  const t = 1 - Math.pow(1 - Math.min(speed, 1), delta * 60);
  return current + (target - current) * t;
}

// ---------------------------------------------------------------------------
// PlayerEntity Component
// ---------------------------------------------------------------------------

export const PlayerEntity: React.FC = () => {
  const rbRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);

  // Store selectors — grab stable references
  const playerRobotConfig = useGameStore((s) => s.playerRobotConfig);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setPlayerRotation = useGameStore((s) => s.setPlayerRotation);

  // Build the robot mesh (memoised on config identity)
  const robotGroup = useMemo(() => buildRobot(playerRobotConfig), [playerRobotConfig]);

  // Sync module-level ref so external systems can read the rigid body
  useEffect(() => {
    rigidBodyRef = rbRef.current;
    return () => {
      rigidBodyRef = null;
    };
  }, []);

  // Accessory hot-swap hook
  usePlayerAccessories(robotGroup);

  // Per-frame update
  useFrame((frameState, delta) => {
    const rb = rbRef.current;
    if (!rb) return;

    // --- Sync position from physics to store ---
    const pos = rb.translation();
    const position: [number, number, number] = [pos.x, pos.y, pos.z];
    setPlayerPosition(position);

    // --- Respawn if fallen into void ---
    if (pos.y < RESPAWN_THRESHOLD) {
      const spawnY = getHeightAtPosition(SPAWN_X, SPAWN_Z) + 3;
      rb.setTranslation({ x: SPAWN_X, y: spawnY, z: SPAWN_Z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // Emit movement event for other systems
    EventBus.emit({ type: 'PLAYER_MOVED', position });

    // --- Read velocity for rotation computation ---
    const vel = rb.linvel();
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

    // --- Rotate robot to face movement direction (smooth lerp) ---
    if (horizontalSpeed > 0.1) {
      const targetAngle = Math.atan2(vel.x, vel.z);
      rotationRef.current = lerpAngle(
        rotationRef.current,
        targetAngle,
        0.2,
        delta,
      );
      setPlayerRotation(rotationRef.current);
    }

    // --- Animation ---
    const currentAnimation = useGameStore.getState().currentAnimation;
    const clockTime = frameState.clock.elapsedTime;

    updatePlayerAnimation(robotGroup, currentAnimation, delta, clockTime);

    // Expression: map animation state to a face expression
    const expression = animationToExpression(currentAnimation);
    updateExpression(robotGroup, expression, delta);

    // --- Apply rotation to the group wrapping the robot ---
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationRef.current;
    }

    // --- Hide mesh when camera is too close (prevent clipping) ---
    const cameraPos = frameState.camera.position;
    _tempVec3.set(pos.x, pos.y, pos.z);
    const cameraDist = cameraPos.distanceTo(_tempVec3);
    if (groupRef.current) {
      groupRef.current.visible = cameraDist >= 1.5;
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      lockRotations
      colliders={false}
      position={[SPAWN_X, 15, SPAWN_Z]}
    >
      <CapsuleCollider
        args={[CHARACTER.CAPSULE_HEIGHT / 2, CHARACTER.CAPSULE_RADIUS]}
      />
      <group ref={groupRef}>
        <primitive object={robotGroup} castShadow />
      </group>
    </RigidBody>
  );
};

// ---------------------------------------------------------------------------
// Map animation state to expression
// ---------------------------------------------------------------------------

function animationToExpression(
  anim: ReturnType<typeof useGameStore.getState>['currentAnimation'],
): 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry' | 'thinking' | 'talking' | 'blink' {
  switch (anim) {
    case 'idle':
    case 'look_around':
      return 'neutral';
    case 'walk':
    case 'run':
      return 'neutral';
    case 'interact':
    case 'tinker':
      return 'thinking';
    case 'talk':
      return 'talking';
    case 'wave':
    case 'celebrate':
      return 'happy';
    case 'surprise':
      return 'surprised';
    case 'sit':
      return 'neutral';
    default:
      return 'neutral';
  }
}
