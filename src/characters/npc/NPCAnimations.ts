import * as THREE from 'three';
import type { AnimationState, IdleAnimationType } from '@shared/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lerpScalar(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

// ---------------------------------------------------------------------------
// Core walk / run shared with player system (sin-based procedural)
// ---------------------------------------------------------------------------

function applyWalkAnimation(
  robot: THREE.Group,
  time: number,
  walkSpeed: number,
  amplitude: number,
): void {
  const { leftArm, rightArm, leftLeg, rightLeg, body } = robot.userData as {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    body: THREE.Group;
  };

  const freq = walkSpeed * 2.0;
  const swing = Math.sin(time * freq);

  // Arms swing opposite to legs
  if (leftArm) leftArm.rotation.x = swing * amplitude * 0.6;
  if (rightArm) rightArm.rotation.x = -swing * amplitude * 0.6;

  // Legs
  if (leftLeg) leftLeg.rotation.x = -swing * amplitude;
  if (rightLeg) rightLeg.rotation.x = swing * amplitude;

  // Subtle body bob
  if (body) body.position.y = Math.abs(Math.sin(time * freq * 2)) * 0.02 * amplitude;
}

function applyIdleBreathing(
  robot: THREE.Group,
  time: number,
): void {
  const { body } = robot.userData as { body: THREE.Group };
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.008;
  }
}

// ---------------------------------------------------------------------------
// NPC-specific idle variants
// ---------------------------------------------------------------------------

function applyFidget(
  robot: THREE.Group,
  time: number,
): void {
  const { body, head, leftArm, rightArm } = robot.userData as {
    body: THREE.Group;
    head: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
  };

  // Small random-feeling body movements using multiple sin frequencies
  if (body) {
    body.position.y = Math.sin(time * 1.8) * 0.01;
    body.rotation.z = Math.sin(time * 0.7) * 0.02;
  }
  if (head) {
    head.rotation.y = Math.sin(time * 0.5) * 0.08;
    head.rotation.x = Math.sin(time * 0.9) * 0.03;
  }
  if (leftArm) {
    leftArm.rotation.z = Math.sin(time * 1.2) * 0.04;
  }
  if (rightArm) {
    rightArm.rotation.z = -Math.sin(time * 1.1) * 0.04;
  }
}

function applyLookAround(
  robot: THREE.Group,
  time: number,
): void {
  const { head, body } = robot.userData as {
    head: THREE.Group;
    body: THREE.Group;
  };

  if (head) {
    head.rotation.y = Math.sin(time * 0.3) * 0.4;
    head.rotation.x = Math.sin(time * 0.2) * 0.05;
  }
  // Subtle body sway following head
  if (body) {
    body.rotation.y = Math.sin(time * 0.3) * 0.05;
    body.position.y = Math.sin(time * 1.5) * 0.005;
  }
}

function applyTapDesk(
  robot: THREE.Group,
  time: number,
): void {
  const { rightArm, body, head } = robot.userData as {
    rightArm: THREE.Group;
    body: THREE.Group;
    head: THREE.Group;
  };

  // Right arm taps downward rhythmically
  if (rightArm) {
    const tap = Math.abs(Math.sin(time * 3.0));
    rightArm.rotation.x = -0.5 - tap * 0.3;
    rightArm.rotation.z = -0.1;
  }
  // Slight head bob following the rhythm
  if (head) {
    head.rotation.x = Math.sin(time * 3.0) * 0.03;
  }
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.005;
  }
}

function applyWaveIdle(
  robot: THREE.Group,
  time: number,
): void {
  const { rightArm, body, head } = robot.userData as {
    rightArm: THREE.Group;
    body: THREE.Group;
    head: THREE.Group;
  };

  // Right arm raises and waves side to side
  if (rightArm) {
    rightArm.rotation.x = -0.2;
    rightArm.rotation.z = -1.2 + Math.sin(time * 4.0) * 0.3;
  }
  if (head) {
    head.rotation.y = Math.sin(time * 0.8) * 0.1;
  }
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.005;
  }
}

