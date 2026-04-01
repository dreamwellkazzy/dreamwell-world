export interface NotificationData {
  id: string;
  type: 'info' | 'quest' | 'achievement' | 'warning' | 'guide';
  title: string;
  message: string;
  icon?: string;
  duration: number;
  action?: { label: string; event: string };
}

export interface MenuState {
  isMainMenuOpen: boolean;
  isPaused: boolean;
  isSettingsOpen: boolean;
  isPhoneOpen: boolean;
  isDialogueOpen: boolean;
  isInventoryOpen: boolean;
  activePhoneTab: PhoneTab;
}

export type PhoneTab = 'map' | 'quests' | 'inventory' | 'settings' | 'characters';

export interface MinimapConfig {
  size: number;
  zoom: number;
  showNPCs: boolean;
  showQuests: boolean;
  showStructures: boolean;
  iconSize: number;
}

export interface LoadingProgress {
  phase: 'initializing' | 'terrain' | 'structures' | 'characters' | 'audio' | 'ready';
  progress: number;
  message: string;
}
