import { useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

const FADED_YELLOW = '#B8A038';

// ---------- sub-components ----------

const BusSeat = ({
  position,
  overturned = false,
}: {
  position: [number, number, number];
  overturned?: boolean;
}) => {
  const rot: [number, number, number] = overturned
    ? [0.3, 0.5, Math.PI * 0.6]
    : [0, 0, 0];
  return (
    <group position={position} rotation={rot}>
      {/* seat base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.8, 0.08, 0.4]} />
        <meshStandardMaterial color="#5B5030" />
      </mesh>
      {/* seat back */}
      <mesh position={[0, 0.42, -0.18]}>
        <boxGeometry args={[0.8, 0.5, 0.06]} />
        <meshStandardMaterial color="#5B5030" />
      </mesh>
      {/* legs */}
      {[[-0.3, -0.15], [0.3, -0.15]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, -0.02, lz]}>
          <boxGeometry args={[0.05, 0.25, 0.05]} />
          <meshStandardMaterial color={PALETTE.DARK_CHROME} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- main component ----------

interface SchoolBusProps {
  def: StructureDef;
}

export const SchoolBus = ({ def }: SchoolBusProps) => {
  const groupRef = useRef<Group>(null);

  // window pattern: true = has glass, false = broken/open
  const windowPattern = [true, true, false, true, false, true, true, false, true, true];

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        {/* slight tilt to make it look broken down */}
        <group rotation={[0, 0, 0.04]}>
          <RigidBody type="fixed" colliders={false}>

            {/* ===== BUS BODY ===== */}
            <mesh position={[0, 1.25, 0]}>
              <boxGeometry args={[8, 2.5, 2.5]} />
              <meshStandardMaterial color={FADED_YELLOW} roughness={0.85} />
            </mesh>

            {/* ===== ROOF ===== */}
            <mesh position={[0, 2.55, 0]}>
              <boxGeometry args={[8.1, 0.1, 2.6]} />
              <meshStandardMaterial color="#9A8A30" roughness={0.8} />
            </mesh>

            {/* ===== FLOOR ===== */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[8, 0.1, 2.5]} />
              <meshStandardMaterial color={PALETTE.DARK_EARTH} />
            </mesh>

            {/* ===== BUMPERS ===== */}
            <mesh position={[-4.1, 0.4, 0]}>
              <boxGeometry args={[0.2, 0.3, 2.2]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            <mesh position={[4.1, 0.4, 0]}>
              <boxGeometry args={[0.2, 0.3, 2.2]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>

            {/* ===== WINDOWS -- left side ===== */}
            {windowPattern.map((hasGlass, i) => {
              const x = -3.2 + i * 0.72;
              return hasGlass ? (
                <mesh key={`wl-${i}`} position={[x, 1.6, 1.26]}>
                  <planeGeometry args={[0.55, 0.7]} />
                  <meshStandardMaterial color="#445566" transparent opacity={0.35} side={2} />
                </mesh>
              ) : null;
            })}

            {/* ===== WINDOWS -- right side ===== */}
            {windowPattern.map((hasGlass, i) => {
              const x = -3.2 + i * 0.72;
              return hasGlass ? (
                <mesh key={`wr-${i}`} position={[x, 1.6, -1.26]}>
                  <planeGeometry args={[0.55, 0.7]} />
                  <meshStandardMaterial color="#445566" transparent opacity={0.35} side={2} />
                </mesh>
              ) : null;
            })}

            {/* ===== WINDOW FRAMES (both sides) ===== */}
            {windowPattern.map((_, i) => {
              const x = -3.2 + i * 0.72;
              return (
                <group key={`wf-${i}`}>
                  {/* left frame */}
                  <mesh position={[x, 1.6, 1.27]}>
                    <boxGeometry args={[0.6, 0.75, 0.02]} />
                    <meshStandardMaterial color="#8A7A20" />
                  </mesh>
                  {/* right frame */}
                  <mesh position={[x, 1.6, -1.27]}>
                    <boxGeometry args={[0.6, 0.75, 0.02]} />
                    <meshStandardMaterial color="#8A7A20" />
                  </mesh>
                </group>
              );
            })}

            {/* ===== FRONT WINDSHIELD ===== */}
            <mesh position={[-4.01, 1.5, 0]}>
              <planeGeometry args={[2.2, 1.2]} />
              <meshStandardMaterial color="#445566" transparent opacity={0.3} side={2} />
            </mesh>

            {/* ===== REAR WINDOW ===== */}
            <mesh position={[4.01, 1.5, 0]}>
              <planeGeometry args={[2, 1]} />
              <meshStandardMaterial color="#445566" transparent opacity={0.25} side={2} />
            </mesh>

            {/* ===== HEADLIGHTS ===== */}
            {[-0.8, 0.8].map((z, i) => (
              <mesh key={`hl-${i}`} position={[-4.12, 0.8, z]}>
                <cylinderGeometry args={[0.12, 0.12, 0.08, 8]} />
                <meshStandardMaterial
                  color={PALETTE.SCREEN_WARM}
                  emissive={PALETTE.SCREEN_WARM}
                  emissiveIntensity={0.4}
                />
              </mesh>
            ))}

            {/* ===== OPEN DOOR (front, driver side) ===== */}
            <mesh
              position={[-3.2, 1, 1.4]}
              rotation={[0, 0.6, 0]}
            >
              <boxGeometry args={[0.8, 1.8, 0.06]} />
              <meshStandardMaterial color={FADED_YELLOW} roughness={0.85} />
            </mesh>
            {/* door window */}
            <mesh
              position={[-3.2, 1.6, 1.42]}
              rotation={[0, 0.6, 0]}
            >
              <planeGeometry args={[0.6, 0.5]} />
              <meshStandardMaterial color="#445566" transparent opacity={0.3} side={2} />
            </mesh>

            {/* ===== WHEELS ===== */}
            {/* front-left (present) */}
            <mesh position={[-2.8, 0, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.2, 12]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* front-right (flat/deflated) */}
            <mesh position={[-2.8, -0.1, -1.35]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.3, 12]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* rear-left (present) */}
            <mesh position={[2.8, 0, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.2, 12]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* rear-right: MISSING -- axle stub only */}
            <mesh position={[2.8, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.3, 6]} />
              <meshStandardMaterial color={PALETTE.RUST} />
            </mesh>

            {/* ===== WHEEL WELLS ===== */}
            {[-2.8, 2.8].map((x, i) => (
              <group key={`well-${i}`}>
                <mesh position={[x, 0.35, 1.26]}>
                  <boxGeometry args={[1, 0.6, 0.04]} />
                  <meshStandardMaterial color="#8A7A20" />
                </mesh>
                <mesh position={[x, 0.35, -1.26]}>
                  <boxGeometry args={[1, 0.6, 0.04]} />
                  <meshStandardMaterial color="#8A7A20" />
                </mesh>
              </group>
            ))}

            {/* ===== GRAFFITI PATCHES (colored rectangles on sides) ===== */}
            {[
              { pos: [1, 1.2, 1.27] as [number, number, number], color: '#CC3344', size: [0.8, 0.5] },
              { pos: [2.5, 0.8, 1.27] as [number, number, number], color: '#3377CC', size: [0.6, 0.4] },
              { pos: [-0.5, 1.8, 1.27] as [number, number, number], color: '#44AA44', size: [1.0, 0.3] },
              { pos: [0.5, 0.9, -1.27] as [number, number, number], color: '#AA44AA', size: [0.7, 0.5] },
              { pos: [-1.5, 1.5, -1.27] as [number, number, number], color: '#DDAA22', size: [0.9, 0.35] },
            ].map((g, i) => (
              <mesh key={`graf-${i}`} position={g.pos}>
                <planeGeometry args={[g.size[0], g.size[1]]} />
                <meshStandardMaterial color={g.color} transparent opacity={0.6} side={2} />
              </mesh>
            ))}

            {/* ===== INTERIOR: BUS SEATS ===== */}
            {/* left row */}
            {[-2, -0.8, 0.4, 1.6].map((x, i) => (
              <BusSeat
                key={`sl-${i}`}
                position={[x, 0.15, 0.7]}
                overturned={i === 2}
              />
            ))}
            {/* right row */}
            {[-2, -0.8, 0.4, 1.6].map((x, i) => (
              <BusSeat
                key={`sr-${i}`}
                position={[x, 0.15, -0.7]}
                overturned={i === 0}
              />
            ))}

            {/* ===== INTERIOR: MAKESHIFT DESK AT BACK ===== */}
            <group position={[3, 0.1, 0]}>
              {/* desk surface */}
              <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[1.2, 0.08, 1.5]} />
                <meshStandardMaterial color={PALETTE.AGED_WOOD} />
              </mesh>
              {/* desk legs (crates) */}
              <mesh position={[-0.4, 0.3, 0]}>
                <boxGeometry args={[0.4, 0.5, 0.5]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} />
              </mesh>
              <mesh position={[0.4, 0.3, 0]}>
                <boxGeometry args={[0.4, 0.5, 0.5]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} />
              </mesh>
              {/* CRT on desk */}
              <mesh position={[0, 0.95, 0]}>
                <boxGeometry args={[0.5, 0.4, 0.4]} />
                <meshStandardMaterial color={PALETTE.DARK_CHROME} />
              </mesh>
              <mesh position={[0, 0.95, 0.22]}>
                <planeGeometry args={[0.38, 0.3]} />
                <meshStandardMaterial
                  color={PALETTE.SCREEN_GREEN}
                  emissive={PALETTE.SCREEN_GREEN}
                  emissiveIntensity={1.2}
                />
              </mesh>
            </group>

            {/* ===== INTERIOR: HANGING WIRES ===== */}
            {[-1, 0.5, 2].map((x, i) => (
              <mesh key={`wire-${i}`} position={[x, 1.8 + Math.sin(i * 2.3) * 0.3, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.6 + Math.sin(i * 4.1) * 0.3, 3]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            ))}

            {/* ===== INTERIOR: SCATTERED BOOKS (flat planes) ===== */}
            {[
              [-1.5, 0.12, 0.2, 0.3],
              [-0.3, 0.12, -0.5, 1.1],
              [1.2, 0.12, 0.1, 0.7],
              [2.1, 0.12, -0.3, 2.3],
              [0.5, 0.12, 0.6, 1.8],
            ].map(([x, y, z, rotY], i) => (
              <mesh
                key={`book-${i}`}
                position={[x, y, z]}
                rotation={[-Math.PI / 2, 0, rotY]}
              >
                <planeGeometry args={[0.18, 0.25]} />
                <meshStandardMaterial
                  color={['#883333', '#336688', '#448833', '#886633', '#663388'][i]}
                  side={2}
                />
              </mesh>
            ))}

            {/* ===== INTERIOR: MATTRESS (padded box at back) ===== */}
            <mesh position={[3, 0.2, -0.8]}>
              <boxGeometry args={[1.4, 0.2, 0.8]} />
              <meshStandardMaterial color="#667755" roughness={0.95} />
            </mesh>
            {/* pillow */}
            <mesh position={[3.4, 0.35, -0.8]}>
              <boxGeometry args={[0.35, 0.12, 0.5]} />
              <meshStandardMaterial color="#998877" roughness={0.95} />
            </mesh>

            {/* ===== EXTERIOR: FLAT TIRE PILE NEXT TO BUS ===== */}
            {[0, 1, 2].map((i) => (
              <mesh
                key={`et-${i}`}
                position={[1 + i * 0.3, 0.12 + i * 0.22, -2]}
                rotation={[Math.PI / 2, 0, i * 0.3]}
              >
                <torusGeometry args={[0.35, 0.12, 8, 16]} />
                <meshStandardMaterial color="#222" roughness={0.95} />
              </mesh>
            ))}

            {/* ===== STOP SIGN on back ===== */}
            <group position={[4.05, 1.2, -0.8]}>
              <mesh>
                <cylinderGeometry args={[0.3, 0.3, 0.04, 8]} />
                <meshStandardMaterial color={PALETTE.POSTMASTER_RED} />
              </mesh>
            </group>

          </RigidBody>

          {/* ===== INTERIOR LIGHT ===== */}
          <pointLight position={[1, 2, 0]} color="#FF6B35" intensity={0.35} distance={5} />
          <pointLight position={[3, 1.5, 0]} color={PALETTE.SCREEN_GREEN} intensity={0.2} distance={3} />
        </group>
      </group>
    </StructureBase>
  );
};
