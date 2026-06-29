import { describe, it, expect } from 'vitest';
import { generate } from './generate';
import { TIERS } from './tiers';
import { createRng } from '@blublux/engine';
import { solve } from '../solver/solve';

describe('Generator', () => {
  it('generates solvable levels', () => {
    // Only doing a few for fast tests locally
    const rng = createRng(12345);
    const state = generate(TIERS.Easy!, rng);
    const path = solve(state, 50000);
    expect(path).not.toBeNull();
  });

  it('is deterministic', () => {
    const rng1 = createRng(42);
    const state1 = generate(TIERS.Tutorial!, rng1);
    
    const rng2 = createRng(42);
    const state2 = generate(TIERS.Tutorial!, rng2);
    
    expect(state1).toEqual(state2);
  });
});
