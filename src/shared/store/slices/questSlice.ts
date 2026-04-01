import { StateCreator } from 'zustand';

export interface QuestProgress {
  questId: string;
  status: 'available' | 'active' | 'completed';
  objectiveProgress: Record<string, number>;
}

export interface QuestSlice {
  quests: Record<string, QuestProgress>;
  activeQuestId: string | null;
  completedQuestIds: string[];

  startQuest: (questId: string) => void;
  updateObjective: (questId: string, objectiveId: string, count: number) => void;
  completeQuest: (questId: string) => void;
  setActiveQuest: (questId: string | null) => void;
}

export const createQuestSlice: StateCreator<QuestSlice> = (set) => ({
  quests: {},
  activeQuestId: null,
  completedQuestIds: [],

  startQuest: (questId) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: { questId, status: 'active', objectiveProgress: {} },
      },
      activeQuestId: questId,
    })),
  updateObjective: (questId, objectiveId, count) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: {
          ...s.quests[questId],
          objectiveProgress: {
            ...s.quests[questId]?.objectiveProgress,
            [objectiveId]: count,
          },
        },
      },
    })),
  completeQuest: (questId) =>
    set((s) => ({
      quests: {
        ...s.quests,
        [questId]: { ...s.quests[questId], status: 'completed' },
      },
      completedQuestIds: [...s.completedQuestIds, questId],
    })),
  setActiveQuest: (questId) => set({ activeQuestId: questId }),
});
