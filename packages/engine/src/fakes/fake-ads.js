export class FakeAds {
    initialized = false;
    consentGiven = false;
    init(consent) {
        this.initialized = true;
        this.consentGiven = consent;
    }
    showBanner() { }
    hideBanner() { }
    async interstitial() {
        if (!this.initialized)
            throw new Error('Ads not initialized');
        if (!this.consentGiven)
            throw new Error('Cannot show ads without consent');
    }
    async rewarded(type) {
        if (!this.initialized)
            throw new Error('Ads not initialized');
        if (!this.consentGiven)
            throw new Error('Cannot show ads without consent');
        return { rewarded: true };
    }
}
//# sourceMappingURL=fake-ads.js.map