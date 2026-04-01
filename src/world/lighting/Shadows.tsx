import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { WORLD } from '@shared/constants';

/**
 * Configures and updates the shadow camera to track the player.
 * Attaches to the scene's first directional light that casts shadows.
 * Quality-adaptive shadow map size is read from the store.
 */
export const Shadows = () => {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const { scene } = useThree();

  const quality = useGameStore((s) => s.qualitySettings);

  // Find the first shadow-casting directional light in the scene
  useEffect(() => {
    scene.traverse((obj) => {
      if (
        obj instanceof THREE.DirectionalLight &&
        obj.castShadow &&
        !lightRef.current
      ) {
        lightRef.current = obj;
      }
    });
  }, [scene]);

  // Update shadow map size when quality changes
  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;

    const size = quality.shadowMapSize;
    light.shadow.mapSize.set(size, size);

    // Dispose the existing shadow map so Three.js recreates it at the new size
    if (light.shadow.map) {
      light.shadow.map.dispose();
      light.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    }
  }, [quality.shadowMapSize]);

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;

    const [px, , pz] = useGameStore.getState().playerPosition;

    // Center the shadow camera frustum on the player
    const cam = light.shadow.camera as THREE.OrthographicCamera;
    const halfSize = WORLD.SHADOW_CAMERA_SIZE / 2;

    cam.left = -halfSize;
    cam.right = halfSize;
    cam.top = halfSize;
    cam.bottom = -halfSize;
    cam.near = 0.5;
    cam.far = 200;
    cam.updateProjectionMatrix();

    // Move the shadow camera target to the player xz
    light.target.position.set(px, 0, pz);
    light.target.updateMatrixWorld();
  });

  return null;
};
