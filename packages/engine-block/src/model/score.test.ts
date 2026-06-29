import { describe, it, expect } from 'vitest';
import { scoreFor } from './score';
import { Piece, ClearedLines } from './types';

describe('scoreFor', () => {
  it('adds cellsPlaced to score', () => {
    const piece: Piece = { cells: [{row: 0, col: 0}, {row: 0, col: 1}] };
    const cleared: ClearedLines = { rows: [], cols: [], boxes: [] };
    
    expect(scoreFor(piece, cleared, 1)).toBe(2);
  });

  it('adds linesCleared * 18 * comboMultiplier', () => {
    const piece: Piece = { cells: [{row: 0, col: 0}] };
    const cleared: ClearedLines = { rows: [0], cols: [], boxes: [] }; // 1 line
    
    // cells(1) + 1*18*1 = 19
    expect(scoreFor(piece, cleared, 1)).toBe(19);
    
    // cells(1) + 1*18*2 = 37
    expect(scoreFor(piece, cleared, 2)).toBe(37);
  });

  it('handles multi-line clears', () => {
    const piece: Piece = { cells: [{row: 0, col: 0}, {row: 1, col: 0}] };
    const cleared: ClearedLines = { rows: [0, 1], cols: [0], boxes: [0] }; // 4 lines
    
    // cells(2) + 4*18*1 = 2 + 72 = 74
    expect(scoreFor(piece, cleared, 1)).toBe(74);
    
    // cells(2) + 4*18*3 = 2 + 216 = 218
    expect(scoreFor(piece, cleared, 3)).toBe(218);
  });
});
