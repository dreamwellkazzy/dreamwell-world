import { Howl } from 'howler';
import { useGameStore } from '@shared/store/useGameStore';

class MusicManagerImpl {
  private currentTrack: Howl | null = null;
  private nextTrack: Howl | null = null;
  private currentTrackPath: string | null = null;
  private crossfadeDuration: number = 2000;
  private musicVolume: number = 0.6;
  private masterVolume: number = 0.8;
  private isPaused: boolean = false;
  private unsubscribeStore: () => void;

  constructor() {
    const state = useGameStore.getState();
    this.musicVolume = state.musicVolume;
    this.masterVolume = state.masterVolume;

    this.unsubscribeStore = useGameStore.subscribe((current, prev) => {
      if (current.musicVolume !== prev.musicVolume) {
        this.musicVolume = current.musicVolume;
        this.applyVolume();
      }
      if (current.masterVolume !== prev.masterVolume) {
        this.masterVolume = current.masterVolume;
        this.applyVolume();
      }
      if (current.isMuted !== prev.isMuted) {
        if (this.currentTrack) {
          this.currentTrack.mute(current.isMuted);
        }
      }
    });
  }

  play(trackPath: string, fadeIn?: number): void {
    // If same track is already playing, do nothing
    if (this.currentTrackPath === trackPath && this.currentTrack?.playing()) {
      return;
    }

    // If another track is playing, crossfade to the new one
    if (this.currentTrack && this.currentTrack.playing()) {
      this.crossfade(trackPath, fadeIn ?? this.crossfadeDuration);
      return;
    }

    // Stop any existing track
    if (this.currentTrack) {
      this.currentTrack.stop();
      this.currentTrack.unload();
      this.currentTrack = null;
    }

    const howl = this.createTrack(trackPath);
    this.currentTrack = howl;
    this.currentTrackPath = trackPath;

    // Update store
    useGameStore.getState().setCurrentMusic(trackPath);

    const targetVol = this.getEffectiveVolume();

    if (fadeIn && fadeIn > 0) {
      howl.volume(0);
      try {
        howl.play();
        howl.fade(0, targetVol, fadeIn);
      } catch {
        console.warn(`[MusicManager] Could not play track: ${trackPath}`);
      }
    } else {
      howl.volume(targetVol);
      try {
        howl.play();
      } catch {
        console.warn(`[MusicManager] Could not play track: ${trackPath}`);
      }
    }
  }

  stop(fadeOut?: number): void {
    if (!this.currentTrack) return;

    if (fadeOut && fadeOut > 0) {
      const track = this.currentTrack;
      track.fade(track.volume(), 0, fadeOut);
      setTimeout(() => {
        track.stop();
        track.unload();
      }, fadeOut);
    } else {
      this.currentTrack.stop();
      this.currentTrack.unload();
    }

    this.currentTrack = null;
    this.currentTrackPath = null;
    this.isPaused = false;
    useGameStore.getState().setCurrentMusic(null);
  }

  crossfade(toTrackPath: string, duration?: number): void {
    const fadeDuration = duration ?? this.crossfadeDuration;

    // Fade out current
    if (this.currentTrack) {
      const outgoing = this.currentTrack;
      outgoing.fade(outgoing.volume(), 0, fadeDuration);
      setTimeout(() => {
        outgoing.stop();
        outgoing.unload();
      }, fadeDuration);
    }

    // Create and fade in new track
    const incoming = this.createTrack(toTrackPath);
    incoming.volume(0);

    this.currentTrack = incoming;
    this.currentTrackPath = toTrackPath;
    useGameStore.getState().setCurrentMusic(toTrackPath);

    try {
      incoming.play();
      incoming.fade(0, this.getEffectiveVolume(), fadeDuration);
    } catch {
      console.warn(`[MusicManager] Could not play track: ${toTrackPath}`);
    }
  }

  setVolume(vol: number): void {
    this.musicVolume = vol;
    this.applyVolume();
  }

  pause(): void {
    if (this.currentTrack && this.currentTrack.playing()) {
      this.currentTrack.pause();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.currentTrack && this.isPaused) {
      this.currentTrack.play();
      this.isPaused = false;
    }
  }

  update(): void {
    // Sync volume with store each frame
    const state = useGameStore.getState();
    this.musicVolume = state.musicVolume;
    this.masterVolume = state.masterVolume;

    if (this.currentTrack && this.currentTrack.playing()) {
      if (state.isMuted) {
        this.currentTrack.mute(true);
      } else {
        this.currentTrack.mute(false);
        // Only set volume if not mid-fade (check if volume is near expected)
        const effectiveVol = this.getEffectiveVolume();
        const currentVol = this.currentTrack.volume();
        // Avoid overriding active fades by checking if volume is significantly different
        if (Math.abs(currentVol - effectiveVol) > 0.05 && !this.isTrackFading()) {
          this.currentTrack.volume(effectiveVol);
        }
      }
    }
  }

  dispose(): void {
    if (this.currentTrack) {
      this.currentTrack.stop();
      this.currentTrack.unload();
      this.currentTrack = null;
    }
    if (this.nextTrack) {
      this.nextTrack.stop();
      this.nextTrack.unload();
      this.nextTrack = null;
    }
    this.currentTrackPath = null;
    this.isPaused = false;
    this.unsubscribeStore();
  }

  private getEffectiveVolume(): number {
    return this.musicVolume * this.masterVolume;
  }

  private applyVolume(): void {
    if (this.currentTrack && this.currentTrack.playing()) {
      this.currentTrack.volume(this.getEffectiveVolume());
    }
  }

  private isTrackFading(): boolean {
    // Howler doesn't expose fade state directly;
    // we rely on the volume difference check in update()
    return false;
  }

  private createTrack(trackPath: string): Howl {
    return new Howl({
      src: [trackPath],
      loop: true,
      volume: 0,
      preload: false,
      html5: true, // Use HTML5 audio for music to allow streaming
      onloaderror: (_id: number, error: unknown) => {
        console.warn(
          `[MusicManager] Failed to load track "${trackPath}":`,
          error
        );
      },
      onplayerror: (_id: number, error: unknown) => {
        console.warn(
          `[MusicManager] Failed to play track "${trackPath}":`,
          error
        );
      },
    });
  }
}

export const MusicManager = new MusicManagerImpl();
