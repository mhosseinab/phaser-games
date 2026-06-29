import * as Sentry from '@sentry/capacitor';

export const initSentry = (dsn: string): void => {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
};
