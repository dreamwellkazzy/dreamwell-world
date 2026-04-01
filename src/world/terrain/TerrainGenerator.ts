import { createNoise2D } from 'simplex-noise';
import { TerrainChunkData } from '@shared/types';
import { WORLD } from '@shared/constants';
import { smoothstep, lerp, clamp } from '@shared/utils/math.utils';

// --- Seeded PRNG (Mulberry32) ---
function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Structure positions (world coordinates, Y derived from heightmap) ---
export const STRUCTURE_POSITIONS = {
  playbook_station: [30, 0, -60] as [number, number, number],
  stock_market: [70, 0, 10] as [number, number, number],
  junkyard: [-10, 0, 60] as [number, number, number],
  drivein_cinema: [-65, 0, -20] as [number, number, number],
  school_bus: [15, 0, 40] as [number, number, number],
  workshop_hut_1: [-30, 0, -30] as [number, number, number],
  workshop_hut_2: [50, 0, -40] as [number, number, number],
  dock: [85, 0, 50] as [number, number, number],
  lighthouse: [-80, 0, -70] as [number, number, number],
};

// --- Path segments connecting structures ---
const PATH_SEGMENTS: [[number, number, number], [number, number, number]][] = [
  [STRUCTURE_POSITIONS.playbook_station, STRUCTURE_POSITIONS.workshop_hut_2],
  [STRUCTURE_POSITIONS.workshop_hut_2, STRUCTURE_POSITIONS.stock_market],
  [STRUCTURE_POSITIONS.playbook_station, STRUCTURE_POSITIONS.workshop_hut_1],
  [STRUCTURE_POSITIONS.workshop_hut_1, STRUCTURE_POSITIONS.drivein_cinema],
  [STRUCTURE_POSITIONS.workshop_hut_1, STRUCTURE_POSITIONS.junkyard],
  [STRUCTURE_POSITIONS.junkyard, STRUCTURE_POSITIONS.school_bus],
  [STRUCTURE_POSITIONS.school_bus, STRUCTURE_POSITIONS.stock_market],
  [STRUCTURE_POSITIONS.stock_market, STRUCTURE_POSITIONS.dock],
  [STRUCTURE_POSITIONS.playbook_station, STRUCTURE_POSITIONS.lighthouse],
];

let noise2D: (x: number, y: number) => number;
let isInitialized = false;

export function initTerrain(seed: number = 42): void {
  const rng = createSeededRandom(seed);
  noise2D = createNoise2D(rng);
  isInitialized = true;
}

function ensureInit(): void {
  if (!isInitialized) initTerrain(42);
}

// --- Multi-octave fractional Brownian motion ---
function fbm(x: number, z: number): number {
  let height = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < WORLD.NOISE_OCTAVES; i++) {
    height += noise2D(x * frequency * 0.008, z * frequency * 0.008) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= WORLD.NOISE_PERSISTENCE;
    frequency *= WORLD.NOISE_LACUNARITY;
  }

  return height / maxAmplitude;
}

// --- Distance from point to line segment ---
function distToSegment(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);

  const t = clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1);
  const projX = ax + t * dx;
  const projZ = az + t * dz;
  return Math.sqrt((px - projX) ** 2 + (pz - projZ) ** 2);
}

// --- Flatten terrain influence around a point ---
function flattenInfluence(
  x: number, z: number,
  cx: number, cz: number,
  radius: number,
): number {
  const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
  return 1 - smoothstep(radius * 0.4, radius, dist);
}

// --- Get path influence at a world position ---
function getPathInfluence(x: number, z: number): number {
  const pathWidth = 3.0;
  const pathFade = 5.0;
  let influence = 0;

  for (const [start, end] of PATH_SEGMENTS) {
    const dist = distToSegment(x, z, start[0], start[2], end[0], end[2]);
    influence = Math.max(influence, 1 - smoothstep(pathWidth, pathWidth + pathFade, dist));
  }

  return influence;
}

// --- Raw normalized height (0-1) at world position ---
function getRawHeight(worldX: number, worldZ: number): number {
  const halfSize = WORLD.ISLAND_SIZE / 2;
  const nx = worldX / halfSize;
  const nz = worldZ / halfSize;
  const dist = Math.sqrt(nx * nx + nz * nz);

  // Island radial mask: 1 at center, 0 at edges
  const mask = 1 - smoothstep(0.6, 1.0, dist);

  // Base terrain noise
  let height = fbm(worldX, worldZ);
  height = (height + 1) / 2; // normalize to 0-1

  // Larger-scale hill variation
  const largeNoise = (noise2D(worldX * 0.003, worldZ * 0.003) + 1) / 2;
  height = height * 0.6 + largeNoise * 0.4;

  // Apply island mask and shift above water level
  height = WORLD.WATER_LEVEL + height * mask * 0.45;

  // Drop below water outside island boundary
  if (dist > 1.0) {
    height = Math.max(0, WORLD.WATER_LEVEL - (dist - 1.0) * 2);
  }

  // --- Structure area flattening ---

  // Playbook Station - elevated plateau
  const pbInfl = flattenInfluence(worldX, worldZ, 30, -60, 18);
  height = lerp(height, 0.75, pbInfl);

  // Stock Market - sunken bowl
  const smInfl = flattenInfluence(worldX, worldZ, 70, 10, 15);
  height = lerp(height, 0.55, smInfl);

  // Junkyard - flat sprawl
  const jyInfl = flattenInfluence(worldX, worldZ, -10, 60, 22);
  height = lerp(height, 0.58, jyInfl);

  // Drive-in Cinema - amphitheater slope
  const dcDist = Math.sqrt((worldX + 65) ** 2 + (worldZ + 20) ** 2);
  if (dcDist < 20) {
    const dcInfl = 1 - smoothstep(5, 20, dcDist);
    const slopeTarget = 0.6 + dcDist * 0.005;
    height = lerp(height, slopeTarget, dcInfl * 0.7);
  }

  // School Bus - slight flatten
  const sbInfl = flattenInfluence(worldX, worldZ, 15, 40, 8);
  height = lerp(height, 0.58, sbInfl);

  // Workshop Huts
  const wh1Infl = flattenInfluence(worldX, worldZ, -30, -30, 8);
  height = lerp(height, 0.63, wh1Infl);
  const wh2Infl = flattenInfluence(worldX, worldZ, 50, -40, 8);
  height = lerp(height, 0.63, wh2Infl);

  // Dock - near shore, low
  const dkInfl = flattenInfluence(worldX, worldZ, 85, 50, 8);
  height = lerp(height, 0.52, dkInfl);

  // Lighthouse - small raised point
  const lhInfl = flattenInfluence(worldX, worldZ, -80, -70, 8);
  height = lerp(height, 0.68, lhInfl);

  // --- Path flattening ---
  const pathInfl = getPathInfluence(worldX, worldZ);
  if (pathInfl > 0) {
    const pathTarget = Math.max(height - 0.02, WORLD.WATER_LEVEL + 0.05);
    height = lerp(height, pathTarget, pathInfl * 0.5);
  }

  return clamp(height, 0, 1);
}

