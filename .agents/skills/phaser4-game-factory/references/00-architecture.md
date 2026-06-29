# 00 — Architecture: Monorepo, Tooling, and the Strategic Risk

Sourced June 2026. Citations as `[n]` map to `99-sources.md`.

## Tooling decision: pnpm workspaces + Turborepo 2.x (not Nx)

For 60+ Vite/TS/Phaser apps plus a shared engine, **pnpm + Turborepo** is the right call. Nx is more powerful (import-graph affected detection, generators, boundary enforcement) but adds conceptual overhead aimed at large enterprise teams. A game studio benefits more from Turborepo's simplicity. [t1][t2]

Choose Nx instead only if you specifically want generator-driven scaffolding (`nx generate @nx/vite:app game-xyz`) and enforced module boundaries across many contributors. [t7]

- Turborepo `--affected` builds only packages changed vs `origin/main`; essential at 60 packages. [t2]
- **Breaking change to remember:** `turbo.json` uses `tasks` (renamed from `pipeline` in Turborepo 2.0). Any pre-2024 tutorial is wrong. [t4]
- Remote cache: Vercel Remote Cache (free tier) via `TURBO_TOKEN`/`TURBO_TEAM`, or self-host on S3.

## Directory layout

```
studio/
├── pnpm-workspace.yaml          # packages: ["packages/*","apps/*"]
├── turbo.json
├── package.json                 # root: devDeps only
├── tsconfig.base.json           # composite, strict, declarationMap
├── packages/
│   ├── engine/        # @studio/engine
│   ├── ads-adapter/   # @studio/ads-adapter
│   └── config/        # @studio/config (eslint/tsconfig/vite presets)
└── apps/
    ├── game-001/      # a Vite app; "@studio/engine":"workspace:*"
    └── ...
```

Shared code is consumed via the pnpm **`workspace:*`** protocol; on publish (if ever) pnpm swaps it for the real version. [p6]

Use **TypeScript project references** for build order and go-to-source navigation. `tsconfig.base.json` sets `composite: true`, `declaration: true`, `declarationMap: true`, `strict: true`, `moduleResolution: "bundler"`. Each game's tsconfig `references` the engine. Build with `tsc --build` / orchestrated by Turbo. `declarationMap` makes IDE "go to definition" jump to engine source, not `.d.ts`. [t8]

`turbo.json` task shape: `build` has `"dependsOn":["^build"]` (build dependencies first), `inputs:["src/**","tsconfig.json"]`, `outputs:["dist/**"]`. This guarantees `@studio/engine` builds before any game that imports it. [t3]

See templates: `assets/templates/monorepo/`.

## Per-game Capacitor config: one project per game

Each native game needs a distinct `appId` (Bundle ID / Application ID, reverse-DNS) and `appName`, so each game owns its `capacitor.config.ts` and its generated `android/` + `ios/` folders inside `apps/<game>/`. [c9] Parameterize signing via `android.buildOptions` / `ios.buildOptions` reading env vars (don't hardcode secrets) — `ios.buildOptions` available since Capacitor 7.1. [c9]

## Versioning across many apps

Use **Changesets** in **independent** mode so only changed games get version bumps. [cs26] Changesets handles JS package versions; native build numbers are handled in CI:
- Android `versionCode`: read current from Play API, increment (Fastlane `google_play_track_version_codes`). [f]
- iOS `CFBundleVersion`: Fastlane `increment_build_number` / read latest from App Store Connect.
- Human version (`versionName` / `CFBundleShortVersionString`): sync from `package.json`.

## ⚠ Strategic risk — read before automating 60 store submissions

Building 60 apps is easy. Getting 60 near-identical apps **accepted and kept** by Apple and Google is not, and is the single largest risk to this whole plan.

**Apple App Review Guidelines [a20]:**
- **4.3(a):** "Don't create multiple Bundle IDs of the same app… consider submitting a single app and provide the variations using in-app purchase."
- **4.3(b):** avoid piling onto saturated categories; spamming "may lead to your removal from the Apple Developer Program."
- **4.2.6:** "Apps created from a commercialized template or app generation service will be rejected unless submitted directly by the provider of the app's content." A shared Phaser engine producing 60 reskins is structurally a template system.

**Google Play [g21][g22][g25]:** Repetitive Content policy bans "uploading many similar apps under one developer account." Google blocked 1.75M+ submissions and banned 80,000+ developer accounts in 2025. White-label guidance requires unique description, icons, graphics, screenshots, and real per-app value. [g23]

**Risk matrix:**

| Scenario | Apple | Google |
|---|---|---|
| 60 reskins, same genre | Very High | Very High |
| 60 genuinely distinct games | Medium (volume draws scrutiny) | Medium |
| One container app per genre, games as IAP/unlock | Low (Apple's explicit recommendation) | Low |
| Web-first, 5–10 premium native apps | Low | Low |

**Recommended architecture (default):**
1. Ship **all 60 to the web** (one Turborepo, Cloudflare/Vercel). Web has no saturation gatekeeper and is where AdMob's absence is irrelevant (use H5/portal ads).
2. Submit only the **strongest 5–10** as native apps, each with a distinct genre/art/mechanic — or bundle a genre's games into **one container app** with in-app selection (this is exactly what Apple 4.3(a) asks for).
3. Stage submissions (3–5 first) to build account track record; bans hit the whole account, not one app.
4. Do **not** spread apps across multiple developer accounts to dodge detection — both platforms pattern-match this and it violates ToS.

Surface this to the user explicitly. The Cloudflare Pages 5-project default limit (see `02-dual-deploy.md`) happens to align with the safe native-submission ceiling.
