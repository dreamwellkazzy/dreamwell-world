export const waterFragmentShader = /* glsl */ `
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Hash-based noise
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

void main() {
  // Distance from world center for depth-based blending
  float distFromCenter = length(vWorldPosition.xz);
  float depthFactor = smoothstep(20.0, 100.0, distFromCenter);

  // Base color: shallow (#5B8C7A) to deep (#1A3A3A)
  vec3 shallowColor = vec3(0.357, 0.549, 0.478);
  vec3 deepColor = vec3(0.102, 0.227, 0.227);
  vec3 baseColor = mix(shallowColor, deepColor, depthFactor);

  // Animated caustics: two scrolling noise layers
  float caustic1 = vnoise(vWorldPosition.xz * 0.3 + vec2(uTime * 0.15, uTime * 0.1));
  float caustic2 = vnoise(vWorldPosition.xz * 0.5 - vec2(uTime * 0.12, uTime * 0.08));
  float caustics = (caustic1 + caustic2) * 0.5;
  caustics = smoothstep(0.3, 0.7, caustics);
  baseColor += caustics * 0.08 * (1.0 - depthFactor * 0.5);

  // Specular highlight: fake sun reflection
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(vec3(0.4, 0.6, 0.3));
  vec3 halfDir = normalize(viewDir + sunDir);
  float specular = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
  baseColor += vec3(1.0, 0.95, 0.8) * specular * 0.6;

  // Fresnel-like rim brightening
  float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
  fresnel = pow(fresnel, 3.0) * 0.3;
  baseColor += vec3(0.6, 0.7, 0.65) * fresnel;

  // Foam: white band near shore (where terrain meets water)
  float shoreDist = smoothstep(60.0, 85.0, distFromCenter);
  float foamNoise = vnoise(vWorldPosition.xz * 1.5 + vec2(uTime * 0.2));
  float foamLine = smoothstep(0.55, 0.75, shoreDist + foamNoise * 0.15);
  float foamFade = 1.0 - smoothstep(0.75, 0.95, shoreDist + foamNoise * 0.1);
  float foam = foamLine * foamFade;
  // Additional inner foam ripples
  float innerFoam = smoothstep(0.5, 0.6, vnoise(vWorldPosition.xz * 3.0 + vec2(uTime * 0.3, -uTime * 0.15)));
  foam += innerFoam * shoreDist * 0.3;
  baseColor = mix(baseColor, vec3(0.95, 0.97, 0.95), clamp(foam, 0.0, 1.0) * 0.6);

  // Transparency: more opaque far from shore, more transparent near shore
  float alpha = mix(0.75, 0.9, depthFactor);

  // Distance fog (warm sand #D4A574)
  float fogDist = length(vWorldPosition.xz);
  float fogFactor = smoothstep(80.0, 300.0, fogDist);
  vec3 fogColor = vec3(0.831, 0.647, 0.455);
  baseColor = mix(baseColor, fogColor, fogFactor);
  alpha = mix(alpha, 1.0, fogFactor * 0.5);

  gl_FragColor = vec4(baseColor, alpha);
}
`;
