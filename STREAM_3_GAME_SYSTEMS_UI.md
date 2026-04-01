# STREAM 3 — GAME SYSTEMS & UI
## Dreamwell World: Retro-Robot Junkyard Island

> **Prerequisites**: Phase 0 must be complete. All shared types, constants, store slices, and placeholder components must exist and compile.
>
> **File Ownership**: This stream ONLY touches files in:
> - `src/ui/**`
> - `src/systems/**`
> - `src/data/**`
> - `src/styles/ui.css`
>
> **DO NOT** modify any files in `src/shared/`, `src/world/`, `src/shaders/`, `src/rendering/`, `src/characters/`, `src/physics/`, `src/controls/`, `src/audio/`.
>
> **Communication with other streams**: Use the shared Zustand store (`useGameStore`) and `EventBus` for cross-stream data. Import types from `@shared/types` and constants from `@shared/constants`.
>
> **Estimated build time**: 2–3 hours with Claude Code Agent Teams.
>
> **Agent Teams suggestion**: Within this Stream, spawn Agent Teams:
> - Agent A: Core UI components (ui/HUD, ui/DialogueBox, ui/Minimap, ui/InteractionPrompt, ui/Notifications)
> - Agent B: Menu UIs (ui/MainMenu, ui/PauseMenu, ui/SettingsPanel, ui/VirtualPhone, ui/CinemaScreen)
> - Agent C: Game systems (systems/*)
> - Agent D: Data definitions (data/*)
> - Agent E: Loading screen + styles (ui/LoadingScreen, styles/ui.css)
>
> All agents can run in parallel — no dependencies between them.

---

## UI DESIGN DIRECTIVE

The UI must match the Dreamwell aesthetic: warm, retro, analog, cinematic.

**Design language**:
- **Colors**: Dark warm backgrounds (#1A1612, #2A241E), warm amber text (#E8D5B7), gold accents (#D4940A), warm borders (#4A3F32)
- **Typography**: Monospace font (Courier New / VT323 / similar). Everything should feel like it's displayed on a vintage terminal.
- **Panels**: Rounded corners (4-8px), subtle borders, slight transparency (rgba backgrounds). Think: floating terminal windows.
- **Animations**: ALL CSS-only. No JavaScript animation libraries. Smooth transitions, typewriter effects, fade-ins. This follows Coastal World's approach: CSS animations run off the main thread.
- **Icons**: Simple, geometric. Use Unicode symbols or simple SVG shapes. No icon library.
- **No pixel art**: Despite the retro vibe, keep it clean and readable. Retro-styled but high-res text.
- **Responsive**: Must work on mobile (phone UI adapts to portrait).

**Positioning rules**:
- HUD elements = screen edges with padding (16px)
- Menus = centered overlays with backdrop blur
- Dialogue = bottom of screen, full width, 25% height
- Notifications = top-right corner, stacked
- Interaction prompts = bottom-center, above dialogue area
- Phone UI = center, phone-shaped container

**CRITICAL**: All UI is HTML/CSS overlay on top of the Canvas, NOT rendered in 3D. Use React DOM components, NOT R3F components. This is important for performance and input handling.

---

## TASK 1: LOADING SCREEN

### 1.1 Loading Screen (`src/ui/LoadingScreen.tsx`)

Replace the Phase 0 placeholder with a full loading screen.

**Requirements**:
- Full-screen overlay (position: fixed, z-index: 10000)
- Dark warm background (#1A1612)
- Center content:
  - Title: "DREAMWELL WORLD" in large monospace text, amber color (#D4940A)
  - Subtitle: "Initializing systems..." (changes based on loading phase)
  - Progress bar: Horizontal bar with warm fill color
    - Container: dark border (#4A3F32), rounded corners
    - Fill: gradient from amber (#D4940A) to warm orange (#FF6B35)
    - Width animates to match `loading.progress` from store
  - Phase text: Shows current loading phase from store
    - "Generating terrain..." / "Building structures..." / "Spawning characters..." / "Loading audio..." / "Ready!"
  - A simple ASCII art or text-art robot face below the progress bar (fun touch)
- When `loading.phase === 'ready'`:
  - Show "PRESS ANY KEY TO START" blinking text
  - On any keypress or click, set `isMainMenuOpen: false` and `isLoaded: true`
- Fade out animation when dismissed (opacity transition 0.5s)
- Scanline effect: semi-transparent horizontal lines across the entire screen (CSS repeating-linear-gradient)

```css
.loading-scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
}
```

---

## TASK 2: HUD (Heads-Up Display)

### 2.1 HUD Component (`src/ui/HUD.tsx`)

The always-visible in-game overlay.

**Requirements**:
- Only visible when `isLoaded === true` and `isMainMenuOpen === false`
- Contains sub-components, all positioned with CSS:

**Top-left: Location indicator**
- Current area name (derived from player position proximity to structures)
- Small text, warm amber color
- Updates when player moves between zones

**Top-right: Coins counter**
- Small coin icon (⬡ or ● in gold) + coin count from store
- Animate when coins change (scale bounce)

**Bottom-right: Quick access buttons**
- Minimap toggle (M)
- Phone toggle (P)  
- Settings toggle
- Small circular buttons, warm border, icon inside
- Tooltip on hover showing key binding

**Top-center: Quest tracker** (only visible if active quest)
- Active quest name
- Current objective text
- Progress indicator (e.g., "2/5 items collected")
- Compact, semi-transparent panel

**Bottom-left: Control hints** (fade out after 30 seconds)
- "WASD: Move | Shift: Run | E: Interact | Space: Jump"
- Very subtle, semi-transparent
- Only shows on first visit or when returning from menu

All HUD elements fade in with a CSS transition when first rendered.

### 2.2 Minimap (`src/ui/Minimap.tsx`)

A small overhead map in the corner.

**Requirements**:
- Position: top-right corner (when visible, shifts coins counter down)
- Size: 180x180px, circular mask with warm border
- Content: Canvas-rendered 2D top-down view
  - Background: Dark color representing the island shape (pre-draw a simple island silhouette on canvas)
  - Player dot: bright amber, centered, with a direction indicator (small triangle pointing forward)
  - NPC dots: colored dots matching their robot body color
  - Structure icons: small distinct shapes for each structure type
  - Quest markers: gold diamond shapes for active objectives
- Rotate with player (north-up or player-up, configurable)
- Scale/zoom adjustable
- Toggle with M key (read from store `showMinimap`)
- CSS transition for show/hide (scale + opacity)

---

## TASK 3: DIALOGUE SYSTEM UI

### 3.1 Dialogue Box (`src/ui/DialogueBox.tsx`)

NPC conversation interface.

**Requirements**:
- Position: bottom of screen, full width, ~25% height
- Only visible when `isDialogueOpen === true` in store
- Listen to `NPC_DIALOGUE_STARTED` event to open
- Listen to `NPC_DIALOGUE_ENDED` event to close

**Layout**:
- Left side: NPC portrait area
  - NPC name in bold, colored to match their body color
  - A simple robot face emoji/icon representation (drawn with CSS/Unicode: 🤖 or custom)
  - Or: a colored square with their screen face expression drawn in CSS (two dots for eyes, line for mouth)
- Right side: Dialogue content
  - Text area with typewriter effect (characters appear one by one, ~30 chars/sec)
  - Text color: warm cream (#E8D5B7)
  - When typewriter is running, clicking/pressing E skips to full text
  - When full text is shown, show response options or "Continue" prompt
- Response options (if dialogue node has responses):
  - Vertical list of options, each with a number prefix "1. Option text"
  - Hover highlight (amber underline)
  - Click or number key to select
  - Selected option triggers next dialogue node
- If no responses (auto-advance):
  - Show "▸ Continue" or "Press E to continue"
  - E key / click advances to next node
- If dialogue is complete (no nextNodeId):
  - Auto-close after brief pause
  - Emit `NPC_DIALOGUE_ENDED`
  - Execute any dialogue actions (give_item, start_quest, etc.) via EventBus

**Visual style**:
- Semi-transparent dark panel: `rgba(26, 22, 18, 0.92)`
- Warm border top: 2px solid #4A3F32
- Slight backdrop blur
- Scanline overlay on the panel
- Slide-up animation on open, slide-down on close

**Typewriter system**:
- Track current character index
- Use `setInterval` or `requestAnimationFrame` to advance
- While typing, emit phoneme events for NPC speech sounds (via EventBus `AUDIO_PLAY`)
- Speed configurable per NPC (from personality `talkSpeed`)

**Dialogue state management**:
- Track current dialogue tree and node
- Load dialogue tree from data (see Task 7)
- Advance through nodes based on user choices
- Execute actions when nodes trigger them

### 3.2 Interaction Prompt (`src/ui/InteractionPrompt.tsx`)

"Press E to interact" floating prompt.

**Requirements**:
- Position: bottom-center, above dialogue area
- Only visible when `interactionPrompt` is not null in store
- Shows the prompt text from store (e.g., "Press E to talk to Sentinel")
- Animated: gentle float up/down (CSS animation)
- Key icon: A styled "E" in a rounded box (like a keyboard key)
- Fade in when appearing, fade out when disappearing
- Auto-hide when dialogue opens

---

## TASK 4: MENUS

### 4.1 Main Menu (`src/ui/MainMenu.tsx`)

Title screen shown before gameplay.

**Requirements**:
- Full-screen overlay
- Dark atmospheric background (can reuse the loading screen look)
- Title: "DREAMWELL WORLD" — large, monospace, amber/gold
- Subtitle: "A retro-futuristic adventure" — smaller, warm cream
- Menu options (centered, vertical list):
  1. "START GAME" → close menu, begin gameplay
  2. "SETTINGS" → open settings panel
  3. "CREDITS" → show credits overlay
- Each option: monospace text, subtle hover glow, click animation
- Ambient CSS animation: very subtle background particle effect or gradient shift
- Version number in bottom-left corner (small, dim)

### 4.2 Pause Menu (`src/ui/PauseMenu.tsx`)

In-game pause overlay.

**Requirements**:
- Triggered by Escape key (read `isPaused` from store)
- Semi-transparent dark overlay over the game
- Center panel with options:
  1. "RESUME" → unpause
  2. "SETTINGS" → open settings
  3. "SAVE PROGRESS" → trigger save system
  4. "QUIT TO MENU" → return to main menu
- Game world should be visible but dimmed behind the panel
- Backdrop blur CSS

### 4.3 Settings Panel (`src/ui/SettingsPanel.tsx`)

Configuration options.

**Requirements**:
- Modal overlay panel (centered, ~500px wide)
- Sections:

**Graphics**:
- Quality preset: dropdown (ultra/high/medium/low/very-low)
- Show FPS counter: toggle

**Audio**:
- Master volume: slider (0–100)
- Music volume: slider
- SFX volume: slider
- Ambient volume: slider
- Mute all: toggle

**Controls**:
- Mouse sensitivity: slider
- Invert Y axis: toggle
- Show control hints: toggle

**Accessibility**:
- Show minimap: toggle
- Text speed: slider (affects typewriter speed)

Each setting reads/writes from the Zustand store.
Sliders: custom CSS-styled range inputs (warm amber track, gold thumb).
Toggles: custom CSS toggle switches (amber when on, dark when off).

---

## TASK 5: VIRTUAL PHONE

### 5.1 Virtual Phone (`src/ui/VirtualPhone.tsx`)

In-game phone/PDA interface (inspired by Coastal World's virtual phone).

**Requirements**:
- Toggle with P key or phone button in HUD
- Appears center-screen as a phone-shaped container:
  - Rounded rectangle, dark background (#1A1612)
  - Inner screen area with slight glow border (amber)
  - Notch at top (cosmetic)
  - Home button at bottom (cosmetic, or close button)
- Size: ~320px wide, ~580px tall (phone proportions)
- Tabs at bottom of phone screen (like mobile app tabs):
  1. **Map** 🗺 — Full island map view
  2. **Quests** 📋 — Active and completed quests
  3. **Inventory** 🎒 — Collected items
  4. **Characters** 🤖 — Met NPCs gallery
  5. **Settings** ⚙ — Quick settings

**Map tab**:
- Larger version of the minimap
- Shows full island shape
- Icons for all discovered structures
- Player position
- NPC positions (only for met NPCs)
- Tap/click a location to set a waypoint? (optional)

**Quests tab**:
- List of active quests with progress
- Completed quests section (collapsed by default)
- Each quest shows: name, giver NPC, objectives with checkmarks
- Active quest highlighted with amber border

**Inventory tab**:
- Grid of collected items
- Each item: small icon (or colored square) + name + quantity
- Tap for description tooltip
- Accessories section with equip/unequip buttons

**Characters tab**:
- Gallery of met NPC robots
- Each entry: NPC name, colored robot head icon, short description
- Locked entries for unmet NPCs (silhouette with "???")
- Shows relationship/dialogue completion progress

**Settings tab**:
- Abbreviated version of the settings panel
- Volume sliders, quality preset

Slide-in animation when opening (scale from 0.8 to 1.0 + opacity).

---

## TASK 6: NOTIFICATIONS

### 6.1 Notification System (`src/systems/NotificationSystem.ts`)

Queue manager for notifications.

**Requirements**:
- Listen to `NOTIFICATION_SHOW` events from EventBus
- Also provides API: `NotificationSystem.show(data: NotificationData)`
- Queue notifications if multiple arrive simultaneously
- Auto-dismiss after `duration` milliseconds
- Max 3 visible at a time (queue the rest)
- Push notification data to store via `pushNotification()`
- Auto-clean: `dismissNotification()` after timeout

### 6.2 Notifications Component (`src/ui/Notifications.tsx`)

Visual notification toasts.

**Requirements**:
- Position: top-right corner, stacked vertically (newest on top)
- Each notification:
  - Small panel: dark bg, warm border, rounded corners
  - Icon (left): Based on type — info (ℹ), quest (⚔), achievement (★), warning (⚠), guide (→)
  - Title: bold, amber
  - Message: normal, cream
  - Optional action button
  - Close button (×) in top-right
- Slide-in animation from right
- Slide-out animation when dismissed
- Auto-fade after duration
- Types and their colors:
  - `info`: default warm border
  - `quest`: gold border, quest icon
  - `achievement`: bright amber with glow animation
  - `warning`: subtle red accent
  - `guide`: directional arrow icon, used for tutorial/navigation hints

---

## TASK 7: DATA DEFINITIONS

All game content data. These files define WHAT exists in the world. Other systems read from these.

### 7.1 NPC Data (`src/data/npcs.data.ts`)

**NOTE**: NPC spawn positions and robot configs are defined in Stream 2. This file holds supplementary data like descriptions and met/unmet status tracking.

```ts
export interface NPCMetadata {
  id: string;
  displayName: string;
  title: string;           // "The Watchman", "The Scientist", etc.
  description: string;     // Character bio
  greeting: string;        // First line when meeting
  area: string;            // Which structure they're associated with
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
```

### 7.2 Dialogue Data (`src/data/dialogues.data.ts`)

Dialogue trees for each NPC.

```ts
import { DialogueTree } from '@shared/types';

export const DIALOGUE_TREES: DialogueTree[] = [
  // ── DIPLOMAT (Greeter — first NPC the player meets) ──────────
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

  // ── EINSTEIN (Playbook Station) ──────────────────────────────
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

  // ── TREASURER (Stock Market) ─────────────────────────────────
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

  // ── SENTINEL (Workshop) ──────────────────────────────────────
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

  // ── SCRIBE ───────────────────────────────────────────────────
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

  // ── POSTMASTER ───────────────────────────────────────────────
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

  // ── SCOUT ────────────────────────────────────────────────────
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

  // ── ORACLE ───────────────────────────────────────────────────
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

  // ── MERNZ ────────────────────────────────────────────────────
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
```

### 7.3 Quest Data (`src/data/quests.data.ts`)

Quest definitions.

```ts
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
```

### 7.4 Structure Data (`src/data/structures.data.ts`)

Supplementary structure info (names, descriptions, tips).

```ts
export interface StructureInfo {
  id: string;
  displayName: string;
  description: string;
  tip: string;              // Notification hint when approaching
  icon: string;             // Unicode icon for minimap
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
```

### 7.5 Collectible Data (`src/data/collectibles.data.ts`)

```ts
import { CollectibleDef } from '@shared/types';

// Data chips scattered in the junkyard for the "Data Recovery" quest
export const COLLECTIBLES: CollectibleDef[] = [
  // Data chips (junkyard area)
  { id: 'chip_1', name: 'Data Chip #1', type: 'chip', position: [-5, 0.5, 55], respawns: false },
  { id: 'chip_2', name: 'Data Chip #2', type: 'chip', position: [-15, 0.3, 62], respawns: false },
  { id: 'chip_3', name: 'Data Chip #3', type: 'chip', position: [0, 0.4, 70], respawns: false },
  { id: 'chip_4', name: 'Data Chip #4', type: 'chip', position: [-20, 0.6, 50], respawns: false },
  { id: 'chip_5', name: 'Data Chip #5', type: 'chip', position: [10, 0.3, 58], respawns: false },

  // Scattered coins around the island
  { id: 'coin_1', name: 'Gear Coin', type: 'coin', position: [5, 0.5, -10], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_2', name: 'Gear Coin', type: 'coin', position: [-20, 0.5, 10], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_3', name: 'Gear Coin', type: 'coin', position: [40, 0.5, -20], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_4', name: 'Gear Coin', type: 'coin', position: [-40, 0.5, -40], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_5', name: 'Gear Coin', type: 'coin', position: [60, 0.5, 30], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_6', name: 'Gear Coin', type: 'coin', position: [-50, 0.5, 20], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_7', name: 'Gear Coin', type: 'coin', position: [20, 0.5, -50], respawns: true, respawnTime: 60, value: 5 },
  { id: 'coin_8', name: 'Gear Coin', type: 'coin', position: [-10, 0.5, -60], respawns: true, respawnTime: 60, value: 5 },

  // Blueprints (rare, hidden)
  { id: 'blueprint_1', name: 'Jetpack Blueprint', type: 'blueprint', position: [-75, 2, -65], respawns: false },
];
```

---

## TASK 8: GAME SYSTEMS

### 8.1 Quest System (`src/systems/QuestSystem.ts`)

Manages quest lifecycle.

**Requirements**:
- Listen to relevant events:
  - `STRUCTURE_ENTERED` → check if a 'visit' objective matches
  - `NPC_DIALOGUE_ENDED` → check if a 'talk_to' objective matches
  - `ITEM_COLLECTED` → check if a 'collect' objective matches
- When an objective is fulfilled:
  - Update store via `updateObjective()`
  - Show notification: "Objective complete: [objective description]"
  - Check if ALL objectives are complete → complete quest
- When quest completes:
  - Update store via `completeQuest()`
  - Grant rewards (coins via `addCoins()`, items via `addItem()`, accessories via `equipAccessory()`)
  - Show achievement notification: "Quest Complete: [quest name]!"
  - Emit `QUEST_COMPLETED` event
- Check prerequisites: Only allow starting quests whose prerequisite quests are completed
- Initialize: On game load, check save data for existing quest progress

### 8.2 Inventory System (`src/systems/InventorySystem.ts`)

Item management.

**Requirements**:
- Listen to `ITEM_COLLECTED` events
- Add items to store inventory via `addItem()`
- Handle stackable items (coins, chips) — increment quantity
- Handle unique items (blueprints, key items) — add only if not already present
- Provide methods: `hasItem(id)`, `getItemCount(id)`, `removeItem(id, count)`

### 8.3 Progression System (`src/systems/ProgressionSystem.ts`)

Overall game progression tracking.

**Requirements**:
- Track:
  - Structures visited (set of IDs)
  - NPCs met (set of IDs)
  - Quests completed (from store)
  - Collectibles found (set of IDs)
  - Total coins earned
  - Time played (seconds)
- Calculate completion percentage: `(visited + met + quests + collectibles) / total * 100`
- Listen to relevant events and update tracking
- Store progress in Zustand (or compute from existing store data)

### 8.4 Save System (`src/systems/SaveSystem.ts`)

localStorage persistence.

**Requirements**:
- Save key: `dreamwell_world_save`
- Save data includes:
  - Player position and rotation
  - Inventory
  - Coins
  - Equipped accessories
  - Quest progress (all quest states)
  - Met NPCs
  - Visited structures
  - Collected collectible IDs
  - Settings (volumes, quality, controls)
  - Completion stats
- Auto-save: Every 60 seconds while playing
- Manual save: From pause menu
- Load: On game start, check for existing save. If found, restore state.
- Delete save: Option in settings to reset progress
- Use `JSON.stringify` / `JSON.parse` with error handling
- Version the save format (include a version number, handle migration if format changes)

### 8.5 Notification System (`src/systems/NotificationSystem.ts`)

(Covered in Task 6.1 above — included here for completeness in the systems directory)

### 8.6 Interaction System (`src/systems/InteractionSystem.ts`)

Bridges interaction events to game logic.

**Requirements**:
- Listen to `PLAYER_INTERACTED` events
- Based on target type:
  - `npc`: Open dialogue (set `isDialogueOpen: true`, load dialogue tree)
  - `structure`: Enter structure (emit `STRUCTURE_ENTERED`)
  - `collectible`: Collect item (emit `ITEM_COLLECTED`, remove from world)
- Track which entities have been interacted with for progression
- Handle dialogue actions (give_item, start_quest, etc.) when dialogue nodes trigger them

---

## TASK 9: CINEMA SCREEN UI

### 9.1 Cinema Screen (`src/ui/CinemaScreen.tsx`)

UI overlay for the drive-in cinema big screen.

**Requirements**:
- When player approaches the drive-in cinema screen (within 15 units), show a UI panel
- The panel simulates the big screen content:
  - A styled frame (like a movie screen with a dark border)
  - Inside: can display a static image, an embedded iframe (YouTube), or a styled placeholder
  - For V1: Show a warm amber "DREAMWELL PRESENTS" static title card
  - Future: Accept a video URL and embed an iframe
- Control: "Press Q to close" when viewing
- The cinema screen in the 3D world (from Stream 1) should glow to indicate it's active
- Emit `CINEMA_PLAY` / `CINEMA_STOP` events

---

## CSS STYLING

### `src/styles/ui.css`

Write comprehensive CSS for all UI components. All animations must be CSS-only.

Key style rules:
```css
/* ── Panel Base ──────────────────────────────────────────── */
.panel {
  background: rgba(26, 22, 18, 0.92);
  border: 1px solid #4A3F32;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  color: #E8D5B7;
  font-family: 'Courier New', monospace;
}

/* ── Typewriter ──────────────────────────────────────────── */
.typewriter {
  overflow: hidden;
  white-space: pre-wrap;
  animation: typing 2s steps(40, end);
}

/* ── Button Styles ───────────────────────────────────────── */
.btn {
  background: rgba(42, 36, 30, 0.9);
  border: 1px solid #4A3F32;
  color: #E8D5B7;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn:hover {
  border-color: #D4940A;
  color: #D4940A;
  box-shadow: 0 0 8px rgba(212, 148, 10, 0.2);
}

.btn-primary {
  border-color: #D4940A;
  color: #D4940A;
}

/* ── Scanline overlay ────────────────────────────────────── */
.scanlines {
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

/* ── Slider (Range Input) ────────────────────────────────── */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #4A3F32;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #D4940A;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(212, 148, 10, 0.4);
}

/* ── Toggle Switch ───────────────────────────────────────── */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: #2A241E;
  border: 1px solid #4A3F32;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle.active {
  background: rgba(212, 148, 10, 0.3);
  border-color: #D4940A;
}

