import { Ads } from '../ports/ads';

export class FakeAds implements Ads {
  private initialized = false;
  private consentGiven = false;
  
  init(consent: boolean): void {
    this.initialized = true;
    this.consentGiven = consent;
  }
  showBanner(): void {}
  hideBanner(): void {}
  async interstitial(): Promise<void> {
    if (!this.initialized) throw new Error('Ads not initialized');
    if (!this.consentGiven) throw new Error('Cannot show ads without consent');
  }
  async rewarded(type: string): Promise<{ rewarded: boolean }> {
    if (!this.initialized) throw new Error('Ads not initialized');
    if (!this.consentGiven) throw new Error('Cannot show ads without consent');
    return { rewarded: true };
  }
}
