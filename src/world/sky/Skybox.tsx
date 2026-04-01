import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';

const skyVertexShader = /* glsl */ `
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const skyFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uTimeOfDay;

varying vec3 vWorldPosition;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += vnoise(p) * amplitude;
    p *= 2.1;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Normalized direction from center of sphere
  vec3 dir = normalize(vWorldPosition);
  float elevation = dir.y; // -1 (bottom) to 1 (top)

  // Golden hour factor: peaks at sunrise/sunset hours
  float goldenHour = 1.0 - smoothstep(0.0, 3.0, abs(uTimeOfDay - 17.0));
  goldenHour = max(goldenHour, 1.0 - smoothstep(0.0, 3.0, abs(uTimeOfDay - 7.0)));

  // Sky gradient colors
  vec3 goldenColor = vec3(1.0, 0.824, 0.498);    // #FFD27F
  vec3 skyBlue = vec3(0.529, 0.808, 0.922);       // #87CEEB
  vec3 duskPurple = vec3(0.180, 0.106, 0.290);    // #2E1B4A

  // Warm shift during golden hour
  vec3 warmSkyBlue = mix(skyBlue, vec3(0.85, 0.65, 0.5), goldenHour * 0.5);
  vec3 warmDusk = mix(duskPurple, vec3(0.3, 0.15, 0.35), goldenHour * 0.3);

  // Three-stop gradient: bottom -> middle -> top
  float bottomToMid = smoothstep(-0.1, 0.3, elevation);
  float midToTop = smoothstep(0.3, 0.85, elevation);

  vec3 skyColor = mix(goldenColor, warmSkyBlue, bottomToMid);
  skyColor = mix(skyColor, warmDusk, midToTop);

  // Procedural clouds: only in upper hemisphere
  if (elevation > 0.0) {
    // Project onto a flat plane for cloud sampling
    vec2 cloudUV = dir.xz / (dir.y + 0.3) * 8.0;

    // Two scrolling cloud layers
    float cloud1 = fbm(cloudUV + vec2(uTime * 0.02, uTime * 0.01));
    float cloud2 = fbm(cloudUV * 0.7 + vec2(-uTime * 0.015, uTime * 0.008));
    float clouds = (cloud1 + cloud2) * 0.5;

    // Shape clouds: threshold and soften
    float cloudMask = smoothstep(0.35, 0.55, clouds);

    // Fade clouds near horizon and zenith
    float horizonFade = smoothstep(0.0, 0.15, elevation);
    float zenithFade = 1.0 - smoothstep(0.7, 0.95, elevation);
    cloudMask *= horizonFade * zenithFade;

    // Warm cloud tint (#FFE8CC not pure white)
    vec3 cloudColor = vec3(1.0, 0.910, 0.800);
    // Warmer during golden hour
    cloudColor = mix(cloudColor, vec3(1.0, 0.82, 0.65), goldenHour * 0.4);

    skyColor = mix(skyColor, cloudColor, cloudMask * 0.7);
  }

  gl_FragColor = vec4(skyColor, 1.0);
}
`;

export function Skybox() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeOfDay = useGameStore((s) => s.timeOfDay);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        uniforms: {
          uTime: { value: 0.0 },
          uTimeOfDay: { value: timeOfDay },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uTimeOfDay.value = timeOfDay;
    }
  });

  return (
    <mesh receiveShadow={false} castShadow={false}>
      <sphereGeometry args={[250, 32, 32]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}
