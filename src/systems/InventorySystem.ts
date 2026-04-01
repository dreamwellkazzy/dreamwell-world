import type { InventoryItem } from '@shared/types';
import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';
import { COLLECTIBLES } from '@data/collectibles.data';

/** Item types that can stack in the inventory. */
const STACKABLE_TYPES = new Set(['coin', 'chip', 'gear']);

/**
 * InventorySystem
 *
 * Reacts to ITEM_COLLECTED events, manages stacking vs. unique item
 * logic, and exposes helpers for querying / removing items.
 */
export class InventorySystem {
  private static instance: InventorySystem;
  private unsubscribers: (() => void)[] = [];
  private collectibleIndex: Map<string, (typeof COLLECTIBLES)[number]> = new Map();

  private constructor() {}

  static getInstance(): InventorySystem {
    if (!InventorySystem.instance) {
      InventorySystem.instance = new InventorySystem();
    }
    return InventorySystem.instance;
  }

  initialize(): void {
    // Index collectibles for fast lookup
    for (const c of COLLECTIBLES) {
      this.collectibleIndex.set(c.id, c);
    }

    this.unsubscribers.push(
      EventBus.on('ITEM_COLLECTED', (event) => {
        this.handleItemCollected(event.itemId, event.itemType);
      })
    );
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  // ----------------------------------------------------------------
  // Public query / mutation API
  // ----------------------------------------------------------------

  /** Returns true if the player owns at least one of this item. */
  hasItem(id: string): boolean {
    const inv = useGameStore.getState().inventory;
    return inv.some((item) => item.id === id && item.quantity > 0);
  }

  /** Returns the quantity owned (0 if not present). */
  getItemCount(id: string): number {
    const item = useGameStore.getState().inventory.find((i) => i.id === id);
    return item ? item.quantity : 0;
  }

  /**
   * Removes `count` of the given item.  Returns false if the player
   * doesn't have enough.
   */
  removeItem(id: string, count: number = 1): boolean {
    const store = useGameStore.getState();
    const item = store.inventory.find((i) => i.id === id);
    if (!item || item.quantity < count) return false;

    // Remove the item entirely from the store (store.removeItem filters by id)
    store.removeItem(id);

    // If there is remaining quantity, re-add with the reduced amount
    const remaining = item.quantity - count;
    if (remaining > 0) {
      store.addItem({ ...item, quantity: remaining });
    }

    return true;
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  private handleItemCollected(itemId: string, itemType: string): void {
    const store = useGameStore.getState();
    const collectible = this.collectibleIndex.get(itemId);

    const itemName = collectible?.name ?? itemId;
    const isStackable = STACKABLE_TYPES.has(itemType);

    if (isStackable) {
      // Check if already in inventory
      const existing = store.inventory.find((i) => i.id === itemId);
      if (existing) {
        // Increment quantity: remove old entry then add with bumped quantity
        store.removeItem(itemId);
        store.addItem({
          ...existing,
          quantity: existing.quantity + (collectible?.value ?? 1),
        });
      } else {
        store.addItem({
          id: itemId,
          name: itemName,
          icon: itemType,
          quantity: collectible?.value ?? 1,
          type: 'collectible',
        });
      }
    } else {
      // Unique items -- only add if not already owned
      const already = store.inventory.some((i) => i.id === itemId);
      if (!already) {
        const inventoryType: InventoryItem['type'] =
          itemType === 'blueprint' ? 'key_item' : 'collectible';

        store.addItem({
          id: itemId,
          name: itemName,
          icon: itemType,
          quantity: 1,
          type: inventoryType,
        });
      }
    }

    EventBus.emit({
      type: 'NOTIFICATION_SHOW',
      notification: {
        id: `collected_${itemId}_${Date.now()}`,
        type: 'info',
        title: 'Collected',
        message: itemName,
        duration: 3000,
      },
    });
  }
}
