import React, { useEffect } from 'react';
import { ROBOT_CONFIGS } from '@characters/robot/RobotConfigs';
import { useGameStore } from '@shared/store/useGameStore';
import type { NPCDef } from '@shared/types';
import type { NPCState } from '@shared/store/slices/npcSlice';
import { NPCEntity } from './NPCEntity';

// ---------------------------------------------------------------------------
// NPC Definitions — all 9 NPC spawn configurations
// ---------------------------------------------------------------------------

export const NPC_DEFINITIONS: NPCDef[] = [
  {
    id: 'sentinel',
    robotConfig: ROBOT_CONFIGS.sentinel,
    position: [-28, 0, -28],
    rotation: 0.4,
    patrolMode: 'patrol_loop',
    patrolPath: [
      [-28, 0, -28],
      [-25, 0, -32],
      [-32, 0, -30],
      [-28, 0, -28],
    ],
    interactionRadius: 3,
    dialogueId: 'sentinel_intro',
    associatedStructure: 'workshop_hut_sentinel',
  },
  {
    id: 'einstein',
    robotConfig: ROBOT_CONFIGS.einstein,
    position: [32, 0, -58],
    rotation: -0.3,
    patrolMode: 'static',
    interactionRadius: 3,
    dialogueId: 'einstein_intro',
    associatedStructure: 'playbook_station',
  },
  {
    id: 'treasurer',
    robotConfig: ROBOT_CONFIGS.treasurer,
    position: [70, 0, 12],
    rotation: 0.5,
    patrolMode: 'static',
    interactionRadius: 4,
    dialogueId: 'treasurer_intro',
    associatedStructure: 'stock_market',
  },
  {
    id: 'scribe',
    robotConfig: ROBOT_CONFIGS.scribe,
    position: [-8, 0, 55],
    rotation: 0,
    patrolMode: 'wander',
    interactionRadius: 2.5,
    dialogueId: 'scribe_intro',
    associatedStructure: 'junkyard',
  },
  {
    id: 'postmaster',
    robotConfig: ROBOT_CONFIGS.postmaster,
    position: [18, 0, 42],
    rotation: -0.7,
    patrolMode: 'patrol_bounce',
    patrolPath: [
      [18, 0, 42],
      [14, 0, 38],
      [18, 0, 42],
    ],
    interactionRadius: 3,
    dialogueId: 'postmaster_intro',
    associatedStructure: 'school_bus',
  },
  {
    id: 'scout',
    robotConfig: ROBOT_CONFIGS.scout,
    position: [-60, 0, -18],
    rotation: 0.8,
    patrolMode: 'patrol_loop',
    patrolPath: [
      [-60, 0, -18],
      [-55, 0, -25],
      [-65, 0, -22],
      [-60, 0, -18],
    ],
    interactionRadius: 3,
    dialogueId: 'scout_intro',
    associatedStructure: 'drivein_cinema',
  },
  {
    id: 'oracle',
    robotConfig: ROBOT_CONFIGS.oracle,
    position: [52, 0, -38],
    rotation: -0.6,
    patrolMode: 'static',
    interactionRadius: 3.5,
    dialogueId: 'oracle_intro',
    associatedStructure: 'workshop_hut_oracle',
  },
  {
    id: 'diplomat',
    robotConfig: ROBOT_CONFIGS.diplomat,
    position: [0, 0, 0],
    rotation: 0,
    patrolMode: 'wander',
    interactionRadius: 4,
    dialogueId: 'diplomat_intro',
  },
  {
    id: 'mernz',
    robotConfig: ROBOT_CONFIGS.mernz,
    position: [-15, 0, 65],
    rotation: 0,
    patrolMode: 'static',
    interactionRadius: 3,
    dialogueId: 'mernz_intro',
    associatedStructure: 'junkyard',
  },
];

// ---------------------------------------------------------------------------
// Initialize NPC state records for the store
// ---------------------------------------------------------------------------

export function initializeNPCs(): Record<string, NPCState> {
  const records: Record<string, NPCState> = {};

  for (const def of NPC_DEFINITIONS) {
    records[def.id] = {
      id: def.id,
      position: [...def.position],
      rotation: def.rotation,
      currentAnimation: 'idle',
      isActive: true,
      isTalking: false,
      dialogueProgress: 0,
    };
  }

  return records;
}

// ---------------------------------------------------------------------------
// NPCManager component
// ---------------------------------------------------------------------------

export const NPCManager: React.FC = () => {
  const initNPCs = useGameStore((s) => s.initNPCs);

  useEffect(() => {
    initNPCs(initializeNPCs());
  }, [initNPCs]);

  return React.createElement(
    'group',
    { name: 'npc-manager' },
    NPC_DEFINITIONS.map((def) =>
      React.createElement(NPCEntity, { key: def.id, def }),
    ),
  );
};
