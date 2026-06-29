export class RemoteConfig {
    fetcher;
    defaults = {
        'interstitial_cadence': 3,
        'min_seconds_between_ads': 60,
        'free_hint_quota': 3,
        'free_undo_quota': 3,
        'coin_reward_level': 10,
        'coin_cost_hint': 50,
    };
    constructor(fetcher) {
        this.fetcher = fetcher;
    }
    getNumber(key, defaultVal) {
        if (this.fetcher) {
            const val = this.fetcher(key);
            if (typeof val === 'number')
                return val;
        }
        return this.defaults[key] ?? defaultVal ?? 0;
    }
    getBool(key, defaultVal) {
        if (this.fetcher) {
            const val = this.fetcher(key);
            if (typeof val === 'boolean')
                return val;
        }
        return this.defaults[key] ?? defaultVal ?? false;
    }
}
//# sourceMappingURL=remote-config.js.map