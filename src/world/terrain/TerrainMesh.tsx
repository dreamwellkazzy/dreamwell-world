import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { TerrainChunkData } from '@shared/types';
import { WORLD } from '@shared/constants';
import { createTerrainMaterial } from './TerrainMaterial';

interface TerrainMeshProps {
  chunkData: TerrainChunkData;
  position: [number, number, number];
}

export function TerrainMesh({ chunkData, position }: TerrainMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const geometry = useMemo(() => {
    const { resolution, heightmap } = chunkData;
    const geo = new THREE.PlaneGeometry(
      WORLD.CHUNK_SIZE,
      WORLD.CHUNK_SIZE,
      resolution - 1,
      resolution - 1,
    );
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, heightmap[i] * WORLD.HEIGHT_SCALE);
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }, [chunkData]);

  const splatTexture = useMemo(() => {
    const { resolution, splatmap } = chunkData;
    const tex = new THREE.DataTexture(
      new Float32Array(splatmap),
      resolution,
      resolution,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [chunkData]);

  const material = useMemo(
    () => createTerrainMaterial(splatTexture),
    [splatTexture],
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh
          geometry={geometry}
          material={material}
          receiveShadow
          ref={(mesh) => {
            if (mesh) {
              materialRef.current = mesh.material as THREE.ShaderMaterial;
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
