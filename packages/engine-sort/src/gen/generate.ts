import { SortState } from '../model/types';
import { Rng } from '@blublux/engine';
import { TierConfig } from './tiers';

export const buildSolvedState = (colors: number, capacity: number, empties: number): SortState => {
  const containers: number[][] = [];
  for (let c = 1; c <= colors; c++) {
    containers.push(new Array(capacity).fill(c));
  }
  for (let e = 0; e < empties; e++) {
    containers.push([]);
  }
  return { colors, capacity, containers };
};

export const generate = (tier: TierConfig, rng: Rng): SortState => {
  let state = buildSolvedState(tier.colors, tier.capacity, tier.empties);
  
  for (let i = 0; i < tier.minDepth; i++) {
    const moves = [];
    for (let f = 0; f < state.containers.length; f++) {
      if (state.containers[f]!.length === 0) continue;
      
      for (let t = 0; t < state.containers.length; t++) {
        if (f === t) continue;
        if (state.containers[t]!.length < state.capacity) {
          moves.push({ from: f, to: t });
        }
      }
    }
    
    if (moves.length === 0) break;
    const move = rng.pick(moves)!;
    
    const containers = state.containers.map(c => [...c]);
    const color = containers[move.from]!.pop()!;
    containers[move.to]!.push(color);
    state = { ...state, containers };
  }

  return state;
};
