import { Howl, Howler } from 'howler';
import type { SoundDef, SoundType } from '@shared/types';
import { EventBus } from '@shared/events';
import { useGameStore } from '@shared/store/useGameStore';

const POOL_SIZE = 3;
const POOLED_TYPES: SoundType[] = ['sfx', 'ui'];

class AudioManagerImpl {
  private sounds: Map<string, Howl> = new Map();
  private soundPools: Map<string, Howl[]> = new Map();
  private poolIndices: Map<string, number> = new Map();
  private definitions: Map<string, SoundDef> = new Map();
  private typeVolumes: Map<SoundType, number> = new Map();
  private activeSounds: Map<string, { howl: Howl; type: SoundType }> = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private unsubscribeStore: () => void;
  private unsubscribePlay: () => void;
  private unsubscribeStop: () => void;

  constructor() {
    // Initialize type volumes from store defaults
    const state = useGameStore.getState();
    this.masterVolume = state.masterVolume;
    this.isMuted = state.isMuted;
    this.typeVolumes.set('sfx', state.sfxVolume);
    this.typeVolumes.set('ui', state.sfxVolume);
    this.typeVolumes.set('music', state.musicVolume);
    this.typeVolumes.set('ambient', state.ambientVolume);
    this.typeVolumes.set('voice', state.sfxVolume);

    // Subscribe to store volume/mute changes
    this.unsubscribeStore = useGameStore.subscribe((current, prev) => {
      if (current.masterVolume !== prev.masterVolume) {
        this.masterVolume = current.masterVolume;
        this.applyAllVolumes();
      }
      if (current.sfxVolume !== prev.sfxVolume) {
        this.typeVolumes.set('sfx', current.sfxVolume);
        this.typeVolumes.set('ui', current.sfxVolume);
        this.applyVolumeForType('sfx');
        this.applyVolumeForType('ui');
      }
      if (current.musicVolume !== prev.musicVolume) {
        this.typeVolumes.set('music', current.musicVolume);
        this.applyVolumeForType('music');
      }
      if (current.ambientVolume !== prev.ambientVolume) {
        this.typeVolumes.set('ambient', current.ambientVolume);
        this.applyVolumeForType('ambient');
      }
      if (current.isMuted !== prev.isMuted) {
        this.isMuted = current.isMuted;
        Howler.mute(this.isMuted);
      }
    });

    // Subscribe to EventBus
    this.unsubscribePlay = EventBus.on('AUDIO_PLAY', (event) => {
      this.play(event.soundId);
    });

    this.unsubscribeStop = EventBus.on('AUDIO_STOP', (event) => {
      this.stop(event.soundId);
    });
  }

  registerSound(def: SoundDef): void {
    this.definitions.set(def.id, def);
  }

  play(
    soundId: string,
    options?: { volume?: number; loop?: boolean; fade?: number }
  ): string | null {
    const def = this.definitions.get(soundId);
    if (!def) {
      console.warn(`[AudioManager] Sound not registered: ${soundId}`);
      return null;
    }

    if (this.isMuted) {
      return null;
    }

    const shouldPool = POOLED_TYPES.includes(def.type);

    let howl: Howl;

    if (shouldPool) {
      howl = this.getPooledHowl(def);
    } else {
      howl = this.getOrCreateHowl(def);
    }

    const typeVol = this.typeVolumes.get(def.type) ?? 1;
    const baseVol = options?.volume ?? def.volume;
    const finalVolume = baseVol * typeVol * this.masterVolume;

    howl.volume(finalVolume);
    howl.loop(options?.loop ?? def.loop);

    const playbackId = howl.play();

    if (options?.fade && options.fade > 0) {
      howl.fade(0, finalVolume, options.fade, playbackId);
    }

    this.activeSounds.set(soundId, { howl, type: def.type });

    const idStr = `${soundId}_${playbackId}`;
    return idStr;
  }

  stop(soundId: string, fade?: number): void {
    const active = this.activeSounds.get(soundId);
    if (!active) {
      // Also check pools
      const pool = this.soundPools.get(soundId);
      if (pool) {
        pool.forEach((h) => {
          if (fade && fade > 0) {
            h.fade(h.volume(), 0, fade);
            setTimeout(() => h.stop(), fade);
          } else {
            h.stop();
          }
        });
      }
      return;
    }

    const { howl } = active;
    if (fade && fade > 0) {
      howl.fade(howl.volume(), 0, fade);
      setTimeout(() => {
        howl.stop();
        this.activeSounds.delete(soundId);
      }, fade);
    } else {
      howl.stop();
      this.activeSounds.delete(soundId);
    }
  }

