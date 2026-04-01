import { StateCreator } from 'zustand';
import { QualityPreset, QualitySettings } from '../../types';

export interface WorldSlice {
  // -- State --
  isLoaded: boolean;
  loadingProgress: number;
  loadingPhase: string;
  activeChunkIds: string[];
  timeOfDay: number;
  qualityPreset: QualityPreset;
  qualitySettings: QualitySettings;

  // -- Actions --
  setLoaded: (loaded: boolean) => void;
  setLoadingProgress: (progress: number, phase: string) => void;
  setActiveChunks: (chunkIds: string[]) => void;
  setTimeOfDay: (hour: number) => void;
  setQualityPreset: (preset: QualityPreset) => void;
}

export const createWorldSlice: StateCreator<WorldSlice> = (set) => ({
  isLoaded: false,
  loadingProgress: 0,
  loadingPhase: 'initializing',
  activeChunkIds: [],
  timeOfDay: 16.5,
  qualityPreset: 'high',
  qualitySettings: {
    preset: 'high',
    renderScale: 1.0,
    shadowMapSize: 2048,
    grassDensity: 0.7,
    grassRenderDistance: 40,
    npcRenderDistance: 60,
    enablePostProcessing: true,
    enableParticles: true,
    maxChunksLoaded: 16,
  },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setLoadingProgress: (progress, phase) => set({ loadingProgress: progress, loadingPhase: phase }),
  setActiveChunks: (chunkIds) => set({ activeChunkIds: chunkIds }),
  setTimeOfDay: (hour) => set({ timeOfDay: hour }),
  setQualityPreset: (preset) => set({ qualityPreset: preset }),
});