function applyTinker(
  robot: THREE.Group,
  time: number,
): void {
  const { leftArm, rightArm, head, body } = robot.userData as {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Group;
    body: THREE.Group;
  };

  // Both arms move in small circular motions (working on something)
  if (leftArm) {
    leftArm.rotation.x = -0.6 + Math.sin(time * 2.5) * 0.15;
    leftArm.rotation.z = 0.3 + Math.cos(time * 2.5) * 0.1;
  }
  if (rightArm) {
    rightArm.rotation.x = -0.6 + Math.cos(time * 2.5) * 0.15;
    rightArm.rotation.z = -0.3 + Math.sin(time * 2.5) * 0.1;
  }
  // Head looks down at work
  if (head) {
    head.rotation.x = 0.15;
    head.rotation.y = Math.sin(time * 0.4) * 0.08;
  }
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.005;
  }
}

// ---------------------------------------------------------------------------
// Talk animation
// ---------------------------------------------------------------------------

function applyTalkAnimation(
  robot: THREE.Group,
  time: number,
): void {
  const { head, body, rightArm, leftArm } = robot.userData as {
    head: THREE.Group;
    body: THREE.Group;
    rightArm: THREE.Group;
    leftArm: THREE.Group;
  };

  // Head nods / tilts while talking
  if (head) {
    head.rotation.x = Math.sin(time * 2.5) * 0.06;
    head.rotation.y = Math.sin(time * 1.2) * 0.1;
  }
  // Subtle body lean
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.008;
    body.rotation.z = Math.sin(time * 0.8) * 0.02;
  }
  // Gentle hand gestures
  if (rightArm) {
    rightArm.rotation.x = -0.3 + Math.sin(time * 1.8) * 0.15;
    rightArm.rotation.z = -0.15;
  }
  if (leftArm) {
    leftArm.rotation.x = -0.2 + Math.sin(time * 1.5) * 0.08;
    leftArm.rotation.z = 0.15;
  }
}

// ---------------------------------------------------------------------------
// Wave animation (interaction greeting)
// ---------------------------------------------------------------------------

function applyWaveAnimation(
  robot: THREE.Group,
  time: number,
): void {
  const { rightArm, head, body } = robot.userData as {
    rightArm: THREE.Group;
    head: THREE.Group;
    body: THREE.Group;
  };

  if (rightArm) {
    rightArm.rotation.x = -0.1;
    rightArm.rotation.z = -1.4 + Math.sin(time * 5.0) * 0.35;
  }
  if (head) {
    head.rotation.y = Math.sin(time * 1.0) * 0.15;
  }
  if (body) {
    body.position.y = Math.sin(time * 1.5) * 0.005;
  }
}

// ---------------------------------------------------------------------------
// Surprise animation
// ---------------------------------------------------------------------------

function applySurpriseAnimation(
  robot: THREE.Group,
  time: number,
): void {
  const { head, body, leftArm, rightArm } = robot.userData as {
    head: THREE.Group;
    body: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
  };

  if (body) {
    body.position.y = 0.05;
  }
  if (head) {
    head.rotation.x = -0.15;
  }
  if (leftArm) {
    leftArm.rotation.z = 0.5 + Math.sin(time * 6.0) * 0.05;
  }
  if (rightArm) {
    rightArm.rotation.z = -0.5 + Math.sin(time * 6.0) * 0.05;
  }
}

// ---------------------------------------------------------------------------
// Celebrate animation
// ---------------------------------------------------------------------------

function applyCelebrateAnimation(
  robot: THREE.Group,
  time: number,
): void {
  const { body, leftArm, rightArm, head } = robot.userData as {
    body: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Group;
  };

  if (body) {
    body.position.y = Math.abs(Math.sin(time * 4.0)) * 0.06;
  }
  if (leftArm) {
    leftArm.rotation.z = 1.2 + Math.sin(time * 5.0) * 0.3;
  }
  if (rightArm) {
    rightArm.rotation.z = -1.2 + Math.sin(time * 5.0) * 0.3;
  }
  if (head) {
    head.rotation.y = Math.sin(time * 3.0) * 0.2;
  }
}

// ---------------------------------------------------------------------------
// Reset helpers — smoothly return parts toward rest pose
// ---------------------------------------------------------------------------

