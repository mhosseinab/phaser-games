export class RemoteConfig {
  private defaults: Record<string, number | boolean> = {
    'interstitial_cadence': 3,
    'min_seconds_between_ads': 60,
    'free_hint_quota': 3,
    'free_undo_quota': 3,
    'coin_reward_level': 10,
    'coin_cost_hint': 50,
  };

  constructor(private fetcher?: (key: string) => number | boolean | undefined) {}

  getNumber(key: string, defaultVal?: number): number {
    if (this.fetcher) {
      const val = this.fetcher(key);
      if (typeof val === 'number') return val;
    }
    return (this.defaults[key] as number) ?? defaultVal ?? 0;
  }

  getBool(key: string, defaultVal?: boolean): boolean {
    if (this.fetcher) {
      const val = this.fetcher(key);
      if (typeof val === 'boolean') return val;
    }
    return (this.defaults[key] as boolean) ?? defaultVal ?? false;
  }
}
