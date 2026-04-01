export const waterVertexShader = /* glsl */ `
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;

  vec3 displaced = position;

  // Layered sine waves for water surface animation
  float wave1 = sin(position.x * 0.3 + uTime * 0.8) * 0.15;
  float wave2 = sin(position.z * 0.4 + uTime * 0.6) * 0.1;
  float wave3 = sin((position.x + position.z) * 0.2 + uTime * 1.2) * 0.08;
  displaced.y += wave1 + wave2 + wave3;

  // Compute approximate animated normal from wave derivatives
  float dx1 = cos(position.x * 0.3 + uTime * 0.8) * 0.3 * 0.15;
  float dx3 = cos((position.x + position.z) * 0.2 + uTime * 1.2) * 0.2 * 0.08;
  float dz2 = cos(position.z * 0.4 + uTime * 0.6) * 0.4 * 0.1;
  float dz3 = cos((position.x + position.z) * 0.2 + uTime * 1.2) * 0.2 * 0.08;

  vec3 animatedNormal = normalize(vec3(-(dx1 + dx3), 1.0, -(dz2 + dz3)));
  vNormal = normalize(normalMatrix * animatedNormal);

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;
