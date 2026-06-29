// @studio/ads-adapter — ONE ad interface for every game; web + native behind it.
// Encodes the policy guardrails from references/03-monetization.md. Game code must call
// THIS, never an ad SDK directly. The consent flow here is mandatory — do not bypass it.
//
// Plugin: @capacitor-community/admob (native only; dynamically imported so web bundles skip it).
// Verify exact event-enum and option names against the installed plugin version before shipping.

import { Capacitor } from '@capacitor/core';

export type AdResult = 'shown' | 'dismissed' | 'no-fill' | 'failed' | 'blocked';
export interface RewardOutcome { granted: boolean; type?: string; amount?: number; }

export interface AdsInitOptions {
  admob?: { bannerId: string; interstitialId: string; rewardedId: string; appId?: string };
  /** Force Google test ad units in development. Defaults to import.meta.env.DEV. */
  testMode?: boolean;
  /** Treat user as a child / under age of consent (kids titles). See references/03 §COPPA. */
  childDirected?: boolean;
  /** Web only: wire your portal SDK (Poki / CrazyGames / Google H5). See WebAdsProvider. */
  web?: WebAdHooks;
  /** Min seconds between interstitials and min user-actions between them (policy: >=2 actions). */
  interstitial?: { minIntervalSec?: number; minActions?: number };
}

export interface AdsProvider {
  init(o: AdsInitOptions): Promise<void>;
  /** True only after consent resolved and ads may be requested. Gate every show on this. */
  canRequestAds(): boolean;
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  /** Call at level start. */
  preloadInterstitial(): Promise<void>;
  /** Call at level end / game over. Respects frequency cap; returns 'blocked' if capped. */
  maybeShowInterstitial(): Promise<AdResult>;
  preloadRewarded(): Promise<void>;
  /** Only grant the reward when outcome.granted === true. */
  showRewarded(): Promise<RewardOutcome>;
  /** Let users change consent later (GDPR requirement on native). */
  openPrivacyOptions(): Promise<void>;
  /** Notify the cap of a user action (level finished, menu press, etc.). */
  noteUserAction(): void;
}

// ---- Shared interstitial frequency cap (policy floor: <=1 per 2 user actions) ----
class FrequencyCap {
  private last = 0;
  private actions = 0;
  constructor(private minIntervalSec = 45, private minActions = 2) {}
  noteAction() { this.actions++; }
  allow(): boolean {
    const okTime = (Date.now() - this.last) / 1000 >= this.minIntervalSec;
    const okActions = this.actions >= this.minActions;
    return okTime && okActions;
  }
  mark() { this.last = Date.now(); this.actions = 0; }
}

// ============================ NATIVE (AdMob) ============================
class AdMobProvider implements AdsProvider {
  private AdMob: any;
  private ev: any; // event enums
  private ready = false;
  private interReady = false;
  private rewardedReady = false;
  private ids!: NonNullable<AdsInitOptions['admob']>;
  private testing = false;
  private cap = new FrequencyCap();

  async init(o: AdsInitOptions): Promise<void> {
    const mod = await import('@capacitor-community/admob');
    this.AdMob = mod.AdMob;
    this.ev = mod;
    this.ids = o.admob!;
    this.testing = o.testMode ?? import.meta.env.DEV;
    this.cap = new FrequencyCap(o.interstitial?.minIntervalSec ?? 45, o.interstitial?.minActions ?? 2);

    await this.AdMob.initialize();

    // --- Consent gate (UMP) + iOS ATT. Order matters; see references/03 §pitfall. ---
    const consent = await this.AdMob.requestConsentInfo();
    if (consent?.isConsentFormAvailable && consent.status === mod.AdmobConsentStatus.REQUIRED) {
      await this.AdMob.showConsentForm();
    }
    if (Capacitor.getPlatform() === 'ios') {
      const t = await this.AdMob.trackingAuthorizationStatus();
      if (t.status === 'notDetermined') await this.AdMob.requestTrackingAuthorization();
    }
    const after = await this.AdMob.requestConsentInfo();
    this.ready = after?.canRequestAds !== false; // proceed only when ads may be requested

    // Reward listener — the only place a reward is recognized.
    this.AdMob.addListener(mod.RewardAdPluginEvents.Rewarded, (item: any) => {
      this.pendingReward = { granted: true, type: item?.type, amount: item?.amount };
    });
    // NOTE: for childDirected titles, setTagForChildDirectedTreatment/MaxAdContentRating
    // are NOT exposed by the plugin JS API — add a small native shim. See references/03 §COPPA.
  }

  private pendingReward: RewardOutcome | null = null;
  canRequestAds() { return this.ready; }
  noteUserAction() { this.cap.noteAction(); }

  private get isIos() { return Capacitor.getPlatform() === 'ios'; }
  /** Platform-correct unit id: Google test ids in dev, your real ids in prod. */
  private adId(kind: 'banner' | 'interstitial' | 'rewarded'): string {
    if (this.testing) {
      if (kind === 'banner') return this.isIos ? TEST_IDS.bannerIos : TEST_IDS.bannerAndroid;
      if (kind === 'interstitial') return this.isIos ? TEST_IDS.interstitialIos : TEST_IDS.interstitialAndroid;
      return this.isIos ? TEST_IDS.rewardedIos : TEST_IDS.rewardedAndroid;
    }
    if (kind === 'banner') return this.ids.bannerId;
    if (kind === 'interstitial') return this.ids.interstitialId;
    return this.ids.rewardedId;
  }

