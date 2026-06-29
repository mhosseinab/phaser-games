import { describe, it, expect } from 'vitest';
import { canPlace, place } from './grid';
import { GridState, Piece } from './types';

describe('grid', () => {
  describe('canPlace', () => {
    it('returns true when piece can be placed', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(canPlace(state, piece, 0, 0)).toBe(true);
    });

    it('returns false when piece overlaps with existing blocks', () => {
      const state: GridState = {
        cells: [
          [true, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(canPlace(state, piece, 0, 0)).toBe(false);
    });

    it('returns false when piece is out of bounds (right)', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(canPlace(state, piece, 0, 2)).toBe(false);
    });

    it('returns false when piece is out of bounds (left)', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(canPlace(state, piece, 0, -1)).toBe(false);
    });

    it('returns false when piece is out of bounds (top/bottom)', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }]
      };
      
      expect(canPlace(state, piece, -1, 0)).toBe(false);
      expect(canPlace(state, piece, 2, 0)).toBe(false); // second block at 2+1=3 (out)
    });
  });

  describe('place', () => {
    it('places the piece and returns a new state', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      const newState = place(state, piece, 1, 1);
      
      expect(newState.cells).toEqual([
        [false, false, false],
        [false, true, true],
        [false, false, false]
      ]);
      expect(newState).not.toBe(state); // Immutability
      expect(newState.cells).not.toBe(state.cells);
    });

    it('throws an error if piece cannot be placed due to collision', () => {
      const state: GridState = {
        cells: [
          [true, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(() => place(state, piece, 0, 0)).toThrow('Cannot place piece at given coordinates');
    });

    it('throws an error if piece cannot be placed due to out of bounds', () => {
      const state: GridState = {
        cells: [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ],
        size: 3,
        mode: 'lines'
      };
      const piece: Piece = {
        cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }]
      };
      
      expect(() => place(state, piece, 0, 2)).toThrow('Cannot place piece at given coordinates');
    });
  });
});
