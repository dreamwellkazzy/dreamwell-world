import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';

/** Shape returned by getStats(). */
export interface ProgressionStats {
  structuresVisited: number;
  totalStructures: number;
  npcsMet: number;
  totalNPCs: number;
  questsCompleted: number;
  totalQuests: number;
  collectiblesFound: number;
  totalCollectibles: number;
  totalCoinsEarned: number;
  playTimeSeconds: number;
  completionPercentage: number;
}

/** Serialisable subset persisted by SaveSystem. */
export interface SavedProgressionData {
  structuresVisited: string[];
  npcsMet: string[];
  collectiblesFound: string[];
  totalCoinsEarned: number;
  playTimeSeconds: number;
}

// Known totals for the island (used to derive completion %)
const TOTAL_STRUCTURES = 5;
const TOTAL_NPCS = 9;
const TOTAL_QUESTS = 3;
const TOTAL_COLLECTIBLES = 14;
const TOTAL_ITEMS =
  TOTAL_STRUCTURES + TOTAL_NPCS + TOTAL_QUESTS + TOTAL_COLLECTIBLES;

/**
 * ProgressionSystem
 *
 * Tracks broad game-progress metrics: places visited, NPCs met,
 * collectibles found, and total play time.  Provides a save/load
 * interface consumed by SaveSystem.
 */
export class ProgressionSystem {
  private static instance: ProgressionSystem;

  private structuresVisited: Set<string> = new Set();
  private npcsMet: Set<string> = new Set();
  private collectiblesFound: Set<string> = new Set();
  private totalCoinsEarned: number = 0;
  private playTimeSeconds: number = 0;
  private playTimeInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: (() => void)[] = [];

  private constructor() {}

  static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem();
    }
    return ProgressionSystem.instance;
  }

  initialize(): void {
    // --- STRUCTURE_ENTERED ---
    this.unsubscribers.push(
      EventBus.on('STRUCTURE_ENTERED', (event) => {
        this.structuresVisited.add(event.structureId);
      })
    );

    // --- NPC_DIALOGUE_ENDED ---
    this.unsubscribers.push(
      EventBus.on('NPC_DIALOGUE_ENDED', (event) => {
        this.npcsMet.add(event.npcId);
      })
    );

    // --- ITEM_COLLECTED ---
    this.unsubscribers.push(
      EventBus.on('ITEM_COLLECTED', (event) => {
        this.collectiblesFound.add(event.itemId);
      })
    );

    // --- Coin tracking via store subscription ---
    let previousCoins = useGameStore.getState().coins;
    const storeUnsub = useGameStore.subscribe((state) => {
      if (state.coins > previousCoins) {
        this.totalCoinsEarned += state.coins - previousCoins;
      }
      previousCoins = state.coins;
    });
    this.unsubscribers.push(storeUnsub);

    // --- Play-time counter (1 Hz) ---
    this.playTimeInterval = setInterval(() => {
      this.playTimeSeconds += 1;
    }, 1000);
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    if (this.playTimeInterval !== null) {
      clearInterval(this.playTimeInterval);
      this.playTimeInterval = null;
    }
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  getCompletionPercentage(): number {
    const store = useGameStore.getState();
    const visited = this.structuresVisited.size;
    const met = this.npcsMet.size;
    const completed = store.completedQuestIds.length;
    const found = this.collectiblesFound.size;

    return Math.min(
      100,
      ((visited + met + completed + found) / TOTAL_ITEMS) * 100
    );
  }

  getStats(): ProgressionStats {
    const store = useGameStore.getState();
    return {
      structuresVisited: this.structuresVisited.size,
      totalStructures: TOTAL_STRUCTURES,
      npcsMet: this.npcsMet.size,
      totalNPCs: TOTAL_NPCS,
      questsCompleted: store.completedQuestIds.length,
      totalQuests: TOTAL_QUESTS,
      collectiblesFound: this.collectiblesFound.size,
      totalCollectibles: TOTAL_COLLECTIBLES,
      totalCoinsEarned: this.totalCoinsEarned,
      playTimeSeconds: this.playTimeSeconds,
      completionPercentage: this.getCompletionPercentage(),
    };
  }

  // ----------------------------------------------------------------
  // Save / Load
  // ----------------------------------------------------------------

  getSaveData(): SavedProgressionData {
    return {
      structuresVisited: Array.from(this.structuresVisited),
      npcsMet: Array.from(this.npcsMet),
      collectiblesFound: Array.from(this.collectiblesFound),
      totalCoinsEarned: this.totalCoinsEarned,
      playTimeSeconds: this.playTimeSeconds,
    };
  }

  loadFromSave(data: SavedProgressionData): void {
    this.structuresVisited = new Set(data.structuresVisited);
    this.npcsMet = new Set(data.npcsMet);
    this.collectiblesFound = new Set(data.collectiblesFound);
    this.totalCoinsEarned = data.totalCoinsEarned;
    this.playTimeSeconds = data.playTimeSeconds;
  }
}