function resetParts(robot: THREE.Group, delta: number): void {
  const { leftArm, rightArm, leftLeg, rightLeg, body, head } = robot.userData as {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    body: THREE.Group;
    head: THREE.Group;
  };

  const speed = Math.min(delta * 6.0, 1.0);

  if (leftArm) {
    leftArm.rotation.x = lerpScalar(leftArm.rotation.x, 0, speed);
    leftArm.rotation.z = lerpScalar(leftArm.rotation.z, 0, speed);
  }
  if (rightArm) {
    rightArm.rotation.x = lerpScalar(rightArm.rotation.x, 0, speed);
    rightArm.rotation.z = lerpScalar(rightArm.rotation.z, 0, speed);
  }
  if (leftLeg) {
    leftLeg.rotation.x = lerpScalar(leftLeg.rotation.x, 0, speed);
  }
  if (rightLeg) {
    rightLeg.rotation.x = lerpScalar(rightLeg.rotation.x, 0, speed);
  }
  if (body) {
    body.position.y = lerpScalar(body.position.y, 0, speed);
    body.rotation.y = lerpScalar(body.rotation.y, 0, speed);
    body.rotation.z = lerpScalar(body.rotation.z, 0, speed);
  }
  if (head) {
    head.rotation.x = lerpScalar(head.rotation.x, 0, speed);
    head.rotation.y = lerpScalar(head.rotation.y, 0, speed);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Updates procedural animation on an NPC robot group.
 *
 * Reuses the core sin-based walk/run/talk/wave approach from the player
 * animation system, and adds NPC-specific idle variants.
 *
 * @param robot     - The robot THREE.Group from buildRobot()
 * @param state     - Current animation state
 * @param idleType  - Idle variant type from the NPC's personality
 * @param delta     - Frame delta time in seconds
 * @param time      - Total elapsed time for sin-based animations
 * @param walkSpeed - Walk speed scalar that controls stride frequency
 */
export function updateNPCAnimation(
  robot: THREE.Group,
  state: AnimationState,
  idleType: IdleAnimationType,
  delta: number,
  time: number,
  walkSpeed: number,
): void {
  // First, smoothly reset parts toward neutral so transitions are clean
  resetParts(robot, delta);

  switch (state) {
    case 'idle':
      // Apply the NPC-specific idle variant
      switch (idleType) {
        case 'fidget':
          applyFidget(robot, time);
          break;
        case 'look_around':
          applyLookAround(robot, time);
          break;
        case 'tap_desk':
          applyTapDesk(robot, time);
          break;
        case 'wave':
          applyWaveIdle(robot, time);
          break;
        case 'tinker':
          applyTinker(robot, time);
          break;
        default:
          applyIdleBreathing(robot, time);
          break;
      }
      break;

    case 'walk':
      applyWalkAnimation(robot, time, walkSpeed, 0.4);
      break;

    case 'run':
      applyWalkAnimation(robot, time, walkSpeed * 1.5, 0.65);
      break;

    case 'talk':
      applyTalkAnimation(robot, time);
      break;

    case 'wave':
      applyWaveAnimation(robot, time);
      break;

    case 'interact':
      applyWaveAnimation(robot, time);
      break;

    case 'surprise':
      applySurpriseAnimation(robot, time);
      break;

    case 'celebrate':
      applyCelebrateAnimation(robot, time);
      break;

    case 'sit':
      // Sit: legs bent, arms resting
      {
        const { leftLeg, rightLeg, leftArm, rightArm } = robot.userData as {
          leftLeg: THREE.Group;
          rightLeg: THREE.Group;
          leftArm: THREE.Group;
          rightArm: THREE.Group;
        };
        if (leftLeg) leftLeg.rotation.x = -1.2;
        if (rightLeg) rightLeg.rotation.x = -1.2;
        if (leftArm) leftArm.rotation.x = -0.3;
        if (rightArm) rightArm.rotation.x = -0.3;
      }
      applyIdleBreathing(robot, time);
      break;

    case 'tinker':
      applyTinker(robot, time);
      break;

    case 'look_around':
      applyLookAround(robot, time);
      break;

    default:
      applyIdleBreathing(robot, time);
      break;
  }
}
