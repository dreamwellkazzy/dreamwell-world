import * as THREE from 'three';
import { terrainVertexShader } from '@shaders/terrain.vert';
import { terrainFragmentShader } from '@shaders/terrain.frag';

export function createTerrainMaterial(splatTexture: THREE.DataTexture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSplatmap: { value: splatTexture },
      uTime: { value: 0 },
    },
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    side: THREE.FrontSide,
  });
}
