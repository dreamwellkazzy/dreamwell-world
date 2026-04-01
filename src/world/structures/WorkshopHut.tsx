import { useRef } from 'react';
import { Group } from 'three';
import { RigidBody } from '@react-three/rapier';
import { StructureDef } from '@shared/types';
import { PALETTE } from '@shared/constants';
import { StructureBase } from './StructureBase';

// ---------- main component ----------

interface WorkshopHutProps {
  def: StructureDef;
}

export const WorkshopHut = ({ def }: WorkshopHutProps) => {
  const groupRef = useRef<Group>(null);

  const variant = (def.metadata?.variant as number) ?? 0;

  // variant-driven colors
  const wallColor = variant === 0 ? PALETTE.AGED_WOOD : PALETTE.WARM_SAND;
  const wallAccent = variant === 0 ? PALETTE.DARK_EARTH : PALETTE.CONCRETE_AGED;
  const roofColor = variant === 0 ? PALETTE.DARK_CHROME : PALETTE.RUST;
  const roofTrim = variant === 0 ? PALETTE.CHROME : PALETTE.DARK_CHROME;

  return (
    <StructureBase def={def}>
      <group ref={groupRef}>
        <RigidBody type="fixed" colliders={false}>

          {/* ===== BASE PLATFORM ===== */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[4, 0.2, 4]} />
            <meshStandardMaterial color={wallAccent} />
          </mesh>

          {/* ===== WALLS ===== */}
          {/* back wall */}
          <mesh position={[0, 1.5, -1.9]}>
            <boxGeometry args={[4, 2.8, 0.15]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          {/* left wall */}
          <mesh position={[-1.925, 1.5, 0]}>
            <boxGeometry args={[0.15, 2.8, 4]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          {/* right wall */}
          <mesh position={[1.925, 1.5, 0]}>
            <boxGeometry args={[0.15, 2.8, 4]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>

          {/* front wall -- two halves with doorway cutout */}
          {/* left half-wall */}
          <mesh position={[-1.25, 1.5, 1.9]}>
            <boxGeometry args={[1.4, 2.8, 0.15]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          {/* right half-wall */}
          <mesh position={[1.25, 1.5, 1.9]}>
            <boxGeometry args={[1.4, 2.8, 0.15]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          {/* above-door lintel */}
          <mesh position={[0, 2.7, 1.9]}>
            <boxGeometry args={[1.2, 0.5, 0.15]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>

          {/* ===== DOOR (slightly ajar) ===== */}
          <mesh
            position={[0.45, 1.15, 2.05]}
            rotation={[0, -0.35, 0]}
          >
            <boxGeometry args={[0.9, 2.1, 0.06]} />
            <meshStandardMaterial color={wallAccent} />
          </mesh>
          {/* door handle */}
          <mesh position={[0.15, 1.15, 2.1]} rotation={[0, -0.35, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={PALETTE.CHROME} metalness={0.9} roughness={0.1} />
          </mesh>

          {/* ===== A-FRAME ROOF ===== */}
          {/* left roof plane */}
          <mesh position={[-1.1, 3.3, 0]} rotation={[0, 0, 0.55]}>
            <boxGeometry args={[2.6, 0.1, 4.6]} />
            <meshStandardMaterial color={roofColor} metalness={0.5} roughness={0.5} />
          </mesh>
          {/* right roof plane */}
          <mesh position={[1.1, 3.3, 0]} rotation={[0, 0, -0.55]}>
            <boxGeometry args={[2.6, 0.1, 4.6]} />
            <meshStandardMaterial color={roofColor} metalness={0.5} roughness={0.5} />
          </mesh>
          {/* ridge cap */}
          <mesh position={[0, 3.85, 0]}>
            <boxGeometry args={[0.3, 0.1, 4.6]} />
            <meshStandardMaterial color={roofTrim} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* roof gable triangles (front and back) */}
          {[1.97, -1.97].map((z, i) => (
            <mesh key={`gable-${i}`} position={[0, 3.1, z]}>
              <boxGeometry args={[3.8, 0.8, 0.08]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          ))}

          {/* ===== FLOOR BOARDS ===== */}
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[3.7, 0.04, 3.7]} />
            <meshStandardMaterial color={wallAccent} />
          </mesh>

          {/* ===== INTERIOR: DESK ===== */}
          <group position={[0, 0.2, -1.2]}>
            {/* desk top */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[1.6, 0.08, 0.8]} />
              <meshStandardMaterial color={PALETTE.AGED_WOOD} />
            </mesh>
            {/* desk legs */}
            {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([lx, lz], j) => (
              <mesh key={`dl-${j}`} position={[lx, 0.28, lz]}>
                <boxGeometry args={[0.08, 0.55, 0.08]} />
                <meshStandardMaterial color={wallAccent} />
              </mesh>
            ))}
            {/* items on desk */}
            {/* small CRT */}
            <mesh position={[-0.3, 0.85, 0]}>
              <boxGeometry args={[0.35, 0.3, 0.3]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            <mesh position={[-0.3, 0.85, 0.16]}>
              <planeGeometry args={[0.25, 0.2]} />
              <meshStandardMaterial
                color={PALETTE.SCREEN_CYAN}
                emissive={PALETTE.SCREEN_CYAN}
                emissiveIntensity={1}
              />
            </mesh>
            {/* book stack */}
            <mesh position={[0.4, 0.72, 0]}>
              <boxGeometry args={[0.25, 0.15, 0.18]} />
              <meshStandardMaterial color="#664433" />
            </mesh>
            <mesh position={[0.4, 0.82, 0]}>
              <boxGeometry args={[0.22, 0.06, 0.18]} />
              <meshStandardMaterial color="#445566" />
            </mesh>
          </group>

          {/* ===== INTERIOR: CHAIR ===== */}
          <group position={[0, 0.2, -0.3]}>
            {/* seat */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.45, 0.05, 0.4]} />
              <meshStandardMaterial color={wallAccent} />
            </mesh>
            {/* back */}
            <mesh position={[0, 0.6, -0.18]}>
              <boxGeometry args={[0.45, 0.5, 0.05]} />
              <meshStandardMaterial color={wallAccent} />
            </mesh>
            {/* legs */}
            {[[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]].map(([lx, lz], j) => (
              <mesh key={`cl-${j}`} position={[lx, 0.15, lz]}>
                <cylinderGeometry args={[0.02, 0.02, 0.28, 4]} />
                <meshStandardMaterial color={PALETTE.DARK_CHROME} />
              </mesh>
            ))}
          </group>

          {/* ===== INTERIOR: LAMP ===== */}
          <group position={[1.3, 0.2, -1.3]}>
            {/* pole */}
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 1.5, 6]} />
              <meshStandardMaterial color={PALETTE.DARK_CHROME} />
            </mesh>
            {/* shade */}
            <mesh position={[0, 1.55, 0]}>
              <cylinderGeometry args={[0.08, 0.2, 0.2, 8]} />
              <meshStandardMaterial color={PALETTE.WARM_SAND} />
            </mesh>
            {/* bulb */}
            <mesh position={[0, 1.45, 0]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial
                color={PALETTE.SCREEN_WARM}
                emissive={PALETTE.SCREEN_WARM}
                emissiveIntensity={2}
              />
            </mesh>
          </group>

          {/* ===== INTERIOR: SMALL PROPS ===== */}
          {/* wall shelf */}
          <mesh position={[1.6, 1.5, -1.2]}>
            <boxGeometry args={[0.5, 0.06, 0.25]} />
            <meshStandardMaterial color={PALETTE.AGED_WOOD} />
          </mesh>
          {/* jar on shelf */}
          <mesh position={[1.6, 1.6, -1.2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.14, 8]} />
            <meshStandardMaterial color="#557788" transparent opacity={0.6} />
          </mesh>
          {/* toolbox on floor */}
          <mesh position={[-1.3, 0.35, 0.5]}>
            <boxGeometry args={[0.4, 0.2, 0.25]} />
            <meshStandardMaterial color={PALETTE.POSTMASTER_RED} />
          </mesh>
          {/* broom leaning on wall */}
          <mesh position={[-1.7, 1, 0.5]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.015, 0.015, 1.6, 4]} />
            <meshStandardMaterial color={PALETTE.AGED_WOOD} />
          </mesh>

          {/* ===== EXTERIOR: SMALL PORCH ===== */}
          <mesh position={[0, 0.08, 2.6]}>
            <boxGeometry args={[2.5, 0.16, 1.2]} />
            <meshStandardMaterial color={wallAccent} />
          </mesh>
          {/* porch posts */}
          {[-1, 1].map((x, i) => (
            <mesh key={`pp-${i}`} position={[x, 1.3, 2.8]}>
              <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          ))}
          {/* porch roof (small overhang) */}
          <mesh position={[0, 2.55, 2.8]}>
            <boxGeometry args={[2.8, 0.08, 1.5]} />
            <meshStandardMaterial color={roofColor} metalness={0.4} roughness={0.6} />
          </mesh>

          {/* ===== EXTERIOR: SIGN PLACEHOLDER ===== */}
          <mesh position={[0, 2.2, 2.85]}>
            <boxGeometry args={[1, 0.5, 0.06]} />
            <meshStandardMaterial color={PALETTE.DARK_EARTH} />
          </mesh>

          {/* ===== CHIMNEY (variant 0) ===== */}
          {variant === 0 && (
            <group position={[1.2, 3.5, -1]}>
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.4, 1.2, 0.4]} />
                <meshStandardMaterial color={PALETTE.CONCRETE_AGED} />
              </mesh>
              {/* chimney cap */}
              <mesh position={[0, 1.05, 0]}>
                <boxGeometry args={[0.5, 0.08, 0.5]} />
                <meshStandardMaterial color={PALETTE.DARK_CHROME} />
              </mesh>
            </group>
          )}

          {/* ===== FLOWER BOX (variant 1) ===== */}
          {variant === 1 && (
            <group position={[1.95, 1, 0.5]}>
              <mesh>
                <boxGeometry args={[0.15, 0.2, 0.6]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} />
              </mesh>
              {/* "flowers" (small spheres) */}
              {[-0.15, 0, 0.15].map((z, i) => (
                <mesh key={i} position={[0.05, 0.18, z]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial
                    color={['#DD4466', '#DDAA22', '#DD4466'][i]}
                  />
                </mesh>
              ))}
            </group>
          )}

        </RigidBody>

        {/* ===== INTERIOR LIGHT ===== */}
        <pointLight position={[0, 2.2, -0.5]} color="#FF6B35" intensity={0.4} distance={4} />
      </group>
    </StructureBase>
  );
};
