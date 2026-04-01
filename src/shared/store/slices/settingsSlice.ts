import { StateCreator } from 'zustand';

export interface SettingsSlice {
  controlScheme: 'keyboard' | 'touch';
  invertY: boolean;
  mouseSensitivity: number;
  showFPS: boolean;
  showMinimap: boolean;
  language: string;

  setControlScheme: (scheme: 'keyboard' | 'touch') => void;
  setInvertY: (invert: boolean) => void;
  setMouseSensitivity: (sens: number) => void;
  setShowFPS: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  controlScheme: 'keyboard',
  invertY: false,
  mouseSensitivity: 0.5,
  showFPS: false,
  showMinimap: true,
  language: 'en',

  setControlScheme: (scheme) => set({ controlScheme: scheme }),
  setInvertY: (invert) => set({ invertY: invert }),
  setMouseSensitivity: (sens) => set({ mouseSensitivity: sens }),
  setShowFPS: (show) => set({ showFPS: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
});
