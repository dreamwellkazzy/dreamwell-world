// -- Dialogue --
export interface DialogueTree {
  id: string;
  npcId: string;
  nodes: DialogueNode[];
  startNodeId: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  emotion?: string;
  responses?: DialogueResponse[];
  nextNodeId?: string;
  action?: DialogueAction;
}

export interface DialogueResponse {
  text: string;
  nextNodeId: string;
  condition?: string;
}

export interface DialogueAction {
  type: 'give_item' | 'start_quest' | 'complete_quest' | 'unlock_area' | 'play_animation' | 'give_coins';
  payload: Record<string, unknown>;
}

// -- Quests --
export interface QuestDef {
  id: string;
  name: string;
  description: string;
  giver: string;
  type: QuestType;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisiteQuests?: string[];
  associatedStructure?: string;
}

export type QuestType = 'fetch' | 'talk' | 'explore' | 'collect' | 'deliver' | 'discover';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'collect' | 'visit' | 'talk_to' | 'interact' | 'find';
  target: string;
  requiredCount: number;
  currentCount: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'coins' | 'item' | 'accessory' | 'unlock';
  id: string;
  quantity?: number;
}

// -- Collectibles --
export interface CollectibleDef {
  id: string;
  name: string;
  type: 'coin' | 'gear' | 'chip' | 'blueprint' | 'tape';
  position: [number, number, number];
  respawns: boolean;
  respawnTime?: number;
  value?: number;
}

// -- Interaction Zones --
export interface InteractionZone {
  id: string;
  type: 'enter_trigger' | 'proximity' | 'action_prompt';
  position: [number, number, number];
  radius: number;
  linkedEntity: string;
  linkedEntityType: 'npc' | 'structure' | 'collectible' | 'zone';
  promptText?: string;
  onEnter?: string;
  onExit?: string;
}
