import { SortState, Move } from '../model/types';
import { isWon, legalMoves, applyMove } from '../model/rules';

export const hashState = (state: SortState): string => {
  const strings = state.containers.map(c => c.join(','));
  strings.sort();
  return strings.join('|');
};

export const solve = (start: SortState, maxNodes = 10000): Move[] | null => {
  if (isWon(start)) return [];

  const visited = new Set<string>();
  visited.add(hashState(start));

  interface Node {
    state: SortState;
    path: Move[];
  }

  const queue: Node[] = [{ state: start, path: [] }];
  let nodes = 0;

  while (queue.length > 0 && nodes < maxNodes) {
    const { state, path } = queue.shift()!;
    nodes++;

    const moves = legalMoves(state);
    for (const move of moves) {
      const next = applyMove(state, move);
      if (isWon(next)) return [...path, move];

      const h = hashState(next);
      if (!visited.has(h)) {
        visited.add(h);
        queue.push({ state: next, path: [...path, move] });
      }
    }
  }

  return null;
};
