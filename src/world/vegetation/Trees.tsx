import { useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE, WORLD } from '@shared/constants';
import { getHeightAtPosition, getSplatValue, STRUCTURE_POSITIONS } from '@world/terrain/TerrainGenerator';

const TRUNK_COLOR = PALETTE.AGED_WOOD;
const CANOPY_COLORS = ['#5B8E23', '#7BA23E', '#8B9E35', '#6B9E33'];
const DEAD_TRUNK_COLOR = '#5E4930';
const DEFAULT_TREE_COUNT = 25;

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

interface TreeData {
  position: [number, number, number];
  trunkHeight: number;
  trunkRadius: number;
  leanAngle: number;
  leanDirection: number;
  canopyLayers: { y: number; scale: number; color: string }[];
  isDead: boolean;
}

/** Check if position is near a structure zone */
function isNearStructure(x: number, z: number, radius: number): boolean {
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const dx = x - pos[0];
    const dz = z - pos[2];
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

/** Check if position is in junkyard area */
function isInJunkyard(x: number, z: number): boolean {
  const jy = STRUCTURE_POSITIONS.junkyard;
  const dx = x - jy[0];
  const dz = z - jy[2];
  return dx * dx + dz * dz < 25 * 25;
}

function generateDefaultPositions(): TreeData[] {
  const rng = seededRandom(31415);
  const trees: TreeData[] = [];
  const halfSize = WORLD.ISLAND_SIZE / 2;
  let attempts = 0;

  while (trees.length < DEFAULT_TREE_COUNT && attempts < 500) {
    attempts++;
    const x = (rng() - 0.5) * WORLD.ISLAND_SIZE * 0.85;
    const z = (rng() - 0.5) * WORLD.ISLAND_SIZE * 0.85;

    // Skip if too close to structures
    if (isNearStructure(x, z, 12)) continue;

    const terrainY = getHeightAtPosition(x, z);
    const waterLine = WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE + 0.3;

    // Skip if below water
    if (terrainY < waterLine) continue;

    const splat = getSplatValue(x, z);
    const isJunkyard = isInJunkyard(x, z);

    // In grassy areas or junkyard (for dead trees)
    if (splat[1] < 0.25 && !isJunkyard) continue;

    const isDead = isJunkyard && rng() > 0.4;
    const trunkHeight = 2.0 + rng() * 2.0;
    const trunkRadius = 0.08 + rng() * 0.06;
    const leanAngle = (rng() - 0.5) * 0.15;
    const leanDirection = rng() * Math.PI * 2;

    const canopyLayers: TreeData['canopyLayers'] = [];
    if (!isDead) {
      const layerCount = 2 + Math.floor(rng() * 2);
      for (let l = 0; l < layerCount; l++) {
        canopyLayers.push({
          y: trunkHeight * (0.6 + l * 0.18) + rng() * 0.2,
          scale: (1.2 - l * 0.25) * (0.8 + rng() * 0.4),
          color: CANOPY_COLORS[Math.floor(rng() * CANOPY_COLORS.length)],
        });
      }
    }

    trees.push({
      position: [x, terrainY, z],
      trunkHeight,
      trunkRadius,
      leanAngle,
      leanDirection,
      canopyLayers,
      isDead,
    });
  }

  return trees;
}

interface TreesProps {
  positions?: [number, number, number][];
}

export const Trees = ({ positions }: TreesProps) => {
  const treeData = useMemo(() => {
    if (positions) {
      // Generate tree data for provided positions
      const rng = seededRandom(27182);
      return positions.map((pos): TreeData => {
        const terrainY = getHeightAtPosition(pos[0], pos[2]);
        const isDead = isInJunkyard(pos[0], pos[2]) && rng() > 0.5;
        const trunkHeight = 2.0 + rng() * 2.0;
        const trunkRadius = 0.08 + rng() * 0.06;
        const canopyLayers: TreeData['canopyLayers'] = [];

        if (!isDead) {
          const layerCount = 2 + Math.floor(rng() * 2);
          for (let l = 0; l < layerCount; l++) {
            canopyLayers.push({
              y: trunkHeight * (0.6 + l * 0.18) + rng() * 0.2,
              scale: (1.2 - l * 0.25) * (0.8 + rng() * 0.4),
              color: CANOPY_COLORS[Math.floor(rng() * CANOPY_COLORS.length)],
            });
          }
        }

        return {
          position: [pos[0], terrainY, pos[2]],
          trunkHeight,
          trunkRadius,
          leanAngle: (rng() - 0.5) * 0.15,
          leanDirection: rng() * Math.PI * 2,
          canopyLayers,
          isDead,
        };
      });
    }
    return generateDefaultPositions();
  }, [positions]);

  // Shared geometries
  const trunkGeo = useMemo(
    () => new THREE.CylinderGeometry(0.06, 0.1, 1, 6),
    [],
  );
  const canopyGeo = useMemo(
    () => new THREE.IcosahedronGeometry(0.6, 1),
    [],
  );

  return (
    <group>
      {treeData.map((tree, i) => {
        const leanX = Math.sin(tree.leanDirection) * tree.leanAngle;
        const leanZ = Math.cos(tree.leanDirection) * tree.leanAngle;

        return (
          <group key={i} position={tree.position} rotation={[leanX, 0, leanZ]}>
            {/* Trunk */}
            <mesh
              geometry={trunkGeo}
              position={[0, tree.trunkHeight / 2, 0]}
              scale={[
                tree.trunkRadius / 0.08,
                tree.trunkHeight,
                tree.trunkRadius / 0.08,
              ]}
              castShadow
            >
              <meshStandardMaterial
                color={tree.isDead ? DEAD_TRUNK_COLOR : TRUNK_COLOR}
                roughness={0.9}
              />
            </mesh>

            {/* Canopy layers */}
            {tree.canopyLayers.map((layer, li) => (
              <mesh
                key={li}
                geometry={canopyGeo}
                position={[
                  (li % 2 === 0 ? 0.1 : -0.1) * layer.scale,
                  layer.y,
                  (li % 2 === 0 ? -0.05 : 0.08) * layer.scale,
                ]}
                scale={[layer.scale, layer.scale * 0.8, layer.scale]}
                castShadow
              >
                <meshStandardMaterial color={layer.color} roughness={0.85} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
