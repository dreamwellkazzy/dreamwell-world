import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { CHARACTER } from '@shared/constants';
import { lerp, clamp } from '@shared/utils';

// ---- Helpers ----

function getTerrainHeight(x: number, z: number): number {
  const terrain = (window as any).__dreamwellTerrain;
  if (terrain?.getHeightAtPosition) return terrain.getHeightAtPosition(x, z);
  return 0;
}

const LOOK_AT_Y_OFFSET = 0.5; // look at player chest, not feet
const INTERIOR_FOV = 70;
const DEFAULT_FOV = 55;
const TRANSITION_SPEED = 2.0; // 1/seconds — 0.5s transition

export const CameraController: React.FC = () => {
  const { camera, gl } = useThree();

  // Orbit state
  const yaw = useRef(0);
  const pitch = useRef(0.3);
  const isRightDown = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Smooth position tracking
  const smoothPosition = useRef(new THREE.Vector3(0, 5, 10));
  const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Transition tracking
  const currentFov = useRef(DEFAULT_FOV);

  const getState = useGameStore.getState;

  // ---- Pointer events on the canvas ----
  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.button === 2) {
      isRightDown.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      // Prevent context menu while orbiting
      e.preventDefault();
    }
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (e.button === 2) {
      isRightDown.current = false;
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isRightDown.current) return;

    const state = getState();
    const sensitivity = state.mouseSensitivity * 0.003;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    yaw.current -= dx * sensitivity;
    const pitchDelta = state.invertY ? -dy * sensitivity : dy * sensitivity;
    pitch.current = clamp(pitch.current - pitchDelta, -0.5, 1.2);
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    const state = getState();
    const delta = e.deltaY > 0 ? 0.5 : -0.5;
    const newDist = clamp(
      state.followDistance + delta,
      CHARACTER.CAMERA_MIN_DISTANCE,
      CHARACTER.CAMERA_MAX_DISTANCE
    );
    state.setFollowDistance(newDist);
  }, []);

  const onContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl.domElement, onPointerDown, onPointerUp, onPointerMove, onWheel, onContextMenu]);

  // ---- Frame loop ----
  useFrame((_rootState, delta) => {
    const state = getState();
    const [px, py, pz] = state.playerPosition;

    const mode = state.cameraMode;
    const followDist = state.followDistance;
    const followH = state.followHeight;
    const smoothing = CHARACTER.CAMERA_SMOOTHING;

    // ---- Calculate desired camera position based on mode ----
    let desiredX: number;
    let desiredY: number;
    let desiredZ: number;
    let lookAtX = px;
    let lookAtY = py + LOOK_AT_Y_OFFSET;
    let lookAtZ = pz;
    let targetFov = DEFAULT_FOV;

    if (mode === 'follow' || mode === 'orbit') {
      // Spherical offset from player based on yaw/pitch
      const cosPitch = Math.cos(pitch.current);
      const sinPitch = Math.sin(pitch.current);
      const cosYaw = Math.cos(yaw.current);
      const sinYaw = Math.sin(yaw.current);

      desiredX = px + followDist * cosPitch * sinYaw;
      desiredY = py + followH + followDist * sinPitch;
      desiredZ = pz + followDist * cosPitch * cosYaw;
    } else if (mode === 'interior') {
      // Closer camera, wider FOV
      const interiorDist = Math.max(followDist * 0.5, CHARACTER.CAMERA_MIN_DISTANCE);
      const cosPitch = Math.cos(pitch.current);
      const sinPitch = Math.sin(pitch.current);
      const cosYaw = Math.cos(yaw.current);
      const sinYaw = Math.sin(yaw.current);

      desiredX = px + interiorDist * cosPitch * sinYaw;
      desiredY = py + followH * 0.6 + interiorDist * sinPitch;
      desiredZ = pz + interiorDist * cosPitch * cosYaw;
      targetFov = INTERIOR_FOV;
    } else if (mode === 'cinematic') {
      // Placeholder: smoothly drift to a position offset
      desiredX = px + 8;
      desiredY = py + 5;
      desiredZ = pz + 8;
    } else {
      // 'fixed' — maintain current camera position
      desiredX = smoothPosition.current.x;
      desiredY = smoothPosition.current.y;
      desiredZ = smoothPosition.current.z;
    }

    // ---- Terrain collision: prevent camera from going below terrain ----
    const terrainAtCamera = getTerrainHeight(desiredX, desiredZ);
    const minCameraY = terrainAtCamera + 0.5; // keep camera at least 0.5 above terrain
    if (desiredY < minCameraY) {
      desiredY = minCameraY;
    }

    // ---- Simple terrain-based line-of-sight check ----
    // Sample a few points along the ray from player to camera and ensure
    // the camera doesn't go below terrain at any sample point
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sampleX = lerp(px, desiredX, t);
      const sampleZ = lerp(pz, desiredZ, t);
      const sampleY = lerp(py + LOOK_AT_Y_OFFSET, desiredY, t);
      const terrainAtSample = getTerrainHeight(sampleX, sampleZ) + 0.5;
      if (sampleY < terrainAtSample) {
        // Camera path goes through terrain — bring camera closer
        const pullT = Math.max(0, (i - 1) / steps);
        desiredX = lerp(px, desiredX, pullT);
        desiredY = Math.max(lerp(py + LOOK_AT_Y_OFFSET, desiredY, pullT), terrainAtSample);
        desiredZ = lerp(pz, desiredZ, pullT);
        break;
      }
    }

    // ---- Smooth interpolation ----
    smoothPosition.current.x = lerp(smoothPosition.current.x, desiredX, smoothing);
    smoothPosition.current.y = lerp(smoothPosition.current.y, desiredY, smoothing);
    smoothPosition.current.z = lerp(smoothPosition.current.z, desiredZ, smoothing);

    smoothLookAt.current.x = lerp(smoothLookAt.current.x, lookAtX, smoothing);
    smoothLookAt.current.y = lerp(smoothLookAt.current.y, lookAtY, smoothing);
    smoothLookAt.current.z = lerp(smoothLookAt.current.z, lookAtZ, smoothing);

    // ---- FOV transition ----
    const clampedDelta = Math.min(delta, 0.05);
    currentFov.current = lerp(currentFov.current, targetFov, TRANSITION_SPEED * clampedDelta);
    (camera as THREE.PerspectiveCamera).fov = currentFov.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // ---- Apply to camera ----
    camera.position.set(
      smoothPosition.current.x,
      smoothPosition.current.y,
      smoothPosition.current.z
    );
    camera.lookAt(
      smoothLookAt.current.x,
      smoothLookAt.current.y,
      smoothLookAt.current.z
    );

    // ---- Update store ----
    state.setCameraPosition([
      smoothPosition.current.x,
      smoothPosition.current.y,
      smoothPosition.current.z,
    ]);
    state.setCameraLookAt([
      smoothLookAt.current.x,
      smoothLookAt.current.y,
      smoothLookAt.current.z,
    ]);
  });

  return null;
};
