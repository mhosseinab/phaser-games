import { Piece, GridState } from "../model/types";
import { Rng } from "@blublux/engine/src/seams/rng";
import { canPlace } from "../model/grid";

export const PIECES: Piece[] = [
  { cells: [{ row: 0, col: 0 }] },
  { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }] },
  { cells: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
  ]},
  { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
  { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
  { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }] },
  { cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }] },
  { cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }] },
  { cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }] },
  { cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }] },
];

export interface BagState {
  history: number[];
}

function generateTrioCandidate(rng: Rng, history: number[]): { trio: Piece[], nextHistory: number[] } {
  const trio: Piece[] = [];
  let currentHistory = [...history];
  
  for (let i = 0; i < 3; i++) {
    let pickedIdx = -1;
    let attempts = 0;
    while (attempts < 10) {
      pickedIdx = rng.intRange(0, PIECES.length);
      const count = currentHistory.filter(h => h === pickedIdx).length;
      if (count < 2) {
        break;
      }
      attempts++;
    }
    
    trio.push(PIECES[pickedIdx]!);
    currentHistory.push(pickedIdx);
    if (currentHistory.length > 4) {
      currentHistory.shift();
    }
  }
  
  return { trio, nextHistory: currentHistory };
}

export function nextTrio(bagState: BagState, gridState: GridState, rng: Rng): { trio: Piece[], nextBag: BagState } {
  let bestTrio: Piece[] | null = null;
  let bestHistory: number[] = [];
  let bestScore = -1;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const { trio, nextHistory } = generateTrioCandidate(rng, bagState.history);
    
    let placeableCount = 0;
    for (const piece of trio) {
      let canFit = false;
      for (let r = 0; r < gridState.size && !canFit; r++) {
        for (let c = 0; c < gridState.size && !canFit; c++) {
          if (canPlace(gridState, piece, r, c)) {
            canFit = true;
          }
        }
      }
      if (canFit) {
        placeableCount++;
      }
    }
    
    if (placeableCount > bestScore) {
      bestScore = placeableCount;
      bestTrio = trio;
      bestHistory = nextHistory;
    }
    
    if (placeableCount > 0) {
      break;
    }
  }
  
  return {
    trio: bestTrio!,
    nextBag: { history: bestHistory }
  };
}
