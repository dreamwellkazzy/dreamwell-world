import type { QuestDef, QuestObjective } from '@shared/types';
import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';
import { QUEST_DEFINITIONS } from '@data/quests.data';

/**
 * QuestSystem
 *
 * Manages the full quest lifecycle: starting quests, tracking objective
 * progress through game events, granting rewards on completion, and
 * enforcing prerequisite chains.
 */
export class QuestSystem {
  private static instance: QuestSystem;
  private unsubscribers: (() => void)[] = [];
  private questDefs: Map<string, QuestDef> = new Map();

  private constructor() {}

  static getInstance(): QuestSystem {
    if (!QuestSystem.instance) {
      QuestSystem.instance = new QuestSystem();
    }
    return QuestSystem.instance;
  }

  initialize(): void {
    // Index quest definitions for fast lookup
    for (const def of QUEST_DEFINITIONS) {
      this.questDefs.set(def.id, def);
    }

    // --- QUEST_STARTED ---
    this.unsubscribers.push(
      EventBus.on('QUEST_STARTED', (event) => {
        this.handleQuestStarted(event.questId);
      })
    );

    // --- STRUCTURE_ENTERED  ->  'visit' objectives ---
    this.unsubscribers.push(
      EventBus.on('STRUCTURE_ENTERED', (event) => {
        this.checkObjectives('visit', event.structureId);
      })
    );

    // --- NPC_DIALOGUE_ENDED  ->  'talk_to' objectives ---
    this.unsubscribers.push(
      EventBus.on('NPC_DIALOGUE_ENDED', (event) => {
        this.checkObjectives('talk_to', event.npcId);
      })
    );

    // --- ITEM_COLLECTED  ->  'collect' objectives ---
    this.unsubscribers.push(
      EventBus.on('ITEM_COLLECTED', (event) => {
        this.checkObjectives('collect', event.itemType);
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
  // Quest start
  // ----------------------------------------------------------------

  private handleQuestStarted(questId: string): void {
    const def = this.questDefs.get(questId);
    if (!def) return;

    // Check prerequisites
    const store = useGameStore.getState();
    if (def.prerequisiteQuests && def.prerequisiteQuests.length > 0) {
      const allMet = def.prerequisiteQuests.every((preId) =>
        store.completedQuestIds.includes(preId)
      );
      if (!allMet) {
        EventBus.emit({
          type: 'NOTIFICATION_SHOW',
          notification: {
            id: `prereq_${Date.now()}`,
            type: 'warning',
            title: 'Quest Unavailable',
            message: 'You need to complete prerequisite quests first.',
            duration: 4000,
          },
        });
        return;
      }
    }

    // Don't re-start a quest that is already active or completed
    const existing = store.quests[questId];
    if (existing && (existing.status === 'active' || existing.status === 'completed')) {
      return;
    }

    store.startQuest(questId);
    store.setActiveQuest(questId);

    EventBus.emit({
      type: 'NOTIFICATION_SHOW',
      notification: {
        id: `quest_start_${questId}_${Date.now()}`,
        type: 'quest',
        title: 'New Quest',
        message: def.name,
        duration: 5000,
      },
    });
  }

  // ----------------------------------------------------------------
  // Objective matching
  // ----------------------------------------------------------------

  private checkObjectives(
    objectiveType: QuestObjective['type'],
    target: string
  ): void {
    const store = useGameStore.getState();

    // Iterate active quests
    for (const [questId, questProgress] of Object.entries(store.quests)) {
      if (questProgress.status !== 'active') continue;

      const def = this.questDefs.get(questId);
      if (!def) continue;

      for (const objective of def.objectives) {
        if (objective.type !== objectiveType) continue;
        if (objective.target !== target) continue;

        const currentCount = questProgress.objectiveProgress[objective.id] ?? 0;
        if (currentCount >= objective.requiredCount) continue; // already done

        const newCount = currentCount + 1;
        useGameStore.getState().updateObjective(questId, objective.id, newCount);

        if (newCount >= objective.requiredCount) {
          EventBus.emit({
            type: 'NOTIFICATION_SHOW',
            notification: {
              id: `obj_done_${objective.id}_${Date.now()}`,
              type: 'quest',
              title: 'Objective Complete',
              message: objective.description,
              duration: 4000,
            },
          });
        }

        // Check if ALL objectives in this quest are now complete
        this.checkQuestCompletion(questId, def);
      }
    }
  }

  // ----------------------------------------------------------------
  // Quest completion
  // ----------------------------------------------------------------

  private checkQuestCompletion(questId: string, def: QuestDef): void {
    const store = useGameStore.getState();
    const progress = store.quests[questId];
    if (!progress || progress.status !== 'active') return;

    const allDone = def.objectives.every((obj) => {
      const count = progress.objectiveProgress[obj.id] ?? 0;
      return count >= obj.requiredCount;
    });

    if (!allDone) return;

    // Complete the quest in the store
    store.completeQuest(questId);

    // Grant rewards
    this.grantRewards(def);

    EventBus.emit({
      type: 'NOTIFICATION_SHOW',
      notification: {
        id: `quest_complete_${questId}_${Date.now()}`,
        type: 'achievement',
        title: 'Quest Complete!',
        message: def.name,
        duration: 6000,
      },
    });

    EventBus.emit({ type: 'QUEST_COMPLETED', questId });
  }

  private grantRewards(def: QuestDef): void {
    const store = useGameStore.getState();

    for (const reward of def.rewards) {
      switch (reward.type) {
        case 'coins':
          store.addCoins(reward.quantity ?? 0);
          break;

        case 'item':
          store.addItem({
            id: reward.id,
            name: reward.id,
            icon: reward.id,
            quantity: reward.quantity ?? 1,
            type: 'collectible',
          });
          break;

        case 'accessory':
          // Add as an inventory item rather than auto-equipping
          store.addItem({
            id: reward.id,
            name: reward.id,
            icon: reward.id,
            quantity: 1,
            type: 'accessory',
          });
          break;

        case 'unlock':
          // Unlock rewards are handled elsewhere; no inventory action needed
          break;
      }
    }
  }
}
