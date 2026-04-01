export const terrainFragmentShader = /* glsl */ `
uniform sampler2D uSplatmap;
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Hash-based noise for color variation
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
  vec4 splat = texture2D(uSplatmap, vUv);

  // Noise layers for color variation
  float n1 = vnoise(vWorldPosition.xz * 0.5);
  float n2 = vnoise(vWorldPosition.xz * 2.0);
  float n3 = vnoise(vWorldPosition.xz * 0.15);

  // Sand (R): warm sandy tones
  vec3 sand = mix(
    vec3(0.831, 0.647, 0.455),  // #D4A574
    vec3(0.769, 0.608, 0.416),  // #C49B6A
    n1
  );
  sand += (n2 - 0.5) * 0.04;

  // Grass (G): warm green-yellow
  vec3 grass = mix(
    vec3(0.420, 0.557, 0.137),  // #6B8E23
    vec3(0.608, 0.545, 0.369),  // #9B8B5E
    n1
  );
  // Patchy variation
  grass *= 0.85 + vnoise(vWorldPosition.xz * 0.8) * 0.3;

  // Dirt/Rock (B): dark earth with rocky highlights
  vec3 dirt = mix(
    vec3(0.243, 0.149, 0.137),  // #3E2723
    vec3(0.427, 0.388, 0.349),  // #6D6359
    n2
  );

  // Path (A): concrete flat tone
  vec3 path = mix(
    vec3(0.427, 0.388, 0.349),  // #6D6359
    vec3(0.545, 0.502, 0.439),  // #8B8070
    n1 * 0.5 + 0.25
  );

  // Blend channels
  vec3 color = sand * splat.r + grass * splat.g + dirt * splat.b + path * splat.a;

  // Large-scale color variation (prevents flat look)
  color *= 0.92 + n3 * 0.16;

  // Height-based influence: higher = more exposed rock
  float heightFactor = clamp(vWorldPosition.y / 15.0, 0.0, 1.0);
  color = mix(color, dirt * 1.1, heightFactor * 0.25);

  // Fake cloud shadows
  float cloudShadow = sin(vWorldPosition.x * 0.02 + uTime * 0.1)
                    * sin(vWorldPosition.z * 0.02 + uTime * 0.08);
  color *= 1.0 - cloudShadow * 0.05;

  // Simple lighting from normal
  float light = dot(vNormal, normalize(vec3(0.5, 0.8, 0.3))) * 0.3 + 0.7;
  color *= light;

  // Distance fog (warm sand tone)
  float fogDist = length(vWorldPosition.xz);
  float fogFactor = smoothstep(80.0, 300.0, fogDist);
  vec3 fogColor = vec3(0.831, 0.647, 0.455);
  color = mix(color, fogColor, fogFactor);

  gl_FragColor = vec4(color, 1.0);
}
`;
