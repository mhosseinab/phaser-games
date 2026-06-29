import { Storage } from '../ports/storage';
import { Clock } from '../seams/clock';
import { Economy } from './economy';
import { Analytics } from '../ports/analytics';

export class DailyRewards {
  private lastClaimTime: number = 0;
  private streak: number = 0;
  private readonly storageKey = 'blublux_daily';

  constructor(
    private storage: Storage,
    private clock: Clock,
    private economy: Economy,
    private analytics: Analytics
  ) {}

  async init(): Promise<void> {
    const saved = await this.storage.getItem(this.storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      this.lastClaimTime = data.lastClaimTime || 0;
      this.streak = data.streak || 0;
    }
  }

  canClaim(): boolean {
    if (this.lastClaimTime === 0) return true;
    const now = this.clock.now();
    const msSinceLast = now - this.lastClaimTime;
    return msSinceLast >= 24 * 60 * 60 * 1000;
  }

  getStreak(): number {
    return this.streak;
  }

  async claim(): Promise<boolean> {
    if (!this.canClaim()) {
      return false;
    }

    const now = this.clock.now();
    
    if (this.lastClaimTime > 0) {
      const msSinceLast = now - this.lastClaimTime;
      if (msSinceLast > 48 * 60 * 60 * 1000) {
        this.streak = 1;
      } else {
        this.streak += 1;
      }
    } else {
      this.streak = 1;
    }

    this.lastClaimTime = now;
    
    await this.storage.setItem(this.storageKey, JSON.stringify({
      lastClaimTime: this.lastClaimTime,
      streak: this.streak
    }));

    const rewardAmount = Math.min(10 + this.streak * 5, 50);
    await this.economy.earn(rewardAmount);

    this.analytics.log('daily_claimed', { streak: this.streak, reward: rewardAmount });
    this.analytics.log('streak_day', { day: this.streak });

    return true;
  }
}
