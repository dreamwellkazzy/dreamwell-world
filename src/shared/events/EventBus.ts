import { GameEvent } from '../types/events.types';

type EventHandler<T extends GameEvent['type']> = (
  event: Extract<GameEvent, { type: T }>
) => void;

class EventBusImpl {
  private handlers: Map<string, Set<Function>> = new Map();

  on<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  emit<T extends GameEvent['type']>(event: Extract<GameEvent, { type: T }>): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  off<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const EventBus = new EventBusImpl();
