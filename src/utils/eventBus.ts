type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        // Clean up empty event sets
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
