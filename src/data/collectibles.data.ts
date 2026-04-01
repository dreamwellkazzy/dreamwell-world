import { CollectibleDef } from '@shared/types';

export const COLLECTIBLES: CollectibleDef[] = [
  // Data chips (junkyard area)
  { id: 'chip_1', name: 'Data Chip #1', type: 'chip', position: [-5, 0.5, 55], respawns: false },
  { id: 'chip_2', name: 'Data Chip #2', type: 'chip', position: [-15, 0.3, 62], respawns: false },
  { id: 'chip_3', name: 'Data Chip #3', type: 'chip', position: [0, 0.4, 70], respawns: false },
  { id: 'chip_4', name: 'Data Chip #4', type: 'chip', position: [-20, 0.6, 50], respawns: false },
  { id: 'chip_5', name: 'Data Chip #5', type: 'chip', position: [10, 0.3, 58], respawns: false },

  // Scattered coins
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
