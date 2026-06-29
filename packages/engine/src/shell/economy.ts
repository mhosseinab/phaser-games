import { Storage } from '../ports/storage';
import { RemoteConfig } from '../adapters/remote-config';

export class Economy {
  private balance: number = 0;
  private readonly storageKey = 'blublux_coins';

  constructor(private storage: Storage, private remoteConfig: RemoteConfig) {}

  async init(): Promise<void> {
    const saved = await this.storage.getItem(this.storageKey);
    if (saved) {
      this.balance = parseInt(saved, 10) || 0;
    }
  }

  getBalance(): number {
    return this.balance;
  }

  async earn(amount: number): Promise<void> {
    this.balance += amount;
    await this.storage.setItem(this.storageKey, this.balance.toString());
  }

  canAfford(amount: number): boolean {
    return this.balance >= amount;
  }

  async spend(amount: number): Promise<boolean> {
    if (!this.canAfford(amount)) {
      return false;
    }
    this.balance -= amount;
    await this.storage.setItem(this.storageKey, this.balance.toString());
    return true;
  }

  getCost(reason: string): number {
    return this.remoteConfig.getNumber('coin_cost_' + reason, 50);
  }

  getReward(reason: string): number {
    return this.remoteConfig.getNumber('coin_reward_' + reason, 10);
  }
}
