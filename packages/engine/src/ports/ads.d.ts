export interface Ads {
    init(consent: boolean): void;
    showBanner(): void;
    hideBanner(): void;
    interstitial(): Promise<void>;
    rewarded(type: string): Promise<{
        rewarded: boolean;
    }>;
}
//# sourceMappingURL=ads.d.ts.map