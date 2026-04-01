import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD } from '@shared/constants';
import { getHeightAtPosition } from '@world/terrain/TerrainGenerator';

const FOAM_PATCH_COUNT = 120;
const SAMPLE_RADIUS_MIN = 50;
const SAMPLE_RADIUS_MAX = 95;
const FOAM_SIZE = 1.2;

interface FoamPatch {
  position: THREE.Vector3;
  baseY: number;
  phase: number;
  scale: number;
  opacity: number;
}

function generateFoamPatches(): FoamPatch[] {
  const patches: FoamPatch[] = [];
  const waterY = WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE;

  // Sample points in a ring around the island edge to find shoreline
  for (let i = 0; i < FOAM_PATCH_COUNT; i++) {
    const angle = (i / FOAM_PATCH_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const radius = SAMPLE_RADIUS_MIN + Math.random() * (SAMPLE_RADIUS_MAX - SAMPLE_RADIUS_MIN);

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const terrainHeight = getHeightAtPosition(x, z);

    // Only place foam near the waterline
    const heightDiff = Math.abs(terrainHeight - waterY);
    if (heightDiff < 2.5) {
      // Scatter slightly around the found position
      const offsetX = x + (Math.random() - 0.5) * 6;
      const offsetZ = z + (Math.random() - 0.5) * 6;

      patches.push({
        position: new THREE.Vector3(offsetX, waterY + 0.05, offsetZ),
        baseY: waterY + 0.05,
        phase: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * FOAM_SIZE,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
  }

  return patches;
}

export function Foam() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { patches, matrix } = useMemo(() => {
    const foamPatches = generateFoamPatches();
    const tempMatrix = new THREE.Matrix4();
    return { patches: foamPatches, matrix: tempMatrix };
  }, []);

  const count = patches.length;

  // Set up instanced geometry initial transforms
  useMemo(() => {
    if (!meshRef.current || count === 0) return;
    const mesh = meshRef.current;

    for (let i = 0; i < count; i++) {
      const p = patches[i];
      matrix.makeScale(p.scale, p.scale, p.scale);
      matrix.setPosition(p.position);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [patches, matrix, count]);

  useFrame(({ clock }) => {
    if (!meshRef.current || count === 0) return;
    const mesh = meshRef.current;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const p = patches[i];

      // Gentle bobbing
      const bobY = p.baseY + Math.sin(t * 0.8 + p.phase) * 0.06;
      // Gentle drift
      const driftX = Math.sin(t * 0.3 + p.phase * 2.0) * 0.15;
      const driftZ = Math.cos(t * 0.25 + p.phase * 1.5) * 0.15;

      // Pulsing scale for spawn/fade effect
      const pulse = 0.8 + Math.sin(t * 0.5 + p.phase) * 0.2;
      const s = p.scale * pulse;

      matrix.makeScale(s, s, s);
      matrix.setPosition(
        p.position.x + driftX,
        bobY,
        p.position.z + driftZ,
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      receiveShadow={false}
      castShadow={false}
      frustumCulled={false}
    >
      <circleGeometry args={[0.5, 8]} />
      <meshBasicMaterial
        color="#f0f5f0"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
