import { PALETTE } from '@shared/constants';

interface FurnitureProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

// ── Desk ──────────────────────────────────────────────────────────────────────
export const Desk = ({ position, rotation = [0, 0, 0] }: FurnitureProps) => {
  const topY = 0.75;
  const topThick = 0.04;
  const topW = 1.2;
  const topD = 0.6;
  const legH = topY - topThick / 2;
  const legW = 0.05;
  const legInset = 0.06;

  const legPositions: [number, number, number][] = [
    [-topW / 2 + legInset, legH / 2, -topD / 2 + legInset],
    [topW / 2 - legInset, legH / 2, -topD / 2 + legInset],
    [-topW / 2 + legInset, legH / 2, topD / 2 - legInset],
    [topW / 2 - legInset, legH / 2, topD / 2 - legInset],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Tabletop */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[topW, topThick, topD]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
      </mesh>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// ── Chair ─────────────────────────────────────────────────────────────────────
interface ChairProps extends FurnitureProps {
  tilted?: boolean;
}

export const Chair = ({ position, rotation = [0, 0, 0], tilted = false }: ChairProps) => {
  const seatY = 0.45;
  const seatW = 0.4;
  const seatD = 0.4;
  const seatH = 0.04;
  const legH = seatY - seatH / 2;
  const legW = 0.04;
  const backH = 0.4;
  const backThick = 0.035;
  const legInset = 0.04;

  const tiltAngle = tilted ? 0.15 : 0;

  const legPositions: [number, number, number][] = [
    [-seatW / 2 + legInset, legH / 2, -seatD / 2 + legInset],
    [seatW / 2 - legInset, legH / 2, -seatD / 2 + legInset],
    [-seatW / 2 + legInset, legH / 2, seatD / 2 - legInset],
    [seatW / 2 - legInset, legH / 2, seatD / 2 - legInset],
  ];

  return (
    <group position={position} rotation={[rotation[0] + tiltAngle, rotation[1], rotation[2]]}>
      {/* Seat */}
      <mesh position={[0, seatY, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatW, seatH, seatD]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, seatY + backH / 2, -seatD / 2 + backThick / 2]} castShadow>
        <boxGeometry args={[seatW, backH, backThick]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
      </mesh>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// ── Shelf ─────────────────────────────────────────────────────────────────────
export const Shelf = ({ position, rotation = [0, 0, 0] }: FurnitureProps) => {
  const frameW = 0.8;
  const frameH = 1.6;
  const frameD = 0.3;
  const frameThick = 0.03;
  const shelfCount = 4;

  const shelfSpacing = frameH / (shelfCount + 1);

  // Small items on shelves (decorative boxes)
  const items = [
    { shelfIdx: 1, x: -0.15, w: 0.12, h: 0.08, d: 0.1, color: PALETTE.RUST },
    { shelfIdx: 1, x: 0.1, w: 0.08, h: 0.1, d: 0.08, color: PALETTE.CONCRETE_AGED },
    { shelfIdx: 2, x: 0.0, w: 0.15, h: 0.06, d: 0.12, color: PALETTE.DARK_EARTH },
    { shelfIdx: 3, x: -0.1, w: 0.1, h: 0.1, d: 0.1, color: PALETTE.WARM_SAND },
    { shelfIdx: 3, x: 0.15, w: 0.06, h: 0.12, d: 0.06, color: PALETTE.RUST },
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Left side panel */}
      <mesh position={[-frameW / 2, frameH / 2, 0]} castShadow>
        <boxGeometry args={[frameThick, frameH, frameD]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[frameW / 2, frameH / 2, 0]} castShadow>
        <boxGeometry args={[frameThick, frameH, frameD]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, frameH / 2, -frameD / 2 + 0.01]}>
        <boxGeometry args={[frameW, frameH, 0.02]} />
        <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
      </mesh>
      {/* Shelf planes */}
      {Array.from({ length: shelfCount }, (_, i) => {
        const y = shelfSpacing * (i + 1);
        return (
          <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[frameW - frameThick, 0.02, frameD]} />
            <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.85} />
          </mesh>
        );
      })}
      {/* Items on shelves */}
      {items.map((item, i) => {
        const shelfY = shelfSpacing * (item.shelfIdx + 1);
        return (
          <mesh key={`item-${i}`} position={[item.x, shelfY + 0.01 + item.h / 2, 0]} castShadow>
            <boxGeometry args={[item.w, item.h, item.d]} />
            <meshStandardMaterial color={item.color} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// ── Workbench ─────────────────────────────────────────────────────────────────
export const Workbench = ({ position, rotation = [0, 0, 0] }: FurnitureProps) => {
  const topW = 1.4;
  const topD = 0.7;
  const topH = 0.08; // thicker top than a desk
  const topY = 0.8;
  const legH = topY - topH / 2;
  const legW = 0.07;
  const legInset = 0.08;

  const legPositions: [number, number, number][] = [
    [-topW / 2 + legInset, legH / 2, -topD / 2 + legInset],
    [topW / 2 - legInset, legH / 2, -topD / 2 + legInset],
    [-topW / 2 + legInset, legH / 2, topD / 2 - legInset],
    [topW / 2 - legInset, legH / 2, topD / 2 - legInset],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Thick workbench top */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[topW, topH, topD]} />
        <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.8} />
      </mesh>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
        </mesh>
      ))}
      {/* Cross brace (structural) */}
      <mesh position={[0, legH * 0.3, -topD / 2 + legInset]} castShadow>
        <boxGeometry args={[topW - legInset * 2, 0.04, 0.04]} />
        <meshStandardMaterial color={PALETTE.DARK_EARTH} roughness={0.9} />
      </mesh>
      {/* Vise: jaw block */}
      <mesh position={[topW / 2 - 0.15, topY + topH / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 0.08]} />
        <meshStandardMaterial color={PALETTE.CONCRETE_AGED} roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Vise: screw handle (cylinder) */}
      <mesh
        position={[topW / 2 - 0.15, topY + topH / 2 + 0.12, 0.06]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color={PALETTE.DARK_CHROME} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
};
