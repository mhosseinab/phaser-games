---
name: phaser4-game-factory
description: >-
  Build production-ready HTML5 games with Phaser 4 + TypeScript + Vite in a monorepo,
  dual-deployed to the web AND to native iOS/Android via Capacitor, monetized with ads
  (AdMob on native, H5 portal/AdSense ads on web). Use this skill WHENEVER the user wants
  to build, scaffold, structure, ship, or monetize one or many Phaser games — including
  "Phaser game", "HTML5 game", "mobile game with AdMob", "rewarded ads", "interstitial",
  "wrap my game in Capacitor", "game monorepo", "ship a game to the App Store / Play Store",
  "game CI/CD", or building a catalog/factory of many small games. Also trigger when the
  user mentions Phaser, Capacitor games, game ad mediation, UMP consent for games, or a
  shared game engine package — even if they don't name this skill. Covers framework setup,
  the shared-engine monorepo, the unified ad+consent adapter, CI/CD with Fastlane, store
  policy/compliance, performance, and a per-game production checklist.
---

# Phaser 4 Game Factory

A complete system for building **many** production-ready Phaser 4 games from one monorepo, each shippable to the **web** and to **native iOS/Android** (Capacitor), each monetized with ads, each compliant with store and privacy policy.

Everything in this skill is sourced from primary documentation verified **June 2026** (see `references/99-sources.md`). Versions move; when a version or API matters, re-verify with the cited source or `npm info <pkg>` before pinning. **Never invent an API, version, ad unit ID, or policy rule — if it isn't in the references or a fetched source, look it up.**

---

## 0. Read this first — five guardrails that prevent disasters

These are the mistakes that get accounts banned, builds rejected, or apps black-screened. They override convenience everywhere in this skill.

1. **Consent gates ad *loading*, not just display.** In the EEA/UK/CH, AdMob requires a Google-certified CMP (the UMP SDK). The order is always `initialize()` → `requestConsentInfo()` → `showConsentForm()` if required → check `canRequestAds` → *only then* load or show any ad. Showing ads before `canRequestAds` is true is a policy violation that suspends accounts. The provided `ads-adapter` enforces this — do not bypass it. See `references/03-monetization.md`.

2. **AdMob is native-only. The web cannot use AdMob.** Web builds monetize through the Google H5 Ad Placement API (needs an approved AdSense account) or a portal SDK (Poki, CrazyGames, GameDistribution). The ad adapter abstracts this so game code never branches on platform. See `references/03-monetization.md`.

3. **App-store saturation is the #1 strategic risk, not a technical one.** 60 near-identical native apps will be rejected (Apple 4.3 spam / 4.2.6 template apps; Google repetitive-content — 80,000+ developer accounts banned in 2025). The correct architecture: **ship all 60 to the web; submit only the strongest 5–10 as genuinely differentiated native apps, or bundle a genre's games into one container app with in-app selection.** Confront this with the user before automating 60 store submissions. See `references/00-architecture.md` §Strategic-Risk.

4. **`base: './'` for every native build.** Capacitor serves from a localhost scheme, not `/`. An absolute Vite base breaks all asset paths → black screen on device. Toggle base via Vite mode (`--mode native`). See `references/02-dual-deploy.md`.

5. **Use Google test ad unit IDs in all development.** Clicking live ads during testing is invalid traffic and risks suspension. Test IDs are in `references/03-monetization.md`. Wire `isTesting`/test IDs to `import.meta.env.DEV`.

---

## 1. The locked tech stack (verified June 2026)

| Layer | Choice | Version | Why |
|---|---|---|---|
| Engine | Phaser | **4.2.x** ("Caladan" GA Apr 2026; Beam WebGL2 renderer) | GA, native TS types, mobile-tuned renderer, auto WebGL context restore. Start new games on v4, never v3. |
| Language/build | TypeScript + Vite | TS 5.x+, Vite latest | Phaser 4 ships native types; Vite is the official template bundler. |
| Native shell | Capacitor | **8.4.x** | Node 22+, Xcode 26, Android API 24+/iOS 15+. SPM default on iOS. |
| Monorepo | pnpm workspaces + **Turborepo 2.x** | pnpm 9+, turbo 2.x | `--affected` builds; simpler than Nx for a game studio. (`turbo.json` uses `tasks`, not `pipeline`.) |
| Native ads | `@capacitor-community/admob` | major == Capacitor major | Banner/Interstitial/Rewarded/Rewarded-Interstitial + UMP + ATT. |
| Web ads | H5 Ad Placement API / Poki / CrazyGames / GameDistribution | — | AdMob does not run in a browser. |
| Analytics | Firebase Analytics (GA4) + Remote Config | — | Free, ad-revenue + A/B for ad frequency. |
| Crashes | `@sentry/capacitor` | — | Handles WebView JS + native; Crashlytics doesn't read WebView JS. |
| Tests | Vitest (logic) + Playwright (smoke) | — | Test pure logic, not the renderer. |

Pin exact versions at build time with `npm info <pkg> version`. Do not assume from memory.

---

## 2. Pick the task, then follow the matching path

This skill covers three jobs. Identify which one the request is, then read the listed references and copy the listed templates.

