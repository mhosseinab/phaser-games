# 03 — Monetization: AdMob (native) + Web Ads + Consent/Policy

The highest-stakes reference. Wrong consent or placement = account suspension. Sourced June 2026; citations `[n]` → `99-sources.md`. Verify the plugin version with `npm info @capacitor-community/admob version`.

## ⚠ The one pitfall that suspends accounts

**UMP/GDPR consent must gate ad *loading*, not just display.** Since 16 Jan 2024, AdMob requires a Google-certified CMP (the UMP SDK) for EEA/UK/CH users. Correct order, every launch: [ad-consent][ad-privacy]
1. `AdMob.initialize()`
2. `AdMob.requestConsentInfo()`
3. if `status === REQUIRED` → `AdMob.showConsentForm()`
4. **check `canRequestAds` — only then load/show any ad.**

Skipping step 4 is the violation. The `ads-adapter` template enforces this; never load an ad outside it.

---

## PART A — Native: AdMob via Capacitor

### Plugin
`@capacitor-community/admob`. Actively maintained. **Plugin major version tracks Capacitor major** (Cap 8 → plugin 8.x). npm `latest` = **8.0.0** (verified June 2026); still confirm with `npm info @capacitor-community/admob version`. [admob-gh][admob-npm] Alternative: `@admob-plus/capacitor` (class-based API), less traction. AdMob does **not** run on web — the plugin stubs on web; use Part C there. [cap-ads]

### Formats and APIs (from the plugin README)
Banner, Interstitial, Rewarded, Rewarded Interstitial are supported. **App Open and Native are NOT confirmed in the plugin** — check the current TS interface before relying on them. [admob-gh]

```ts
// Banner
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';
AdMob.addListener(BannerAdPluginEvents.SizeChanged, (s) => {/* resize Phaser canvas */});
await AdMob.showBanner({ adId, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0 });
await AdMob.hideBanner(); await AdMob.resumeBanner(); await AdMob.removeBanner();

// Interstitial — preload at level start, show at level end
import { InterstitialAdPluginEvents } from '@capacitor-community/admob';
AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {/* resume game */});
await AdMob.prepareInterstitial({ adId }); await AdMob.showInterstitial();

// Rewarded — grant ONLY on Rewarded event
import { RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
AdMob.addListener(RewardAdPluginEvents.Rewarded, (item: AdMobRewardItem) => {/* grant item.amount */});
await AdMob.prepareRewardVideoAd({ adId }); await AdMob.showRewardVideoAd();

// Rewarded Interstitial — same shape via RewardInterstitialAdPluginEvents
await AdMob.prepareRewardInterstitialAd({ adId }); await AdMob.showRewardInterstitialAd();
```
Register listeners before `prepare*`. Options support `isTesting`, `npa` (non-personalized), rewarded `ssv` (server-side verification). [admob-gh]

### Native config
**Android** `AndroidManifest.xml` → `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>`; put the `ca-app-pub-…~…` id in `strings.xml`. [admob-gh]
**iOS** `Info.plist` → `GADApplicationIdentifier` (`ca-app-pub-…~…`), `GADIsAdManagerApp=true`, `SKAdNetworkItems`, and `NSUserTrackingUsageDescription` (mandatory or the app crashes on ATT request). [admob-gh]

### Official test ad unit IDs (use in all dev) [ad-test-android][ad-test-ios]
| Format | Android | iOS |
|---|---|---|
| App Open | `…/9257395921` | `…/5575463023` |
| Adaptive Banner | `…/9214589741` | `…/2435281174` |
| Banner | `…/6300978111` | `…/2934735716` |
| Interstitial | `…/1033173712` | `…/4411468910` |
| Rewarded | `…/5224354917` | `…/1712485313` |
| Rewarded Interstitial | `…/5354046379` | `…/6978759866` |
| Native | `…/2247696110` | `…/3986624511` |

Prefix all with `ca-app-pub-3940256099942544`. Emulators/simulators are auto-registered test devices.

### iOS ATT
`AdMob.trackingAuthorizationStatus()` / `AdMob.requestTrackingAuthorization()` for IDFA on iOS 14.5+. Show after a context screen. Without ATT auth, IDFA is zeroed and ads go non-personalized. `NSUserTrackingUsageDescription` required. [att][admob-gh]

---

## PART B — Compliance

### UMP (GDPR/EEA)
Plugin methods: `requestConsentInfo(options?)` (every launch), `showConsentForm()`, `showPrivacyOptionsForm()` (give users an in-menu "Privacy options" entry to change consent — required for some message types), `resetConsentInfo()` (testing). Test with `debugGeography: AdmobConsentDebugGeography.EEA` + `testDeviceIdentifiers`. UMP Android dep `com.google.android.ump:user-messaging-platform:4.0.0`. [ad-privacy][admob-gh][ad-consent]

