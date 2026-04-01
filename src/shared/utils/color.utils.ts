import * as THREE from 'three';

export const hexToThreeColor = (hex: string): THREE.Color => new THREE.Color(hex);

export const lerpColor = (a: string, b: string, t: number): THREE.Color => {
  const colorA = new THREE.Color(a);
  const colorB = new THREE.Color(b);
  return colorA.lerp(colorB, t);
};

export const darken = (hex: string, amount: number): string => {
  const color = new THREE.Color(hex);
  color.multiplyScalar(1 - amount);
  return '#' + color.getHexString();
};

export const lighten = (hex: string, amount: number): string => {
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color('#ffffff'), amount);
  return '#' + color.getHexString();
};