### Path A — Bootstrap the monorepo (do once)
Read `references/00-architecture.md`. Copy from `assets/templates/monorepo/` and `assets/templates/engine/`:
`pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, root `package.json`, and the `packages/engine`, `packages/ads-adapter`, `packages/config` skeletons. Establish `apps/` for games. Verify `pnpm install` + `pnpm turbo run build` succeed on the empty engine before adding games.

### Path B — Scaffold and build one game (the common case)
1. Read `references/01-phaser4.md` for the framework patterns and the mobile-tuned game config.
2. Copy `assets/templates/game/` into `apps/<game-id>/` and fill the placeholders (`__GAME_ID__`, `__APP_ID__`, `__APP_NAME__`).
3. Build the game using the shared `@studio/engine` (scene flow, object pools, scale manager) and the `@studio/ads-adapter` for all ad calls. Never call an ad SDK directly from game code.
4. Add the web ad path and (if shipping native) the Capacitor project: read `references/02-dual-deploy.md`.
5. Before calling it done, run the per-game checklist in `references/05-production-checklist.md`.

### Path C — Wire CI/CD and store delivery
Read `references/04-ci-cd.md`. Copy from `assets/templates/ci/`: `ci.yml` (affected lint/typecheck/test/build), `release-android.yml`, `release-ios.yml`, and the two `Fastfile` templates. Set up signing secrets, Play service account, and App Store Connect API key as documented. **Validate the whole pipeline on 3–5 games before templating to more.**

---

## 3. Architecture in one screen

```
studio/                            # the monorepo (Path A)
├── pnpm-workspace.yaml            # packages: ["packages/*","apps/*"]
├── turbo.json                     # tasks: build/typecheck/lint/test (affected in CI)
├── tsconfig.base.json             # composite project refs, strict
├── packages/
│   ├── engine/                    # @studio/engine — Boot/Preloader/scene base, pools, scale, audio unlock
│   ├── ads-adapter/               # @studio/ads-adapter — ONE interface, native(AdMob)+web impls, UMP gating
│   └── config/                    # @studio/config — shared eslint/tsconfig/vite presets
└── apps/
    ├── game-001/                  # one Vite app per game (Path B)
    │   ├── vite.config.ts         # base: mode==='native' ? './' : '/'
    │   ├── capacitor.config.ts    # per-game appId/appName (only if shipped native)
    │   ├── src/                   # game scenes; depends on "@studio/engine":"workspace:*"
    │   ├── android/  ios/         # generated by `npx cap add` (only if native)
    │   └── public/_headers        # immutable cache for /assets/*
    └── game-002/ ...
```

The two pieces that carry the most correctness risk — and therefore live in shared packages, written once — are:

- **`@studio/ads-adapter`**: a single `Ads` interface (`init`, `showBanner`, `interstitial`, `rewarded`, etc.) with a native implementation (AdMob via the Capacitor plugin, including the full UMP/ATT consent flow) and a web implementation (H5/portal SDK). Game code calls the interface; it never knows which platform it's on. Template: `assets/templates/engine/ads-adapter.ts` + `consent.ts`.
- **`@studio/engine`**: the boot→preloader→game scene scaffold, object pooling, the mobile-correct Phaser config (devicePixelRatio scaling, safe-area handling, `render.stencil:false`, audio unlock), and the analytics hook. Template: `assets/templates/engine/`.

---

## 4. Ad UX rules baked into every game (policy, not preference)

Wrong ad placement is the fastest path to suspension. The adapter and engine enforce these; keep them when customizing. Full citations in `references/03-monetization.md`.

- **Interstitials:** never on app launch (use App Open ads instead), never on app exit, never back-to-back, never mid-gameplay. Max one per **two** user actions. Pre-load at level start, show at level end. Mute audio + disable input while shown.
- **Rewarded:** explicit opt-in only, with a pre-prompt describing the reward ("Watch a video for 50 coins"). Must be skippable. Only grant on the verified completion/reward event. Never cash rewards. Don't stack two rewarded prompts.
- **Banners:** keep clear of tap targets (no banner under a jump/fire button); bottom-center is safest in portrait. Resize the Phaser canvas on `SizeChanged`.
- **Web parity:** the same logical breaks map to `commercialBreak`/`rewardedBreak` (Poki), `requestAd("midgame"|"rewarded")` (CrazyGames), or `adBreak({type})` (Google H5). Games must stay fully playable with an ad blocker.

---

## 5. The "production-ready" bar

A game is not done when it runs. It is done when it passes the checklist in `references/05-production-checklist.md`: logic unit-tested with Vitest, a Playwright smoke test, 60fps on a low-end Android device, atlases ≤2048², object pooling, OGG+MP3 audio, Firebase events firing after consent, Sentry wired with source maps, privacy policy + Data Safety + Apple privacy manifest complete, UMP consent gating verified, and `prefers-reduced-motion` respected. Treat that checklist as the definition of done for every game.

---

## 6. Reference map (read on demand — do not load all at once)

| File | Read when |
|---|---|
| `references/00-architecture.md` | Setting up the monorepo, choosing tooling, or deciding the web-first/native-selective strategy and the store-saturation risk. |
| `references/01-phaser4.md` | Building game code: version facts, renderer, scenes, scale, input, audio, pooling, the mobile config. |
| `references/02-dual-deploy.md` | Anything touching Capacitor or web hosting: base path, platform detection, sync workflow, safe areas, hosting/cache. |
| `references/03-monetization.md` | Anything touching ads or consent: AdMob API, UMP/ATT, COPPA, policy rules, web portal SDKs. The crown-jewel reference. |
| `references/04-ci-cd.md` | Build/release automation: GitHub Actions affected builds, Fastlane, Play/App Store upload, signing, versioning. |
| `references/05-production-checklist.md` | Testing, performance, asset pipeline, analytics, crash reporting, privacy, i18n, a11y, and the pre-submission checklist. |
| `references/99-sources.md` | To re-verify any claim or pull the primary URL. |

Templates to copy live under `assets/templates/` (`monorepo/`, `engine/`, `game/`, `ci/`). They are real, working starting points — adapt placeholders, keep the guardrails.
