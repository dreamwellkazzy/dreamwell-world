import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

// ---------- helpers ----------

const CRTSmall = ({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <boxGeometry args={[0.4, 0.35, 0.35]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    <mesh position={[0, 0, 0.18]}>
      <planeGeometry args={[0.3, 0.25]} />
      <meshStandardMaterial
        color={PALETTE.SCREEN_AMBER}
        emissive={PALETTE.SCREEN_AMBER}
        emissiveIntensity={1.2}
      />
    </mesh>
  </group>
);

const TickerBoard = ({
  position,
  rotation = [0, 0, 0],
  width = 3,
  height = 1.2,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) => (
  <group position={position} rotation={rotation}>
    {/* frame */}
    <mesh>
      <boxGeometry args={[width + 0.2, height + 0.2, 0.1]} />
      <meshStandardMaterial color={PALETTE.DARK_EARTH} />
    </mesh>
    {/* screen */}
    <mesh position={[0, 0, 0.06]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={PALETTE.SCREEN_AMBER}
        emissive={PALETTE.SCREEN_AMBER}
        emissiveIntensity={0.8}
      />
    </mesh>
    {/* ticker lines */}
    {[-0.3, 0, 0.3].map((y, i) => (
      <mesh key={i} position={[0, y, 0.07]}>
        <planeGeometry args={[width * 0.9, 0.06]} />
        <meshStandardMaterial
          color={PALETTE.SCREEN_GREEN}
          emissive={PALETTE.SCREEN_GREEN}
          emissiveIntensity={1.0}
        />
      </mesh>
    ))}
  </group>
);

const WoodenPole = ({
  position,
  height = 3.5,
}: {
  position: [number, number, number];
  height?: number;
}) => (
  <mesh position={[position[0], position[1] + height / 2, position[2]]}>
    <cylinderGeometry args={[0.08, 0.1, height, 6]} />
    <meshStandardMaterial color={PALETTE.AGED_WOOD} />
  </mesh>
);

// ---------- main ----------

interface StockMarketProps {
  def: StructureDef;
}

export const StockMarket = ({ def }: StockMarketProps) => {
  const groupRef = useRef<Group>(null);

  // desk arrangement around the pit
  const deskPositions = useMemo(() => {
    const desks: { pos: [number, number, number]; rot: number }[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 6;
      desks.push({
        pos: [Math.cos(angle) * r, 0.6, Math.sin(angle) * r],
        rot: -angle + Math.PI,
      });
    }
    return desks;
  }, []);

  // fence posts around perimeter
  const fencePosts = useMemo(() => {
    const posts: [number, number, number][] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 10;
      posts.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
    }
    return posts;
  }, []);

  // string light bulb positions
  const bulbPositions = useMemo(() => {
    const bulbs: [number, number, number][] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 8.5;
      bulbs.push([Math.cos(angle) * r, 3.6, Math.sin(angle) * r]);
    }
    return bulbs;
  }, []);

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        <RigidBody type="fixed" colliders={false}>

          {/* ===== TIER 1: Outer ring (ground level) ===== */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[9, 9.5, 0.3, 24]} />
            <meshStandardMaterial color={PALETTE.AGED_WOOD} />
          </mesh>

          {/* ===== TIER 2: Middle ring (lowered) ===== */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[6, 6.5, 0.3, 24]} />
            <meshStandardMaterial color={PALETTE.WARM_SAND} />
          </mesh>

          {/* ===== TIER 3: Inner pit (lowest) ===== */}
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[3, 3.5, 0.3, 24]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} />
          </mesh>

          {/* tier step walls */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[6.5, 6.5, 0.35, 24, 1, true]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} side={2} />
          </mesh>
          <mesh position={[0, -0.37, 0]}>
            <cylinderGeometry args={[3.5, 3.5, 0.35, 24, 1, true]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} side={2} />
          </mesh>

          {/* ===== CENTRAL PODIUM ===== */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.5, 1.8, 1]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} />
          </mesh>
          {/* podium screen */}
          <mesh position={[0, 0.8, 0.52]}>
            <planeGeometry args={[1.2, 1]} />
            <meshStandardMaterial
              color={PALETTE.SCREEN_AMBER}
              emissive={PALETTE.SCREEN_AMBER}
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* podium top trim */}
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[1.7, 0.1, 1.2]} />
            <meshStandardMaterial color={PALETTE.AGED_WOOD} />
          </mesh>

          {/* ===== TRADING DESKS with CRTs ===== */}
          {deskPositions.map((d, i) => (
            <group key={`desk-${i}`} position={d.pos} rotation={[0, d.rot, 0]}>
              {/* desk surface */}
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[1.4, 0.1, 0.7]} />
                <meshStandardMaterial color={PALETTE.AGED_WOOD} />
              </mesh>
              {/* desk legs */}
              {[[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].map(([lx, lz], j) => (
                <mesh key={j} position={[lx, 0.05, lz]}>
                  <boxGeometry args={[0.08, 0.6, 0.08]} />
                  <meshStandardMaterial color={PALETTE.DARK_EARTH} />
                </mesh>
              ))}
              {/* CRT on desk */}
              <CRTSmall position={[0, 0.7, 0]} />
              {/* scattered papers */}
              <mesh position={[0.4, 0.47, 0.1]} rotation={[0, Math.sin(i * 3.7) * 0.5, 0]}>
                <planeGeometry args={[0.2, 0.28]} />
                <meshStandardMaterial color="#E8D5B7" side={2} />
              </mesh>
            </group>
          ))}

          {/* ===== TICKER BOARDS (4 around perimeter) ===== */}
          <TickerBoard position={[0, 3, -8.5]} rotation={[0, 0, 0]} />
          <TickerBoard position={[0, 3, 8.5]} rotation={[0, Math.PI, 0]} />
          <TickerBoard position={[-8.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} />
          <TickerBoard position={[8.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} />

          {/* ===== WOODEN FENCE POSTS ===== */}
          {fencePosts.map((p, i) => (
            <group key={`fence-${i}`}>
              <mesh position={[p[0], 0.6, p[2]]}>
                <boxGeometry args={[0.15, 1.2, 0.15]} />
                <meshStandardMaterial color={PALETTE.AGED_WOOD} />
              </mesh>
              {/* top cap */}
              <mesh position={[p[0], 1.22, p[2]]}>
                <boxGeometry args={[0.2, 0.06, 0.2]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} />
              </mesh>
            </group>
          ))}
          {/* fence rails (simplified as ring segments) */}
          {[0.4, 0.9].map((y, ri) => (
            <mesh key={`rail-${ri}`} position={[0, y, 0]}>
              <torusGeometry args={[10, 0.04, 4, 32]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
          ))}

          {/* ===== OVERHEAD CABLES WITH BULBS ===== */}
          {/* cable ring */}
          <mesh position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[8.5, 0.02, 4, 32]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* wooden poles supporting cables */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <WoodenPole
              key={`pole-${i}`}
              position={[Math.cos(angle) * 8.5, 0, Math.sin(angle) * 8.5]}
              height={3.8}
            />
          ))}
          {/* emissive bulbs */}
          {bulbPositions.map((p, i) => (
            <mesh key={`bulb-${i}`} position={p}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={PALETTE.SCREEN_WARM}
                emissive={PALETTE.SCREEN_WARM}
                emissiveIntensity={2}
              />
            </mesh>
          ))}

          {/* ===== SCATTERED PAPERS on the ground ===== */}
          {Array.from({ length: 10 }).map((_, i) => {
            const seed = Math.sin(i * 12345.6789) * 0.5 + 0.5;
            const angle = seed * Math.PI * 2;
            const r = 1 + seed * 4;
            return (
              <mesh
                key={`paper-${i}`}
                position={[Math.cos(angle) * r, -0.3, Math.sin(angle) * r]}
                rotation={[-Math.PI / 2, 0, seed * Math.PI * 2]}
              >
                <planeGeometry args={[0.15, 0.2]} />
                <meshStandardMaterial color="#E8D5B7" side={2} />
              </mesh>
            );
          })}

          {/* ===== MARKET BELL ===== */}
          <group position={[2, 0, -2]}>
            {/* bell stand */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 1, 6]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            {/* crossbar */}
            <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            {/* bell body */}
            <mesh position={[0, 0.75, 0]}>
              <cylinderGeometry args={[0.05, 0.2, 0.3, 12]} />
              <meshStandardMaterial color={PALETTE.EINSTEIN_GOLD} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* clapper sphere */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={PALETTE.CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
          </group>

        </RigidBody>

        {/* ===== LIGHTING ===== */}
        <pointLight position={[0, 2, 0]} color={PALETTE.SCREEN_WARM} intensity={0.6} distance={8} />
        <pointLight position={[0, 4, 0]} color="#FF6B35" intensity={0.3} distance={12} />
      </group>
    </StructureBase>
  );
};
