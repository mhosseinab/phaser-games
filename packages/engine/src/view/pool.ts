export class Pool<T> {
  private active = new Set<T>();
  private inactive: T[] = [];

  constructor(private factory: () => T) {}

  acquire(): T {
    let item = this.inactive.pop();
    if (!item) {
      item = this.factory();
    }
    this.active.add(item);
    return item;
  }

  release(item: T): void {
    if (this.active.has(item)) {
      this.active.delete(item);
      this.inactive.push(item);
    }
  }

  getActive(): T[] {
    return Array.from(this.active);
  }
}
