import { DialogueTree } from '@shared/types';

export const DIALOGUE_TREES: DialogueTree[] = [
  // DIPLOMAT (Greeter)
  {
    id: 'diplomat_intro',
    npcId: 'diplomat',
    startNodeId: 'dip_1',
    nodes: [
      {
        id: 'dip_1',
        speaker: 'Diplomat',
        text: 'Welcome to Dreamwell Island! I am Diplomat, your guide. This place is... special. Built from the scraps of a thousand campaigns.',
        emotion: 'happy',
        nextNodeId: 'dip_2',
      },
      {
        id: 'dip_2',
        speaker: 'Diplomat',
        text: 'There is much to explore here. Each corner of this island serves a purpose. Would you like to know more?',
        emotion: 'neutral',
        responses: [
          { text: 'Tell me about the island.', nextNodeId: 'dip_3a' },
          { text: 'Who are all these robots?', nextNodeId: 'dip_3b' },
          { text: 'I want to explore on my own.', nextNodeId: 'dip_3c' },
        ],
      },
      {
        id: 'dip_3a',
        speaker: 'Diplomat',
        text: 'To the north, Einstein runs the Playbook Station — our campaign command center. East, you will find the Influencer Stock Market, managed by Treasurer.',
        emotion: 'neutral',
        nextNodeId: 'dip_4a',
      },
      {
        id: 'dip_4a',
        speaker: 'Diplomat',
        text: 'The south sprawl is the Junkyard — do not let the name fool you, it is where creativity thrives. And west, Scout guards the Drive-In Cinema.',
        emotion: 'happy',
        nextNodeId: 'dip_end',
        action: {
          type: 'start_quest',
          payload: { questId: 'explore_island' },
        },
      },
      {
        id: 'dip_3b',
        speaker: 'Diplomat',
        text: 'We are the caretakers of Dreamwell Island. Nine of us, each with a role. Sentinel watches, Einstein builds, Treasurer trades, Scribe records...',
        emotion: 'neutral',
        nextNodeId: 'dip_4b',
      },
      {
        id: 'dip_4b',
        speaker: 'Diplomat',
        text: 'Postmaster connects, Scout explores, Oracle... sees. Mernz teaches. And I welcome. Speak to each of us — we all have something to offer.',
        emotion: 'happy',
        nextNodeId: 'dip_end',
        action: {
          type: 'start_quest',
          payload: { questId: 'meet_everyone' },
        },
      },
      {
        id: 'dip_3c',
        speaker: 'Diplomat',
        text: 'A self-starter! I respect that. The island is yours to discover. Come back if you ever need direction.',
        emotion: 'happy',
        nextNodeId: 'dip_end',
        action: {
          type: 'give_coins',
          payload: { amount: 10 },
        },
      },
      {
        id: 'dip_end',
        speaker: 'Diplomat',
        text: 'Good luck out there. And remember — every robot on this island has a story. Including you.',
        emotion: 'happy',
      },
    ],
  },

  // EINSTEIN (Playbook Station)
  {
    id: 'einstein_intro',
    npcId: 'einstein',
    startNodeId: 'ein_1',
    nodes: [
      {
        id: 'ein_1',
        speaker: 'Einstein',
        text: 'Ah-HA! A visitor to the Playbook Station! Come in, come in. Watch the wires — some of them are still live.',
        emotion: 'surprised',
        nextNodeId: 'ein_2',
      },
      {
        id: 'ein_2',
        speaker: 'Einstein',
        text: 'This is where every campaign begins and ends. Strategy, planning, execution — all from this very desk. Well, multiple desks. Organization is... not my strength.',
        emotion: 'happy',
        responses: [
          { text: 'What exactly happens here?', nextNodeId: 'ein_3a' },
          { text: 'This place is a mess.', nextNodeId: 'ein_3b' },
        ],
      },
      {
        id: 'ein_3a',
        speaker: 'Einstein',
        text: 'Playbooks! Campaign playbooks. Templates, workflows, sequencing — everything a campaign manager needs. I built the system. It is... mostly functional.',
        emotion: 'happy',
        nextNodeId: 'ein_end',
        action: { type: 'give_item', payload: { itemId: 'playbook_blueprint', itemName: 'Playbook Blueprint', type: 'key_item' } },
      },
      {
        id: 'ein_3b',
        speaker: 'Einstein',
        text: 'MESS? This is organized chaos! Every wire, every screen, every blinking light serves a purpose. ...I just cannot remember all of them right now.',
        emotion: 'surprised',
        nextNodeId: 'ein_end',
      },
      {
        id: 'ein_end',
        speaker: 'Einstein',
        text: 'Come back anytime. The Playbook Station never sleeps. Neither do I, actually. Robots don\'t sleep. Hm. Carry on!',
        emotion: 'happy',
      },
    ],
  },

  // TREASURER (Stock Market)
  {
    id: 'treasurer_intro',
    npcId: 'treasurer',
    startNodeId: 'tre_1',
    nodes: [
      {
        id: 'tre_1',
        speaker: 'Treasurer',
        text: 'Welcome to the Influencer Stock Market. Here, we track the rise and fall of creator value. Every metric tells a story.',
        emotion: 'neutral',
        nextNodeId: 'tre_2',
      },
      {
        id: 'tre_2',
        speaker: 'Treasurer',
        text: 'Engagement rates, follower growth, brand alignment scores — all flowing across these boards in real time. Fascinating, isn\'t it?',
        emotion: 'neutral',
        responses: [
          { text: 'How does the market work?', nextNodeId: 'tre_3a' },
          { text: 'Who decides the value?', nextNodeId: 'tre_3b' },
        ],
      },
      {
        id: 'tre_3a',
        speaker: 'Treasurer',
        text: 'Simple supply and demand. When a creator performs, their stock rises. When they miss targets or go silent, it falls. The market does not lie.',
        emotion: 'neutral',
        nextNodeId: 'tre_end',
      },
      {
        id: 'tre_3b',
        speaker: 'Treasurer',
        text: 'The DATA decides. Not me. Not you. The numbers. That is why this market is fair — emotions are noise, data is signal.',
        emotion: 'neutral',
        nextNodeId: 'tre_end',
      },
      {
        id: 'tre_end',
        speaker: 'Treasurer',
        text: 'Stay as long as you like. Watch the boards. Learn the rhythms. In time, you will see the patterns.',
        emotion: 'neutral',
        action: { type: 'give_coins', payload: { amount: 25 } },
      },
    ],
  },

  // SENTINEL (Workshop)
  {
    id: 'sentinel_intro',
    npcId: 'sentinel',
    startNodeId: 'sen_1',
    nodes: [
      {
        id: 'sen_1',
        speaker: 'Sentinel',
        text: 'You have been observed since you arrived. Do not be alarmed — observation is my function.',
        emotion: 'neutral',
        nextNodeId: 'sen_2',
      },
      {
        id: 'sen_2',
        speaker: 'Sentinel',
        text: 'I watch the perimeter. I monitor the systems. I make sure the island\'s operations continue without interruption.',
        emotion: 'neutral',
        nextNodeId: 'sen_end',
      },
      {
        id: 'sen_end',
        speaker: 'Sentinel',
        text: 'You may explore freely. But know that I will be watching. That is not a threat. It is... a promise of safety.',
        emotion: 'neutral',
      },
    ],
  },

  // SCRIBE
  {
    id: 'scribe_intro',
    npcId: 'scribe',
    startNodeId: 'scr_1',
    nodes: [
      {
        id: 'scr_1',
        speaker: 'Scribe',
        text: 'Oh! You! Stay right there — I need to document this. New visitor, day... what day is it? Doesn\'t matter. You\'re here!',
        emotion: 'surprised',
        nextNodeId: 'scr_2',
      },
      {
        id: 'scr_2',
        speaker: 'Scribe',
        text: 'I am Scribe. I write everything down. Every deal, every campaign, every negotiation — if it happened on this island, I have a record of it.',
        emotion: 'happy',
        nextNodeId: 'scr_end',
      },
      {
        id: 'scr_end',
        speaker: 'Scribe',
        text: 'If you find any old logs or data chips around the junkyard, bring them to me. Every piece of data is precious!',
        emotion: 'happy',
        action: { type: 'start_quest', payload: { questId: 'collect_data_chips' } },
      },
    ],
  },

  // POSTMASTER
  {
    id: 'postmaster_intro',
    npcId: 'postmaster',
    startNodeId: 'post_1',
    nodes: [
      {
        id: 'post_1',
        speaker: 'Postmaster',
        text: 'Signal acquired! I have been picking up your frequency for a while now. Good to finally meet face to screen.',
        emotion: 'happy',
        nextNodeId: 'post_2',
      },
      {
        id: 'post_2',
        speaker: 'Postmaster',
        text: 'I handle all communications on the island. Every email, every DM, every outreach message — it all flows through me. Well, through the bus.',
        emotion: 'neutral',
        nextNodeId: 'post_end',
      },
      {
        id: 'post_end',
        speaker: 'Postmaster',
        text: 'The bus may look broken down, but the communications array on the roof? That thing reaches every corner of the internet. Step inside if you want to see.',
        emotion: 'happy',
      },
    ],
  },

  // SCOUT
  {
    id: 'scout_intro',
    npcId: 'scout',
    startNodeId: 'sco_1',
    nodes: [
      {
        id: 'sco_1',
        speaker: 'Scout',
        text: 'Hey there, newcomer! Ready to explore? I know all the best spots on this island.',
        emotion: 'happy',
        nextNodeId: 'sco_2',
      },
      {
        id: 'sco_2',
        speaker: 'Scout',
        text: 'The Drive-In over there? Best spot for watching creator content. I set up the screen myself. Even got the projector working... mostly.',
        emotion: 'happy',
        nextNodeId: 'sco_end',
      },
      {
        id: 'sco_end',
        speaker: 'Scout',
        text: 'If you explore the whole island and find all the hidden spots, come find me. I might have something special for you.',
        emotion: 'happy',
        action: { type: 'start_quest', payload: { questId: 'explore_island' } },
      },
    ],
  },

  // ORACLE
  {
    id: 'oracle_intro',
    npcId: 'oracle',
    startNodeId: 'ora_1',
    nodes: [
      {
        id: 'ora_1',
        speaker: 'Oracle',
        text: '...I knew you would come. The circuits told me. Sit. Listen.',
        emotion: 'neutral',
        nextNodeId: 'ora_2',
      },
      {
        id: 'ora_2',
        speaker: 'Oracle',
        text: 'This island is more than metal and code. It is a reflection of something larger. The campaigns you run, the connections you forge — they ripple outward.',
        emotion: 'thinking',
        nextNodeId: 'ora_end',
      },
      {
        id: 'ora_end',
        speaker: 'Oracle',
        text: 'When you are ready to understand the deeper patterns, return to me. I will be here. I am always here.',
        emotion: 'neutral',
      },
    ],
  },

  // MERNZ
  {
    id: 'mernz_intro',
    npcId: 'mernz',
    startNodeId: 'mer_1',
    nodes: [
      {
        id: 'mer_1',
        speaker: 'Mernz',
        text: 'Class is in session! Well, sort of. Pull up a crate and let me teach you something useful.',
        emotion: 'happy',
        nextNodeId: 'mer_2',
      },
      {
        id: 'mer_2',
        speaker: 'Mernz',
        text: 'I used to teach in a real classroom — you can see what is left of it in the junkyard. But knowledge does not need walls. It just needs willing circuits.',
        emotion: 'neutral',
        nextNodeId: 'mer_end',
      },
      {
        id: 'mer_end',
        speaker: 'Mernz',
        text: 'Come back when you have explored more of the island. I will have lessons tailored to what you have seen. Knowledge builds on experience!',
        emotion: 'happy',
        action: { type: 'give_coins', payload: { amount: 15 } },
      },
    ],
  },
];
