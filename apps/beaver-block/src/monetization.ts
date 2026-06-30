import { Ads, ConsentManager } from '@blublux/engine';

export async function initMonetization(ads: Ads, consentManager: ConsentManager): Promise<boolean> {
  try {
    const consent = await consentManager.request();
    ads.init(consent.canRequestAds);
    return consent.canRequestAds;
  } catch (e) {
    console.warn('Ads init failed', e);
    return false;
  }
}