  stopAll(): void {
    this.activeSounds.forEach(({ howl }) => {
      howl.stop();
    });
    this.activeSounds.clear();

    this.soundPools.forEach((pool) => {
      pool.forEach((h) => h.stop());
    });

    this.sounds.forEach((howl) => {
      howl.stop();
    });
  }

  setTypeVolume(type: SoundType, volume: number): void {
    this.typeVolumes.set(type, volume);
    this.applyVolumeForType(type);
  }

  fadeIn(soundId: string, duration: number): void {
    const active = this.activeSounds.get(soundId);
    if (!active) return;

    const def = this.definitions.get(soundId);
    const typeVol = this.typeVolumes.get(active.type) ?? 1;
    const targetVol = (def?.volume ?? 1) * typeVol * this.masterVolume;

    active.howl.fade(0, targetVol, duration);
  }

  fadeOut(soundId: string, duration: number): void {
    const active = this.activeSounds.get(soundId);
    if (!active) return;

    active.howl.fade(active.howl.volume(), 0, duration);
    setTimeout(() => {
      active.howl.stop();
      this.activeSounds.delete(soundId);
    }, duration);
  }

  isPlaying(soundId: string): boolean {
    const active = this.activeSounds.get(soundId);
    if (active) {
      return active.howl.playing();
    }

    const pool = this.soundPools.get(soundId);
    if (pool) {
      return pool.some((h) => h.playing());
    }

    return false;
  }

  update(): void {
    // Clean up finished non-looping sounds from activeSounds
    const toRemove: string[] = [];
    this.activeSounds.forEach(({ howl }, id) => {
      if (!howl.playing() && !howl.loop()) {
        toRemove.push(id);
      }
    });
    toRemove.forEach((id) => this.activeSounds.delete(id));
  }

  dispose(): void {
    this.stopAll();

    this.sounds.forEach((howl) => howl.unload());
    this.sounds.clear();

    this.soundPools.forEach((pool) => {
      pool.forEach((h) => h.unload());
    });
    this.soundPools.clear();

    this.definitions.clear();
    this.activeSounds.clear();
    this.poolIndices.clear();

    this.unsubscribeStore();
    this.unsubscribePlay();
    this.unsubscribeStop();
  }

  private getOrCreateHowl(def: SoundDef): Howl {
    let howl = this.sounds.get(def.id);
    if (!howl) {
      howl = this.createHowl(def);
      this.sounds.set(def.id, howl);
    }
    return howl;
  }

  private getPooledHowl(def: SoundDef): Howl {
    let pool = this.soundPools.get(def.id);
    if (!pool) {
      pool = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        pool.push(this.createHowl(def));
      }
      this.soundPools.set(def.id, pool);
      this.poolIndices.set(def.id, 0);
    }

    const idx = this.poolIndices.get(def.id) ?? 0;
    const howl = pool[idx];
    this.poolIndices.set(def.id, (idx + 1) % pool.length);
    return howl;
  }

  private createHowl(def: SoundDef): Howl {
    return new Howl({
      src: [def.src],
      volume: def.volume,
      loop: def.loop,
      preload: false,
      onloaderror: (_id: number, error: unknown) => {
        console.warn(
          `[AudioManager] Failed to load sound "${def.id}":`,
          error
        );
      },
      onplayerror: (_id: number, error: unknown) => {
        console.warn(
          `[AudioManager] Failed to play sound "${def.id}":`,
          error
        );
      },
    });
  }

  private applyVolumeForType(type: SoundType): void {
    const typeVol = this.typeVolumes.get(type) ?? 1;

    this.activeSounds.forEach(({ howl, type: sType }, soundId) => {
      if (sType === type) {
        const def = this.definitions.get(soundId);
        const baseVol = def?.volume ?? 1;
        howl.volume(baseVol * typeVol * this.masterVolume);
      }
    });
  }

  private applyAllVolumes(): void {
    this.activeSounds.forEach(({ howl, type }, soundId) => {
      const def = this.definitions.get(soundId);
      const baseVol = def?.volume ?? 1;
      const typeVol = this.typeVolumes.get(type) ?? 1;
      howl.volume(baseVol * typeVol * this.masterVolume);
    });
  }
}

export const AudioManager = new AudioManagerImpl();
