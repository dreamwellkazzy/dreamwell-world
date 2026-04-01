import { PALETTE } from '@shared/constants';

interface SignDef {
  position: [number, number, number];
  text: string;
  rotation: number;
}

interface SignPostsProps {
  signs: SignDef[];
}

const POST_HEIGHT = 2.0;
const POST_RADIUS = 0.03;
const SIGN_W = 0.6;
const SIGN_H = 0.25;
const SIGN_D = 0.03;
const SIGN_COLORS = [PALETTE.WARM_SAND, PALETTE.RUST, '#AA8844', PALETTE.CONCRETE_AGED];

export const SignPosts = ({ signs }: SignPostsProps) => {
  return (
    <group>
      {signs.map((sign, i) => {
        // Slight weathered tilt
        const tiltX = ((i * 137) % 7 - 3) * 0.015;
        const tiltZ = ((i * 89) % 5 - 2) * 0.02;
        const signColor = SIGN_COLORS[i % SIGN_COLORS.length];

        return (
          <group
            key={i}
            position={sign.position}
            rotation={[tiltX, sign.rotation, tiltZ]}
          >
            {/* Post */}
            <mesh position={[0, POST_HEIGHT / 2, 0]} castShadow>
              <cylinderGeometry args={[POST_RADIUS, POST_RADIUS * 1.2, POST_HEIGHT, 6]} />
              <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
            </mesh>

            {/* Sign board (slightly angled for weathered look) */}
            <group position={[0, POST_HEIGHT * 0.85, 0]} rotation={[0, 0, 0.05]}>
              <mesh castShadow>
                <boxGeometry args={[SIGN_W, SIGN_H, SIGN_D]} />
                <meshStandardMaterial color={signColor} roughness={0.8} />
              </mesh>
              {/* Dark trim border on sign face */}
              <mesh position={[0, 0, SIGN_D / 2 + 0.001]}>
                <planeGeometry args={[SIGN_W - 0.06, SIGN_H - 0.04]} />
                <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
              </mesh>
            </group>

            {/* Support bracket (small angled piece connecting post to sign) */}
            <mesh
              position={[0, POST_HEIGHT * 0.75, 0.03]}
              rotation={[0.3, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.02, 0.15, 0.02]} />
              <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
