import { EventBus, Event, EventCallback } from './interfaces';

export class SimpleEventBus implements EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  subscribe<T>(eventType: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }
  
  unsubscribe<T>(eventType: string, callback: EventCallback<T>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  publish<T>(eventType: string, payload: T): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const event: Event<T> = {
        type: eventType,
        payload,
        timestamp: Date.now()
      };
      listeners.forEach(callback => callback(event));
    }
  }
}