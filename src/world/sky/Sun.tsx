import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';

const SUN_DISTANCE = 200;
const SUN_SIZE = 8;

function getSunPosition(hour: number): THREE.Vector3 {
  // Sun orbits from east (6h) through zenith (12h) to west (18h)
  // Angle: 0 at sunrise (6h), PI at sunset (18h)
  const dayProgress = (hour - 6) / 12; // 0 at 6am, 1 at 6pm
  const angle = dayProgress * Math.PI;

  // Sun arc: rises in +X, peaks at +Y, sets in -X
  const x = Math.cos(angle) * SUN_DISTANCE;
  const y = Math.sin(angle) * SUN_DISTANCE * 0.8; // slightly flattened arc
  const z = -SUN_DISTANCE * 0.3; // offset toward viewer

  return new THREE.Vector3(x, Math.max(y, -20), z);
}

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeOfDay = useGameStore((s) => s.timeOfDay);

  const sunMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFD27F'),
        fog: false,
      }),
    [],
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFE8B0'),
        transparent: true,
        opacity: 0.25,
        fog: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame(({ camera }) => {
    const pos = getSunPosition(timeOfDay);

    if (meshRef.current) {
      meshRef.current.position.copy(pos);
      // Billboard: always face camera
      meshRef.current.lookAt(camera.position);
    }

    if (glowRef.current) {
      glowRef.current.position.copy(pos);
      glowRef.current.lookAt(camera.position);

      // Pulsing glow intensity
      const pulse = 0.2 + Math.sin(Date.now() * 0.001) * 0.05;
      glowMaterial.opacity = pulse;
    }

    // Warm color shift near horizon
    const sunHeight = pos.y / SUN_DISTANCE;
    const horizonWarmth = 1.0 - Math.min(Math.max(sunHeight, 0), 1);
    const warmColor = new THREE.Color('#FFD27F').lerp(
      new THREE.Color('#FF8C42'),
      horizonWarmth * 0.6,
    );
    sunMaterial.color.copy(warmColor);
  });

  // Hide sun when below horizon (nighttime)
  const sunPos = getSunPosition(timeOfDay);
  if (sunPos.y < -10) return null;

  return (
    <group>
      {/* Sun disc */}
      <mesh
        ref={meshRef}
        receiveShadow={false}
        castShadow={false}
      >
        <circleGeometry args={[SUN_SIZE, 32]} />
        <primitive object={sunMaterial} attach="material" />
      </mesh>

      {/* Glow halo */}
      <mesh
        ref={glowRef}
        receiveShadow={false}
        castShadow={false}
      >
        <circleGeometry args={[SUN_SIZE * 3, 32]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
    </group>
  );
}
