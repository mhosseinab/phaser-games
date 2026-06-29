import { Ads } from '@blublux/engine';

export class WebAds implements Ads {
  init(consent: boolean): void {}
  showBanner(): void {}
  hideBanner(): void {}
  async interstitial(): Promise<void> {}
  async rewarded(type: string): Promise<{ rewarded: boolean }> {
    return { rewarded: true };
  }
}
