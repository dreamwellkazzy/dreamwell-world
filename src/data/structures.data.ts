export interface StructureInfo {
  id: string;
  displayName: string;
  description: string;
  tip: string;
  icon: string;
}

export const STRUCTURE_INFO: StructureInfo[] = [
  {
    id: 'playbook_station',
    displayName: 'Playbook Station',
    description: 'The campaign command center. Where strategies are born and playbooks are written.',
    tip: 'Einstein can teach you about campaign playbooks here.',
    icon: '📡',
  },
  {
    id: 'stock_market',
    displayName: 'Influencer Stock Market',
    description: 'An open-air trading pit where influencer value is tracked in real time.',
    tip: 'Treasurer watches the boards. Ask about market trends.',
    icon: '📊',
  },
  {
    id: 'junkyard',
    displayName: 'The Junkyard',
    description: 'A sprawling collection of tech relics and creative chaos. Look carefully — treasures hide among the scrap.',
    tip: 'Search scrap piles for collectible data chips.',
    icon: '🔧',
  },
  {
    id: 'drivein_cinema',
    displayName: 'The Drive-In',
    description: 'A retro drive-in cinema showing creator content. The best view on the island.',
    tip: 'Scout set up the cinema. Ask her about what\'s showing.',
    icon: '🎬',
  },
  {
    id: 'school_bus',
    displayName: 'The Bus',
    description: 'A broken-down school bus repurposed as a communications hub. Step inside to explore.',
    tip: 'Postmaster runs comms from inside the bus. Walk through the door!',
    icon: '🚌',
  },
];
