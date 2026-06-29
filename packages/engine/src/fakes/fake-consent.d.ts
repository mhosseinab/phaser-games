import { ConsentManager } from '../ports/consent';
export declare class FakeConsent implements ConsentManager {
    request(): Promise<{
        canRequestAds: boolean;
    }>;
}
//# sourceMappingURL=fake-consent.d.ts.map