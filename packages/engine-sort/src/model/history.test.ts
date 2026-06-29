import { describe, it, expect } from 'vitest';
import { History } from './history';
import { SortState } from './types';

describe('Sort history', () => {
  it('pushes and pops state clones', () => {
    const hist = new History();
    const state: SortState = { capacity: 4, colors: 1, containers: [[1]] };
    hist.push(state);
    
    state.containers[0]!.push(1);
    
    const popped = hist.undo();
    expect(popped?.containers[0]).toEqual([1]);
    expect(hist.undo()).toBeNull();
  });
});
