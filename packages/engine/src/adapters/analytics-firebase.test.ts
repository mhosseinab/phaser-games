import { describe, it, expect, vi } from 'vitest';
import { FirebaseAnalytics } from './analytics-firebase';

describe('FirebaseAnalytics', () => {
  it('drops events before consent and forwards after', () => {
    const transport = vi.fn();
    const analytics = new FirebaseAnalytics(transport);

    analytics.log('level_start');
    expect(transport).not.toHaveBeenCalled();

    analytics.setConsent(true);
    analytics.log('level_start');
    expect(transport).toHaveBeenCalledWith('level_start', undefined);
  });
});
