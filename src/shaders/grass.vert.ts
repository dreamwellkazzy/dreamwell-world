export const grassVertexShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uPlayerPosition;

  attribute float instanceOffset;
  attribute float bladeHeight;
  attribute vec3 baseColor;

  varying vec3 vColor;
  varying float vHeightFrac;
  varying float vFogDepth;

  void main() {
    // Height fraction along the blade (0 at base, 1 at tip)
    vHeightFrac = position.y;

    // Apply instance transform to get world position of blade base
    vec4 worldBase = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // Scale vertex by blade dimensions
    vec3 localPos = position;
    localPos.y *= bladeHeight;

    // Apply instance transform
    vec4 worldPos = instanceMatrix * vec4(localPos, 1.0);

    // --- Wind animation (only affects the tip) ---
    float windStrength = vHeightFrac * vHeightFrac; // quadratic falloff from base
    float windX = sin(worldBase.x * 0.5 + uTime * 2.0 + instanceOffset) * 0.15;
    float windZ = cos(worldBase.z * 0.4 + uTime * 1.7 + instanceOffset * 0.7) * 0.08;
    worldPos.x += windX * windStrength;
    worldPos.z += windZ * windStrength;

    // --- Player interaction: push blade tip away ---
    vec3 toPlayer = worldPos.xyz - uPlayerPosition;
    float playerDist = length(toPlayer.xz);
    float pushRadius = 1.8;
    float pushStrength = 1.0 - smoothstep(0.0, pushRadius, playerDist);
    pushStrength *= windStrength; // only push the tip

    if (playerDist > 0.01) {
      vec2 pushDir = normalize(toPlayer.xz);
      worldPos.x += pushDir.x * pushStrength * 0.5;
      worldPos.z += pushDir.y * pushStrength * 0.5;
      worldPos.y -= pushStrength * 0.15; // slight droop when pushed
    }

    // Pass color variation to fragment
    vColor = baseColor;

    vec4 mvPosition = viewMatrix * worldPos;
    vFogDepth = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;
