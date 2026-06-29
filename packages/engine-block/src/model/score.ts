import { Piece, ClearedLines } from './types';

export function scoreFor(piece: Piece, cleared: ClearedLines, comboMultiplier: number): number {
  const cellsPlaced = piece.cells.length;
  const linesCleared = cleared.rows.length + cleared.cols.length + cleared.boxes.length;
  
  let score = cellsPlaced;
  if (linesCleared > 0) {
    score += linesCleared * 18 * comboMultiplier;
  }
  
  return score;
}