// --- Public API ---

/** Get world-space Y height at any (x, z) position. Used by physics, characters, structures. */
export function getHeightAtPosition(worldX: number, worldZ: number): number {
  ensureInit();
  return getRawHeight(worldX, worldZ) * WORLD.HEIGHT_SCALE;
}

/** Get terrain slope at position (0 = flat, 1 = very steep) */
export function getSlopeAtPosition(worldX: number, worldZ: number): number {
  ensureInit();
  const d = 0.5;
  const hL = getRawHeight(worldX - d, worldZ);
  const hR = getRawHeight(worldX + d, worldZ);
  const hU = getRawHeight(worldX, worldZ - d);
  const hD = getRawHeight(worldX, worldZ + d);
  const dx = (hR - hL) / (2 * d);
  const dz = (hD - hU) / (2 * d);
  return clamp(Math.sqrt(dx * dx + dz * dz) * 5, 0, 1);
}

/** Get splatmap value [sand, grass, dirt, path] at world position */
export function getSplatValue(worldX: number, worldZ: number): [number, number, number, number] {
  ensureInit();
  const height = getRawHeight(worldX, worldZ);
  const slope = getSlopeAtPosition(worldX, worldZ);

  const sandFactor = (1 - smoothstep(WORLD.WATER_LEVEL, WORLD.WATER_LEVEL + 0.12, height)) *
    (1 - slope * 0.5);
  const grassHeight = smoothstep(WORLD.WATER_LEVEL + 0.05, WORLD.WATER_LEVEL + 0.15, height) *
    (1 - smoothstep(0.85, 1.0, height));
  const grassSlope = 1 - smoothstep(0.25, 0.6, slope);
  const grassFactor = grassHeight * grassSlope;
  const dirtFactor = Math.max(
    smoothstep(0.7, 0.85, height),
    smoothstep(0.3, 0.6, slope),
  );

  let pathFactor = 0;
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const d = Math.sqrt((worldX - pos[0]) ** 2 + (worldZ - pos[2]) ** 2);
    pathFactor = Math.max(pathFactor, 1 - smoothstep(3, 10, d));
  }
  pathFactor = Math.max(pathFactor, getPathInfluence(worldX, worldZ) * 0.8);

  const total = sandFactor + grassFactor + dirtFactor + pathFactor;
  if (total < 0.001) return [0.25, 0.5, 0.25, 0];

  return [
    sandFactor / total,
    grassFactor / total,
    dirtFactor / total,
    pathFactor / total,
  ];
}

/** Generate full chunk heightmap + splatmap data */
export function generateChunkHeightmap(
  chunkGridX: number,
  chunkGridZ: number,
  resolution: number = WORLD.CHUNK_RESOLUTION,
): TerrainChunkData {
  ensureInit();

  const halfIsland = WORLD.ISLAND_SIZE / 2;
  const chunkWorldX = -halfIsland + chunkGridX * WORLD.CHUNK_SIZE;
  const chunkWorldZ = -halfIsland + chunkGridZ * WORLD.CHUNK_SIZE;

  const heightmap = new Float32Array(resolution * resolution);
  const splatmap = new Float32Array(resolution * resolution * 4);

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const wx = chunkWorldX + (x / (resolution - 1)) * WORLD.CHUNK_SIZE;
      const wz = chunkWorldZ + (z / (resolution - 1)) * WORLD.CHUNK_SIZE;

      const idx = z * resolution + x;
      heightmap[idx] = getRawHeight(wx, wz);

      const splat = getSplatValue(wx, wz);
      const si = idx * 4;
      splatmap[si] = splat[0];
      splatmap[si + 1] = splat[1];
      splatmap[si + 2] = splat[2];
      splatmap[si + 3] = splat[3];
    }
  }

  return {
    id: `chunk_${chunkGridX}_${chunkGridZ}`,
    gridX: chunkGridX,
    gridZ: chunkGridZ,
    heightmap,
    splatmap,
    resolution,
    lod: 0,
  };
}
