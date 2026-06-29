import { GridState, ClearedLines } from './types';

export function clear(state: GridState): { state: GridState; cleared: ClearedLines } {
  const cleared: ClearedLines = { rows: [], cols: [], boxes: [] };
  const size = state.size;

  // Detect full rows
  for (let r = 0; r < size; r++) {
    let full = true;
    for (let c = 0; c < size; c++) {
      if (!state.cells[r]![c]) {
        full = false;
        break;
      }
    }
    if (full) cleared.rows.push(r);
  }

  // Detect full cols
  for (let c = 0; c < size; c++) {
    let full = true;
    for (let r = 0; r < size; r++) {
      if (!state.cells[r]![c]) {
        full = false;
        break;
      }
    }
    if (full) cleared.cols.push(c);
  }

  // Detect full boxes (only if mode is 'box9')
  if (state.mode === 'box9' && size === 9) {
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        let full = true;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (!state.cells[br * 3 + r]![bc * 3 + c]) {
              full = false;
              break;
            }
          }
        }
        if (full) {
          cleared.boxes.push(br * 3 + bc); // Box index 0-8
        }
      }
    }
  }

  // Clear cells
  const newCells = state.cells.map(row => [...row]);

  for (const r of cleared.rows) {
    for (let c = 0; c < size; c++) newCells[r]![c] = false;
  }
  for (const c of cleared.cols) {
    for (let r = 0; r < size; r++) newCells[r]![c] = false;
  }
  for (const b of cleared.boxes) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        newCells[br + r]![bc + c] = false;
      }
    }
  }

  return {
    state: { ...state, cells: newCells },
    cleared
  };
}
