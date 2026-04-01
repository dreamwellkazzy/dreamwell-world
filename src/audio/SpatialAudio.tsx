import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Howl } from 'howler';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { clamp } from '@shared/utils';

export interface SpatialAudioProps {
  soundId: string;
  position: [number, number, number];
  falloffDistance?: number;
  maxDistance?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

export const SpatialAudio: React.FC<SpatialAudioProps> = ({
  soundId,
  position,
  falloffDistance = 10,
  maxDistance = 50,
  autoPlay = true,
  loop = false,
}) => {
  const howlRef = useRef<Howl | null>(null);
  const playIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const { camera } = useThree();

  // Temp vectors to avoid per-frame allocations
  const soundPos = useRef(new THREE.Vector3());
  const cameraPos = useRef(new THREE.Vector3());
  const toSound = useRef(new THREE.Vector3());
  const cameraRight = useRef(new THREE.Vector3());

  const getEffectiveVolume = useCallback(() => {
    const state = useGameStore.getState();
    if (state.isMuted) return 0;
    return state.sfxVolume * state.masterVolume;
  }, []);

  // Create and optionally start the Howl on mount
  useEffect(() => {
    const howl = new Howl({
      src: [soundId],
      loop,
      volume: 0,
      preload: false,
      onloaderror: (_id: number, error: unknown) => {
        console.warn(
          `[SpatialAudio] Failed to load "${soundId}":`,
          error
        );
      },
      onplayerror: (_id: number, error: unknown) => {
        console.warn(
          `[SpatialAudio] Failed to play "${soundId}":`,
          error
        );
      },
      onend: () => {
        if (!loop) {
          isPlayingRef.current = false;
          playIdRef.current = null;
        }
      },
    });

    howlRef.current = howl;

    if (autoPlay) {
      try {
        const id = howl.play();
        playIdRef.current = id;
        isPlayingRef.current = true;
      } catch {
        console.warn(
          `[SpatialAudio] Could not auto-play "${soundId}"`
        );
      }
    }

    return () => {
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
      playIdRef.current = null;
      isPlayingRef.current = false;
    };
  }, [soundId, loop, autoPlay]);

  // Per-frame spatial calculations
  useFrame(() => {
    const howl = howlRef.current;
    if (!howl || !isPlayingRef.current) return;

    // Sound world position
    soundPos.current.set(position[0], position[1], position[2]);

    // Camera world position
    camera.getWorldPosition(cameraPos.current);

    // Distance from camera to sound
    const distance = cameraPos.current.distanceTo(soundPos.current);

    // Volume attenuation
    let vol: number;
    if (distance <= falloffDistance) {
      // Within falloff distance: full volume
      vol = 1;
    } else if (distance >= maxDistance) {
      // Beyond max distance: silent
      vol = 0;
    } else {
      // Between falloff and max: exponential attenuation
      const normalizedDist = (distance - falloffDistance) / (maxDistance - falloffDistance);
      const linear = 1 - clamp(normalizedDist, 0, 1);
      vol = Math.pow(linear, 2);
    }

    // Apply global volume multiplier
    const effectiveVol = vol * getEffectiveVolume();
    howl.volume(clamp(effectiveVol, 0, 1));

    // Stereo pan: project sound direction onto camera's right vector
    camera.getWorldDirection(toSound.current);
    cameraRight.current
      .crossVectors(toSound.current, camera.up)
      .normalize();

    // Direction from camera to sound
    toSound.current
      .copy(soundPos.current)
      .sub(cameraPos.current)
      .normalize();

    // Dot product with camera right gives pan (-1 = left, +1 = right)
    const pan = clamp(toSound.current.dot(cameraRight.current), -1, 1);
    howl.stereo(pan);
  });

  return null;
};
