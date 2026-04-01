import type { InventoryItem } from '@shared/types';
import type { QualityPreset } from '@shared/types';
import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';
import { ProgressionSystem } from './ProgressionSystem';

/** Full save-file shape. */
export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    position: [number, number, number];
    rotation: number;
    inventory: InventoryItem[];
    coins: number;
    equippedAccessories: string[];
  };
  quests: Record<string, any>;
  completedQuestIds: string[];
  activeQuestId: string | null;
  progression: {
    structuresVisited: string[];
    npcsMet: string[];
    collectiblesFound: string[];
    totalCoinsEarned: number;
    playTimeSeconds: number;
  };
  settings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    ambientVolume: number;
    qualityPreset: string;
    showMinimap: boolean;
    mouseSensitivity: number;
    invertY: boolean;
  };
}

/**
 * SaveSystem
 *
 * Serialises game state to localStorage with auto-save support.
 * Includes a version field for future migration paths.
 */
export class SaveSystem {
  private static instance: SaveSystem;
  private readonly SAVE_KEY = 'dreamwell_world_save';
  private readonly SAVE_VERSION = 1;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  initialize(): void {
    // Notify if a save file already exists
    if (this.hasSave()) {
      EventBus.emit({
        type: 'NOTIFICATION_SHOW',
        notification: {
          id: `save_found_${Date.now()}`,
          type: 'info',
          title: 'Save Data Found',
          message: 'A previous save was detected. You can continue your adventure.',
          duration: 5000,
        },
      });
    }

    // Auto-save every 60 seconds while the world is loaded and not in the main menu
    this.autoSaveInterval = setInterval(() => {
      const state = useGameStore.getState();
      if (state.isLoaded && !state.isMainMenuOpen) {
        this.save();
      }
    }, 60_000);
  }

  dispose(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  /** Persist the current game state to localStorage. Returns true on success. */
  save(): boolean {
    try {
      const state = useGameStore.getState();
      const progression = ProgressionSystem.getInstance().getSaveData();

      const data: SaveData = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        player: {
          position: state.playerPosition,
          rotation: state.playerRotation,
          inventory: state.inventory,
          coins: state.coins,
          equippedAccessories: state.equippedAccessories as string[],
        },
        quests: state.quests,
        completedQuestIds: state.completedQuestIds,
        activeQuestId: state.activeQuestId,
        progression,
        settings: {
          masterVolume: state.masterVolume,
          musicVolume: state.musicVolume,
          sfxVolume: state.sfxVolume,
          ambientVolume: state.ambientVolume,
          qualityPreset: state.qualityPreset,
          showMinimap: state.showMinimap,
          mouseSensitivity: state.mouseSensitivity,
          invertY: state.invertY,
        },
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('[SaveSystem] Failed to save:', err);
      return false;
    }
  }

  /** Load a save from localStorage and apply to stores. Returns true on success. */
  load(): boolean {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return false;

      const data: SaveData = JSON.parse(raw);

      // Version guard -- reject incompatible saves
      if (!data.version || data.version > this.SAVE_VERSION) {
        console.warn('[SaveSystem] Incompatible save version:', data.version);
        return false;
      }

      const store = useGameStore.getState();

      // --- Player state ---
      if (data.player) {
        store.setPlayerPosition(data.player.position);
        store.setPlayerRotation(data.player.rotation);
        store.addCoins(data.player.coins - store.coins); // adjust delta

        // Restore inventory: clear then re-add
        for (const item of store.inventory) {
          store.removeItem(item.id);
        }
        for (const item of data.player.inventory) {
          store.addItem(item);
        }

        // Restore accessories
        for (const acc of store.equippedAccessories) {
          store.unequipAccessory(acc);
        }
        for (const acc of data.player.equippedAccessories) {
          store.equipAccessory(acc as any);
        }
      }

      // --- Quest state ---
      if (data.quests) {
        // Re-hydrate quests by starting + updating each one
        for (const [questId, progress] of Object.entries(data.quests)) {
          store.startQuest(questId);
          if (progress && typeof progress === 'object' && progress.objectiveProgress) {
            for (const [objId, count] of Object.entries(progress.objectiveProgress)) {
              store.updateObjective(questId, objId, count as number);
            }
          }
          if (progress?.status === 'completed') {
            store.completeQuest(questId);
          }
        }
      }
      if (data.activeQuestId) {
        store.setActiveQuest(data.activeQuestId);
      }

      // --- Progression ---
      if (data.progression) {
        ProgressionSystem.getInstance().loadFromSave(data.progression);
      }

      // --- Settings ---
      if (data.settings) {
        store.setMasterVolume(data.settings.masterVolume);
        store.setMusicVolume(data.settings.musicVolume);
        store.setSfxVolume(data.settings.sfxVolume);
        store.setAmbientVolume(data.settings.ambientVolume);
        store.setQualityPreset(data.settings.qualityPreset as QualityPreset);
        store.setShowMinimap(data.settings.showMinimap);
        store.setMouseSensitivity(data.settings.mouseSensitivity);
        store.setInvertY(data.settings.invertY);
      }

      return true;
    } catch (err) {
      console.error('[SaveSystem] Failed to load (possibly corrupt save):', err);
      return false;
    }
  }

  /** Returns true if a save exists in localStorage. */
  hasSave(): boolean {
    try {
      return localStorage.getItem(this.SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  /** Permanently deletes the save from localStorage. */
  deleteSave(): void {
    try {
      localStorage.removeItem(this.SAVE_KEY);
    } catch (err) {
      console.error('[SaveSystem] Failed to delete save:', err);
    }
  }

  /** Quick metadata about the existing save, or null. */
  getSaveInfo(): { timestamp: number; playTime: number } | null {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;

      const data: SaveData = JSON.parse(raw);
      return {
        timestamp: data.timestamp,
        playTime: data.progression?.playTimeSeconds ?? 0,
      };
    } catch {
      return null;
    }
  }
}
