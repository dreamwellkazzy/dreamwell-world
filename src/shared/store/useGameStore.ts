import { create } from 'zustand';
import { createWorldSlice, WorldSlice } from './slices/worldSlice';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createNPCSlice, NPCSlice } from './slices/npcSlice';
import { createQuestSlice, QuestSlice } from './slices/questSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createAudioSlice, AudioSlice } from './slices/audioSlice';
import { createCameraSlice, CameraSlice } from './slices/cameraSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';

export type GameStore = WorldSlice &
  PlayerSlice &
  NPCSlice &
  QuestSlice &
  UISlice &
  AudioSlice &
  CameraSlice &
  SettingsSlice;

export const useGameStore = create<GameStore>()((...args) => ({
  ...createWorldSlice(...args),
  ...createPlayerSlice(...args),
  ...createNPCSlice(...args),
  ...createQuestSlice(...args),
  ...createUISlice(...args),
  ...createAudioSlice(...args),
  ...createCameraSlice(...args),
  ...createSettingsSlice(...args),
}));
