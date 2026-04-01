import { StateCreator } from 'zustand';
import { AnimationState, InventoryItem, AccessoryType, RobotConfig } from '../../types';
import { PALETTE } from '../../constants/colors.constants';

export interface PlayerSlice {
  // -- State --
  playerPosition: [number, number, number];
  playerRotation: number;
  playerVelocity: [number, number, number];
  isGrounded: boolean;
  isRunning: boolean;
  isInteracting: boolean;
  currentAnimation: AnimationState;
  playerRobotConfig: RobotConfig;
  inventory: InventoryItem[];
  equippedAccessories: AccessoryType[];
  coins: number;

  // -- Actions --
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (rot: number) => void;
  setPlayerVelocity: (vel: [number, number, number]) => void;
  setGrounded: (grounded: boolean) => void;
  setRunning: (running: boolean) => void;
  setInteracting: (interacting: boolean) => void;
  setAnimation: (anim: AnimationState) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  addCoins: (amount: number) => void;
  equipAccessory: (accessory: AccessoryType) => void;
  unequipAccessory: (accessory: AccessoryType) => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  playerPosition: [0, 2, 0],
  playerRotation: 0,
  playerVelocity: [0, 0, 0],
  isGrounded: false,
  isRunning: false,
  isInteracting: false,
  currentAnimation: 'idle',
  playerRobotConfig: {
    id: 'player',
    name: 'Player',
    role: 'player',
    bodyColor: PALETTE.SCOUT_ORANGE,
    accentColor: PALETTE.CHROME,
    screenColor: PALETTE.SCREEN_AMBER,
    eyeColor: '#FFFFFF',
    bodyShape: 'standard',
    headShape: 'rounded_box',
    accessories: [],
    scale: 1.0,
    personality: {
      voicePitch: 1.0,
      talkSpeed: 30,
      idleAnimation: 'fidget',
      walkSpeed: 4.0,
    },
  },
  inventory: [],
  equippedAccessories: [],
  coins: 0,

  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
  setGrounded: (grounded) => set({ isGrounded: grounded }),
  setRunning: (running) => set({ isRunning: running }),
  setInteracting: (interacting) => set({ isInteracting: interacting }),
  setAnimation: (anim) => set({ currentAnimation: anim }),
  addItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),
  removeItem: (itemId) => set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),
  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
  equipAccessory: (acc) => set((s) => ({
    equippedAccessories: [...s.equippedAccessories, acc],
  })),
  unequipAccessory: (acc) => set((s) => ({
    equippedAccessories: s.equippedAccessories.filter((a) => a !== acc),
  })),
});
