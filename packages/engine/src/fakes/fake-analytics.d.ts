import { Analytics } from '../ports/analytics';
export declare class FakeAnalytics implements Analytics {
    private consent;
    events: {
        event: string;
        params?: Record<string, any>;
    }[];
    setConsent(bool: boolean): void;
    log(event: string, params?: Record<string, any>): void;
}
//# sourceMappingURL=fake-analytics.d.ts.map