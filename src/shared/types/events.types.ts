import type { NotificationData } from './ui.types';

export type GameEvent =
  | { type: 'PLAYER_MOVED'; position: [number, number, number] }
  | { type: 'PLAYER_ENTERED_ZONE'; zoneId: string }
  | { type: 'PLAYER_EXITED_ZONE'; zoneId: string }
  | { type: 'PLAYER_INTERACTED'; targetId: string; targetType: 'npc' | 'structure' | 'collectible' }
  | { type: 'NPC_DIALOGUE_STARTED'; npcId: string; dialogueId: string }
  | { type: 'NPC_DIALOGUE_ENDED'; npcId: string }
  | { type: 'QUEST_STARTED'; questId: string }
  | { type: 'QUEST_OBJECTIVE_UPDATED'; questId: string; objectiveId: string }
  | { type: 'QUEST_COMPLETED'; questId: string }
  | { type: 'ITEM_COLLECTED'; itemId: string; itemType: string }
  | { type: 'STRUCTURE_ENTERED'; structureId: string }
  | { type: 'STRUCTURE_EXITED'; structureId: string }
  | { type: 'CAMERA_MODE_CHANGED'; mode: string }
  | { type: 'QUALITY_CHANGED'; preset: string }
  | { type: 'NOTIFICATION_SHOW'; notification: NotificationData }
  | { type: 'AUDIO_PLAY'; soundId: string }
  | { type: 'AUDIO_STOP'; soundId: string }
  | { type: 'TIME_OF_DAY_CHANGED'; hour: number }
  | { type: 'LOADING_PROGRESS'; progress: number; phase: string }
  | { type: 'GAME_READY' }
  | { type: 'CINEMA_PLAY'; videoUrl?: string }
  | { type: 'CINEMA_STOP' };
