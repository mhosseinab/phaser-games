export type GridMode = 'box9' | 'lines';

export interface GridState {
  cells: boolean[][];
  size: number;
  mode: GridMode;
}

export interface Piece {
  cells: { row: number; col: number }[];
}

export interface ClearedLines {
  rows: number[];
  cols: number[];
  boxes: number[];
}