.toggle::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #6D6359;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.toggle.active::after {
  left: 22px;
  background: #D4940A;
}

/* ── Slide animations ────────────────────────────────────── */
.slide-up { animation: slideUp 0.3s ease-out; }
.slide-down { animation: slideDown 0.3s ease-out; }
.slide-in-right { animation: slideInRight 0.3s ease-out; }
.fade-in { animation: fadeIn 0.3s ease-out; }
.fade-out { animation: fadeOut 0.3s ease-out; }

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* ── Blink animation ─────────────────────────────────────── */
.blink {
  animation: blink 1.2s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ── Keyboard key style ──────────────────────────────────── */
.key {
  display: inline-block;
  padding: 2px 8px;
  background: #2A241E;
  border: 1px solid #6D6359;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: bold;
  color: #D4940A;
  box-shadow: 0 2px 0 #4A3F32;
  margin: 0 2px;
}

/* ── Phone UI ────────────────────────────────────────────── */
.phone {
  width: 320px;
  height: 580px;
  background: #1A1612;
  border: 2px solid #4A3F32;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.phone-screen {
  margin: 8px;
  height: calc(100% - 60px);
  background: #2A241E;
  border-radius: 16px;
  overflow: hidden;
}

.phone-tabs {
  display: flex;
  height: 52px;
  background: #1A1612;
  border-top: 1px solid #4A3F32;
}

.phone-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #6D6359;
  cursor: pointer;
  transition: color 0.2s ease;
}

