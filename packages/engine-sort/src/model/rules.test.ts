import { describe, it, expect } from 'vitest';
import { legalMoves, applyMove, isWon, isStuck } from './rules';
import { SortState } from './types';

describe('Sort rules', () => {
  it('identifies legal moves', () => {
    const state: SortState = {
      capacity: 4, colors: 2,
      containers: [
        [1, 1, 2, 2],
        [2, 2, 1],
        []
      ]
    };
    const moves = legalMoves(state);
    // top of 0 is 2 (count 2). can move to 2 (empty).
    // top of 1 is 1 (count 1). can move to 2 (empty).
    // but top of 0 cannot move to 1 (top is 1).
    expect(moves).toContainEqual({ from: 0, to: 2, count: 2 });
    expect(moves).toContainEqual({ from: 1, to: 2, count: 1 });
    expect(moves.length).toBe(2);
  });

  it('applies moves immutably', () => {
    const state: SortState = {
      capacity: 4, colors: 1,
      containers: [[1, 1], [], []]
    };
    const next = applyMove(state, { from: 0, to: 1, count: 2 });
    expect(next.containers[0]).toEqual([]);
    expect(next.containers[1]).toEqual([1, 1]);
    expect(state.containers[0]).toEqual([1, 1]); // unchanged
  });

  it('checks win state', () => {
    expect(isWon({ capacity: 4, colors: 1, containers: [[1, 1, 1, 1], []] })).toBe(true);
    expect(isWon({ capacity: 4, colors: 1, containers: [[1, 1, 1], [1]] })).toBe(false);
  });

  it('checks stuck state', () => {
    expect(isStuck({ capacity: 2, colors: 2, containers: [[1, 2], [2, 1]] })).toBe(true);
  });
});
