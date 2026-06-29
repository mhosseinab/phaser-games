import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyRewards } from './daily';
import { Storage } from '../ports/storage';
import { Clock, FakeClock } from '../seams/clock';
import { Economy } from './economy';
import { Analytics } from '../ports/analytics';
import { RemoteConfig } from '../adapters/remote-config';

class MockStorage implements Storage {
  private data = new Map<string, string>();
  async getItem(key: string) { return this.data.get(key) || null; }
  async setItem(key: string, value: string) { this.data.set(key, value); }
  async remove(key: string) { this.data.delete(key); }
}

class MockAnalytics implements Analytics {
  setConsent(bool: boolean) {}
  log(event: string, params?: Record<string, any>) {}
}

describe('DailyRewards', () => {
  let storage: Storage;
  let clock: FakeClock;
  let economy: Economy;
  let analytics: Analytics;
  let daily: DailyRewards;
  let remoteConfig: RemoteConfig;

  beforeEach(async () => {
    storage = new MockStorage();
    clock = new FakeClock(1000000000000);
    remoteConfig = new RemoteConfig();
    economy = new Economy(storage, remoteConfig);
    await economy.init();
    analytics = new MockAnalytics();
    
    daily = new DailyRewards(storage, clock, economy, analytics);
    await daily.init();
  });

  it('can claim on first day', async () => {
    expect(daily.canClaim()).toBe(true);
    await daily.claim();
    expect(daily.getStreak()).toBe(1);
    expect(economy.getBalance()).toBeGreaterThan(0);
    expect(daily.canClaim()).toBe(false);
  });

  it('cannot claim twice on same day', async () => {
    await daily.claim();
    expect(daily.canClaim()).toBe(false);
    clock.advance(10 * 60 * 60 * 1000);
    expect(daily.canClaim()).toBe(false);
  });

  it('can claim next day and increases streak', async () => {
    await daily.claim();
    clock.advance(25 * 60 * 60 * 1000);
    expect(daily.canClaim()).toBe(true);
    await daily.claim();
    expect(daily.getStreak()).toBe(2);
  });

  it('resets streak if more than 48 hours passed', async () => {
    await daily.claim();
    clock.advance(50 * 60 * 60 * 1000);
    expect(daily.canClaim()).toBe(true);
    await daily.claim();
    expect(daily.getStreak()).toBe(1);
  });
});