.phone-tab.active {
  color: #D4940A;
}
```

---

## COMPLETION CRITERIA

When Stream 3 is complete:

- [ ] Loading screen shows with progress bar and phase messages
- [ ] Main menu displays with Start Game, Settings, Credits options
- [ ] HUD shows coins, location name, quest tracker, and quick buttons
- [ ] Minimap renders in top-right with player dot and structure icons
- [ ] Dialogue box opens when NPC dialogue events fire
- [ ] Typewriter text effect works with character-by-character reveal
- [ ] Player can choose dialogue responses with number keys or clicks
- [ ] Dialogue actions execute (give items, start quests, give coins)
- [ ] Notifications appear in top-right corner and auto-dismiss
- [ ] Pause menu works with Escape key
- [ ] Settings panel has working sliders and toggles that update store
- [ ] Virtual Phone opens with P key, shows Map/Quests/Inventory/Characters/Settings tabs
- [ ] Quest system tracks progress and completes quests when objectives met
- [ ] Save system persists game state to localStorage
- [ ] All UI matches the warm retro aesthetic (dark, amber, monospace)
- [ ] All animations are CSS-only (no JS tween libraries)
- [ ] Interaction prompt shows when near interactables
- [ ] Cinema screen UI shows when near the drive-in
- [ ] No TypeScript errors

---

> After Stream 3 is complete, the full game loop is functional: walk around, talk to NPCs, receive and track quests, collect items, save progress, adjust settings, and explore with full UI guidance.
