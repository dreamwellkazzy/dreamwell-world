import { StateCreator } from 'zustand';

export interface NPCState {
  id: string;
  position: [number, number, number];
  rotation: number;
  currentAnimation: string;
  isActive: boolean;
  isTalking: boolean;
  dialogueProgress: number;
}

export interface NPCSlice {
  npcs: Record<string, NPCState>;
  activeDialogueNpcId: string | null;

  setNPCState: (id: string, state: Partial<NPCState>) => void;
  setActiveDialogueNpc: (id: string | null) => void;
  initNPCs: (npcs: Record<string, NPCState>) => void;
}

export const createNPCSlice: StateCreator<NPCSlice> = (set) => ({
  npcs: {},
  activeDialogueNpcId: null,

  setNPCState: (id, state) =>
    set((s) => ({
      npcs: {
        ...s.npcs,
        [id]: { ...s.npcs[id], ...state },
      },
    })),
  setActiveDialogueNpc: (id) => set({ activeDialogueNpcId: id }),
  initNPCs: (npcs) => set({ npcs }),
});
