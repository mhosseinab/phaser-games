import { expect, it, describe } from 'vitest';
import { createRng } from './rng';

describe('Rng', () => {
  it('two Rng seeded with the same seed yield identical streams', () => {
    const r1 = createRng(12345);
    const r2 = createRng(12345);
    for (let i = 0; i < 100; i++) {
      expect(r1.next()).toBe(r2.next());
    }
  });

  it('different seeds diverge', () => {
    const r1 = createRng(12345);
    const r2 = createRng(54321);
    expect(r1.next()).not.toBe(r2.next());
  });

  it('fork() reproduces a substream', () => {
    const r1 = createRng(123);
    const r2 = r1.fork();
    const r3 = r1.fork();
    expect(r2.next()).not.toBe(r3.next());
  });

  it('uniformity smoke test', () => {
    const r = createRng(1);
    let sum = 0;
    const n = 100000;
    for (let i = 0; i < n; i++) {
      sum += r.next();
    }
    const mean = sum / n;
    expect(mean).toBeGreaterThan(0.49);
    expect(mean).toBeLessThan(0.51);
  });

  it('intRange is uniform and inclusive-exclusive', () => {
    const r = createRng(42);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const val = r.intRange(0, 3);
      counts[val] = counts[val]! + 1;
    }
    expect(counts[0]).toBeGreaterThan(900);
    expect(counts[1]).toBeGreaterThan(900);
    expect(counts[2]).toBeGreaterThan(900);
    expect(counts.length).toBe(3);
  });
});
