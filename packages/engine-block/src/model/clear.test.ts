import { describe, it, expect } from 'vitest';
import { clear } from './clear';
import { GridState } from './types';

function createGrid(mode: 'box9' | 'lines', size: number): GridState {
  return {
    mode,
    size,
    cells: Array.from({ length: size }, () => Array(size).fill(false))
  };
}

describe('clear', () => {
  it('clears completed rows, columns, and 3x3 boxes simultaneously in box9', () => {
    const grid = createGrid('box9', 9);
    
    // Fill row 2
    for (let c = 0; c < 9; c++) grid.cells[2][c] = true;
    
    // Fill col 4
    for (let r = 0; r < 9; r++) grid.cells[r][4] = true;
    
    // Fill box 8 (bottom right: rows 6..8, cols 6..8)
    for (let r = 6; r < 9; r++) {
      for (let c = 6; c < 9; c++) {
        grid.cells[r][c] = true;
      }
    }
    
    const result = clear(grid);
    
    expect(result.cleared.rows).toEqual([2]);
    expect(result.cleared.cols).toEqual([4]);
    expect(result.cleared.boxes).toEqual([8]);
    
    // Check they are cleared
    expect(result.state.cells[2][0]).toBe(false);
    expect(result.state.cells[0][4]).toBe(false);
    expect(result.state.cells[6][6]).toBe(false);
  });

  it('does not clear 3x3 boxes in lines mode (8x8)', () => {
    const grid = createGrid('lines', 8);
    
    // Fill top-left 3x3 (which would be a box, though lines is 8x8 so boxes dont perfectly align, but shouldn't clear anyway)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid.cells[r][c] = true;
      }
    }
    
    const result = clear(grid);
    expect(result.cleared.boxes).toEqual([]);
    expect(result.state.cells[0][0]).toBe(true); // Still there
  });
});
