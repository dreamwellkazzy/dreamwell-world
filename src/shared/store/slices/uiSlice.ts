import { StateCreator } from 'zustand';
import { NotificationData, PhoneTab, LoadingProgress } from '../../types';

export interface UISlice {
  // -- Menu State --
  isMainMenuOpen: boolean;
  isPaused: boolean;
  isSettingsOpen: boolean;
  isPhoneOpen: boolean;
  isDialogueOpen: boolean;
  isInventoryOpen: boolean;
  activePhoneTab: PhoneTab;

  // -- Notifications --
  notifications: NotificationData[];

  // -- Loading --
  loading: LoadingProgress;

  // -- Interaction Prompt --
  interactionPrompt: { visible: boolean; text: string; targetId: string } | null;

  // -- Actions --
  setMainMenu: (open: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSettings: (open: boolean) => void;
  setPhone: (open: boolean) => void;
  setDialogue: (open: boolean) => void;
  setInventory: (open: boolean) => void;
  setPhoneTab: (tab: PhoneTab) => void;
  pushNotification: (notification: NotificationData) => void;
  dismissNotification: (id: string) => void;
  setLoading: (loading: LoadingProgress) => void;
  setInteractionPrompt: (prompt: { visible: boolean; text: string; targetId: string } | null) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isMainMenuOpen: true,
  isPaused: false,
  isSettingsOpen: false,
  isPhoneOpen: false,
  isDialogueOpen: false,
  isInventoryOpen: false,
  activePhoneTab: 'map',
  notifications: [],
  loading: { phase: 'initializing', progress: 0, message: 'Starting up...' },
  interactionPrompt: null,

  setMainMenu: (open) => set({ isMainMenuOpen: open }),
  setPaused: (paused) => set({ isPaused: paused }),
  setSettings: (open) => set({ isSettingsOpen: open }),
  setPhone: (open) => set({ isPhoneOpen: open }),
  setDialogue: (open) => set({ isDialogueOpen: open }),
  setInventory: (open) => set({ isInventoryOpen: open }),
  setPhoneTab: (tab) => set({ activePhoneTab: tab }),
  pushNotification: (notification) =>
    set((s) => ({ notifications: [...s.notifications, notification] })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),
});
