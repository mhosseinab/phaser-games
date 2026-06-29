import { describe, it, expect } from 'vitest';
import { solve } from './solve';
import { hint } from './hint';
import { SortState } from '../model/types';

describe('Solver', () => {
  it('solves a simple state', () => {
    const state: SortState = {
      capacity: 4, colors: 1,
      containers: [
        [1, 1],
        [1, 1],
        []
      ]
    };
    const path = solve(state);
    expect(path).not.toBeNull();
    expect(path?.length).toBe(1);
    expect(hint(state)).toEqual(path![0]);
  });

  it('returns null for unsolvable', () => {
    const state: SortState = {
      capacity: 2, colors: 2,
      containers: [
        [1, 2],
        [2, 1]
      ]
    };
    expect(solve(state)).toBeNull();
  });
});
