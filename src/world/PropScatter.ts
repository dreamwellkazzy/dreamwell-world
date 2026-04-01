import { PropDef } from '@shared/types';
import { WORLD } from '@shared/constants';
import { getHeightAtPosition, getSplatValue, STRUCTURE_POSITIONS } from './terrain/TerrainGenerator';

// Seeded deterministic random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HALF = WORLD.ISLAND_SIZE / 2;
const WATER_Y = WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE;

interface ScatterZone {
  center: [number, number, number];
  radius: number;
  density: 'high' | 'medium' | 'low';
}

// Zones around structures (denser props)
const STRUCTURE_ZONES: ScatterZone[] = Object.values(STRUCTURE_POSITIONS).map((pos) => ({
  center: pos,
  radius: 12,
  density: 'medium' as const,
}));

// Junkyard gets maximum density
const JUNKYARD_ZONE: ScatterZone = {
  center: STRUCTURE_POSITIONS.junkyard,
  radius: 22,
  density: 'high',
};

function isInWater(x: number, z: number): boolean {
  return getHeightAtPosition(x, z) < WATER_Y + 0.3;
}

function isOnSteepSlope(x: number, z: number): boolean {
  const d = 1;
  const h = getHeightAtPosition(x, z);
  const hx = getHeightAtPosition(x + d, z);
  const hz = getHeightAtPosition(x, z + d);
  const slope = Math.sqrt((hx - h) ** 2 + (hz - h) ** 2);
  return slope > 2;
}

function isInsideStructure(x: number, z: number): boolean {
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const dist = Math.sqrt((x - pos[0]) ** 2 + (z - pos[2]) ** 2);
    if (dist < 5) return true;
  }
  return false;
}

function canPlace(x: number, z: number): boolean {
  return !isInWater(x, z) && !isOnSteepSlope(x, z) && !isInsideStructure(x, z);
}

// --- Generate prop scatter data ---

export function generateCRTPositions(seed: number = 100): [number, number, number][] {
  const rand = seededRandom(seed);
  const positions: [number, number, number][] = [];

  // Dense around structures
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const count = 4 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 5 + rand() * 10;
      const x = pos[0] + Math.cos(angle) * dist;
      const z = pos[2] + Math.sin(angle) * dist;
      if (canPlace(x, z)) {
        const y = getHeightAtPosition(x, z);
        positions.push([x, y, z]);
      }
    }
  }

  // Extra in junkyard
  for (let i = 0; i < 20; i++) {
    const x = JUNKYARD_ZONE.center[0] + (rand() - 0.5) * JUNKYARD_ZONE.radius * 2;
    const z = JUNKYARD_ZONE.center[2] + (rand() - 0.5) * JUNKYARD_ZONE.radius * 2;
    if (canPlace(x, z)) {
      positions.push([x, getHeightAtPosition(x, z), z]);
    }
  }

  return positions;
}

export function generateWiringSegments(seed: number = 200): { start: [number, number, number]; end: [number, number, number] }[] {
  const rand = seededRandom(seed);
  const segments: { start: [number, number, number]; end: [number, number, number] }[] = [];

  // Wiring between nearby structure points
  const structKeys = Object.keys(STRUCTURE_POSITIONS) as (keyof typeof STRUCTURE_POSITIONS)[];
  for (let i = 0; i < structKeys.length; i++) {
    const pos = STRUCTURE_POSITIONS[structKeys[i]];
    const count = 1 + Math.floor(rand() * 2);
    for (let j = 0; j < count; j++) {
      const angle = rand() * Math.PI * 2;
      const dist = 3 + rand() * 5;
      const startY = getHeightAtPosition(pos[0], pos[2]) + 1.5 + rand() * 2;
      const endX = pos[0] + Math.cos(angle) * dist;
      const endZ = pos[2] + Math.sin(angle) * dist;
      const endY = getHeightAtPosition(endX, endZ) + 1 + rand() * 2;
      segments.push({
        start: [pos[0] + (rand() - 0.5) * 2, startY, pos[2] + (rand() - 0.5) * 2],
        end: [endX, endY, endZ],
      });
    }
  }

  return segments;
}

export function generateElectronicsPositions(seed: number = 300): [number, number, number][] {
  const rand = seededRandom(seed);
  const positions: [number, number, number][] = [];

  // Near structures and junkyard
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const x = pos[0] + (rand() - 0.5) * 14;
      const z = pos[2] + (rand() - 0.5) * 14;
      if (canPlace(x, z)) {
        positions.push([x, getHeightAtPosition(x, z), z]);
      }
    }
  }

  return positions;
}

