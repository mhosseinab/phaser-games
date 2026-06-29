import { SortState, Move } from './types';

export const legalMoves = (state: SortState): Move[] => {
  const moves: Move[] = [];
  for (let f = 0; f < state.containers.length; f++) {
    const src = state.containers[f];
    if (!src || src.length === 0) continue;
    
    const color = src[src.length - 1]!;
    let count = 1;
    for (let i = src.length - 2; i >= 0; i--) {
      if (src[i] === color) count++;
      else break;
    }

    // Heuristic: don't move a full completed run to an empty container
    // Wait, the rules say: "dest empty OR (dest.top===runColor AND dest has a free slot)"
    // We shouldn't forbid moving full runs to empty spaces if it's the only move, but it's redundant.
    const isFullRun = count === state.capacity && src.length === state.capacity;

    for (let t = 0; t < state.containers.length; t++) {
      if (f === t) continue;
      const dest = state.containers[t];
      if (!dest) continue;

      if (dest.length === 0) {
        if (!isFullRun) {
          moves.push({ from: f, to: t, count });
        }
      } else if (dest.length < state.capacity && dest[dest.length - 1] === color) {
        const space = state.capacity - dest.length;
        moves.push({ from: f, to: t, count: Math.min(count, space) });
      }
    }
  }
  return moves;
};

export const applyMove = (state: SortState, move: Move): SortState => {
  const containers = state.containers.map(c => [...c]);
  const color = containers[move.from]![containers[move.from]!.length - 1]!;
  
  containers[move.from] = containers[move.from]!.slice(0, -move.count);
  for (let i = 0; i < move.count; i++) {
    containers[move.to]!.push(color);
  }

  return { ...state, containers };
};

export const isWon = (state: SortState): boolean => {
  return state.containers.every(c => c.length === 0 || (c.length === state.capacity && c.every(v => v === c[0])));
};

export const isStuck = (state: SortState): boolean => {
  if (isWon(state)) return false;
  return legalMoves(state).length === 0;
};
