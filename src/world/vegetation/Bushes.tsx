import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { PALETTE, WORLD } from '@shared/constants';
import { getHeightAtPosition, getSplatValue, STRUCTURE_POSITIONS } from '@world/terrain/TerrainGenerator';

const BUSH_COUNT = 50;
const BUSH_COLORS = ['#5B8E23', '#6B8E23', '#4A7A1E', '#7B9E33', '#5C8832'];

/** Seeded PRNG (Mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BushData {
  x: number;
  y: number;
  z: number;
  scale: number;
  color: THREE.Color;
  rotY: number;
}

function generateBushPositions(): BushData[] {
  const rng = seededRandom(65358);
  const bushes: BushData[] = [];
  let attempts = 0;

  while (bushes.length < BUSH_COUNT && attempts < 800) {
    attempts++;
    const x = (rng() - 0.5) * WORLD.ISLAND_SIZE * 0.85;
    const z = (rng() - 0.5) * WORLD.ISLAND_SIZE * 0.85;

    const terrainY = getHeightAtPosition(x, z);
    const waterLine = WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE + 0.2;
    if (terrainY < waterLine) continue;

    const splat = getSplatValue(x, z);
    // Place in grassy areas, but allow some near structures
    if (splat[1] < 0.2) continue;

    // Allow bushes near structure bases (within 15 units) more freely
    let nearStructure = false;
    for (const pos of Object.values(STRUCTURE_POSITIONS)) {
      const dx = x - pos[0];
      const dz = z - pos[2];
      if (dx * dx + dz * dz < 6 * 6) {
        nearStructure = true;
        break;
      }
    }
    // Skip if very close to structure center (< 6 units) to avoid overlap
    if (nearStructure) continue;

    const scale = 0.3 + rng() * 0.5;
    const colorStr = BUSH_COLORS[Math.floor(rng() * BUSH_COLORS.length)];
    const color = new THREE.Color(colorStr);
    // Add slight random tint variation
    color.r += (rng() - 0.5) * 0.05;
    color.g += (rng() - 0.5) * 0.08;

    bushes.push({
      x,
      y: terrainY,
      z,
      scale,
      color,
      rotY: rng() * Math.PI * 2,
    });
  }

  return bushes;
}

export const Bushes = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bushData = useMemo(() => generateBushPositions(), []);
  const count = bushData.length;

  // Per-instance colors
  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = bushData[i].color.r;
      arr[i * 3 + 1] = bushData[i].color.g;
      arr[i * 3 + 2] = bushData[i].color.b;
    }
    return arr;
  }, [bushData, count]);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const b = bushData[i];
      dummy.position.set(b.x, b.y - 0.05, b.z); // slight ground embedding
      dummy.rotation.set(0, b.rotY, 0);
      // Non-uniform scale for organic variety
      dummy.scale.set(
        b.scale * (0.8 + Math.sin(i * 1.3) * 0.2),
        b.scale * (0.7 + Math.cos(i * 0.7) * 0.3),
        b.scale * (0.8 + Math.sin(i * 2.1) * 0.2),
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Apply per-instance colors
    const geo = meshRef.current.geometry;
    geo.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorArray, 3),
    );
  }, [bushData, count, dummy, colorArray]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial
        color={PALETTE.GRASS_WARM}
        roughness={0.85}
        metalness={0.0}
        vertexColors={false}
      />
    </instancedMesh>
  );
};
