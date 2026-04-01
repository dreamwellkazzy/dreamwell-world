import * as THREE from 'three';

/**
 * Creates a standard metallic body material for robot torso/limbs.
 */
export function createBodyMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.35,
  });
}

/**
 * Creates a highly reflective chrome material for joints and accents.
 */
export function createChromeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#C0C0C0',
    metalness: 0.9,
    roughness: 0.1,
  });
}

/**
 * Creates a dark emissive screen material for the robot face display.
 */
export function createScreenMaterial(glowColor: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#111111',
    emissive: new THREE.Color(glowColor),
    emissiveIntensity: 0.3,
  });
}

/**
 * Creates a bright emissive material for robot eyes.
 */
export function createEyeMaterial(eyeColor: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: new THREE.Color(eyeColor),
    emissiveIntensity: 1.0,
  });
}

/**
 * Creates an accessory material with properties based on material type.
 */
export function createAccessoryMaterial(
  color: string,
  type: 'metal' | 'fabric' | 'glass',
): THREE.MeshStandardMaterial {
  switch (type) {
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.2,
      });
    case 'fabric':
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.05,
        roughness: 0.9,
      });
    case 'glass':
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.35,
      });
  }
}
