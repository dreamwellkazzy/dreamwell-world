import * as THREE from 'three';

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const lerpV3 = (
  a: THREE.Vector3Tuple,
  b: THREE.Vector3Tuple,
  t: number
): THREE.Vector3Tuple => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const distanceV3 = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple): number =>
  Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2);

export const randomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const randomInt = (min: number, max: number): number =>
  Math.floor(randomRange(min, max + 1));
