import * as THREE from 'three';
import { waterVertexShader } from '@shaders/water.vert';
import { waterFragmentShader } from '@shaders/water.frag';

export function createWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
