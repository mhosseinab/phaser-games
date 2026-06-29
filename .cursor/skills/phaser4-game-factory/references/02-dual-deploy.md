# 02 — Dual Deploy: Web + Capacitor Native

Sourced June 2026. Citations `[n]` → `99-sources.md`. Verify versions with `npm info @capacitor/core version`.

## Capacitor 8 (current major)

`@capacitor/core`, `/cli`, `/ios`, `/android` at **8.4.x**. Requirements: **Node 22+, Xcode 26, Android Studio 2025.2.1, Android API 24+ (Android 7), iOS 15+.** iOS default dependency manager is now **Swift Package Manager** (CocoaPods via `--packagemanager CocoaPods`). [cap-env][cap-8]

## How the wrap works

`webDir` points at the compiled web output — `dist` for Vite. `npx cap sync` copies `dist/` into `ios/App/App/public/` and `android/app/src/main/assets/public/` and updates native deps; `npx cap copy` copies web assets only. **Always `vite build` before `cap sync`** or you ship stale assets. [cap-config][cap-workflow]

Initial setup (per game):
```bash
npm i @capacitor/core @capacitor/ios @capacitor/android
npm i -D @capacitor/cli
npx cap init
npm run build:native            # vite build --mode native  (base './')
npx cap add ios
npx cap add android
npx cap sync
```
Iterate: `npm run build:native && npx cap sync && npx cap run ios|android`. Open IDEs with `npx cap open ios|android`. [cap-getting-started][cap-workflow]

**Live reload (dev only):** add `server:{ url:'http://<LAN-IP>:5173', cleartext:true }`, `npx cap copy`, run. **Remove `server.url` and `cleartext` before committing/release.** [cap-livereload]

## One codebase, two targets

Platform detection from `@capacitor/core`:
```ts
import { Capacitor } from '@capacitor/core';
Capacitor.getPlatform();        // 'web' | 'ios' | 'android'
Capacitor.isNativePlatform();   // boolean
```
Game code should not branch on this for ads — that's the adapter's job (`03-monetization.md`). Use it only at the composition root to pick the ad implementation. [cap-utils]

**Base path — the critical gotcha.** Web hosting may need `base:'/'` (or `/subpath/`); Capacitor needs `base:'./'`. Toggle by Vite mode:
```ts
// vite.config.ts
export default defineConfig(({ mode }) => ({
  base: mode === 'native' ? './' : '/',
  build: { outDir: 'dist', rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
}));
```
```bash
npm run build          # web,    base '/'
vite build --mode native   # native, base './'
```
[vite-build]

Env vars: `import.meta.env.VITE_*` (define in `.env.production` / `.env.native`). `import.meta.env.BASE_URL` must be written literally (statically replaced). [vite-build]

## Native specifics

- **Icons/splash:** `@capacitor/assets`; source `icon-only/foreground/background.png` (≥1024²) + `splash[-dark].png` (≥2732²); `npx capacitor-assets generate`. Android 12+ uses the masked-icon splash. [cap-assets]
- **Pinch-zoom:** `zoomEnabled:false` (default since Cap 6) + viewport `maximum-scale=1, user-scalable=no`. [cap-config]
- **Safe areas:** iOS `env(safe-area-inset-*)` works natively; Android via SystemBars `insetsHandling:'css'`. Fullscreen games: `body,canvas{position:fixed;top:0;left:0;width:100%;height:100%}`; hide bars with SystemBars `hidden:true`. [cap-systembars]
- **Orientation/status bar:** `@capacitor/screen-orientation` `lock({orientation:'landscape'})`; `@capacitor/status-bar` `hide()`. [cap-statusbar]
- **Android back button:** `@capacitor/app` `addListener('backButton', …)` — **adding a listener disables default behavior**, so handle navigation/`exitApp()` yourself; or `disableBackButtonHandler:true`. [cap-app]
- **iPadOS 26:** add `UIDesignRequiresCompatibility = YES` to `Info.plist` to stop window controls overlapping. [cap-ios]
- **Android config:** `minWebViewVersion:60`, `webContentsDebuggingEnabled:false` (prod), `allowMixedContent:false` (prod). [cap-config]

## Gotchas
- **Not `file://`.** iOS serves `capacitor://localhost`, Android `https://localhost`; normal CORS/fetch apply. Don't change `androidScheme` from `https` (WebView 117+ routing breaks). `Capacitor.convertFileSrc()` only for native filesystem paths. [cap-utils][cap-config]
- **Audio autoplay blocked** without a gesture (WebView policy). Resume on first `pointerdown` / rely on Phaser's `sound.unlock()`. [cap-livereload]
- **Memory:** unload textures/audio per scene; keep total texture memory bounded (≈150MB on mid-range Android, device-dependent).
- **`server.url` must never ship.** [cap-livereload]

## Web hosting

- **Cloudflare Pages:** build `npm run build`, output `dist`. Auto-SPA if no top-level `404.html`. Long-cache hashed assets via `public/_headers`:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
  ⚠ **Hard limit: 5 Pages projects per repository** [cf-monorepo] — request an increase, use `wrangler pages deploy` (Direct Upload) in CI, or serve all games path-based under one project (`studio.games/game-001/`). This constraint reinforces the web-first/native-selective strategy in `00-architecture.md`.
- **Netlify:** `public/_redirects` → `/* /index.html 200`; output `dist`. [nf-redirects]
- **Vercel:** zero-config for Vite; no documented hard per-repo project cap (verify your plan).

Per-game template files: `assets/templates/game/` (`vite.config.ts`, `capacitor.config.ts`, `_headers`, scripts).
