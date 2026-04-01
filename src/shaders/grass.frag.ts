export const grassFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uRenderDistance;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vColor;
  varying float vHeightFrac;
  varying float vFogDepth;

  void main() {
    // Gradient from darker base to lighter tip
    float brightnessMod = mix(0.55, 1.0, vHeightFrac);
    vec3 color = vColor * brightnessMod;

    // Subtle tip highlight
    color += vec3(0.05, 0.08, 0.02) * smoothstep(0.6, 1.0, vHeightFrac);

    // Alpha fade at render distance boundary
    float distFade = 1.0 - smoothstep(uRenderDistance * 0.75, uRenderDistance, vFogDepth);

    // Fog
    float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
    color = mix(color, uFogColor, fogFactor);

    gl_FragColor = vec4(color, distFade);

    // Discard fully transparent fragments
    if (distFade < 0.01) discard;
  }
`;
