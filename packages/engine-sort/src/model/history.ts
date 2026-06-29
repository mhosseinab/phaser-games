import { SortState } from './types';

export class History {
  private stack: SortState[] = [];

  push(state: SortState): void {
    const clone = { ...state, containers: state.containers.map(c => [...c]) };
    this.stack.push(clone);
  }

  undo(): SortState | null {
    if (this.stack.length === 0) return null;
    return this.stack.pop()!;
  }
}
