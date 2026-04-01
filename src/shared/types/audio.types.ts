export interface SoundDef {
  id: string;
  src: string;
  type: SoundType;
  volume: number;
  loop: boolean;
  spatial: boolean;
  falloffDistance?: number;
  maxDistance?: number;
}

export type SoundType = 'sfx' | 'music' | 'ambient' | 'voice' | 'ui';

export interface AmbienceZone {
  id: string;
  position: [number, number, number];
  radius: number;
  sounds: string[];
  fadeDistance: number;
}

export interface PhonemeConfig {
  pitch: number;
  pitchVariation: number;
  speed: number;
  vowelDuration: number;
  consonantDuration: number;
}
