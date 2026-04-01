import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

// ---------- sub-components ----------

const SpeakerPole = ({
  position,
}: {
  position: [number, number, number];
}) => (
  <group position={position}>
    {/* pole */}
    <mesh position={[0, 0.6, 0]}>
      <cylinderGeometry args={[0.04, 0.05, 1.2, 6]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    {/* speaker box */}
    <mesh position={[0, 1.25, 0]}>
      <boxGeometry args={[0.25, 0.2, 0.15]} />
      <meshStandardMaterial color={PALETTE.DARK_CHROME} />
    </mesh>
    {/* speaker cone */}
    <mesh position={[0, 1.25, 0.09]}>
      <circleGeometry args={[0.06, 8]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

const StringLights = ({
  start,
  end,
  count = 6,
}: {
  start: [number, number, number];
  end: [number, number, number];
  count?: number;
}) => {
  const bulbs = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      // catenary sag
      const sag = Math.sin(t * Math.PI) * 0.3;
      arr.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t - sag,
        start[2] + (end[2] - start[2]) * t,
      ]);
    }
    return arr;
  }, [start, end, count]);

  return (
    <group>
      {/* wire (simplified as thin segments) */}
      {bulbs.map((b, i) => {
        if (i === 0) return null;
        const prev = bulbs[i - 1];
        const mx = (prev[0] + b[0]) / 2;
        const my = (prev[1] + b[1]) / 2;
        const mz = (prev[2] + b[2]) / 2;
        const dx = b[0] - prev[0];
        const dy = b[1] - prev[1];
        const dz = b[2] - prev[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return (
          <mesh key={`wire-${i}`} position={[mx, my, mz]}>
            <cylinderGeometry args={[0.01, 0.01, len, 3]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
      })}
      {/* bulbs */}
      {bulbs.map((b, i) => (
        <mesh key={`bulb-${i}`} position={b}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial
            color={PALETTE.SCREEN_WARM}
            emissive={PALETTE.SCREEN_WARM}
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}
    </group>
  );
};

// ---------- main component ----------

interface DriveinCinemaProps {
  def: StructureDef;
}

export const DriveinCinema = ({ def }: DriveinCinemaProps) => {
  const groupRef = useRef<Group>(null);

  // seating rows
  const rows = useMemo(() => {
    const arr: {
      pos: [number, number, number];
      width: number;
      color: string;
      type: 'car' | 'bench';
    }[] = [];
    for (let row = 0; row < 4; row++) {
      const z = 2 + row * 2.5;
      const y = row * 0.4; // slope upward
      const count = 3 + row;
      for (let col = 0; col < count; col++) {
        const x = (col - (count - 1) / 2) * 2.5;
        const seed = Math.sin((row * 10 + col) * 12345.6789) * 0.5 + 0.5;
        arr.push({
          pos: [x, y, z],
          width: 1.6 + seed * 0.4,
          color: seed > 0.5 ? PALETTE.RUST : PALETTE.AGED_WOOD,
          type: seed > 0.5 ? 'car' : 'bench',
        });
      }
    }
    return arr;
  }, []);

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        <RigidBody type="fixed" colliders={false}>

          {/* ===== GROUND / VIEWING AREA ===== */}
          <mesh position={[0, -0.05, 5]} rotation={[0.05, 0, 0]}>
            <boxGeometry args={[18, 0.1, 14]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} />
          </mesh>

          {/* ===== BIG SCREEN ===== */}
          {/* screen surface */}
          <mesh position={[0, 3.5, -1]}>
            <planeGeometry args={[10, 6]} />
            <meshStandardMaterial
              color={PALETTE.SCREEN_AMBER}
              emissive={PALETTE.SCREEN_AMBER}
              emissiveIntensity={0.8}
            />
          </mesh>
          {/* scan lines overlay (horizontal strips) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={`scan-${i}`} position={[0, 1 + i * 0.45, -0.98]}>
              <planeGeometry args={[9.8, 0.04]} />
              <meshStandardMaterial
                color="#000000"
                transparent
                opacity={0.15}
              />
            </mesh>
          ))}

          {/* screen frame -- dark metal border */}
          {/* top */}
          <mesh position={[0, 6.55, -1.02]}>
            <boxGeometry args={[10.4, 0.2, 0.15]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* bottom */}
          <mesh position={[0, 0.45, -1.02]}>
            <boxGeometry args={[10.4, 0.2, 0.15]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* left */}
          <mesh position={[-5.1, 3.5, -1.02]}>
            <boxGeometry args={[0.2, 6.2, 0.15]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* right */}
          <mesh position={[5.1, 3.5, -1.02]}>
            <boxGeometry args={[0.2, 6.2, 0.15]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* screen support poles */}
          <mesh position={[-4, 3.3, -1.3]}>
            <cylinderGeometry args={[0.15, 0.2, 6.6, 8]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[4, 3.3, -1.3]}>
            <cylinderGeometry args={[0.15, 0.2, 6.6, 8]} />
            <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.5} roughness={0.5} />
          </mesh>
          {/* pole bases */}
          {[-4, 4].map((x, i) => (
            <mesh key={`base-${i}`} position={[x, 0.05, -1.3]}>
              <boxGeometry args={[0.8, 0.1, 0.8]} />
              <meshStandardMaterial color={PALETTE.CONCRETE_AGED} />
            </mesh>
          ))}

          {/* ===== SEATING: CAR HOODS + BENCHES ===== */}
          {rows.map((seat, i) => (
            <group key={`seat-${i}`} position={seat.pos}>
              {seat.type === 'car' ? (
                <>
                  {/* car hood (angled box) */}
                  <mesh position={[0, 0.35, 0]} rotation={[-0.15, 0, 0]}>
                    <boxGeometry args={[seat.width, 0.12, 1.2]} />
                    <meshStandardMaterial color={seat.color} roughness={0.85} />
                  </mesh>
                  {/* windshield stub */}
                  <mesh position={[0, 0.65, -0.5]} rotation={[-0.6, 0, 0]}>
                    <boxGeometry args={[seat.width * 0.8, 0.04, 0.5]} />
                    <meshStandardMaterial color="#556677" transparent opacity={0.3} />
                  </mesh>
                </>
              ) : (
                <>
                  {/* bench seat */}
                  <mesh position={[0, 0.3, 0]}>
                    <boxGeometry args={[seat.width, 0.1, 0.5]} />
                    <meshStandardMaterial color={seat.color} />
                  </mesh>
                  {/* bench legs */}
                  {[-seat.width * 0.4, seat.width * 0.4].map((lx, j) => (
                    <mesh key={j} position={[lx, 0.12, 0]}>
                      <boxGeometry args={[0.1, 0.25, 0.4]} />
                      <meshStandardMaterial color={PALETTE.DARK_EARTH} />
                    </mesh>
                  ))}
                </>
              )}
            </group>
          ))}

          {/* ===== PROJECTION BOOTH ===== */}
          <group position={[0, 0, 12]}>
            {/* booth structure */}
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[3, 2.5, 2.5]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
            {/* window */}
            <mesh position={[0, 1.8, -1.27]}>
              <planeGeometry args={[1.5, 0.6]} />
              <meshStandardMaterial color="#334455" transparent opacity={0.5} />
            </mesh>
            {/* projector cylinder */}
            <mesh position={[0, 1.8, -1.4]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* projector lens */}
            <mesh position={[0, 1.8, -1.72]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial
                color={PALETTE.SCREEN_AMBER}
                emissive={PALETTE.SCREEN_AMBER}
                emissiveIntensity={1.5}
              />
            </mesh>
            {/* roof */}
            <mesh position={[0, 2.85, 0]}>
              <boxGeometry args={[3.4, 0.15, 2.9]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            {/* steps up */}
            {[0, 1].map((s) => (
              <mesh key={`bs-${s}`} position={[0, 0.1 + s * 0.2, -1.4 - s * 0.4]}>
                <boxGeometry args={[1.5, 0.2, 0.4]} />
                <meshStandardMaterial color={PALETTE.CONCRETE_AGED} />
              </mesh>
            ))}
          </group>

          {/* ===== SPEAKER POLES ===== */}
          <SpeakerPole position={[-7, 0, 3]} />
          <SpeakerPole position={[-7, 0, 6]} />
          <SpeakerPole position={[-7, 0, 9]} />
          <SpeakerPole position={[7, 0, 3]} />
          <SpeakerPole position={[7, 0, 6]} />
          <SpeakerPole position={[7, 0, 9]} />

          {/* ===== CONCESSION STAND ===== */}
          <group position={[7.5, 0, 11]}>
            {/* counter */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[2, 1, 1.2]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
            {/* counter top */}
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[2.2, 0.06, 1.4]} />
              <meshStandardMaterial color={PALETTE.WARM_SAND} />
            </mesh>
            {/* awning */}
            <mesh position={[0, 1.7, -0.4]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[2.5, 0.06, 1.5]} />
              <meshStandardMaterial color={PALETTE.RUST} />
            </mesh>
            {/* awning supports */}
            {[-1, 1].map((x, i) => (
              <mesh key={i} position={[x, 1.35, -0.8]}>
                <cylinderGeometry args={[0.03, 0.03, 0.7, 4]} />
                <meshStandardMaterial color={PALETTE.DARK_CHROME} />
              </mesh>
            ))}
            {/* sign */}
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[1.5, 0.4, 0.06]} />
              <meshStandardMaterial color={PALETTE.DARK_EARTH} />
            </mesh>
          </group>

          {/* ===== STRING LIGHTS ===== */}
          <StringLights
            start={[-7, 2.5, 2]}
            end={[7, 2.5, 2]}
            count={8}
          />
          <StringLights
            start={[-7, 2.8, 7]}
            end={[7, 2.8, 7]}
            count={8}
          />
          {/* diagonal strings */}
          <StringLights
            start={[-5.5, 6.3, -1]}
            end={[-7, 2.5, 3]}
            count={4}
          />
          <StringLights
            start={[5.5, 6.3, -1]}
            end={[7, 2.5, 3]}
            count={4}
          />

        </RigidBody>

        {/* ===== LIGHTING ===== */}
        <pointLight position={[0, 4, 3]} color={PALETTE.SCREEN_AMBER} intensity={0.3} distance={10} />
        <pointLight position={[0, 1.8, -0.5]} color={PALETTE.SCREEN_AMBER} intensity={0.4} distance={6} />
        <pointLight position={[7.5, 1.5, 11]} color="#FF6B35" intensity={0.3} distance={4} />
      </group>
    </StructureBase>
  );
};