### COPPA / kids
- App targeting **only children** on Play → AdMob auto-serves Families-compliant ads. [admob-families]
- **Mixed audience** → per request, `setTagForChildDirectedTreatment(true)` + `setMaxAdContentRating(G)`, and use only Families self-certified mediation SDKs. **The Capacitor plugin does not expose these as JS methods — a small native bridge/shim may be required.** [admob-families][admob-coppa]
- Use GMA SDK Android 20.6.0+/iOS 7.67.0+ so the ad ID isn't sent under child-directed treatment. [admob-families]
- Effect: no behavioral/remarketing ads; G-rated only. Apple Kids Category forbids third-party tracking/ads unless the network meets Apple child-safety rules. [apple-privacy-use]
- FTC COPPA amendment (22 Apr 2026): biometrics are now personal info; bundled consent prohibited; separate opt-in for targeted ads to children. [coppa-2026]

### Program policy — game-critical rules
**Interstitial** [ad-interstitial]: never on launch (use App Open), never on exit, never back-to-back, never mid-task; **max one per two user actions** (includes back presses). Preload, then show at a logical break to dodge carrier latency.
**Rewarded** [ad-rewarded]: affirmative opt-in; skippable; rewarded-interstitial needs an intro with a clear opt-out; no cash/crypto rewards; in-game items only, non-transferable; physical discounts ≤25%; random rewards must disclose odds; deliver the promised reward; don't imply Google endorsement; don't guilt-trip.
**Banner** [ad-banner]: keep away from tap targets; don't obscure content; resize canvas on `SizeChanged`.
**Invalid traffic** [ad-policy]: never click your own ads, never incentivize clicks, always test-mode in dev.

### Store privacy deliverables
- **Google Play Data Safety:** GMA SDK auto-collects IP, product interactions, diagnostics, device/ad identifiers — you must declare all of it (plus mediation SDKs). [play-data][play-datasafety]
- **Apple:** App Privacy "nutrition labels" + a **`PrivacyInfo.xcprivacy` manifest** declaring Required-Reason APIs (enforced since 1 May 2024; SDK manifests since 12 Feb 2025). Missing → rejection. [apple-privacy][apple-required-reason]
- **Privacy policy URL** required by both stores and AdMob terms; stable, public, non-PDF.

---

## PART C — Web monetization

**AdMob is app-only.** Web paths:

### Google H5 Ad Placement API (via AdSense) [h5-structure][h5-adsense]
Needs an approved AdSense account and an approved gaming site. The `adsbygoogle` tag + Ad Placement API must live in the **same document** as the canvas (if iframed, tag goes inside the iframe with `allow="autoplay"`). Calls:
```js
adBreak({ type:'next', name:'level-complete', beforeAd:()=>mute(), afterAd:()=>resume(), adBreakDone:i=>{} }); // interstitial
adBreak({ type:'reward', name:'extra-life', beforeReward:(show)=>{/*show UI then*/ show();}, adViewed:()=>grant(), adDismissed:()=>{} });
```

### Portal SDKs
| Portal | Interstitial | Rewarded | Model | Onboarding |
|---|---|---|---|---|
| Poki [poki] | `commercialBreak(cb)` | `rewardedBreak({size})→bool` | rev-share (undisclosed) | curated review |
| CrazyGames [crazy] | `SDK.ad.requestAd("midgame",cb)` | `requestAd("rewarded",cb)` | CPM (undisclosed) | submit+review |
| GameDistribution [gd] | `gdsdk.showAd()` (pre/mid-roll) | `SDK_REWARDED_WATCH_COMPLETE` | network (undisclosed) | self-serve |

Common rules: signal gameplay start/stop (Poki `gameplayStart/Stop`), ads only behind user input, mute audio + disable input during ads, and **games must remain fully playable with an ad blocker** (CrazyGames `ad.hasAdblock()`). Poki resets its commercial-break timer after a rewarded break to avoid stacking. Revenue splits are not publicly documented — treat any number as UNVERIFIED.

---

## Ad UX patterns (defaults the adapter encodes)
- **Rewarded** for: continue-after-death, extra lives, coin doubler, unlock hint, skip timer. Pre-prompt with the exact reward. Grant only on completion; on no-fill, return gracefully without punishing. [ad-rewarded-playbook]
- **Interstitial** at: game-over→retry, level-complete→next. Preload at start. Cap ≈1 per 2–3 levels (policy floor: 1 per 2 actions).
- **Banner**: menus/lobby; bottom-center in portrait; hide during busy gameplay.
- All formats: mute + freeze input on ad start, restore on end/fail.

The unified interface and both implementations are in `assets/templates/engine/ads-adapter.ts` and `consent.ts`.
