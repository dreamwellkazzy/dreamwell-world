export interface NPCMetadata {
  id: string;
  displayName: string;
  title: string;
  description: string;
  greeting: string;
  area: string;
}

export const NPC_METADATA: NPCMetadata[] = [
  {
    id: 'sentinel',
    displayName: 'Sentinel',
    title: 'The Watchman',
    description: 'A steadfast guardian who monitors the island\'s systems from his workshop. Sentinel has watched over the junkyard for longer than anyone can remember.',
    greeting: 'Ah, a new arrival. The island has been expecting you.',
    area: 'Sentinel\'s Workshop',
  },
  {
    id: 'einstein',
    displayName: 'Einstein',
    title: 'The Tinkerer',
    description: 'A brilliant but eccentric inventor who runs the Playbook Station. His wire hair crackles with ideas — and occasionally with actual static electricity.',
    greeting: 'Fascinating! Another variable in my grand equation. Come, come — I have experiments to discuss!',
    area: 'Playbook Station',
  },
  {
    id: 'treasurer',
    displayName: 'Treasurer',
    title: 'The Market Keeper',
    description: 'The stately operator of the Influencer Stock Market. Treasurer tracks every trend, every rise and fall, with mechanical precision.',
    greeting: 'Welcome to the exchange. Every influence has a value here. Let me show you the board.',
    area: 'Influencer Stock Market',
  },
  {
    id: 'scribe',
    displayName: 'Scribe',
    title: 'The Chronicler',
    description: 'A small but tireless recorder of everything that happens on the island. Scribe believes that documentation is the highest form of creation.',
    greeting: 'Oh! Stay still a moment — I need to note this in my records. A new visitor!',
    area: 'The Junkyard',
  },
  {
    id: 'postmaster',
    displayName: 'Postmaster',
    title: 'The Connector',
    description: 'Surrounded by screens and signals, Postmaster keeps the island\'s communications running. Every message passes through their system.',
    greeting: 'Signal acquired! I\'ve been picking up your frequency for a while now. Good to finally meet face to screen.',
    area: 'The Bus',
  },
  {
    id: 'scout',
    displayName: 'Scout',
    title: 'The Explorer',
    description: 'Always on the move, Scout knows every corner of the island. Her goggles have seen things most robots wouldn\'t believe.',
    greeting: 'Hey there, newcomer! Ready to explore? I know all the best spots. Follow me — or don\'t. I\'ll be moving either way!',
    area: 'The Drive-In',
  },
  {
    id: 'oracle',
    displayName: 'Oracle',
    title: 'The Seer',
    description: 'Mysterious and ancient, Oracle speaks in riddles and sees patterns others miss. Their glowing eyes seem to look right through you.',
    greeting: '...I knew you would come. The circuits told me. Sit. Listen. There is much you need to understand.',
    area: 'Oracle\'s Den',
  },
  {
    id: 'diplomat',
    displayName: 'Diplomat',
    title: 'The Greeter',
    description: 'Smooth, polished, and perpetually pleasant, Diplomat stands at the island\'s center welcoming all visitors. They know everyone and everything.',
    greeting: 'Welcome, welcome! I am Diplomat, your guide to this wonderful place. Where would you like to begin?',
    area: 'Island Center',
  },
  {
    id: 'mernz',
    displayName: 'Mernz',
    title: 'The Teacher',
    description: 'Purple and proud, Mernz runs informal lessons in a reclaimed corner of the junkyard. Knowledge, they say, is the only thing that doesn\'t rust.',
    greeting: 'Class is in session! Well, sort of. Pull up a crate and let me teach you something useful.',
    area: 'The Junkyard',
  },
];
