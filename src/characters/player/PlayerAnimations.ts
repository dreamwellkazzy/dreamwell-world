import * as THREE from 'three';
import type { AnimationState } from '@shared/types';

// ---------------------------------------------------------------------------
// Blend state tracking (per-robot, keyed by group uuid)
// ---------------------------------------------------------------------------

interface BlendState {
  previousState: AnimationState;
  blendFactor: number; // 0 = fully previous, 1 = fully current
  fidgetTimer: number;
  fidgetActive: boolean;
  fidgetEndTime: number;
  // Stored rest transforms so we lerp from the right baseline
  headRotY: number;
  headRotX: number;
  bodyPosY: number;
  bodyRotX: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
}

const blendStates = new Map<string, BlendState>();

const BLEND_SPEED = 6.0; // units per second — how fast we transition between states

function getBlendState(id: string): BlendState {
  let state = blendStates.get(id);
  if (!state) {
    state = {
      previousState: 'idle',
      blendFactor: 1,
      fidgetTimer: 5 + Math.random() * 5,
      fidgetActive: false,
      fidgetEndTime: 0,
      headRotY: 0,
      headRotX: 0,
      bodyPosY: 0,
      bodyRotX: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
    };
    blendStates.set(id, state);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Smooth lerp helper
// ---------------------------------------------------------------------------

function lerpAngle(current: number, target: number, speed: number, delta: number): number {
  const t = 1 - Math.pow(1 - Math.min(speed, 1), delta * 60);
  return current + (target - current) * t;
}

// ---------------------------------------------------------------------------
// Target computation per animation state
// ---------------------------------------------------------------------------

interface AnimationTargets {
  headRotY: number;
  headRotX: number;
  bodyPosY: number;
  bodyRotX: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
}

function computeTargets(
  animState: AnimationState,
  time: number,
  blend: BlendState,
): AnimationTargets {
  switch (animState) {
    case 'idle': {
      // Fidget system
      let fidgetMul = 1.0;
      if (blend.fidgetActive && time < blend.fidgetEndTime) {
        fidgetMul = 2.5;
      }

      return {
        headRotY: Math.sin(time * 0.5) * 0.1 * fidgetMul,
        headRotX: Math.sin(time * 0.7) * 0.03 * fidgetMul,
        bodyPosY: Math.sin(time * 2) * 0.02,
        bodyRotX: 0,
        leftArmRotX: Math.sin(time * 1.5) * 0.05 * fidgetMul,
        leftArmRotZ: 0,
        rightArmRotX: -Math.sin(time * 1.5) * 0.05 * fidgetMul,
        rightArmRotZ: 0,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'walk': {
      const walkFreq = 8;
      return {
        headRotY: Math.sin(time * 1.0) * 0.05,
        headRotX: Math.abs(Math.sin(time * walkFreq * 2)) * 0.02,
        bodyPosY: Math.abs(Math.sin(time * walkFreq * 2)) * 0.03,
        bodyRotX: 0.03,
        leftArmRotX: -Math.sin(time * walkFreq) * 0.4,
        leftArmRotZ: 0,
        rightArmRotX: Math.sin(time * walkFreq) * 0.4,
        rightArmRotZ: 0,
        leftLegRotX: Math.sin(time * walkFreq) * 0.6,
        rightLegRotX: -Math.sin(time * walkFreq) * 0.6,
      };
    }

    case 'run': {
      const runFreq = 12;
      return {
        headRotY: Math.sin(time * 1.5) * 0.04,
        headRotX: Math.abs(Math.sin(time * runFreq * 2)) * 0.03,
        bodyPosY: Math.abs(Math.sin(time * runFreq * 2)) * 0.05,
        bodyRotX: 0.1,
        leftArmRotX: -Math.sin(time * runFreq) * 0.6,
        leftArmRotZ: 0,
        rightArmRotX: Math.sin(time * runFreq) * 0.6,
        rightArmRotZ: 0,
        leftLegRotX: Math.sin(time * runFreq) * 0.8,
        rightLegRotX: -Math.sin(time * runFreq) * 0.8,
      };
    }

    case 'interact': {
      return {
        headRotY: 0,
        headRotX: 0.2,
        bodyPosY: 0,
        bodyRotX: 0.15,
        leftArmRotX: 0,
        leftArmRotZ: 0,
        rightArmRotX: -0.8,
        rightArmRotZ: 0,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'talk': {
      // Head has small random rotations, arms gesture occasionally
      const gesturePhase = Math.sin(time * 0.4);
      const gestureArm = gesturePhase > 0.7 ? -0.5 * (gesturePhase - 0.7) / 0.3 : 0;
      return {
        headRotY: Math.sin(time * 2.3) * 0.08 + Math.sin(time * 1.1) * 0.05,
        headRotX: Math.sin(time * 1.7) * 0.04,
        bodyPosY: 0,
        bodyRotX: 0,
        leftArmRotX: gestureArm,
        leftArmRotZ: gestureArm * 0.3,
        rightArmRotX: 0,
        rightArmRotZ: 0,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'wave': {
      return {
        headRotY: 0.15,
        headRotX: 0,
        bodyPosY: 0,
        bodyRotX: 0,
        leftArmRotX: 0,
        leftArmRotZ: 0,
        rightArmRotX: -0.3,
        rightArmRotZ: -1.2 + Math.sin(time * 4) * 0.3,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'sit': {
      return {
        headRotY: Math.sin(time * 0.3) * 0.05,
        headRotX: 0.05,
        bodyPosY: -0.15,
        bodyRotX: 0,
        leftArmRotX: 0.3,
        leftArmRotZ: 0,
        rightArmRotX: 0.3,
        rightArmRotZ: 0,
        leftLegRotX: -1.3,
        rightLegRotX: -1.3,
      };
    }

    case 'tinker': {
      return {
        headRotY: Math.sin(time * 1.2) * 0.15,
        headRotX: 0.25,
        bodyPosY: 0,
        bodyRotX: 0.2,
        leftArmRotX: -0.6 + Math.sin(time * 3) * 0.15,
        leftArmRotZ: 0.2,
        rightArmRotX: -0.8 + Math.sin(time * 2.5 + 1) * 0.2,
        rightArmRotZ: -0.2,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'look_around': {
      return {
        headRotY: Math.sin(time * 0.8) * 0.4,
        headRotX: Math.sin(time * 0.5) * 0.1,
        bodyPosY: Math.sin(time * 2) * 0.01,
        bodyRotX: 0,
        leftArmRotX: Math.sin(time * 1.2) * 0.08,
        leftArmRotZ: 0,
        rightArmRotX: -Math.sin(time * 1.2) * 0.08,
        rightArmRotZ: 0,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'surprise': {
      const decay = Math.max(0, 1 - ((time % 3) / 2));
      return {
        headRotY: 0,
        headRotX: -0.15 * decay,
        bodyPosY: 0.05 * decay,
        bodyRotX: -0.05 * decay,
        leftArmRotX: -0.4 * decay,
        leftArmRotZ: 0.5 * decay,
        rightArmRotX: -0.4 * decay,
        rightArmRotZ: -0.5 * decay,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }

    case 'celebrate': {
      return {
        headRotY: Math.sin(time * 3) * 0.1,
        headRotX: -0.1,
        bodyPosY: Math.abs(Math.sin(time * 4)) * 0.06,
        bodyRotX: 0,
        leftArmRotX: -0.3 + Math.sin(time * 5) * 0.5,
        leftArmRotZ: 0.8 + Math.sin(time * 5) * 0.3,
        rightArmRotX: -0.3 + Math.sin(time * 5 + Math.PI) * 0.5,
        rightArmRotZ: -0.8 - Math.sin(time * 5 + Math.PI) * 0.3,
        leftLegRotX: Math.sin(time * 4) * 0.2,
        rightLegRotX: -Math.sin(time * 4) * 0.2,
      };
    }

    default: {
      // Fallback to idle-like stance
      return {
        headRotY: 0,
        headRotX: 0,
        bodyPosY: 0,
        bodyRotX: 0,
        leftArmRotX: 0,
        leftArmRotZ: 0,
        rightArmRotX: 0,
        rightArmRotZ: 0,
        leftLegRotX: 0,
        rightLegRotX: 0,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Procedurally animates a robot group by directly manipulating part transforms.
 * Call every frame from useFrame.
 *
 * @param robot - The robot root THREE.Group (built by buildRobot)
 * @param state - Current AnimationState
 * @param delta - Frame delta in seconds
 * @param time  - Elapsed clock time in seconds
 */
export function updatePlayerAnimation(
  robot: THREE.Group,
  state: AnimationState,
  delta: number,
  time: number,
): void {
  const { head, body, leftArm, rightArm, leftLeg, rightLeg } = robot.userData as {
    head?: THREE.Group;
    body?: THREE.Group;
    leftArm?: THREE.Group;
    rightArm?: THREE.Group;
    leftLeg?: THREE.Group;
    rightLeg?: THREE.Group;
  };

  if (!head || !body || !leftArm || !rightArm || !leftLeg || !rightLeg) return;

  const blend = getBlendState(robot.uuid);

  // Detect state change and reset blend
  if (blend.previousState !== state) {
    blend.blendFactor = 0;
    blend.previousState = state;
  }

  // Advance blend factor toward 1
  blend.blendFactor = Math.min(1, blend.blendFactor + BLEND_SPEED * delta);

  // Fidget system for idle
  if (state === 'idle') {
    blend.fidgetTimer -= delta;
    if (blend.fidgetTimer <= 0 && !blend.fidgetActive) {
      blend.fidgetActive = true;
      blend.fidgetEndTime = time + 0.3;
      blend.fidgetTimer = 5 + Math.random() * 5;
    }
    if (blend.fidgetActive && time >= blend.fidgetEndTime) {
      blend.fidgetActive = false;
    }
  } else {
    blend.fidgetActive = false;
    blend.fidgetTimer = 5 + Math.random() * 5;
  }

  // Compute target transforms
  const targets = computeTargets(state, time, blend);

  // Lerp speed factor incorporating the blend progress for smooth transitions
  const lerpSpeed = 0.15 * blend.blendFactor + 0.05;

  // Apply smooth lerp to stored values, then assign to parts
  blend.headRotY = lerpAngle(blend.headRotY, targets.headRotY, lerpSpeed, delta);
  blend.headRotX = lerpAngle(blend.headRotX, targets.headRotX, lerpSpeed, delta);
  blend.bodyPosY = lerpAngle(blend.bodyPosY, targets.bodyPosY, lerpSpeed, delta);
  blend.bodyRotX = lerpAngle(blend.bodyRotX, targets.bodyRotX, lerpSpeed, delta);
  blend.leftArmRotX = lerpAngle(blend.leftArmRotX, targets.leftArmRotX, lerpSpeed, delta);
  blend.leftArmRotZ = lerpAngle(blend.leftArmRotZ, targets.leftArmRotZ, lerpSpeed, delta);
  blend.rightArmRotX = lerpAngle(blend.rightArmRotX, targets.rightArmRotX, lerpSpeed, delta);
  blend.rightArmRotZ = lerpAngle(blend.rightArmRotZ, targets.rightArmRotZ, lerpSpeed, delta);
  blend.leftLegRotX = lerpAngle(blend.leftLegRotX, targets.leftLegRotX, lerpSpeed, delta);
  blend.rightLegRotX = lerpAngle(blend.rightLegRotX, targets.rightLegRotX, lerpSpeed, delta);

  // Write transforms to parts
  head.rotation.y = blend.headRotY;
  head.rotation.x = blend.headRotX;

  // Body Y offset is additive to the original position (body is at origin)
  body.position.y = blend.bodyPosY;
  body.rotation.x = blend.bodyRotX;

  leftArm.rotation.x = blend.leftArmRotX;
  leftArm.rotation.z = blend.leftArmRotZ;

  rightArm.rotation.x = blend.rightArmRotX;
  rightArm.rotation.z = blend.rightArmRotZ;

  leftLeg.rotation.x = blend.leftLegRotX;
  rightLeg.rotation.x = blend.rightLegRotX;
}
