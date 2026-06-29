import { SortState, Move } from '../model/types';
import { solve } from './solve';

export const hint = (state: SortState): Move | null => {
  const path = solve(state);
  if (!path || path.length === 0) return null;
  return path[0]!;
};
