import * as Sentry from '@sentry/capacitor';
export const initSentry = (dsn) => {
    Sentry.init({
        dsn,
        tracesSampleRate: 1.0,
    });
};
//# sourceMappingURL=sentry.js.map