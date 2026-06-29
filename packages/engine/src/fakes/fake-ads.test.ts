import { expect, it, describe } from 'vitest';
import { FakeAds } from './fake-ads';

describe('FakeAds', () => {
  it('interstitial rejects before init', async () => {
    const ads = new FakeAds();
    await expect(ads.interstitial()).rejects.toThrow();
  });
  
  it('rewarded rejects before init', async () => {
    const ads = new FakeAds();
    await expect(ads.rewarded('test')).rejects.toThrow();
  });

  it('interstitial rejects if init with consent=false', async () => {
    const ads = new FakeAds();
    ads.init(false);
    await expect(ads.interstitial()).rejects.toThrow();
  });

  it('interstitial succeeds after init with consent=true', async () => {
    const ads = new FakeAds();
    ads.init(true);
    await expect(ads.interstitial()).resolves.toBeUndefined();
  });
});
