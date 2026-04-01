import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';

const CULL_DISTANCE = 30;
const MAX_ACTIVE_LIGHTS = 25;

interface PointLightDef {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
}

interface PointLightsProps {
  lights: PointLightDef[];
}

interface ActiveLight extends PointLightDef {
  distSq: number;
}

/**
 * Renders point lights with small emissive source spheres.
 * Distance-culls against the player position every frame,
 * keeping at most MAX_ACTIVE_LIGHTS visible.
 */
export const PointLights = ({ lights }: PointLightsProps) => {
  const [activeLights, setActiveLights] = useState<ActiveLight[]>([]);
  const playerPosRef = useRef<[number, number, number]>([0, 0, 0]);

  // Subscribe to player position outside useFrame to avoid store access every frame
  const playerPos = useGameStore((s) => s.playerPosition);

  const cullDistSq = CULL_DISTANCE * CULL_DISTANCE;

  useFrame(() => {
    playerPosRef.current = playerPos;
    const [px, , pz] = playerPosRef.current;

    const visible: ActiveLight[] = [];

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const dx = light.position[0] - px;
      const dz = light.position[2] - pz;
      const distSq = dx * dx + dz * dz;

      if (distSq <= cullDistSq) {
        visible.push({ ...light, distSq });
      }
    }

    // Sort by distance and clamp to max
    visible.sort((a, b) => a.distSq - b.distSq);
    const clamped = visible.slice(0, MAX_ACTIVE_LIGHTS);

    // Only update state if the count changed or positions shifted meaningfully
    setActiveLights((prev) => {
      if (prev.length !== clamped.length) return clamped;
      for (let i = 0; i < clamped.length; i++) {
        if (prev[i].position !== clamped[i].position) return clamped;
      }
      return prev;
    });
  });

  // Pre-create a shared sphere geometry for the emissive source meshes
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  return (
    <>
      {activeLights.map((light, i) => (
        <group key={`pl-${light.position[0]}-${light.position[1]}-${light.position[2]}-${i}`} position={light.position}>
          {/* Point light */}
          <pointLight
            color={light.color}
            intensity={light.intensity}
            distance={light.distance}
            decay={2}
          />
          {/* Visible emissive source sphere */}
          <mesh geometry={sphereGeo}>
            <meshBasicMaterial color={light.color} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
};
