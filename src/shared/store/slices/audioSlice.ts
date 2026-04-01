import { StateCreator } from 'zustand';

export interface AudioSlice {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  isMuted: boolean;
  currentMusicTrack: string | null;

  setMasterVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setAmbientVolume: (vol: number) => void;
  toggleMute: () => void;
  setCurrentMusic: (track: string | null) => void;
}

export const createAudioSlice: StateCreator<AudioSlice> = (set) => ({
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  ambientVolume: 0.5,
  isMuted: false,
  currentMusicTrack: null,

  setMasterVolume: (vol) => set({ masterVolume: vol }),
  setMusicVolume: (vol) => set({ musicVolume: vol }),
  setSfxVolume: (vol) => set({ sfxVolume: vol }),
  setAmbientVolume: (vol) => set({ ambientVolume: vol }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setCurrentMusic: (track) => set({ currentMusicTrack: track }),
});
