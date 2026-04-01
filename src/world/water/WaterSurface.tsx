import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD } from '@shared/constants';
import { createWaterMaterial } from './WaterMaterial';

export function WaterSurface() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const waterMaterial = useMemo(() => createWaterMaterial(), []);

  const waterY = WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE;

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterY, 0]}
      receiveShadow={false}
      castShadow={false}
    >
      <planeGeometry args={[400, 400, 128, 128]} />
      <primitive
        ref={materialRef}
        object={waterMaterial}
        attach="material"
      />
    </mesh>
  );
}