export function generateDebrisData(seed: number = 400): {
  tirePositions: [number, number, number][];
  cratePositions: [number, number, number][];
  barrelPositions: [number, number, number][];
} {
  const rand = seededRandom(seed);
  const tires: [number, number, number][] = [];
  const crates: [number, number, number][] = [];
  const barrels: [number, number, number][] = [];

  // Junkyard: tons of debris
  for (let i = 0; i < 15; i++) {
    const x = JUNKYARD_ZONE.center[0] + (rand() - 0.5) * 35;
    const z = JUNKYARD_ZONE.center[2] + (rand() - 0.5) * 35;
    if (canPlace(x, z)) {
      tires.push([x, getHeightAtPosition(x, z) - 0.1, z]);
    }
  }

  // Crates scattered around
  for (let i = 0; i < 20; i++) {
    const x = (rand() - 0.5) * WORLD.ISLAND_SIZE * 0.7;
    const z = (rand() - 0.5) * WORLD.ISLAND_SIZE * 0.7;
    if (canPlace(x, z)) {
      crates.push([x, getHeightAtPosition(x, z), z]);
    }
  }

  // Barrels near structures
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const count = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < count; i++) {
      const x = pos[0] + (rand() - 0.5) * 12;
      const z = pos[2] + (rand() - 0.5) * 12;
      if (canPlace(x, z)) {
        barrels.push([x, getHeightAtPosition(x, z), z]);
      }
    }
  }

  return { tirePositions: tires, cratePositions: crates, barrelPositions: barrels };
}

export function generateSignPosts(seed: number = 500): { position: [number, number, number]; text: string; rotation: number }[] {
  const rand = seededRandom(seed);
  const signs: { position: [number, number, number]; text: string; rotation: number }[] = [];

  const labels: { key: keyof typeof STRUCTURE_POSITIONS; text: string }[] = [
    { key: 'playbook_station', text: 'PLAYBOOK STATION' },
    { key: 'stock_market', text: 'STOCK MARKET' },
    { key: 'junkyard', text: 'THE JUNKYARD' },
    { key: 'drivein_cinema', text: 'DRIVE-IN' },
    { key: 'school_bus', text: 'THE BUS' },
    { key: 'lighthouse', text: 'LIGHTHOUSE' },
  ];

  for (const label of labels) {
    const pos = STRUCTURE_POSITIONS[label.key];
    const angle = rand() * Math.PI * 2;
    const dist = 10 + rand() * 5;
    const x = pos[0] + Math.cos(angle) * dist;
    const z = pos[2] + Math.sin(angle) * dist;
    if (canPlace(x, z)) {
      const toward = Math.atan2(pos[2] - z, pos[0] - x);
      signs.push({
        position: [x, getHeightAtPosition(x, z), z],
        text: label.text,
        rotation: toward,
      });
    }
  }

  return signs;
}

export function generatePointLightPositions(seed: number = 600): { position: [number, number, number]; color: string; intensity: number; distance: number }[] {
  const rand = seededRandom(seed);
  const lights: { position: [number, number, number]; color: string; intensity: number; distance: number }[] = [];

  // Desk lamps inside structures
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const count = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < count; i++) {
      const x = pos[0] + (rand() - 0.5) * 4;
      const z = pos[2] + (rand() - 0.5) * 4;
      const y = getHeightAtPosition(x, z) + 1.5 + rand();
      lights.push({ position: [x, y, z], color: '#FF6B35', intensity: 0.5, distance: 5 });
    }
  }

  // CRT glow near monitors
  for (const pos of Object.values(STRUCTURE_POSITIONS)) {
    const x = pos[0] + (rand() - 0.5) * 3;
    const z = pos[2] + (rand() - 0.5) * 3;
    const y = getHeightAtPosition(x, z) + 1;
    const colors = ['#39FF14', '#FFB000', '#00D4FF'];
    lights.push({
      position: [x, y, z],
      color: colors[Math.floor(rand() * colors.length)],
      intensity: 0.2,
      distance: 3,
    });
  }

  return lights;
}

export function generateVineAttachPoints(seed: number = 700): { top: [number, number, number]; length: number }[] {
  const rand = seededRandom(seed);
  const vines: { top: [number, number, number]; length: number }[] = [];

  // Vines on structure walls
  const vineStructures = [
    STRUCTURE_POSITIONS.playbook_station,
    STRUCTURE_POSITIONS.stock_market,
    STRUCTURE_POSITIONS.junkyard,
    STRUCTURE_POSITIONS.school_bus,
    STRUCTURE_POSITIONS.workshop_hut_1,
    STRUCTURE_POSITIONS.workshop_hut_2,
  ];

  for (const pos of vineStructures) {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const x = pos[0] + (rand() - 0.5) * 6;
      const z = pos[2] + (rand() - 0.5) * 6;
      const baseY = getHeightAtPosition(x, z);
      const y = baseY + 2 + rand() * 2;
      vines.push({ top: [x, y, z], length: 1 + rand() * 2 });
    }
  }

  return vines;
}
