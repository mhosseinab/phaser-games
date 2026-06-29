export class FirebaseAnalytics {
    transport;
    hasConsent = false;
    constructor(transport) {
        this.transport = transport;
    }
    setConsent(consent) {
        this.hasConsent = consent;
    }
    log(event, params) {
        if (this.hasConsent) {
            this.transport(event, params);
        }
    }
}
//# sourceMappingURL=analytics-firebase.js.map