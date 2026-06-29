import { GridState, Piece } from './types';

export function canPlace(state: GridState, piece: Piece, targetRow: number, targetCol: number): boolean {
  for (const cell of piece.cells) {
    const r = targetRow + cell.row;
    const c = targetCol + cell.col;
    if (r < 0 || r >= state.size || c < 0 || c >= state.size) {
      return false; // Out of bounds
    }
    if (state.cells[r][c]) {
      return false; // Collision
    }
  }
  return true;
}

export function place(state: GridState, piece: Piece, targetRow: number, targetCol: number): GridState {
  if (!canPlace(state, piece, targetRow, targetCol)) {
    throw new Error('Cannot place piece at given coordinates');
  }
  
  const newCells = state.cells.map(row => [...row]);
  for (const cell of piece.cells) {
    newCells[targetRow + cell.row][targetCol + cell.col] = true;
  }
  
  return {
    ...state,
    cells: newCells
  };
}

export function isGameOver(state: GridState, trayPieces: Piece[]): boolean {
  for (const piece of trayPieces) {
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (canPlace(state, piece, r, c)) {
          return false;
        }
      }
    }
  }
  return true;
}
