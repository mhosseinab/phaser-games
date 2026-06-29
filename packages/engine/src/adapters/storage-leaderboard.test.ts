import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../fakes/memory-storage';
import { LocalLeaderboard } from './leaderboard-local';

describe('Leaderboard & Storage', () => {
  it('maintains a monotonic best score', async () => {
    const storage = new MemoryStorage();
    const lb = new LocalLeaderboard(storage);

    await lb.submit('main', 100);
    expect(await lb.best('main')).toBe(100);

    await lb.submit('main', 50); // Lower score should not overwrite
    expect(await lb.best('main')).toBe(100);

    await lb.submit('main', 150);
    expect(await lb.best('main')).toBe(150);
  });
});
