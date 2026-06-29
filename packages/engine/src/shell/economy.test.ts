import { describe, it, expect, beforeEach } from 'vitest';
import { Economy } from './economy';
import { Storage } from '../ports/storage';
import { RemoteConfig } from '../adapters/remote-config';

class MockStorage implements Storage {
  private data = new Map<string, string>();
  async getItem(key: string) { return this.data.get(key) || null; }
  async setItem(key: string, value: string) { this.data.set(key, value); }
  async remove(key: string) { this.data.delete(key); }
}

describe('Economy', () => {
  let storage: Storage;
  let remoteConfig: RemoteConfig;
  let economy: Economy;

  beforeEach(async () => {
    storage = new MockStorage();
    remoteConfig = new RemoteConfig();
    economy = new Economy(storage, remoteConfig);
    await economy.init();
  });

  it('starts with 0 balance', () => {
    expect(economy.getBalance()).toBe(0);
  });

  it('can earn coins', async () => {
    await economy.earn(100);
    expect(economy.getBalance()).toBe(100);
    const saved = await storage.getItem('blublux_coins');
    expect(saved).toBe('100');
  });

  it('can spend coins if affordable', async () => {
    await economy.earn(100);
    expect(economy.canAfford(50)).toBe(true);
    const success = await economy.spend(50);
    expect(success).toBe(true);
    expect(economy.getBalance()).toBe(50);
  });

  it('fails to spend coins if not affordable', async () => {
    await economy.earn(40);
    expect(economy.canAfford(50)).toBe(false);
    const success = await economy.spend(50);
    expect(success).toBe(false);
    expect(economy.getBalance()).toBe(40);
  });

  it('provides cost based on reason and remote config', () => {
    expect(economy.getCost('hint')).toBe(50);
    expect(economy.getReward('level')).toBe(10);
  });
});
