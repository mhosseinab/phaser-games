import { describe, it, expect } from 'vitest';
import { isGameOver } from './grid';
import { GridState, Piece } from './types';

describe('isGameOver', () => {
  it('returns false if any piece can be placed', () => {
    const state: GridState = {
      mode: 'box9',
      size: 9,
      cells: Array.from({ length: 9 }, () => Array(9).fill(false))
    };
    const piece: Piece = { cells: [{row: 0, col: 0}] };
    
    expect(isGameOver(state, [piece])).toBe(false);
  });

  it('returns true if no piece can be placed', () => {
    const state: GridState = {
      mode: 'box9',
      size: 9,
      // Fill the grid completely
      cells: Array.from({ length: 9 }, () => Array(9).fill(true))
    };
    const piece: Piece = { cells: [{row: 0, col: 0}] };
    
    expect(isGameOver(state, [piece])).toBe(true);
  });
});
