import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { PALETTE } from '@shared/constants';

/**
 * Main scene lighting that shifts with the time of day.
 * - Directional light follows a sun arc
 * - Color warms at sunrise/sunset, whitens at noon
 * - Hemisphere + ambient fill for base illumination
 */

const SUNRISE_COLOR = new THREE.Color(PALETTE.SCREEN_WARM);
const NOON_COLOR = new THREE.Color('#FFFAF0');
const SUNSET_COLOR = new THREE.Color(PALETTE.SCREEN_WARM);
const NIGHT_COLOR = new THREE.Color('#1A1A3E');

function getSunColor(hour: number): THREE.Color {
  const color = new THREE.Color();

  if (hour >= 6 && hour < 8) {
    // Sunrise: warm orange fading to white
    const t = (hour - 6) / 2;
    color.copy(SUNRISE_COLOR).lerp(NOON_COLOR, t);
  } else if (hour >= 8 && hour < 16) {
    // Daytime: near-white warm light
    color.copy(NOON_COLOR);
  } else if (hour >= 16 && hour < 18) {
    // Sunset: white fading to warm orange
    const t = (hour - 16) / 2;
    color.copy(NOON_COLOR).lerp(SUNSET_COLOR, t);
  } else if (hour >= 18 && hour < 20) {
    // Dusk: orange fading to night
    const t = (hour - 18) / 2;
    color.copy(SUNSET_COLOR).lerp(NIGHT_COLOR, t);
  } else if (hour >= 20 || hour < 5) {
    // Night
    color.copy(NIGHT_COLOR);
  } else {
    // Pre-dawn (5-6)
    const t = hour - 5;
    color.copy(NIGHT_COLOR).lerp(SUNRISE_COLOR, t);
  }

  return color;
}

function getSunIntensity(sunY: number): number {
  // sunY ranges roughly from -60 (below horizon) to 100 (overhead)
  // Map to intensity 0.0 .. 1.4
  if (sunY < 0) return Math.max(0, 0.1 + (sunY / 60) * 0.1);
  const normalized = Math.min(sunY / 80, 1);
  return 0.8 + normalized * 0.6;
}

export const WorldLighting = () => {
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const quality = useGameStore((s) => s.qualitySettings);

  // Sun position derived from timeOfDay
  const angle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
  const sunX = Math.cos(angle) * 80;
  const sunY = Math.sin(angle) * 80 + 20;
  const sunZ = 30;

  const sunColor = useMemo(() => getSunColor(timeOfDay), [timeOfDay]);
  const sunIntensity = getSunIntensity(sunY);

  useFrame(() => {
    const light = directionalRef.current;
    if (!light) return;

    light.position.set(sunX, sunY, sunZ);
    tempColor.copy(getSunColor(timeOfDay));
    light.color.copy(tempColor);
    light.intensity = getSunIntensity(sunY);
  });

  const shadowMapSize = quality.shadowMapSize;

  return (
    <>
      {/* Primary directional (sun) light */}
      <directionalLight
        ref={directionalRef}
        position={[sunX, sunY, sunZ]}
        color={sunColor}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />

      {/* Hemisphere light: sky warm gold, ground dark earth */}
      <hemisphereLight
        args={[PALETTE.SKY_GOLDEN, PALETTE.DARK_EARTH, 0.2]}
      />

      {/* Low ambient fill */}
      <ambientLight color="#FFE8CC" intensity={0.15} />
    </>
  );
};
