import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { CHARACTER } from '@shared/constants';
import { EventBus } from '@shared/events';
import { getPlayerRigidBody } from '@characters/player/PlayerEntity';
import { groundCheck } from '@physics/RaycastManager';
import { touchInput } from './TouchController';
import type { AnimationState } from '@shared/types';

const ACCEL_LERP = 0.12;
const DECEL_LERP = 0.2;
const EMIT_INTERVAL = 10; // emit PLAYER_MOVED every N frames
const GROUND_CHECK_DISTANCE = 1.5;

export const PlayerController: React.FC = () => {
  const { camera } = useThree();

  // Pressed keys
  const keys = useRef(new Set<string>());
  const frameCounter = useRef(0);

  // Smooth velocity tracking
  const currentVelocity = useRef(new THREE.Vector3());

  // ---- Store selectors (read once per frame via getState, not per-render) ----
  const getState = useGameStore.getState;

  // ---- Key listeners ----
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current.add(e.code);

    const state = getState();

    // Toggle keys (on key down, not held)
    switch (e.code) {
      case 'Escape':
        state.setPaused(!state.isPaused);
        return;
      case 'KeyM':
        if (!state.isPaused) state.setShowMinimap(!state.showMinimap);
        return;
      case 'KeyP':
        if (!state.isPaused) state.setPhone(!state.isPhoneOpen);
        return;
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // ---- Frame loop ----
  useFrame((_rootState, delta) => {
    const rb = getPlayerRigidBody();
    if (!rb) return;

    const state = getState();

    // --- Block movement when UI is blocking ---
    const blocked = state.isPaused || state.isDialogueOpen || state.isPhoneOpen;

    // --- Read input (keyboard + touch merge) ---
    let inputX = 0;
    let inputZ = 0;
    let wantsRun = false;
    let wantsJump = false;
    let wantsInteract = false;

    if (!blocked) {
      const k = keys.current;

      // Keyboard input
      if (k.has('KeyW') || k.has('ArrowUp')) inputZ -= 1;
      if (k.has('KeyS') || k.has('ArrowDown')) inputZ += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) inputX -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) inputX += 1;
      wantsRun = k.has('ShiftLeft') || k.has('ShiftRight');
      wantsJump = k.has('Space');
      wantsInteract = k.has('KeyE');

      // Merge touch input
      if (touchInput.moveX !== 0 || touchInput.moveY !== 0) {
        inputX = touchInput.moveX;
        inputZ = touchInput.moveY;
      }
      if (touchInput.jump) {
        wantsJump = true;
        touchInput.jump = false; // consume
      }
      if (touchInput.interact) {
        wantsInteract = true;
        touchInput.interact = false; // consume
      }
    }

    // --- Calculate camera-relative movement direction ---
    const cameraYaw = Math.atan2(
      camera.position.x - state.playerPosition[0],
      camera.position.z - state.playerPosition[2]
    );

    // Forward is away from camera, right is perpendicular
    const sinYaw = Math.sin(cameraYaw);
    const cosYaw = Math.cos(cameraYaw);

    // Rotate input by camera yaw so forward = toward where camera looks
    let dirX = inputX * cosYaw + inputZ * sinYaw;
    let dirZ = -inputX * sinYaw + inputZ * cosYaw;

    // Normalize if magnitude > 1
    const inputMag = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (inputMag > 1) {
      dirX /= inputMag;
      dirZ /= inputMag;
    }

    const hasMovementInput = inputMag > 0.01;

    // --- Speed ---
    const speed = wantsRun ? CHARACTER.RUN_SPEED : CHARACTER.WALK_SPEED;

    // --- Target velocity ---
    const targetVx = dirX * speed * Math.min(inputMag, 1);
    const targetVz = dirZ * speed * Math.min(inputMag, 1);

    // --- Smooth acceleration / deceleration ---
    const lerpFactor = hasMovementInput ? ACCEL_LERP : DECEL_LERP;
    currentVelocity.current.x += (targetVx - currentVelocity.current.x) * lerpFactor;
    currentVelocity.current.z += (targetVz - currentVelocity.current.z) * lerpFactor;

    // Snap to zero when close enough (avoid sliding forever)
    if (!hasMovementInput && Math.abs(currentVelocity.current.x) < 0.05) currentVelocity.current.x = 0;
    if (!hasMovementInput && Math.abs(currentVelocity.current.z) < 0.05) currentVelocity.current.z = 0;

    // --- Ground detection via physics raycast ---
    const rbPos = rb.translation();

    const groundResult = groundCheck(
      [rbPos.x, rbPos.y, rbPos.z],
      GROUND_CHECK_DISTANCE
    );

    // Player is grounded if the raycast hit something within the capsule extent + small margin
    const grounded = groundResult.hit && groundResult.distance < CHARACTER.CAPSULE_HEIGHT / 2 + 0.15;

    // --- Y velocity (gravity + jump) ---
    const currentLinvel = rb.linvel();
    let vy = currentLinvel.y;

    if (wantsJump && grounded) {
      vy = CHARACTER.JUMP_FORCE;
    }

    // --- Apply velocity to rigid body ---
    rb.setLinvel(
      { x: currentVelocity.current.x, y: vy, z: currentVelocity.current.z },
      true
    );

    // --- Update player rotation toward movement direction ---
    if (hasMovementInput) {
      const targetRotation = Math.atan2(currentVelocity.current.x, currentVelocity.current.z);
      const currentRot = state.playerRotation;
      // Shortest-angle lerp
      let diff = targetRotation - currentRot;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const clampedDelta = Math.min(delta, 0.05); // cap delta to prevent huge jumps
      const newRot = currentRot + diff * CHARACTER.TURN_SPEED * clampedDelta;
      state.setPlayerRotation(newRot);
    }

    // --- Interaction ---
    if (wantsInteract && state.interactionPrompt?.visible) {
      state.setInteracting(true);
      // Interaction events are fired by InteractionController
    } else if (!wantsInteract && state.isInteracting) {
      state.setInteracting(false);
    }

    // --- Animation state machine ---
    let nextAnim: AnimationState = state.currentAnimation;

    if (blocked) {
      // Keep current or go idle
      if (state.isDialogueOpen) {
        nextAnim = 'talk';
      }
    } else if (state.isInteracting) {
      nextAnim = 'interact';
    } else if (grounded) {
      if (hasMovementInput) {
        nextAnim = wantsRun ? 'run' : 'walk';
      } else {
        nextAnim = 'idle';
      }
    }
    // If airborne, keep current animation (don't flicker)

    // --- Update store ---
    const newPos: [number, number, number] = [rbPos.x, rbPos.y, rbPos.z];
    const newVel: [number, number, number] = [
      currentVelocity.current.x,
      vy,
      currentVelocity.current.z,
    ];

    state.setPlayerPosition(newPos);
    state.setPlayerVelocity(newVel);

    if (state.isGrounded !== grounded) state.setGrounded(grounded);
    if (state.isRunning !== wantsRun) state.setRunning(wantsRun);
    if (state.currentAnimation !== nextAnim) state.setAnimation(nextAnim);

    // --- Emit PLAYER_MOVED periodically ---
    frameCounter.current++;
    if (frameCounter.current >= EMIT_INTERVAL) {
      frameCounter.current = 0;
      EventBus.emit({ type: 'PLAYER_MOVED', position: newPos });
    }
  });

  return null;
};
