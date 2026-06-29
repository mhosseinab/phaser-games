import { Ads } from '../ports/ads';
export declare class FakeAds implements Ads {
    private initialized;
    private consentGiven;
    init(consent: boolean): void;
    showBanner(): void;
    hideBanner(): void;
    interstitial(): Promise<void>;
    rewarded(type: string): Promise<{
        rewarded: boolean;
    }>;
}
//# sourceMappingURL=fake-ads.d.ts.map