import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { PALETTE } from '@shared/constants';

const dummy = new THREE.Object3D();

/** Seeded pseudo-random (Mulberry32) for deterministic transforms */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Tires ─────────────────────────────────────────────────────────────────────
interface TiresProps {
  positions: [number, number, number][];
}

const Tires = ({ positions }: TiresProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = positions.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const rng = seededRandom(9001);

    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      const embed = -0.1 - rng() * 0.2;

      dummy.position.set(pos[0], pos[1] + embed, pos[2]);
      // Some tires flat, some leaning, some upright
      const variant = i % 3;
      if (variant === 0) {
        // Flat on ground
        dummy.rotation.set(Math.PI / 2, rng() * Math.PI * 2, 0);
      } else if (variant === 1) {
        // Leaning
        dummy.rotation.set(0.3 + rng() * 0.4, rng() * Math.PI * 2, 0);
      } else {
        // Upright
        dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      }

      const scale = 0.8 + rng() * 0.5;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <torusGeometry args={[0.3, 0.1, 8, 16]} />
      <meshStandardMaterial color={'#1A1A1A'} roughness={0.95} metalness={0.0} />
    </instancedMesh>
  );
};

// ── Crates ────────────────────────────────────────────────────────────────────
interface CratesProps {
  positions: [number, number, number][];
}

const Crates = ({ positions }: CratesProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = positions.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const rng = seededRandom(4242);

    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      const embed = -0.1 - rng() * 0.15;
      const sizeVar = 0.6 + rng() * 0.8;

      dummy.position.set(pos[0], pos[1] + embed + (0.25 * sizeVar), pos[2]);
      dummy.rotation.set(
        (rng() - 0.5) * 0.1,
        rng() * Math.PI * 2,
        (rng() - 0.5) * 0.1,
      );
      dummy.scale.set(sizeVar, sizeVar, sizeVar);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={PALETTE.AGED_WOOD} roughness={0.9} metalness={0.0} />
    </instancedMesh>
  );
};

// ── Barrels ───────────────────────────────────────────────────────────────────
interface BarrelsProps {
  positions: [number, number, number][];
}

const BARREL_COLORS = [PALETTE.RUST, '#884422', PALETTE.CONCRETE_AGED];

const Barrels = ({ positions }: BarrelsProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorRef = useRef<THREE.InstancedBufferAttribute | null>(null);
  const count = positions.length;

  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const rng = seededRandom(7777);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      tmpColor.set(BARREL_COLORS[Math.floor(rng() * BARREL_COLORS.length)]);
      arr[i * 3] = tmpColor.r;
      arr[i * 3 + 1] = tmpColor.g;
      arr[i * 3 + 2] = tmpColor.b;
    }
    return arr;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    const rng = seededRandom(7777);

    for (let i = 0; i < count; i++) {
      // Consume the same random as colorArray so sequences stay in sync
      rng();

      const pos = positions[i];
      const embed = -0.15 - rng() * 0.15;
      const scale = 0.8 + rng() * 0.4;

      // Some barrels upright, some on their sides
      const onSide = i % 4 === 0;

      dummy.position.set(
        pos[0],
        pos[1] + embed + (onSide ? 0.2 * scale : 0.4 * scale),
        pos[2],
      );

      if (onSide) {
        dummy.rotation.set(Math.PI / 2, rng() * Math.PI * 2, (rng() - 0.5) * 0.2);
      } else {
        dummy.rotation.set(
          (rng() - 0.5) * 0.08,
          rng() * Math.PI * 2,
          (rng() - 0.5) * 0.08,
        );
      }

      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <cylinderGeometry args={[0.2, 0.22, 0.8, 12]} />
      <meshStandardMaterial color={PALETTE.RUST} roughness={0.85} metalness={0.15} />
    </instancedMesh>
  );
};

// ── Debris (combined export) ──────────────────────────────────────────────────
interface DebrisProps {
  tirePositions: [number, number, number][];
  cratePositions: [number, number, number][];
  barrelPositions: [number, number, number][];
}

export const Debris = ({ tirePositions, cratePositions, barrelPositions }: DebrisProps) => {
  return (
    <group>
      {tirePositions.length > 0 && <Tires positions={tirePositions} />}
      {cratePositions.length > 0 && <Crates positions={cratePositions} />}
      {barrelPositions.length > 0 && <Barrels positions={barrelPositions} />}
    </group>
  );
};
