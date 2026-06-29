export class FakeAnalytics {
    consent = false;
    events = [];
    setConsent(bool) {
        this.consent = bool;
    }
    log(event, params) {
        if (!this.consent)
            return; // drop pre-consent
        this.events.push({ event, params });
    }
}
//# sourceMappingURL=fake-analytics.js.map