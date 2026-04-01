import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD, PALETTE } from '@shared/constants';
import { useGameStore } from '@shared/store/useGameStore';

export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const qualitySettings = useGameStore((s) => s.qualitySettings);

  // Initialize fog on mount
  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(PALETTE.FOG_WARM, WORLD.FOG_NEAR, WORLD.FOG_FAR);
    }
  }, [scene]);

  useFrame(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (!fog) return;

    // Golden hour factor: peaks around hour 7 (sunrise) and 17 (sunset)
    const sunsetDist = Math.abs(timeOfDay - 17.0);
    const sunriseDist = Math.abs(timeOfDay - 7.0);
    const goldenHour = Math.max(
      1.0 - Math.min(sunsetDist / 3.0, 1.0),
      1.0 - Math.min(sunriseDist / 3.0, 1.0),
    );

    // Night factor: how deep into night we are
    const nightFactor = timeOfDay < 6 || timeOfDay > 20
      ? 1.0
      : timeOfDay < 7
        ? 1.0 - (timeOfDay - 6)
        : timeOfDay > 19
          ? (timeOfDay - 19)
          : 0.0;

    // Fog color: blend warm sand toward cooler tones at night
    const warmFog = new THREE.Color(PALETTE.FOG_WARM);
    const nightFog = new THREE.Color('#2A3040');
    const goldenFog = new THREE.Color('#E8B868');

    const baseColor = warmFog.clone().lerp(nightFog, nightFactor * 0.7);
    const finalColor = baseColor.lerp(goldenFog, goldenHour * 0.4);
    fog.color.copy(finalColor);

    // Fog distance: denser during golden hour, denser on low quality
    let fogNear = WORLD.FOG_NEAR;
    let fogFar = WORLD.FOG_FAR;

    // Golden hour: pull fog closer for atmospheric density
    fogNear -= goldenHour * 30;
    fogFar -= goldenHour * 60;

    // Night: moderate fog increase
    fogNear -= nightFactor * 20;
    fogFar -= nightFactor * 50;

    // Quality adjustment: low quality uses denser fog to hide draw distance
    const qualityPreset = qualitySettings.preset;
    if (qualityPreset === 'low' || qualityPreset === 'very-low') {
      fogNear *= 0.6;
      fogFar *= 0.6;
    } else if (qualityPreset === 'medium') {
      fogNear *= 0.8;
      fogFar *= 0.8;
    }

    fog.near = Math.max(fogNear, 10);
    fog.far = Math.max(fogFar, fog.near + 50);
  });

  return null;
}
