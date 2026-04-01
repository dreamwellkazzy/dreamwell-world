import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@shared/store/useGameStore';
import { WORLD } from '@shared/constants';

const ISLAND_SIZE = WORLD.ISLAND_SIZE; // 200
const CHUNK_SIZE = WORLD.CHUNK_SIZE; // 50
const GRID_COUNT = ISLAND_SIZE / CHUNK_SIZE; // 4

// Pre-compute all chunk center positions
interface ChunkInfo {
  id: string;
  centerX: number;
  centerZ: number;
}

const ALL_CHUNKS: ChunkInfo[] = [];
for (let gx = 0; gx < GRID_COUNT; gx++) {
  for (let gz = 0; gz < GRID_COUNT; gz++) {
    const centerX = gx * CHUNK_SIZE + CHUNK_SIZE / 2 - ISLAND_SIZE / 2;
    const centerZ = gz * CHUNK_SIZE + CHUNK_SIZE / 2 - ISLAND_SIZE / 2;
    ALL_CHUNKS.push({
      id: `chunk_${gx}_${gz}`,
      centerX,
      centerZ,
    });
  }
}

/**
 * Hook that determines which terrain chunks should be active based on
 * the player's position and quality settings.
 *
 * Runs every frame via useFrame, sorts chunks by distance to player,
 * and pushes the nearest N chunk IDs to the store.
 */
export function useChunkManager(): void {
  const prevChunkIds = useRef<string>('');

  useFrame(() => {
    const { playerPosition, qualitySettings, setActiveChunks } =
      useGameStore.getState();

    const [px, , pz] = playerPosition;
    const maxChunks = qualitySettings.maxChunksLoaded;

    // Calculate squared distances and sort
    const sorted = ALL_CHUNKS.map((chunk) => {
      const dx = chunk.centerX - px;
      const dz = chunk.centerZ - pz;
      return { id: chunk.id, distSq: dx * dx + dz * dz };
    }).sort((a, b) => a.distSq - b.distSq);

    // Take the nearest chunks up to the limit
    const activeIds = sorted.slice(0, maxChunks).map((c) => c.id);

    // Only update store if the active set actually changed
    const key = activeIds.join(',');
    if (key !== prevChunkIds.current) {
      prevChunkIds.current = key;
      setActiveChunks(activeIds);
    }
  });
}
