import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@shared/constants';

const SCREEN_COLORS = [PALETTE.SCREEN_GREEN, PALETTE.SCREEN_AMBER, PALETTE.SCREEN_CYAN];

const BODY_W = 0.4;
const BODY_H = 0.35;
const BODY_D = 0.3;
const SCREEN_W = 0.3;
const SCREEN_H = 0.24;

interface CRTMonitorsProps {
  positions: [number, number, number][];
}

export const CRTMonitors = ({ positions }: CRTMonitorsProps) => {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const count = positions.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Compute per-instance data: which are stacked, rotation offsets
  const instanceData = useMemo(() => {
    const data: {
      position: [number, number, number];
      rotationY: number;
      screenColor: string;
      isOn: boolean;
    }[] = [];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const rotationY = ((i * 137.5) % 360) * (Math.PI / 180) * 0.15; // slight random rotation
      const screenColor = SCREEN_COLORS[i % SCREEN_COLORS.length];
      const isOn = i % 3 !== 2; // 2 out of 3 are on

      data.push({ position: pos, rotationY, screenColor, isOn });

      // Some monitors stacked (every 4th gets a second, every 8th gets a third)
      if (i % 4 === 0) {
        data.push({
          position: [pos[0], pos[1] + BODY_H, pos[2]],
          rotationY: rotationY + 0.1,
          screenColor: SCREEN_COLORS[(i + 1) % SCREEN_COLORS.length],
          isOn: (i + 1) % 3 !== 2,
        });
      }
      if (i % 8 === 0) {
        data.push({
          position: [pos[0], pos[1] + BODY_H * 2, pos[2]],
          rotationY: rotationY - 0.12,
          screenColor: SCREEN_COLORS[(i + 2) % SCREEN_COLORS.length],
          isOn: (i + 2) % 3 !== 2,
        });
      }
    }
    return data;
  }, [positions]);

  const totalCount = instanceData.length;

  // Set instance matrices for bodies
  useEffect(() => {
    if (!bodyMeshRef.current) return;

    for (let i = 0; i < totalCount; i++) {
      const d = instanceData[i];
      dummy.position.set(d.position[0], d.position[1] + BODY_H / 2, d.position[2]);
      dummy.rotation.set(0, d.rotationY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bodyMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    bodyMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [instanceData, totalCount, dummy]);

  // Flicker effect for screens
  const screenRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    screenRefs.current.forEach((mesh, i) => {
      if (!mesh || !instanceData[i]?.isOn) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // Subtle flicker
      const flicker = 0.8 + Math.sin(t * 4 + i * 2.3) * 0.1 + Math.sin(t * 13 + i) * 0.1;
      mat.emissiveIntensity = flicker;
    });
  });

  return (
    <group>
      {/* Instanced CRT bodies */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[undefined, undefined, totalCount]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
        <meshStandardMaterial color={PALETTE.CONCRETE_AGED} roughness={0.8} metalness={0.1} />
      </instancedMesh>

      {/* Individual screen planes (need unique emissive materials) */}
      {instanceData.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => { screenRefs.current[i] = el; }}
          position={[
            d.position[0] + Math.sin(d.rotationY) * (BODY_D / 2 + 0.001),
            d.position[1] + BODY_H / 2,
            d.position[2] + Math.cos(d.rotationY) * (BODY_D / 2 + 0.001),
          ]}
          rotation={[0, d.rotationY, 0]}
        >
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial
            color={d.isOn ? d.screenColor : '#111111'}
            emissive={d.isOn ? d.screenColor : '#000000'}
            emissiveIntensity={d.isOn ? 0.9 : 0}
            roughness={0.3}
            metalness={0.0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
