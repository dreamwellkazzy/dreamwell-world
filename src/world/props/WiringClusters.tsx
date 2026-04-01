import { useMemo } from 'react';
import * as THREE from 'three';

const CABLE_COLORS = ['#111111', '#CC2222', '#CCCC22', '#2255CC'];
const CABLES_PER_CLUSTER = 6;
const TUBE_RADIUS = 0.015;
const TUBE_SEGMENTS = 24;
const CURVE_POINTS = 12;

interface WiringSegment {
  start: [number, number, number];
  end: [number, number, number];
}

interface WiringClustersProps {
  segments: WiringSegment[];
}

/**
 * Generate a simplified catenary curve between two points.
 * Uses a parabolic approximation for visual droop.
 */
function generateCatenaryCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  sag: number,
  offset: THREE.Vector3,
  numPoints: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Linear interpolation
    const x = start.x + (end.x - start.x) * t + offset.x;
    const z = start.z + (end.z - start.z) * t + offset.z;
    // Catenary approximation: parabolic droop, deepest at midpoint
    const sagAmount = -sag * 4 * t * (1 - t);
    const y = start.y + (end.y - start.y) * t + sagAmount + offset.y;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

export const WiringClusters = ({ segments }: WiringClustersProps) => {
  const cables = useMemo(() => {
    const allCables: { points: THREE.Vector3[]; color: string }[] = [];

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      const start = new THREE.Vector3(...seg.start);
      const end = new THREE.Vector3(...seg.end);
      const dist = start.distanceTo(end);
      const baseSag = dist * 0.15;

      // Seeded pseudo-random for deterministic offsets
      const seed = si * 137 + 42;

      for (let ci = 0; ci < CABLES_PER_CLUSTER; ci++) {
        const hash = seed + ci * 73;
        const ox = (((hash * 2654435761) >>> 0) / 4294967296 - 0.5) * 0.08;
        const oy = (((hash * 2246822519) >>> 0) / 4294967296 - 0.5) * 0.04;
        const oz = (((hash * 3266489917) >>> 0) / 4294967296 - 0.5) * 0.08;
        const sagVariation = baseSag * (0.7 + (((hash * 668265263) >>> 0) / 4294967296) * 0.6);

        const offset = new THREE.Vector3(ox, oy, oz);
        const points = generateCatenaryCurve(start, end, sagVariation, offset, CURVE_POINTS);
        const color = CABLE_COLORS[(si + ci) % CABLE_COLORS.length];

        allCables.push({ points, color });
      }
    }

    return allCables;
  }, [segments]);

  return (
    <group>
      {cables.map((cable, i) => {
        const curve = new THREE.CatmullRomCurve3(cable.points);
        return (
          <mesh key={i}>
            <tubeGeometry args={[curve, TUBE_SEGMENTS, TUBE_RADIUS, 4, false]} />
            <meshStandardMaterial
              color={cable.color}
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
};
