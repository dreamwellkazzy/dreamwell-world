import { QuestDef } from '@shared/types';

export const QUEST_DEFINITIONS: QuestDef[] = [
  {
    id: 'explore_island',
    name: 'Island Explorer',
    description: 'Visit all the major landmarks on Dreamwell Island.',
    giver: 'diplomat',
    type: 'explore',
    objectives: [
      { id: 'visit_playbook', description: 'Visit the Playbook Station', type: 'visit', target: 'playbook_station', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'visit_market', description: 'Visit the Stock Market', type: 'visit', target: 'stock_market', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'visit_junkyard', description: 'Visit the Junkyard', type: 'visit', target: 'junkyard', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'visit_cinema', description: 'Visit the Drive-In Cinema', type: 'visit', target: 'drivein_cinema', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'visit_bus', description: 'Enter the School Bus', type: 'visit', target: 'school_bus', requiredCount: 1, currentCount: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', id: 'coins', quantity: 50 },
      { type: 'accessory', id: 'goggles' },
    ],
  },
  {
    id: 'meet_everyone',
    name: 'Social Circuit',
    description: 'Introduce yourself to every robot on the island.',
    giver: 'diplomat',
    type: 'talk',
    objectives: [
      { id: 'meet_sentinel', description: 'Talk to Sentinel', type: 'talk_to', target: 'sentinel', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_einstein', description: 'Talk to Einstein', type: 'talk_to', target: 'einstein', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_treasurer', description: 'Talk to Treasurer', type: 'talk_to', target: 'treasurer', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_scribe', description: 'Talk to Scribe', type: 'talk_to', target: 'scribe', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_postmaster', description: 'Talk to Postmaster', type: 'talk_to', target: 'postmaster', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_scout', description: 'Talk to Scout', type: 'talk_to', target: 'scout', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_oracle', description: 'Talk to Oracle', type: 'talk_to', target: 'oracle', requiredCount: 1, currentCount: 0, completed: false },
      { id: 'meet_mernz', description: 'Talk to Mernz', type: 'talk_to', target: 'mernz', requiredCount: 1, currentCount: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', id: 'coins', quantity: 100 },
      { type: 'accessory', id: 'antenna_double' },
    ],
  },
  {
    id: 'collect_data_chips',
    name: 'Data Recovery',
    description: 'Scribe needs old data chips found around the junkyard. Search the scrap piles!',
    giver: 'scribe',
    type: 'collect',
    objectives: [
      { id: 'chips', description: 'Collect Data Chips', type: 'collect', target: 'data_chip', requiredCount: 5, currentCount: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', id: 'coins', quantity: 75 },
      { type: 'item', id: 'scribe_journal', quantity: 1 },
    ],
    prerequisiteQuests: ['meet_everyone'],
  },
];
