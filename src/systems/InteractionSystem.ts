import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';
import { DIALOGUE_TREES } from '@data/dialogues.data';
import { COLLECTIBLES } from '@data/collectibles.data';
import { STRUCTURE_INFO } from '@data/structures.data';

/**
 * InteractionSystem
 *
 * Bridges raw PLAYER_INTERACTED events to the appropriate
 * downstream game logic: opening dialogue for NPCs, emitting
 * structure/collectible events, etc.
 */
export class InteractionSystem {
  private static instance: InteractionSystem;
  private metNpcs: Set<string> = new Set();
  private unsubscribers: (() => void)[] = [];

  // Indices built at init time for O(1) lookups
  private dialogueByNpc: Map<string, (typeof DIALOGUE_TREES)[number]> = new Map();
  private collectibleById: Map<string, (typeof COLLECTIBLES)[number]> = new Map();

  private constructor() {}

  static getInstance(): InteractionSystem {
    if (!InteractionSystem.instance) {
      InteractionSystem.instance = new InteractionSystem();
    }
    return InteractionSystem.instance;
  }

  initialize(): void {
    // Build lookup indices
    for (const tree of DIALOGUE_TREES) {
      this.dialogueByNpc.set(tree.npcId, tree);
    }
    for (const c of COLLECTIBLES) {
      this.collectibleById.set(c.id, c);
    }

    // --- PLAYER_INTERACTED ---
    this.unsubscribers.push(
      EventBus.on('PLAYER_INTERACTED', (event) => {
        switch (event.targetType) {
          case 'npc':
            this.handleNPCInteraction(event.targetId);
            break;
          case 'structure':
            this.handleStructureInteraction(event.targetId);
            break;
          case 'collectible':
            this.handleCollectibleInteraction(event.targetId);
            break;
        }
      })
    );

    // --- NPC_DIALOGUE_ENDED ---
    this.unsubscribers.push(
      EventBus.on('NPC_DIALOGUE_ENDED', (event) => {
        useGameStore.getState().setDialogue(false);
        useGameStore.getState().setActiveDialogueNpc(null);
      })
    );
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  // ----------------------------------------------------------------
  // Save / Load helpers for metNpcs tracking
  // ----------------------------------------------------------------

  getSaveData(): { metNpcs: string[] } {
    return { metNpcs: Array.from(this.metNpcs) };
  }

  loadFromSave(data: { metNpcs: string[] }): void {
    this.metNpcs = new Set(data.metNpcs);
  }

  // ----------------------------------------------------------------
  // Private handlers
  // ----------------------------------------------------------------

  private handleNPCInteraction(npcId: string): void {
    const store = useGameStore.getState();

    // Open dialogue UI
    store.setDialogue(true);
    store.setActiveDialogueNpc(npcId);

    // Find the matching dialogue tree
    const tree = this.dialogueByNpc.get(npcId);
    if (tree) {
      EventBus.emit({
        type: 'NPC_DIALOGUE_STARTED',
        npcId,
        dialogueId: tree.id,
      });
    }

    this.metNpcs.add(npcId);
  }

  private handleStructureInteraction(structureId: string): void {
    EventBus.emit({ type: 'STRUCTURE_ENTERED', structureId });

    // Show a tip / info notification if we know about this structure
    const info = STRUCTURE_INFO.find(
      (s) => s.id === structureId
    );
    if (info) {
      EventBus.emit({
        type: 'NOTIFICATION_SHOW',
        notification: {
          id: `struct_${structureId}_${Date.now()}`,
          type: 'guide',
          title: info.displayName ?? structureId,
          message: info.tip ?? `You entered ${structureId}.`,
          duration: 5000,
        },
      });
    }
  }

  private handleCollectibleInteraction(itemId: string): void {
    const collectible = this.collectibleById.get(itemId);
    const itemType = collectible?.type ?? 'unknown';

    EventBus.emit({
      type: 'ITEM_COLLECTED',
      itemId,
      itemType,
    });
  }
}
