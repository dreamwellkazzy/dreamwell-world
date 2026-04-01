import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { WORLD, PALETTE } from '@shared/constants';
import { getHeightAtPosition, getSplatValue } from '@world/terrain/TerrainGenerator';
import { grassVertexShader } from '@shaders/grass.vert';
import { grassFragmentShader } from '@shaders/grass.frag';

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

const CELL_SIZE = 4;
const MAX_BLADES_PER_CELL = 60;

const colorWarm = new THREE.Color(PALETTE.GRASS_WARM);
const colorDry = new THREE.Color(PALETTE.GRASS_DRY);

interface GrassBladeData {
  x: number;
  y: number;
  z: number;
  rotY: number;
  height: number;
  colorR: number;
  colorG: number;
  colorB: number;
  offset: number;
}

/**
 * Pre-compute all potential blade positions across the island grid.
 * Only positions where the grass splat channel > 0.3 and above water are included.
 */
function generateBladeDataForCell(
  cellX: number,
  cellZ: number,
  density: number,
): GrassBladeData[] {
  const blades: GrassBladeData[] = [];
  const rng = seededRandom(cellX * 73856093 + cellZ * 19349669);
  const bladesInCell = Math.floor(MAX_BLADES_PER_CELL * density);

  for (let i = 0; i < bladesInCell; i++) {
    const lx = cellX * CELL_SIZE + rng() * CELL_SIZE;
    const lz = cellZ * CELL_SIZE + rng() * CELL_SIZE;

    const worldX = lx - WORLD.ISLAND_SIZE / 2;
    const worldZ = lz - WORLD.ISLAND_SIZE / 2;

    // Check splatmap: only place grass where grass channel > 0.3
    const splat = getSplatValue(worldX, worldZ);
    if (splat[1] < 0.3) continue;

    const terrainY = getHeightAtPosition(worldX, worldZ);

    // Skip if below water level
    if (terrainY < WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE + 0.1) continue;

    // Color variation based on splatmap blend and randomness
    const t = rng() * 0.4 + splat[1] * 0.6;
    const tmpColor = new THREE.Color().copy(colorDry).lerp(colorWarm, t);

    blades.push({
      x: worldX,
      y: terrainY,
      z: worldZ,
      rotY: rng() * Math.PI * 2,
      height: WORLD.GRASS_BLADE_HEIGHT * (0.6 + rng() * 0.8),
      colorR: tmpColor.r,
      colorG: tmpColor.g,
      colorB: tmpColor.b,
      offset: rng() * Math.PI * 2,
    });
  }

  return blades;
}

