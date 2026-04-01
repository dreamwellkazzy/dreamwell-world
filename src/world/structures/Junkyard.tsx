import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

// ---------- seeded random helper ----------

function seededRand(i: number): number {
  return Math.sin(i * 12345.6789) * 0.5 + 0.5;
}

function seededRange(i: number, min: number, max: number): number {
  return min + seededRand(i) * (max - min);
}

// ---------- sub-components ----------

const ScrapPile = ({
  position,
  seed,
}: {
  position: [number, number, number];
  seed: number;
}) => {
  const pieces = useMemo(() => {
    const items: {
      pos: [number, number, number];
      rot: [number, number, number];
      size: [number, number, number];
      color: string;
      type: 'box' | 'cyl';
    }[] = [];
    const count = 4 + Math.floor(seededRand(seed) * 5);
    for (let i = 0; i < count; i++) {
      const s = seed * 100 + i;
      const type = seededRand(s + 1) > 0.5 ? 'box' : 'cyl';
      const scaleF = 0.2 + seededRand(s + 2) * 0.6;
      items.push({
        pos: [
          seededRange(s + 3, -1.2, 1.2),
          seededRand(s + 4) * 0.5,
          seededRange(s + 5, -1.2, 1.2),
        ],
        rot: [
          seededRange(s + 6, -0.5, 0.5),
          seededRange(s + 7, 0, Math.PI),
          seededRange(s + 8, -0.4, 0.4),
        ],
        size: [scaleF, scaleF * (0.5 + seededRand(s + 9)), scaleF],
        color: seededRand(s + 10) > 0.5 ? PALETTE.RUST : PALETTE.DARK_CHROME,
        type,
      });
    }
    return items;
  }, [seed]);

  return (
    <group position={position}>
      {pieces.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          {p.type === 'box' ? (
            <boxGeometry args={p.size} />
          ) : (
            <cylinderGeometry args={[p.size[0] * 0.5, p.size[0] * 0.5, p.size[1], 8]} />
          )}
          <meshStandardMaterial color={p.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const SatelliteDish = ({
  position,
  tiltAngle,
}: {
  position: [number, number, number];
  tiltAngle: number;
}) => (
  <group position={position}>
    {/* stand */}
    <mesh position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.08, 0.12, 1.6, 6]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    {/* dish */}
    <mesh position={[0, 1.8, 0]} rotation={[tiltAngle, 0, 0]}>
      <cylinderGeometry args={[1.2, 0.6, 0.2, 16]} />
      <meshStandardMaterial color={PALETTE.CHROME} metalness={0.6} roughness={0.3} />
    </mesh>
    {/* feed arm */}
    <mesh position={[0, 2.1, 0.4]} rotation={[tiltAngle * 0.7, 0, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
  </group>
);

const TireStack = ({
  position,
  count = 3,
}: {
  position: [number, number, number];
  count?: number;
}) => (
  <group position={position}>
    {Array.from({ length: count }).map((_, i) => (
      <mesh
        key={i}
        position={[
          (i % 2) * 0.05,
          i * 0.22,
          0,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.35, 0.12, 8, 16]} />
        <meshStandardMaterial color="#222" roughness={0.95} />
      </mesh>
    ))}
  </group>
);

const RustyCarShell = ({
  position,
  rotation = [0, 0, 0],
  buried = 0,
  color = PALETTE.RUST,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  buried?: number;
  color?: string;
}) => (
  <group position={[position[0], position[1] - buried, position[2]]} rotation={rotation}>
    {/* body */}
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[2, 0.8, 1.2]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    {/* cabin */}
    <mesh position={[0.1, 1.1, 0]}>
      <boxGeometry args={[1.2, 0.6, 1.1]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    {/* windshield (cracked) */}
    <mesh position={[-0.45, 1.1, 0]} rotation={[0, 0, 0.15]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshStandardMaterial color="#556677" transparent opacity={0.4} side={2} />
    </mesh>
    {/* wheels (if not buried) */}
    {buried < 0.3 &&
      [[-0.7, 0.15, 0.65], [-0.7, 0.15, -0.65], [0.7, 0.15, 0.65], [0.7, 0.15, -0.65]].map(
        ([wx, wy, wz], i) => (
          <mesh key={i} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        )
      )}
  </group>
);

const ShippingContainer = ({
  position,
  rotation = [0, 0, 0],
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 1.2, 0]}>
      <boxGeometry args={[5, 2.4, 2.2]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
    {/* corrugation ridges */}
    {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
      <mesh key={i} position={[x, 1.2, 1.12]}>
        <boxGeometry args={[0.06, 2.2, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    ))}
    {/* doors */}
    <mesh position={[2.52, 1.2, -0.4]}>
      <boxGeometry args={[0.06, 2.1, 0.9]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
    <mesh position={[2.52, 1.2, 0.4]}>
      <boxGeometry args={[0.06, 2.1, 0.9]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  </group>
);

const StandingLamp = ({
  position,
}: {
  position: [number, number, number];
}) => (
  <group position={position}>
    <mesh position={[0, 1.5, 0]}>
      <cylinderGeometry args={[0.04, 0.06, 3, 6]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    <mesh position={[0, 3.1, 0]}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial
        color={PALETTE.SCREEN_WARM}
        emissive={PALETTE.SCREEN_WARM}
        emissiveIntensity={2}
      />
    </mesh>
  </group>
);

// ---------- main component ----------

interface JunkyardProps {
  def: StructureDef;
}

export const Junkyard = ({ def }: JunkyardProps) => {
  const groupRef = useRef<Group>(null);

  // generate scatter positions for scrap piles
  const scrapPiles = useMemo(() => {
    const piles: { pos: [number, number, number]; seed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = seededRange(i * 7 + 1, 0, Math.PI * 2);
      const r = seededRange(i * 7 + 2, 4, 14);
      // avoid the central clearing (r < 3)
      piles.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        seed: i,
      });
    }
    return piles;
  }, []);

  const tirePosns = useMemo(() => {
    const arr: { pos: [number, number, number]; count: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = seededRange(i * 11 + 50, 0, Math.PI * 2);
      const r = seededRange(i * 11 + 51, 5, 12);
      arr.push({
        pos: [Math.cos(angle) * r, 0.12, Math.sin(angle) * r],
        count: 2 + Math.floor(seededRand(i * 11 + 52) * 4),
      });
    }
    return arr;
  }, []);

  const lampPositions = useMemo(() => {
    const lamps: [number, number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const angle = seededRange(i * 13 + 90, 0, Math.PI * 2);
      const r = seededRange(i * 13 + 91, 6, 13);
      lamps.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
    }
    return lamps;
  }, []);

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        <RigidBody type="fixed" colliders={false}>

          {/* ===== GROUND AREA (large rough platform) ===== */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[16, 16.5, 0.2, 24]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={1} />
          </mesh>

          {/* ===== SCRAP PILES ===== */}
          {scrapPiles.map((pile, i) => (
            <ScrapPile key={`scrap-${i}`} position={pile.pos} seed={pile.seed} />
          ))}

          {/* ===== SATELLITE DISHES ===== */}
          <SatelliteDish position={[-8, 0, 6]} tiltAngle={0.5} />
          <SatelliteDish position={[10, 0, -4]} tiltAngle={-0.3} />
          <SatelliteDish position={[3, 0, 10]} tiltAngle={0.7} />

          {/* ===== TIRE STACKS ===== */}
          {tirePosns.map((t, i) => (
            <TireStack key={`tire-${i}`} position={t.pos} count={t.count} />
          ))}

          {/* ===== RUSTY CAR SHELLS ===== */}
          <RustyCarShell position={[-5, 0, -8]} rotation={[0, 0.4, 0]} color={PALETTE.RUST} />
          <RustyCarShell position={[8, 0, 7]} rotation={[0, -0.8, 0.05]} color="#885533" />
          <RustyCarShell
            position={[-10, 0, 3]}
            rotation={[0.1, 1.2, 0.05]}
            buried={0.5}
            color={PALETTE.RUST}
          />
          <RustyCarShell
            position={[5, 0, -10]}
            rotation={[0, 2.1, 0]}
            buried={0.8}
            color="#667788"
          />

          {/* ===== SHIPPING CONTAINERS ===== */}
          <ShippingContainer position={[-12, 0, -5]} rotation={[0, 0.3, 0]} color={PALETTE.RUST} />
          <ShippingContainer
            position={[11, 0, -8]}
            rotation={[0, -0.5, 0]}
            color="#4466AA"
          />
          {/* stacked container */}
          <ShippingContainer
            position={[-12, 2.4, -5]}
            rotation={[0, 0.35, 0]}
            color="#886644"
          />

          {/* ===== CENTRAL CLEARING: WORKBENCH ===== */}
          <group position={[0, 0, 0]}>
            {/* workbench top */}
            <mesh position={[0, 0.85, 0]}>
              <boxGeometry args={[2.5, 0.12, 1.2]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
            {/* legs */}
            {[[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].map(([lx, lz], i) => (
              <mesh key={`wbl-${i}`} position={[lx, 0.4, lz]}>
                <boxGeometry args={[0.1, 0.8, 0.1]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} />
              </mesh>
            ))}
            {/* vise on bench */}
            <mesh position={[0.8, 1.05, 0]}>
              <boxGeometry args={[0.3, 0.25, 0.2]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            {/* toolbox */}
            <mesh position={[-0.6, 1, 0]}>
              <boxGeometry args={[0.5, 0.25, 0.3]} />
              <meshStandardMaterial color={PALETTE.POSTMASTER_RED} />
            </mesh>
            {/* scattered small parts on bench */}
            {[0.2, -0.1, 0.5].map((x, i) => (
              <mesh key={`part-${i}`} position={[x, 0.95, 0.3]}>
                <cylinderGeometry args={[0.04, 0.04, 0.08, 6]} />
                <meshStandardMaterial color={PALETTE.CHROME} />
              </mesh>
            ))}
            {/* stool */}
            <group position={[0, 0, 1.2]}>
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
                <meshStandardMaterial color={PALETTE.AGED_WOOD} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
                <meshStandardMaterial color={PALETTE.DARK_CHROME} />
              </mesh>
            </group>
          </group>

          {/* ===== STANDING LAMPS ===== */}
          {lampPositions.map((p, i) => (
            <StandingLamp key={`lamp-${i}`} position={p} />
          ))}

          {/* ===== MISC SCATTERED PLANES (flat junk) ===== */}
          {Array.from({ length: 8 }).map((_, i) => {
            const s = i * 17 + 200;
            const angle = seededRange(s, 0, Math.PI * 2);
            const r = seededRange(s + 1, 3, 13);
            return (
              <mesh
                key={`flat-${i}`}
                position={[Math.cos(angle) * r, 0.02, Math.sin(angle) * r]}
                rotation={[-Math.PI / 2 + seededRange(s + 2, -0.1, 0.1), 0, seededRange(s + 3, 0, Math.PI)]}
              >
                <planeGeometry args={[seededRange(s + 4, 0.3, 1.2), seededRange(s + 5, 0.3, 0.8)]} />
                <meshStandardMaterial
                  color={seededRand(s + 6) > 0.5 ? PALETTE.RUST : PALETTE.CONCRETE_AGED}
                  side={2}
                  roughness={0.95}
                />
              </mesh>
            );
          })}

          {/* ===== ADDITIONAL DETAIL: old CRT on a crate ===== */}
          <group position={[-3, 0, -3]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.8, 0.7, 0.8]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[0.5, 0.4, 0.45]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            <mesh position={[0, 0.9, 0.24]}>
              <planeGeometry args={[0.35, 0.28]} />
              <meshStandardMaterial
                color={PALETTE.SCREEN_GREEN}
                emissive={PALETTE.SCREEN_GREEN}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>

        </RigidBody>

        {/* ===== LIGHTING ===== */}
        {lampPositions.map((p, i) => (
          <pointLight
            key={`lamplight-${i}`}
            position={[p[0], 3.3, p[2]]}
            color={PALETTE.SCREEN_WARM}
            intensity={0.4}
            distance={6}
          />
        ))}
      </group>
    </StructureBase>
  );
};
