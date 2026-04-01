import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { PALETTE } from '@shared/constants';

type ElectronicType = 'keyboard' | 'circuit_board' | 'cassette';

interface RetroElectronicsProps {
  positions: [number, number, number][];
}

function getTypeForIndex(index: number): ElectronicType {
  const types: ElectronicType[] = ['keyboard', 'circuit_board', 'cassette'];
  // Deterministic based on index
  const hash = ((index * 2654435761) >>> 0) % 3;
  return types[hash];
}

/** Procedural keyboard: flat box body with tiny raised key bumps */
const Keyboard = ({ position, rotY }: { position: [number, number, number]; rotY: number }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    {/* Body */}
    <mesh position={[0, 0.01, 0]} castShadow>
      <boxGeometry args={[0.3, 0.02, 0.12]} />
      <meshStandardMaterial color={PALETTE.CONCRETE_AGED} roughness={0.9} />
    </mesh>
    {/* Key rows (3 rows of simplified key blocks) */}
    {[0, 1, 2].map((row) => (
      <mesh key={row} position={[0, 0.025, -0.035 + row * 0.035]} castShadow>
        <boxGeometry args={[0.26, 0.008, 0.025]} />
        <meshStandardMaterial color={'#2A2A2A'} roughness={0.85} />
      </mesh>
    ))}
    {/* Space bar */}
    <mesh position={[0, 0.025, 0.045]} castShadow>
      <boxGeometry args={[0.14, 0.006, 0.02]} />
      <meshStandardMaterial color={'#333333'} roughness={0.85} />
    </mesh>
  </group>
);

/** Procedural circuit board: flat green plane with colored rectangles */
const CircuitBoard = ({ position, rotY }: { position: [number, number, number]; rotY: number }) => {
  const chipColors = ['#222222', '#555555', '#883311', PALETTE.SCREEN_GREEN];
  return (
    <group position={position} rotation={[-0.05, rotY, 0]}>
      {/* PCB base */}
      <mesh position={[0, 0.003, 0]} castShadow>
        <boxGeometry args={[0.18, 0.006, 0.12]} />
        <meshStandardMaterial color={'#1B5E20'} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Chips / components */}
      {[
        [0.04, 0.008, 0.02, 0.04, 0.005, 0.025],
        [-0.04, 0.008, -0.02, 0.03, 0.004, 0.02],
        [0.02, 0.008, -0.035, 0.05, 0.003, 0.015],
        [-0.05, 0.008, 0.03, 0.02, 0.006, 0.02],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={chipColors[i % chipColors.length]} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* Traces (thin lines) */}
      <mesh position={[0, 0.007, 0]}>
        <boxGeometry args={[0.16, 0.001, 0.002]} />
        <meshStandardMaterial color={'#B8860B'} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.03, 0.007, 0]}>
        <boxGeometry args={[0.002, 0.001, 0.1]} />
        <meshStandardMaterial color={'#B8860B'} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

/** Procedural cassette tape: small box body with two cylinder reels */
const CassetteTape = ({ position, rotY }: { position: [number, number, number]; rotY: number }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    {/* Body */}
    <mesh position={[0, 0.008, 0]} castShadow>
      <boxGeometry args={[0.1, 0.016, 0.065]} />
      <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.8} />
    </mesh>
    {/* Label area */}
    <mesh position={[0, 0.017, 0]}>
      <boxGeometry args={[0.08, 0.001, 0.04]} />
      <meshStandardMaterial color={'#E8D5B7'} roughness={0.9} />
    </mesh>
    {/* Left reel */}
    <mesh position={[-0.025, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.012, 0.012, 0.003, 8]} />
      <meshStandardMaterial color={'#CCCCCC'} metalness={0.4} roughness={0.5} />
    </mesh>
    {/* Right reel */}
    <mesh position={[0.025, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.012, 0.012, 0.003, 8]} />
      <meshStandardMaterial color={'#CCCCCC'} metalness={0.4} roughness={0.5} />
    </mesh>
  </group>
);

export const RetroElectronics = ({ positions }: RetroElectronicsProps) => {
  const items = useMemo(() => {
    return positions.map((pos, i) => {
      const type = getTypeForIndex(i);
      const rotY = ((i * 137.5) % 360) * (Math.PI / 180);
      return { position: pos, type, rotY };
    });
  }, [positions]);

  return (
    <group>
      {items.map((item, i) => {
        switch (item.type) {
          case 'keyboard':
            return <Keyboard key={i} position={item.position} rotY={item.rotY} />;
          case 'circuit_board':
            return <CircuitBoard key={i} position={item.position} rotY={item.rotY} />;
          case 'cassette':
            return <CassetteTape key={i} position={item.position} rotY={item.rotY} />;
        }
      })}
    </group>
  );
};