  async showBanner() {
    if (!this.ready) return;
    await this.AdMob.showBanner({
      adId: this.adId('banner'),
      adSize: this.ev.BannerAdSize.ADAPTIVE_BANNER,
      position: this.ev.BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: this.testing,
    });
  }
  async hideBanner() { try { await this.AdMob.hideBanner(); } catch {} }

  async preloadInterstitial() {
    if (!this.ready) return;
    await this.AdMob.prepareInterstitial({ adId: this.adId('interstitial'), isTesting: this.testing });
    this.interReady = true;
  }
  async maybeShowInterstitial(): Promise<AdResult> {
    if (!this.ready) return 'blocked';
    if (!this.cap.allow()) return 'blocked';
    if (!this.interReady) return 'no-fill';
    try {
      await this.AdMob.showInterstitial();
      this.cap.mark();
      this.interReady = false;
      void this.preloadInterstitial(); // prepare the next one
      return 'shown';
    } catch { return 'failed'; }
  }

  async preloadRewarded() {
    if (!this.ready) return;
    await this.AdMob.prepareRewardVideoAd({ adId: this.adId('rewarded'), isTesting: this.testing });
    this.rewardedReady = true;
  }
  async showRewarded(): Promise<RewardOutcome> {
    if (!this.ready || !this.rewardedReady) return { granted: false };
    this.pendingReward = null;
    try {
      await this.AdMob.showRewardVideoAd(); // Rewarded listener sets pendingReward on completion
      this.rewardedReady = false;
      void this.preloadRewarded();
      return this.pendingReward ?? { granted: false };
    } catch { return { granted: false }; }
  }

  async openPrivacyOptions() { try { await this.AdMob.showPrivacyOptionsForm(); } catch {} }
}

// ============================ WEB ============================
// Web has no AdMob. Wire your portal here. Provide hooks at init; this stays SDK-agnostic.
export interface WebAdHooks {
  ready?: () => boolean;
  showBanner?: () => void | Promise<void>;
  hideBanner?: () => void | Promise<void>;
  interstitial: () => Promise<AdResult>;      // map to adBreak({type:'next'}) / commercialBreak / requestAd('midgame')
  rewarded: () => Promise<RewardOutcome>;     // map to adBreak({type:'reward'}) / rewardedBreak / requestAd('rewarded')
  openPrivacyOptions?: () => void | Promise<void>;
}

class WebAdsProvider implements AdsProvider {
  private hooks!: WebAdHooks;
  private cap = new FrequencyCap();
  async init(o: AdsInitOptions) {
    if (!o.web) throw new Error('WebAdsProvider requires AdsInitOptions.web hooks');
    this.hooks = o.web;
    this.cap = new FrequencyCap(o.interstitial?.minIntervalSec ?? 45, o.interstitial?.minActions ?? 2);
  }
  canRequestAds() { return this.hooks.ready ? this.hooks.ready() : true; }
  noteUserAction() { this.cap.noteAction(); }
  async showBanner() { await this.hooks.showBanner?.(); }
  async hideBanner() { await this.hooks.hideBanner?.(); }
  async preloadInterstitial() { /* most web SDKs self-manage fill */ }
  async maybeShowInterstitial(): Promise<AdResult> {
    if (!this.cap.allow()) return 'blocked';
    const r = await this.hooks.interstitial();
    if (r === 'shown') this.cap.mark();
    return r;
  }
  async preloadRewarded() {}
  async showRewarded(): Promise<RewardOutcome> { return this.hooks.rewarded(); }
  async openPrivacyOptions() { await this.hooks.openPrivacyOptions?.(); }
}

// Google test ad unit IDs (development only). Full table incl. iOS in references/03-monetization.md.
export const TEST_IDS = {
  bannerAndroid: 'ca-app-pub-3940256099942544/6300978111',
  interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
  bannerIos: 'ca-app-pub-3940256099942544/2934735716',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
  rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
} as const;

let _ads: AdsProvider | null = null;
/** Composition root: returns the right provider for the platform. Call init() once at boot. */
export function createAds(): AdsProvider {
  if (_ads) return _ads;
  _ads = Capacitor.isNativePlatform() ? new AdMobProvider() : new WebAdsProvider();
  return _ads;
}

/* ----------------------------------------------------------------------------
EXAMPLE — wiring Google H5 (AdSense Ad Placement API) on the web at the call site:

const ads = createAds();
await ads.init({
  admob: { bannerId: '...', interstitialId: '...', rewardedId: '...' },
  web: {
    interstitial: () => new Promise(res => {
      (window as any).adBreak({ type: 'next', name: 'level-end',
        beforeAd: muteAndPause, afterAd: resume,
        adBreakDone: (i: any) => res(i.breakStatus === 'viewed' ? 'shown' : 'no-fill') });
    }),
    rewarded: () => new Promise(res => {
      let granted = false;
      (window as any).adBreak({ type: 'reward', name: 'extra-life',
        beforeReward: (show: () => void) => show(),
        adViewed: () => { granted = true; }, adDismissed: () => { granted = false; },
        beforeAd: muteAndPause, afterAd: resume,
        adBreakDone: () => res({ granted }) });
    }),
  },
});
---------------------------------------------------------------------------- */
