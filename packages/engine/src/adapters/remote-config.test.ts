import { describe, it, expect } from 'vitest';
import { RemoteConfig } from './remote-config';

describe('RemoteConfig', () => {
  it('returns defaults when no fetcher is provided', () => {
    const rc = new RemoteConfig();
    expect(rc.getNumber('interstitial_cadence')).toBe(3);
    expect(rc.getNumber('unknown_key', 99)).toBe(99);
  });
});
