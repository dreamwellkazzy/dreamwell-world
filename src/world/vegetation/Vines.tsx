import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@shared/constants';

const VINE_COLOR = PALETTE.OXIDIZED_COPPER;
const LEAF_COLOR = '#3A6B4A';
const VINE_RADIUS = 0.012;
const LEAF_SIZE = 0.04;
const LEAVES_PER_VINE = 4;

interface VineAttachPoint {
  top: [number, number, number];
  length: number;
}

interface VinesProps {
  attachPoints: VineAttachPoint[];
}

interface VineData {
  top: THREE.Vector3;
  length: number;
  swayOffset: number;
  leafPositions: { y: number; side: number }[];
}

export const Vines = ({ attachPoints }: VinesProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const vineData = useMemo((): VineData[] => {
    return attachPoints.map((ap, i) => {
      const hash = i * 2654435761;
      const swayOffset = ((hash >>> 0) % 1000) / 1000 * Math.PI * 2;

      const leafPositions: VineData['leafPositions'] = [];
      for (let l = 0; l < LEAVES_PER_VINE; l++) {
        leafPositions.push({
          y: (l + 1) / (LEAVES_PER_VINE + 1),
          side: l % 2 === 0 ? 1 : -1,
        });
      }

      return {
        top: new THREE.Vector3(...ap.top),
        length: ap.length,
        swayOffset,
        leafPositions,
      };
    });
  }, [attachPoints]);

  // Animate subtle sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.children.forEach((vineGroup, i) => {
      if (i >= vineData.length) return;
      const data = vineData[i];

      // Sway the bottom of each vine group
      const swayX = Math.sin(t * 0.8 + data.swayOffset) * 0.03 * data.length;
      const swayZ = Math.cos(t * 0.6 + data.swayOffset * 1.3) * 0.02 * data.length;

      // Apply sway to the vine stem mesh (first child) via slight rotation
      const stem = vineGroup.children[0];
      if (stem) {
        stem.rotation.x = swayZ * 0.15;
        stem.rotation.z = -swayX * 0.15;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {vineData.map((vine, i) => (
        <group key={i} position={vine.top}>
          {/* Vine stem (cylinder hanging down) */}
          <mesh position={[0, -vine.length / 2, 0]}>
            <cylinderGeometry args={[VINE_RADIUS, VINE_RADIUS * 0.6, vine.length, 4]} />
            <meshStandardMaterial color={VINE_COLOR} roughness={0.8} />
          </mesh>

          {/* Leaf accents at intervals */}
          {vine.leafPositions.map((leaf, li) => {
            const leafY = -vine.length * leaf.y;
            const leafX = leaf.side * 0.03;

            return (
              <mesh
                key={li}
                position={[leafX, leafY, 0]}
                rotation={[
                  0.2 * leaf.side,
                  li * 0.8,
                  0.4 * leaf.side,
                ]}
              >
                <planeGeometry args={[LEAF_SIZE, LEAF_SIZE * 1.4]} />
                <meshStandardMaterial
                  color={LEAF_COLOR}
                  roughness={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
};
