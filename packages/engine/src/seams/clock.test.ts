import { expect, it, describe } from 'vitest';
import { SystemClock, FakeClock } from './clock';

describe('Clock', () => {
  it('SystemClock returns a number', () => {
    expect(typeof SystemClock.now()).toBe('number');
  });

  it('FakeClock advances', () => {
    const clock = new FakeClock(100);
    expect(clock.now()).toBe(100);
    clock.advance(50);
    expect(clock.now()).toBe(150);
  });
});