export const GrassField = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const prevCellKeyRef = useRef<string>('');

  const quality = useGameStore((s) => s.qualitySettings);
  const density = quality.grassDensity;
  const renderDistance = quality.grassRenderDistance;

  // Number of cells across the island
  const cellCount = Math.ceil(WORLD.ISLAND_SIZE / CELL_SIZE);

  // Blade triangle geometry (3 vertices)
  const bladeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const halfW = WORLD.GRASS_BLADE_WIDTH / 2;
    const vertices = new Float32Array([
      -halfW, 0.0, 0.0,  // base-left
       halfW, 0.0, 0.0,  // base-right
       0.0,   1.0, 0.0,  // tip (y=1, scaled by bladeHeight attribute)
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPlayerPosition: { value: new THREE.Vector3() },
        uRenderDistance: { value: renderDistance },
        uFogColor: { value: new THREE.Color(PALETTE.FOG_WARM) },
        uFogNear: { value: WORLD.FOG_NEAR },
        uFogFar: { value: WORLD.FOG_FAR },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }, [renderDistance]);

  // Maximum possible blade count for buffer sizing
  const maxBladeCount = useMemo(() => {
    const cellsInRange = Math.ceil((renderDistance * 2) / CELL_SIZE);
    return cellsInRange * cellsInRange * MAX_BLADES_PER_CELL;
  }, [renderDistance]);

  // Pre-allocate instance attribute buffers
  const instanceOffsets = useMemo(() => new Float32Array(maxBladeCount), [maxBladeCount]);
  const bladeHeights = useMemo(() => new Float32Array(maxBladeCount), [maxBladeCount]);
  const baseColors = useMemo(() => new Float32Array(maxBladeCount * 3), [maxBladeCount]);

  // Update visible blades based on player position
  const updateBlades = (playerX: number, playerZ: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Determine which cells are in range
    const playerCellX = Math.floor((playerX + WORLD.ISLAND_SIZE / 2) / CELL_SIZE);
    const playerCellZ = Math.floor((playerZ + WORLD.ISLAND_SIZE / 2) / CELL_SIZE);
    const cellRadius = Math.ceil(renderDistance / CELL_SIZE);

    // Quick check: same center cell as before?
    const cellKey = `${playerCellX},${playerCellZ}`;
    if (cellKey === prevCellKeyRef.current) return;
    prevCellKeyRef.current = cellKey;

    const dummy = new THREE.Object3D();
    let bladeIndex = 0;

    for (let cz = playerCellZ - cellRadius; cz <= playerCellZ + cellRadius; cz++) {
      for (let cx = playerCellX - cellRadius; cx <= playerCellX + cellRadius; cx++) {
        if (cx < 0 || cx >= cellCount || cz < 0 || cz >= cellCount) continue;

        // Distance check (cell center to player)
        const cellCenterX = (cx + 0.5) * CELL_SIZE - WORLD.ISLAND_SIZE / 2;
        const cellCenterZ = (cz + 0.5) * CELL_SIZE - WORLD.ISLAND_SIZE / 2;
        const dx = cellCenterX - playerX;
        const dz = cellCenterZ - playerZ;
        if (dx * dx + dz * dz > renderDistance * renderDistance) continue;

        const blades = generateBladeDataForCell(cx, cz, density);

        for (const blade of blades) {
          if (bladeIndex >= maxBladeCount) break;

          dummy.position.set(blade.x, blade.y, blade.z);
          dummy.rotation.set(0, blade.rotY, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          mesh.setMatrixAt(bladeIndex, dummy.matrix);

          instanceOffsets[bladeIndex] = blade.offset;
          bladeHeights[bladeIndex] = blade.height;
          baseColors[bladeIndex * 3] = blade.colorR;
          baseColors[bladeIndex * 3 + 1] = blade.colorG;
          baseColors[bladeIndex * 3 + 2] = blade.colorB;

          bladeIndex++;
        }
        if (bladeIndex >= maxBladeCount) break;
      }
      if (bladeIndex >= maxBladeCount) break;
    }

    // Update instance count and mark buffers dirty
    mesh.count = bladeIndex;
    mesh.instanceMatrix.needsUpdate = true;

    const geo = mesh.geometry;
    geo.setAttribute(
      'instanceOffset',
      new THREE.InstancedBufferAttribute(instanceOffsets.slice(0, bladeIndex), 1),
    );
    geo.setAttribute(
      'bladeHeight',
      new THREE.InstancedBufferAttribute(bladeHeights.slice(0, bladeIndex), 1),
    );
    geo.setAttribute(
      'baseColor',
      new THREE.InstancedBufferAttribute(baseColors.slice(0, bladeIndex * 3), 3),
    );
  };

  // Initial placement
  useEffect(() => {
    const playerPos = useGameStore.getState().playerPosition;
    updateBlades(playerPos[0], playerPos[2]);
  }, [density, renderDistance]);

  // Per-frame updates
  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    const playerPos = useGameStore.getState().playerPosition;

    // Update shader uniforms
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uPlayerPosition.value.set(
      playerPos[0],
      playerPos[1],
      playerPos[2],
    );

    // Re-populate blades if player moved to new cell
    updateBlades(playerPos[0], playerPos[2]);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeometry, shaderMaterial, maxBladeCount]}
      frustumCulled={false}
    >
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </instancedMesh>
  );
};
