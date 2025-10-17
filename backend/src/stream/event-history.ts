/** Fixed-capacity buffer of the most recent items, oldest first. */
export class EventHistory<T> {
  private readonly items: T[] = [];

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('capacity must be a positive integer');
    }
  }

  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) {
      this.items.splice(0, this.items.length - this.capacity);
    }
  }

  snapshot(): T[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }
}
