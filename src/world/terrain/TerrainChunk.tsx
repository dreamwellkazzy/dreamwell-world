import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TerrainChunkData } from '@shared/types';
import { WORLD } from '@shared/constants';
import { generateChunkHeightmap } from './TerrainGenerator';
import { TerrainMesh } from './TerrainMesh';

interface TerrainChunkProps {
  gridX: number;
  gridZ: number;
}

const LOD_RESOLUTIONS = [
  WORLD.CHUNK_RESOLUTION,          // LOD 0: 64
  WORLD.CHUNK_RESOLUTION / 2,      // LOD 1: 32
  WORLD.CHUNK_RESOLUTION / 4,      // LOD 2: 16
];

export function TerrainChunk({ gridX, gridZ }: TerrainChunkProps) {
  const [currentLod, setCurrentLod] = useState(0);
  const chunkCenter = useRef(new THREE.Vector3());
  const { camera } = useThree();

  // Calculate chunk world position
  const halfIsland = WORLD.ISLAND_SIZE / 2;
  const worldX = -halfIsland + gridX * WORLD.CHUNK_SIZE + WORLD.CHUNK_SIZE / 2;
  const worldZ = -halfIsland + gridZ * WORLD.CHUNK_SIZE + WORLD.CHUNK_SIZE / 2;

  useEffect(() => {
    chunkCenter.current.set(worldX, 0, worldZ);
  }, [worldX, worldZ]);

  // LOD switching based on camera distance
  useFrame(() => {
    const dist = camera.position.distanceTo(chunkCenter.current);
    let newLod = 0;
    for (let i = 0; i < WORLD.LOD_DISTANCES.length; i++) {
      if (dist > WORLD.LOD_DISTANCES[i]) {
        newLod = Math.min(i + 1, LOD_RESOLUTIONS.length - 1);
      }
    }
    if (newLod !== currentLod) {
      setCurrentLod(newLod);
    }
  });

  // Generate heightmap data for current LOD
  const chunkData: TerrainChunkData = useMemo(
    () => generateChunkHeightmap(gridX, gridZ, LOD_RESOLUTIONS[currentLod]),
    [gridX, gridZ, currentLod],
  );

  return (
    <TerrainMesh
      chunkData={chunkData}
      position={[worldX, 0, worldZ]}
    />
  );
}

/** Renders all terrain chunks for the island */
export function TerrainSystem() {
  const chunksPerSide = WORLD.ISLAND_SIZE / WORLD.CHUNK_SIZE; // 4

  const chunks = useMemo(() => {
    const result: { gridX: number; gridZ: number }[] = [];
    for (let gz = 0; gz < chunksPerSide; gz++) {
      for (let gx = 0; gx < chunksPerSide; gx++) {
        result.push({ gridX: gx, gridZ: gz });
      }
    }
    return result;
  }, [chunksPerSide]);

  return (
    <group name="terrain">
      {chunks.map((c) => (
        <TerrainChunk
          key={`${c.gridX}_${c.gridZ}`}
          gridX={c.gridX}
          gridZ={c.gridZ}
        />
      ))}
    </group>
  );
}
