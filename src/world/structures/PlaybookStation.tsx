import { useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

// ---------- small reusable pieces ----------

const CRTMonitor = ({
  position,
  screenColor,
}: {
  position: [number, number, number];
  screenColor: string;
}) => (
  <group position={position}>
    {/* monitor body */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.6, 0.5, 0.5]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    {/* screen face */}
    <mesh position={[0, 0, 0.26]}>
      <planeGeometry args={[0.45, 0.35]} />
      <meshStandardMaterial
        color={screenColor}
        emissive={screenColor}
        emissiveIntensity={1.5}
      />
    </mesh>
    {/* base stand */}
    <mesh position={[0, -0.3, 0]}>
      <boxGeometry args={[0.3, 0.1, 0.3]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
  </group>
);

const AnalogGauge = ({
  position,
}: {
  position: [number, number, number];
}) => (
  <group position={position}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
      <meshStandardMaterial color={PALETTE.CHROME} />
    </mesh>
    {/* glass face */}
    <mesh position={[0, 0, 0.03]}>
      <circleGeometry args={[0.1, 16]} />
      <meshStandardMaterial
        color="#223322"
        emissive={PALETTE.SCREEN_GREEN}
        emissiveIntensity={0.4}
      />
    </mesh>
  </group>
);

const FilingCabinet = ({
  position,
}: {
  position: [number, number, number];
}) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[0.5, 1.2, 0.4]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    {/* drawer handles */}
    {[0.35, 0.05, -0.25].map((y, i) => (
      <mesh key={i} position={[0, y, 0.22]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color={PALETTE.CHROME} />
      </mesh>
    ))}
  </group>
);

const HangingCable = ({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) => {
  const midX = (start[0] + end[0]) / 2;
  const midY = Math.min(start[1], end[1]) - 0.3;
  const midZ = (start[2] + end[2]) / 2;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <group>
      {/* simplified as a thin cylinder between start and midpoint, then mid to end */}
      <mesh position={[(start[0] + midX) / 2, (start[1] + midY) / 2, (start[2] + midZ) / 2]}>
        <cylinderGeometry args={[0.015, 0.015, len * 0.55, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[(end[0] + midX) / 2, (end[1] + midY) / 2, (end[2] + midZ) / 2]}>
        <cylinderGeometry args={[0.015, 0.015, len * 0.55, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

// ---------- main component ----------

interface PlaybookStationProps {
  def: StructureDef;
}

export const PlaybookStation = ({ def }: PlaybookStationProps) => {
  const groupRef = useRef<Group>(null);

  const woodMain = PALETTE.AGED_WOOD;
  const woodDark = PALETTE.DARK_EARTH;
  const metalRoof = PALETTE.DARK_CHROME;

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        <RigidBody type="fixed" colliders={false}>
          {/* ===== BASE PLATFORM ===== */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[12, 0.5, 8]} />
            <meshStandardMaterial color={woodMain} />
          </mesh>

          {/* ===== STEPS (front, 3 steps) ===== */}
          {[0, 1, 2].map((i) => (
            <mesh key={`step-${i}`} position={[0, 0.08 * (i + 1) - 0.1, 4.2 + i * 0.4]}>
              <boxGeometry args={[3, 0.16, 0.4]} />
              <meshStandardMaterial color={woodDark} />
            </mesh>
          ))}

          {/* ===== WALLS (open front) ===== */}
          {/* back wall */}
          <mesh position={[0, 2, -3.75]}>
            <boxGeometry args={[12, 3.5, 0.25]} />
            <meshStandardMaterial color={woodMain} />
          </mesh>
          {/* left wall */}
          <mesh position={[-5.875, 2, 0]}>
            <boxGeometry args={[0.25, 3.5, 7.5]} />
            <meshStandardMaterial color={woodDark} />
          </mesh>
          {/* right wall */}
          <mesh position={[5.875, 2, 0]}>
            <boxGeometry args={[0.25, 3.5, 7.5]} />
            <meshStandardMaterial color={woodDark} />
          </mesh>

          {/* ===== ROOF (angled, corrugated style) ===== */}
          {/* left roof plane */}
          <mesh position={[-3, 4.3, 0]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[7, 0.12, 9]} />
            <meshStandardMaterial color={metalRoof} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* right roof plane */}
          <mesh position={[3, 4.3, 0]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[7, 0.12, 9]} />
            <meshStandardMaterial color={metalRoof} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* roof ridge */}
          <mesh position={[0, 4.9, 0]}>
            <boxGeometry args={[0.4, 0.15, 9]} />
            <meshStandardMaterial color={PALETTE.CHROME} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* corrugation ridges on roof */}
          {[-3, -1.5, 0, 1.5, 3].map((z, i) => (
            <mesh key={`corr-l-${i}`} position={[-3, 4.38, z]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[7, 0.04, 0.08]} />
              <meshStandardMaterial color={PALETTE.CHROME} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}

          {/* ===== INTERIOR: LONG DESK ===== */}
          <mesh position={[0, 1.15, -2.5]}>
            <boxGeometry args={[10, 0.15, 1.8]} />
            <meshStandardMaterial color={woodDark} />
          </mesh>
          {/* desk legs */}
          {[-4, 0, 4].map((x) => (
            <mesh key={`leg-${x}`} position={[x, 0.72, -2.5]}>
              <boxGeometry args={[0.15, 0.7, 0.15]} />
              <meshStandardMaterial color={woodDark} />
            </mesh>
          ))}

          {/* ===== CRT MONITORS ON DESK ===== */}
          <CRTMonitor position={[-3, 1.6, -2.5]} screenColor={PALETTE.SCREEN_GREEN} />
          <CRTMonitor position={[0, 1.6, -2.5]} screenColor={PALETTE.SCREEN_AMBER} />
          <CRTMonitor position={[3, 1.6, -2.5]} screenColor={PALETTE.SCREEN_GREEN} />

          {/* ===== LARGE CENTRAL SCREEN on back wall ===== */}
          <mesh position={[0, 2.8, -3.6]}>
            <planeGeometry args={[3.5, 2]} />
            <meshStandardMaterial
              color={PALETTE.SCREEN_CYAN}
              emissive={PALETTE.SCREEN_CYAN}
              emissiveIntensity={1.2}
            />
          </mesh>
          {/* screen border */}
          <mesh position={[0, 2.8, -3.58]}>
            <boxGeometry args={[3.8, 2.3, 0.06]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} />
          </mesh>

          {/* ===== ANALOG GAUGES on back wall ===== */}
          <AnalogGauge position={[-4.5, 2.8, -3.58]} />
          <AnalogGauge position={[-4.5, 2.2, -3.58]} />
          <AnalogGauge position={[4.5, 2.8, -3.58]} />
          <AnalogGauge position={[4.5, 2.2, -3.58]} />
          <AnalogGauge position={[3.5, 3.2, -3.58]} />
          <AnalogGauge position={[-3.5, 3.2, -3.58]} />

          {/* ===== FILING CABINETS ===== */}
          <FilingCabinet position={[-5, 1.1, -1]} />
          <FilingCabinet position={[-5, 1.1, 0.8]} />
          <FilingCabinet position={[5, 1.1, -1]} />

          {/* ===== HANGING CABLES ===== */}
          <HangingCable start={[-4, 3.8, -3.5]} end={[-2, 3.8, -3.5]} />
          <HangingCable start={[2, 3.8, -3.5]} end={[4, 3.8, -3.5]} />
          <HangingCable start={[-3, 4.2, 0]} end={[3, 4.2, 0]} />

          {/* ===== EXTERIOR: ANTENNA ON ROOF ===== */}
          {/* antenna mast */}
          <mesh position={[4, 5.8, -2]}>
            <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
            <meshStandardMaterial color={PALETTE.CHROME} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* antenna crossbars */}
          {[5.4, 5.8, 6.2].map((y, i) => (
            <mesh key={`cross-${i}`} position={[4, y, -2]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6 - i * 0.15, 4]} />
              <meshStandardMaterial color={PALETTE.CHROME} />
            </mesh>
          ))}
          {/* small dish */}
          <mesh position={[-4, 5.5, -2]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.3, 0.15, 12]} />
            <meshStandardMaterial color={PALETTE.CHROME} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* dish arm */}
          <mesh position={[-4, 5.1, -2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} />
          </mesh>

          {/* ===== EXTERIOR: SIGN PLACEHOLDER ===== */}
          <mesh position={[5.5, 2, 4]}>
            <boxGeometry args={[1.2, 0.8, 0.1]} />
            <meshStandardMaterial color={woodDark} />
          </mesh>
          <mesh position={[5.5, 1.2, 4]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
            <meshStandardMaterial color={woodMain} />
          </mesh>

          {/* ===== RETRO KEYBOARDS on desk ===== */}
          {[-3, 0, 3].map((x, i) => (
            <mesh key={`kb-${i}`} position={[x, 1.28, -1.9]}>
              <boxGeometry args={[0.5, 0.04, 0.2]} />
              <meshStandardMaterial color={PALETTE.CONCRETE_AGED} />
            </mesh>
          ))}

          {/* ===== CHAIR PLACEHOLDERS ===== */}
          {[-3, 0, 3].map((x, i) => (
            <group key={`chair-${i}`} position={[x, 0.9, -0.8]}>
              <mesh>
                <boxGeometry args={[0.5, 0.06, 0.5]} />
                <meshStandardMaterial color={PALETTE.RUST} />
              </mesh>
              <mesh position={[0, 0.35, -0.22]}>
                <boxGeometry args={[0.5, 0.6, 0.06]} />
                <meshStandardMaterial color={PALETTE.RUST} />
              </mesh>
              {/* legs */}
              {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([lx, lz], j) => (
                <mesh key={j} position={[lx, -0.35, lz]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
                  <meshStandardMaterial color={PALETTE.DARK_CHROME} />
                </mesh>
              ))}
            </group>
          ))}
        </RigidBody>

        {/* ===== INTERIOR LIGHTING ===== */}
        <pointLight position={[-3, 3.2, -1.5]} color="#FF6B35" intensity={0.5} distance={5} />
        <pointLight position={[0, 3.2, -1.5]} color="#FF6B35" intensity={0.5} distance={5} />
        <pointLight position={[3, 3.2, -1.5]} color="#FF6B35" intensity={0.4} distance={5} />
      </group>
    </StructureBase>
  );
};
