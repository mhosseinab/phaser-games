import { Ads } from '@blublux/engine';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

export class AdmobAds implements Ads {
  private initialized = false;
  private consent = false;
  
  private interstitialId = import.meta.env?.DEV ? 'ca-app-pub-3940256099942544/1033173712' : 'PROD_INTERSTITIAL_ID';
  private rewardedId = import.meta.env?.DEV ? 'ca-app-pub-3940256099942544/5224354917' : 'PROD_REWARDED_ID';
  private bannerId = import.meta.env?.DEV ? 'ca-app-pub-3940256099942544/6300978111' : 'PROD_BANNER_ID';

  init(consent: boolean): void {
    this.consent = consent;
    this.initialized = true;
  }

  showBanner(): void {
    if (!this.consent) return;
    AdMob.showBanner({
      adId: this.bannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER
    }).catch(console.error);
  }

  hideBanner(): void {
    AdMob.hideBanner().catch(console.error);
  }

  async interstitial(): Promise<void> {
    if (!this.initialized || !this.consent) throw new Error('Cannot show ads without consent');
    await AdMob.prepareInterstitial({ adId: this.interstitialId });
    await AdMob.showInterstitial();
  }

  async rewarded(type: string): Promise<{ rewarded: boolean }> {
    if (!this.initialized || !this.consent) throw new Error('Cannot show ads without consent');
    await AdMob.prepareRewardVideoAd({ adId: this.rewardedId });
    const reward = await AdMob.showRewardVideoAd();
    return { rewarded: !!reward };
  }
}
