import type { NotificationData } from '@shared/types';
import { EventBus } from '@shared/events/EventBus';
import { useGameStore } from '@shared/store/useGameStore';

/**
 * NotificationSystem
 *
 * Queue manager for on-screen notifications. Caps the number of
 * simultaneously visible notifications and drains a FIFO queue as
 * earlier ones are dismissed.
 */
export class NotificationSystem {
  private static instance: NotificationSystem;
  private queue: NotificationData[] = [];
  private activeCount: number = 0;
  private readonly MAX_VISIBLE = 3;
  private readonly DEFAULT_DURATION = 5000;
  private unsubscribers: (() => void)[] = [];
  private dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private constructor() {}

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  initialize(): void {
    // Listen for NOTIFICATION_SHOW events from the EventBus
    const unsub = EventBus.on('NOTIFICATION_SHOW', (event) => {
      this.enqueue(event.notification);
    });
    this.unsubscribers.push(unsub);

    // Track activeCount by subscribing to the store's notifications array
    const storeUnsub = useGameStore.subscribe((state) => {
      const prev = this.activeCount;
      this.activeCount = state.notifications.length;

      // If a notification was dismissed externally, try to drain the queue
      if (this.activeCount < prev) {
        this.drainQueue();
      }
    });
    this.unsubscribers.push(storeUnsub);
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.dismissTimers.clear();

    this.queue = [];
    this.activeCount = 0;
  }

  /**
   * Public API -- can be called directly instead of going through the EventBus.
   */
  show(data: Omit<NotificationData, 'id'>): void {
    const notification: NotificationData = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      duration: data.duration ?? this.DEFAULT_DURATION,
    };
    this.enqueue(notification);
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  private enqueue(notification: NotificationData): void {
    // Ensure duration has a default
    if (!notification.duration) {
      notification = { ...notification, duration: this.DEFAULT_DURATION };
    }

    if (this.activeCount < this.MAX_VISIBLE) {
      this.present(notification);
    } else {
      this.queue.push(notification);
    }
  }

  private present(notification: NotificationData): void {
    const store = useGameStore.getState();
    store.pushNotification(notification);
    this.activeCount = useGameStore.getState().notifications.length;

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      this.dismiss(notification.id);
    }, notification.duration);
    this.dismissTimers.set(notification.id, timer);
  }

  private dismiss(id: string): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    useGameStore.getState().dismissNotification(id);
    this.activeCount = useGameStore.getState().notifications.length;

    this.drainQueue();
  }

  private drainQueue(): void {
    while (this.queue.length > 0 && this.activeCount < this.MAX_VISIBLE) {
      const next = this.queue.shift();
      if (next) {
        this.present(next);
      }
    }
  }
}
