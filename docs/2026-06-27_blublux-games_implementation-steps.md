---
type: steps
project: blublux-games
tags: [games, phaser4, capacitor, migration-orchestration, implementation-steps, dev]
status: READY TO EXECUTE
slug: blublux-games
date: 2026-06-27
companion_plan: 2026-06-27_blublux-games_plan.md
drivers: [2026-06-27_blublux-games_orchestrator-prompt.md, 2026-06-27_blublux-games_workflow.md]
tracker: 2026-06-27_blublux-games_progress.md
---

# BluBlux Games — Step-by-Step Implementation

**Status: READY TO EXECUTE (2026-06-27).** Companion to [[2026-06-27_blublux-games_plan.md]] (the *why*). This is the *how* — ordered, **standalone, independently verifiable** steps S1–S33, each a paste-ready worker prompt + an explicit Verify block. Stack/architecture authority: the **[[phaser4-game-factory]]** skill; for any Phaser 4 API not in its references, pull live v4 docs via Context7 (`resolve-library-id` → `query-docs` for `phaser`) — never Phaser 3 memory.

## How to use this
Run steps **in order, respecting the dependency graph**. Each is self-contained: land it on its own branch, run its **Verify**, commit, then advance. Paste a step's fenced **prompt** into a worker subagent; it must run the Verify block and paste actual output. Nothing destructive or paid ships until P8; everything before is additive and dev-only (test ad ids, RevenueCat sandbox). The **S15 review gate** is mandatory: stop after the Butterfly slice for human review before any reskin/block scaling.

## Decisions baked in (final, 2026-06-27 — from plan §4)
- **Distribution:** Option B — 3 native apps (`sort-collection` with 4 themes, `knotwork`, `beaver-block`) + all 6 to web. Per-skin appIds are web/Option-C only (§4.1).
- **Architecture:** pure model (zero Phaser) → Phaser view → theme config; one mechanic = one engine; **zero copy-paste into `apps/*`** (§4.2).
- **Seams/DI:** `Ads/IAP/Analytics/Leaderboard/Storage/Haptics/Consent/AudioBus/Clock/Rng` are injected interfaces, constructed at each app's composition root; no `new SomeSDK()`, `Date.now()`, `Math.random()` in model/scene; no global singletons in engines (§4.3).
- **IAP:** RevenueCat behind `IAPAdapter` (§4.4). **Leaderboards:** local default, GPGS behind adapter OFF (§4.5). **Beaver grid:** 8×8 (§4.5). **Monetization:** Remote-Config defaults — sort interstitial every 3 + on fail; block on game-over; rewarded opt-in; first-session grace (§4.5).
- **9×9 rename:** **Knotwork** (`com.blublux.knotwork`); trademark verified at S29 (§4.6).
- **Stack (pin again at S1 with `npm info`):** phaser 4.2.0 · @capacitor/core+cli 8.4.1 · @capacitor-community/admob 8.0.0 · turbo 2.10.0 · @revenuecat/purchases-capacitor 13.2.0 · @sentry/capacitor 4.2.0 · vitest 4.1.9; Node 22+, Android API 24+ (§4.7).
- **Drivers:** orchestrator primary + workflow for gate-free segments (§4.8).

## Project rules every prompt must respect (stated once)
- **Model purity:** `engine-sort`/`engine-block` **model** code imports only TS/stdlib — **no `phaser`, no DOM/canvas, no `Date.now()`, no `Math.random()`**. Time/randomness enter only via injected `Clock`/seeded `Rng`. A model must play a full game in a Node test.
- **View thinness:** Phaser scenes render model state; **no rules in scenes**. **Theme = config only**, no logic.
- **DI:** depend on interfaces, never concretions; construct providers at the app composition root; no service-locator/singleton inside engines/models.
- **DRY:** shared logic lives in `packages/*`; a fix happens in exactly one place; a step that adds rules under `apps/*` is wrong.
- **TDD:** model logic is written test-first (failing Vitest → impl → refactor). The step's Verify names the tests that must exist and pass.
- **Determinism:** one seeded `Rng` (mulberry32/xorshift); same seed → same stream.
- **Ads/UMP:** all ad calls go through `@blublux/ads-adapter`; **UMP gates loading** — `initialize()` → `requestConsentInfo()` → `showConsentForm()` if required → check `canRequestAds` → only then load/show. Test ad unit IDs wired to `import.meta.env.DEV`. Ad-UX policy: never launch/exit/back-to-back/mid-gameplay; preload at level start, show at level end; mute + disable input while shown; rewarded opt-in + grant only on the verified completion event; first-session grace.
- **Native build:** `base:'./'` via Vite `--mode native` (or black screen). Portrait-locked 1080×1920, Scale FIT, dPR-aware, safe areas, `render.stencil:false`.
- **a11y:** every color **also** carries a distinct shape/symbol/pattern (colorblind-safe); large tap targets; banners clear of tap targets.
- **Assets:** original vector/programmatic art + CC0/self-made audio only; **no copyrighted/AI-likeness assets**; atlases ≤ 2048².
- **Analytics:** events fire **only post-consent**. **Server-free, offline-first.**
- **Per commit:** `pnpm turbo run typecheck` (tsc `--noEmit`, strict) + `pnpm turbo run lint` (eslint) clean; `pnpm turbo run test` (vitest) green; stage files **by name**; Conventional Commits; **English only**; update docs in the same commit as behavior; **never weaken a rule or a test/solvability tolerance to pass a check — escalate.**

## Dependency graph (quick view)
```
P1 Foundation   S1 → {S2, S3, S4} ;  S3 → {S5, S6, S7, S8}
P2 Sort model   S2 → S9 → {S10, S11}                         # pure, TDD
P5 Block model  S2 → S20 → S21                               # pure, TDD; parallel to P2/P3
P3 Sort slice   {S4,S9} → S12 ; {S4,S6,S7,S8} → S13 ;
                {S5,S6,S7,S10,S11,S12,S13} → S14 → S15(⛔ REVIEW GATE)
P4 Sort reskins S15 → {S16, S17, S18} → S19
P6 Block slice  {S15,S20} → S22 ; {S5,S6,S7,S8,S13,S21,S22} → S23 → S24
P7 Beaver       {S13,S22} → S25 → S26
P8 Polish/store {S19,S24,S26} → {S27, S28, S29} → S30 → S31[GATED] → S32[SIGN-OFF] → S33[DESTRUCTIVE/PAID]
```
Parallelizable sets (disjoint files): `{S2,S3,S4}` · `{S5,S6,S7,S8}` · `{S10,S11}` · `{P2 sort-model ∥ P5 block-model}` · `{S16,S17,S18}` · `{P4 ∥ P6 ∥ P7 after S15}` · `{S27,S28,S29}`.
CARRY-FORWARDS: `Rng`/`Clock` seams (S2 → every model + view) · game-shell (S13 → S14, S23, S25) · `engine-sort` view (S12 → S16/S17/S18 themes) · `engine-block` view (S22 → S25).

---

# Phase 1 — Foundation (P1) — shared core, ships nothing user-facing

### S1 — Scaffold monorepo, Turborepo, `@blublux/config`, CI
**Goal:** the workspace root `~/workspace/blublux-phaser-games` is a git repo where `pnpm install` + `pnpm turbo run build|typecheck|lint|test` all run green on empty packages, and CI runs the same gates.
**Depends on:** none.
**Edits:** repo root (`pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, root `package.json`, `.github/workflows/ci.yml`), `packages/config/**`, empty `packages/{engine,ads-adapter,engine-sort,engine-block}/` skeletons.

```
Create the monorepo at the workspace root `~/workspace/blublux-phaser-games` following the phaser4-game-factory skill, Path A (read .agents/skills/phaser4-game-factory/SKILL.md §3 + references/00-architecture.md). Copy from .agents/skills/phaser4-game-factory/assets/templates/monorepo/ (pnpm-workspace.yaml, turbo.json, tsconfig.base.json, root package.json) and assets/templates/ci/ci.yml. Then:
- Re-pin exact versions with `npm info <pkg> version` and write them into the root: phaser, @capacitor/core, @capacitor/cli, @capacitor-community/admob, turbo, @revenuecat/purchases-capacitor, @sentry/capacitor, vitest, vite, typescript, eslint, playwright. (As of 2026-06-27: phaser 4.2.0, capacitor 8.4.1, admob 8.0.0, turbo 2.10.0, revenuecat 13.2.0, sentry 4.2.0, vitest 4.1.9 — confirm, do not trust this line.)
- Replace the templates' @studio/* scope with @blublux/* everywhere.
- pnpm-workspace.yaml: packages: ["packages/*","apps/*"]. turbo.json MUST use `tasks` (not `pipeline`); define build (dependsOn ["^build"], outputs ["dist/**"]), typecheck, lint, test; enable --affected in CI.
- tsconfig.base.json: composite, declaration, declarationMap, strict, moduleResolution "bundler".
- packages/config: @blublux/config exporting shared eslint flat-config, a base tsconfig, and a vite preset (incl. base: mode==='native' ? './' : '/').
- Create empty placeholder packages packages/{engine,ads-adapter,engine-sort,engine-block}, each with package.json (name @blublux/<x>, "build":"tsc -b", "test":"vitest run"), tsconfig referencing the base, src/index.ts exporting nothing yet, and a trivial vitest test asserting true.
- .github/workflows/ci.yml: pnpm install, then turbo run typecheck lint test build (affected vs origin/main).
- git init; first commit on branch blublux-games/main. Do NOT add any game logic, Phaser, or Capacitor yet. English only. Conventional Commits ("chore: scaffold monorepo + turborepo + ci").
```
**Verify:** `pnpm install` succeeds; `pnpm turbo run typecheck lint test build` exit 0 (all packages); `grep -R "pipeline" turbo.json` empty; `grep -R "@studio/" packages` empty; `node -e "require('phaser/package.json').version"` prints 4.2.x; diff is scaffold-only.

---

### S2 — `Rng` + `Clock` seams (pure, TDD, determinism)
**Goal:** `@blublux/engine` exports a seeded `Rng` (mulberry32) and a `Clock`, both pure interfaces + default impls, deterministic and Phaser-free; the single entry point for randomness/time across all models.
**Depends on:** S1.
**Edits:** `packages/engine/src/seams/{rng.ts,clock.ts,index.ts}`, `packages/engine/src/seams/*.test.ts`.

```
In @blublux/engine, implement the Rng and Clock seams TEST-FIRST. Write packages/engine/src/seams/rng.test.ts FIRST (red): assert (a) two Rng seeded with the same seed yield identical streams of next() in [0,1); (b) different seeds diverge; (c) fork()/clone() reproduces a substream; (d) a uniformity smoke (mean of 1e5 draws ≈ 0.5 ± 0.01); (e) an intRange(min,max) is uniform and inclusive-exclusive as documented. Then implement rng.ts: createRng(seed:number): Rng using mulberry32 (or xorshift) with next(), intRange(), pick(arr), shuffle(arr) (Fisher–Yates using next), fork(). Implement clock.ts: Clock { now():number } + a SystemClock and a FakeClock(t) for tests. Export from seams/index.ts. Rules: stdlib only; NO Math.random, NO Date.now inside rng/clock logic except SystemClock.now which is the ONE sanctioned Date.now() site (documented). Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. determinism + uniformity; `git grep -nE "Math\.random|Date\.now" -- packages/engine/src/seams` returns only the single documented `SystemClock.now`; `pnpm --filter @blublux/engine typecheck` clean.

---

### S3 — Core interfaces / seams + fakes (Ads, IAP, Analytics, Leaderboard, Storage, Haptics, Consent, AudioBus)
**Goal:** every external-dependency interface from plan §5 exists in `@blublux/engine` as a minimal segregated TypeScript interface plus an in-memory **fake**, with the fakes unit-tested. No concrete SDK is imported anywhere in this step.
**Depends on:** S1.
**Edits:** `packages/engine/src/ports/*.ts` (interfaces), `packages/engine/src/fakes/*.ts`, `packages/engine/src/ports/*.test.ts`.

```
In @blublux/engine, define the dependency PORTS (interfaces) and a fake per port, TEST-FIRST where the fake has behavior. Create packages/engine/src/ports/: Ads (init(consent), showBanner(), hideBanner(), interstitial():Promise<void>, rewarded(type:string):Promise<{rewarded:boolean}>), IAP (getProducts(), purchase(id), restore(), isRemoveAds():Promise<boolean>), Analytics (setConsent(bool), log(event:string, params?)), Leaderboard (submit(board,score), best(board)), Storage (getItem/setItem/remove — async KV), Haptics (impact(kind)), ConsentManager (request():Promise<{canRequestAds:boolean}>), AudioBus (play/stop/setMuted). Then packages/engine/src/fakes/: FakeAds (records calls; rewarded resolves {rewarded:true}; throws if interstitial()/rewarded() called before init with consent — encodes the UMP rule), FakeIAP, FakeAnalytics (drops events until setConsent(true); records after — assert in test), FakeLeaderboard (in-memory max), MemoryStorage, NoopHaptics, FakeConsent, FakeAudioBus. Tests: FakeAnalytics buffers nothing pre-consent and records post-consent; FakeAds.interstitial() rejects before init(consent). Rules: interfaces only — NO @capacitor*, NO firebase, NO revenuecat imports in this package's ports/fakes. Keep interfaces minimal (ISP). Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. the consent-gating fake tests; `git grep -nE "@capacitor|firebase|revenuecat|admob" -- packages/engine/src/ports packages/engine/src/fakes` returns nothing; `typecheck` clean.

---

### S4 — `@blublux/engine` Phaser scaffold (boot→preload→scene, pools, scale, audio unlock, mobile config)
**Goal:** the shared Phaser 4 scaffold builds and exposes a mobile-correct game config + scene base classes + an object pool + a scale/safe-area helper, with a headless test that the config object is valid (no canvas).
**Depends on:** S1. *(Independent of S2/S3 files — parallel-eligible.)*
**Edits:** `packages/engine/src/view/{game-config.ts,scenes.ts,pool.ts,scale.ts,audio.ts,index.ts}`, `packages/engine/src/view/game-config.test.ts`.

```
In @blublux/engine, add the Phaser 4 view scaffold by adapting .agents/skills/phaser4-game-factory/assets/templates/engine/ (game-config.ts, scenes.ts) — read references/01-phaser4.md first; for any v4 API not covered, pull live docs via Context7 (resolve-library-id phaser → query-docs). Implement: game-config.ts (a factory makeGameConfig(opts) returning a Phaser.Types.Core.GameConfig — portrait 1080x1920, Scale.FIT, autoCenter, devicePixelRatio-aware, render.stencil:false, audio unlock on first input, transparent:false); scenes.ts (BootScene, PreloaderScene, and an abstract BaseGameScene with lifecycle hooks but NO game rules); pool.ts (a generic ObjectPool<T> with acquire/release); scale.ts (safe-area inset helper honoring notches/gesture insets); audio.ts (AudioBus impl over Phaser sound implementing the §S3 AudioBus port, global mute, OGG+MP3). Write game-config.test.ts that imports makeGameConfig and asserts the returned config has scale.mode===FIT, the portrait dims, render.stencil===false — WITHOUT constructing a Phaser.Game (no canvas in Node). Rules: view layer only; no game rules here; depends on @blublux/engine ports for AudioBus. Keep Phaser imports to this view/ folder only. Run vitest + build and paste output.
```
**Verify:** `pnpm --filter @blublux/engine build` + `test` green; `game-config.test.ts` asserts FIT + 1080×1920 + stencil:false without a canvas; `git grep -nl "from 'phaser'" packages/engine/src` shows imports only under `view/`; typecheck clean.

---

### S5 — `@blublux/ads-adapter` (Ads iface + AdMob/UMP native + web H5/portal + test ids)
**Goal:** a single `Ads` implementation package with a native AdMob impl (full UMP flow) and a web impl, both satisfying the §S3 `Ads` port, wired to Google **test** ad unit ids on `import.meta.env.DEV`, with unit tests proving the UMP load-gating order.
**Depends on:** S3.
**Edits:** `packages/ads-adapter/src/{native.ts,web.ts,consent.ts,index.ts}`, `packages/ads-adapter/src/*.test.ts`.

```
Implement @blublux/ads-adapter per .agents/skills/phaser4-game-factory/references/03-monetization.md (read it — the crown-jewel reference) by adapting assets/templates/engine/ads-adapter.ts + consent.ts. Provide createAds(platform): native impl using @capacitor-community/admob (Banner/Interstitial/Rewarded + UMP via the plugin's consent APIs) and a web impl (H5 Ad Placement / portal SDK shape; stub the network calls behind a provider). Both implement the @blublux/engine Ads port. consent.ts enforces the INVARIANT order: initialize() → requestConsentInfo() → showConsentForm() if required → read canRequestAds → ONLY THEN allow load/show; calling interstitial()/rewarded() before canRequestAds throws. Ad-unit ids: a getter that returns Google TEST ids when import.meta.env.DEV, real-id placeholders otherwise (never hardcode live ids). Ad-UX policy helpers: a guard that blocks back-to-back interstitials, enforces first-session grace, and exposes preload()/show-at-level-end. Unit-test with a fake AdMob/UMP provider injected (DI — do not call the real SDK in tests): assert (a) load/show throws before canRequestAds; (b) after the full consent flow with canRequestAds=true, interstitial loads then shows; (c) DEV returns test ids; (d) two interstitials back-to-back are blocked. Rules: game code NEVER calls a concrete SDK — only this adapter; do not bypass UMP gating. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/ads-adapter test` green incl. (a)–(d); a test asserts `interstitial()`/`rewarded()` reject when `canRequestAds===false`; `grep -RnE "ca-app-pub-[0-9]" packages/ads-adapter/src` finds only test ids or env-gated placeholders; typecheck + build clean.

---

### S6 — `IAPAdapter` (RevenueCat) behind the IAP port
**Goal:** a RevenueCat-backed `IAP` implementation (`getProducts/purchase/restore/isRemoveAds`) satisfying the §S3 port, fakeable, with Remove-Ads entitlement logic unit-tested against a fake RevenueCat client.
**Depends on:** S3.
**Edits:** `packages/engine/src/adapters/iap-revenuecat.ts`, `packages/engine/src/adapters/iap-revenuecat.test.ts`.

```
Implement a RevenueCat IAP adapter satisfying the @blublux/engine IAP port using @revenuecat/purchases-capacitor (DECIDED provider). createRevenueCatIAP(client) takes the RC client by DEPENDENCY INJECTION (so tests pass a fake). Map: getProducts() → offerings; purchase(id) → purchasePackage; restore() → restorePurchases; isRemoveAds() → true iff the "remove_ads" entitlement is active. Remove-Ads semantics: kills interstitials, rewarded stays available. Unit-test with a fake RC client: purchase activates remove_ads → isRemoveAds() true; restore re-activates; products list maps correctly. Rules: depend on the IAP port; no global singleton; the concrete @revenuecat import lives ONLY in this file. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. Remove-Ads + restore; `git grep -nl "@revenuecat" packages/engine/src` shows only `adapters/iap-revenuecat.ts`; typecheck clean.

---

### S7 — `Analytics` (Firebase GA4) + Remote Config + Sentry (post-consent)
**Goal:** a Firebase GA4 `Analytics` impl that **drops events until consent**, a Remote-Config reader with typed defaults, and Sentry wiring — all behind ports, all injectable/fakeable.
**Depends on:** S3.
**Edits:** `packages/engine/src/adapters/{analytics-firebase.ts,remote-config.ts,sentry.ts}`, `packages/engine/src/adapters/analytics-firebase.test.ts`, `packages/engine/src/adapters/remote-config.test.ts`.

```
Implement three adapters in @blublux/engine, injected (DI), fakeable. analytics-firebase.ts: an Analytics port impl over Firebase GA4 — setConsent(false) drops all log() calls; setConsent(true) flushes/forwards subsequent events; expose the brief §9 event names as a typed helper (level_start/level_complete/level_fail/round_start/game_over/hint_used/undo_used/addtube_used/revive_used/daily_claimed/streak_day/ad_*; iap_*; remove_ads_active; theme_unlocked; settings_changed). remote-config.ts: getNumber/getBool(key, default) with the brief's Remote-Config keys (interstitial cadence=3, min-seconds-between, free hint/undo quotas, coin rewards/costs) as typed DEFAULTS so the app works offline before a fetch. sentry.ts: initSentry(dsn) wiring @sentry/capacitor (source maps in CI later). Test analytics-firebase with a fake transport: pre-consent log() forwards nothing; post-consent forwards; event params typed. Test remote-config returns defaults when no remote value. Rules: events ONLY post-consent; concrete firebase/sentry imports confined to these files. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. pre/post-consent forwarding + RC defaults; a test asserts zero forwarded events before `setConsent(true)`; `git grep -nl "firebase\|@sentry" packages/engine/src` shows only these three files; typecheck clean.

---

### S8 — `StorageAdapter` (Preferences + IndexedDB) + `LeaderboardAdapter` (local default, GPGS off)
**Goal:** a Capacitor-Preferences KV `Storage` impl + an IndexedDB blob store, and a local-only `Leaderboard` impl with a GPGS provider seam left OFF — both behind ports, fakeable, with the persistence round-trip tested.
**Depends on:** S3.
**Edits:** `packages/engine/src/adapters/{storage-capacitor.ts,leaderboard-local.ts}`, `packages/engine/src/adapters/*.test.ts`.

```
Implement in @blublux/engine, injected/fakeable. storage-capacitor.ts: a Storage port impl using @capacitor/preferences for KV (settings, coins, progress, daily, streak) + a thin IndexedDB helper for larger blobs (level-pack caches); JSON-safe get/set/remove. leaderboard-local.ts: a Leaderboard port impl persisting best-score per board via Storage (local default); accept an optional GpgsProvider by DI that is UNSET by default (off) — submit()/best() use local unless a provider is injected. Test with MemoryStorage (from S3 fakes): coins/progress round-trip; best-score monotonic (submit lower than best does not lower it). Rules: server-free; concrete @capacitor/preferences import confined to storage-capacitor.ts; GPGS is opt-in only. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. KV round-trip + monotonic best; `leaderboard-local` works with no GPGS provider injected; `git grep -nl "@capacitor/preferences" packages/engine/src` shows only `storage-capacitor.ts`; typecheck + build of the whole engine package clean.

---

# Phase 2 — `engine-sort` model (P2) — pure, TDD, headless

### S9 — Sort core model (legality, win, stuck, undo)
**Goal:** `@blublux/engine-sort` model implements `legalMoves/applyMove/isWon/isStuck/undo` over `SortState`, pure and Phaser-free, with the move/win/stuck/undo rules TDD'd headless.
**Depends on:** S2.
**Edits:** `packages/engine-sort/src/model/{types.ts,rules.ts,history.ts,index.ts}`, `packages/engine-sort/src/model/*.test.ts`.

```
Implement the engine-sort pure model TEST-FIRST (red→green). Write rules.test.ts FIRST asserting brief §5.2: a move is legal iff source non-empty AND (dest empty OR (dest.top===runColor AND dest has a free slot)); applyMove moves as many of the source's top contiguous same-color run as fit; isWon iff every container is empty or holds K of one color; isStuck iff no legal move and not won. Write history.test.ts: full undo history, one step per undo, restores exact prior state. Then implement types.ts (Color=number; Container=Color[] bottom→top length≤K; SortState{containers, capacity:K, colors:C}; Move{from,to,count}), rules.ts (legalMoves(s):Move[], applyMove(s,m):SortState (immutable, returns new state), isWon(s), isStuck(s)), history.ts (an undo stack: push on applyMove, undo():SortState). Rules: PURE — no phaser, no Date.now/Math.random (none needed here), immutable state transitions. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-sort test` green incl. legality/win/stuck/undo; `git grep -nE "phaser|Math\.random|Date\.now" -- packages/engine-sort/src/model` empty; `node -e "require('@blublux/engine-sort')"` imports without a DOM; typecheck clean.

---

### S10 — Sort generator (reverse-moves + solver-validated; tiers; 300-level + infinite + daily)
**Goal:** `generate(tier, seed)` produces **guaranteed-solvable** levels via reverse-moves from the solved state, validated by the solver, across difficulty tiers; a ≥300-level finite progression + an infinite procedural mode (seeded by index) + a daily challenge seeded by `YYYYMMDD`.
**Depends on:** S9. *(Uses the S11 solver for the validation gate; if S11 not yet merged, validate via the reverse-move invariant and add the solver cross-check when S11 lands — CARRY-FORWARD.)*
**Edits:** `packages/engine-sort/src/gen/{generate.ts,tiers.ts,daily.ts,index.ts}`, `packages/engine-sort/src/gen/*.test.ts`.

```
Implement the engine-sort generator TEST-FIRST. Write generate.test.ts FIRST asserting: across ≥1000 seeds PER TIER, every generated level is solvable (validate each with engine-sort solve() once S11 exists; until then assert the reverse-move construction invariant — the scramble is a sequence of legal inverse pours from a solved state, so a solution always exists by construction). Then implement generate.ts: build the solved state (C colors × K each), then apply N random legal INVERSE moves using the injected Rng(seed) to scramble into a start state with `empties` spare containers; return SortState. tiers.ts: a monotonic Tutorial→Easy→Medium→Hard→Expert curve via (C, container count, empties, K, min-scramble-depth). daily.ts: dailySeed(yyyymmdd:number) and a level(index) for the infinite mode (seed = index). Provide a 300+ entry finite progression as level(0..299) over the tier curve. Rules: PURE; randomness ONLY via injected Rng; determinism — generate(tier, seed) is a pure function of its args. Run vitest (use a reduced seed count locally if 1000×tiers is slow, but the CI gate uses the full count). Paste output.
```
**Verify:** `pnpm --filter @blublux/engine-sort test` green; the solvability gate runs **≥1,000 seeds/tier at 100% solvable** (CI count); `generate(tier, seed)` identical across two calls (determinism); `dailySeed` stable for a fixed date; purity grep empty.

---

### S11 — Sort solver (BFS/DFS + memo + heuristic) powering Hint
**Goal:** a deterministic solver returning a short solution or "unsolvable", fast enough on shipped sizes, exposed as `solve(s)` and a `hint(s)` (next move on a live solution path).
**Depends on:** S9.
**Edits:** `packages/engine-sort/src/solver/{solve.ts,hint.ts,index.ts}`, `packages/engine-sort/src/solver/*.test.ts`.

```
Implement the engine-sort solver TEST-FIRST. Write solve.test.ts FIRST: a hand-built solvable 3-color/2-empty state returns a valid solution (each move legal, end state isWon); a deliberately unsolvable state returns null/"unsolvable"; determinism (same state → same solution). Then implement solve.ts: BFS/DFS over states with a visited-set keyed by a canonical container-multiset hash (order-independent) + a simple admissible heuristic (e.g. count of out-of-place segments); cap explored nodes and return the first solution found; for the hardest shipped tier, ensure it returns within a budget (precompute/iterative-deepening as needed). hint.ts: hint(s):Move = first move of solve(s), or null. Add a perf test asserting solve() on an Expert-tier state completes under a fixed node/time budget. Rules: PURE; deterministic; no Math.random/Date.now. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-sort test` green incl. solvable/unsolvable/determinism + the perf-budget test; `hint(s)` returns a legal first move that the model accepts; purity grep empty; typecheck clean.

---

# Phase 5 — `engine-block` model (P5) — pure, TDD; parallel to P2/P3

### S20 — Block core model (box9 row/col/3×3-box + lines row/col; scoring/combo; game-over)
**Goal:** `@blublux/engine-block` model implements placement legality, simultaneous clear of full rows/cols/(3×3 boxes in `box9`), scoring with combo multiplier, and game-over detection — config-selected mode, pure and Phaser-free, TDD'd headless.
**Depends on:** S2.
**Edits:** `packages/engine-block/src/model/{types.ts,grid.ts,clear.ts,score.ts,index.ts}`, `packages/engine-block/src/model/*.test.ts`.

```
Implement the engine-block pure model TEST-FIRST (red→green) per brief §6.1–6.3. Write clear.test.ts FIRST: in box9 (9×9) a completed row, a completed column, AND a completed 3×3 box each clear; simultaneous multi-clears all resolve in one placement; in lines mode (8×8) only rows/cols clear (no box). Write score.test.ts: score += cellsPlaced; score += linesCleared*18*comboMultiplier where a "line" = row|col|box; comboMultiplier rises on consecutive clearing placements and resets on a no-clear placement; multi-line (2+,3+) clears earn the extra bonus. Write gameover.test.ts: game over iff none of the 3 current tray pieces can be placed anywhere. Then implement types.ts (GridMode='box9'|'lines'; GridState{cells:boolean[][], size, mode}; Piece=offset list), grid.ts (canPlace(s,piece,cell), place(s,piece,cell):GridState), clear.ts (clear(s):{state, cleared:{rows,cols,boxes}}), score.ts (scoreFor(placement, cleared, combo)). Rules: PURE; box-clear only when mode==='box9'; scoring numbers read from config (Remote-Config-tunable) with the brief defaults; no Math.random/Date.now. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-block test` green incl. explicit **3×3-box** clear in box9 and its **absence** in lines, simultaneous multi-clear, combo rise/reset, multi-line bonus, game-over; purity grep empty; typecheck clean.

---

### S21 — Block fair-bag piece generator + daily + best-score hook
**Goal:** a weighted "fair bag" producing the tray of 3 pieces with anti-degenerate-streak behavior and an anti-frustration bias (≥1 placeable when feasible, never guaranteed), seeded daily, deterministic.
**Depends on:** S20.
**Edits:** `packages/engine-block/src/gen/{bag.ts,daily.ts,index.ts}`, `packages/engine-block/src/gen/*.test.ts`.

```
Implement the engine-block bag generator TEST-FIRST per brief §6.4. Write bag.test.ts FIRST: nextTrio(state, rng) returns 3 pieces from the defined set (1×1 → tetrominoes/pentominoes + squares/lines); determinism (same state+seed → same trio); no degenerate streak (e.g. not the same piece ×3 beyond a bound over many draws); ANTI-FRUSTRATION — when at least one piece in the weighted set is placeable on the current board, the returned trio contains ≥1 placeable piece (bias, asserted statistically over many boards, NOT a guarantee of infinite play). Write daily.test.ts: dailySeed(yyyymmdd) stable. Then implement bag.ts (weighted sampling via injected Rng; the placeability bias re-rolls within a bounded attempt budget using engine-block canPlace) and daily.ts. Rules: PURE; randomness ONLY via injected Rng; never guarantee infinite play — only reduce cheap deaths. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-block test` green incl. determinism + anti-streak + anti-frustration bias (statistical) + daily stability; purity grep empty; typecheck + build of engine-block clean.

---

# Phase 3 — First sort game E2E: Butterfly in `sort-collection` (P3) — ⛔ REVIEW GATE

### S12 — `engine-sort` Phaser view (theme-swappable)
**Goal:** a Phaser scene renders any `SortState` and animates pour/lift/invalid-shake/solve-celebration + container fill states, driven entirely by injected theme config + model — no rules in the scene.
**Depends on:** S4, S9.
**Edits:** `packages/engine-sort/src/view/{SortScene.ts,anims.ts,theme.ts,index.ts}`, `packages/engine-sort/src/view/SortScene.smoke.test.ts`.

```
Implement the engine-sort Phaser 4 view on the @blublux/engine BaseGameScene. SortScene takes (model API from @blublux/engine-sort, a SortTheme config, and injected ports: Ads/Analytics/AudioBus/Haptics/Rng/Clock) by constructor injection. Interaction: tap source → lift its top run with a highlight → tap dest → applyMove (pour: segments arc/flow source→dest); invalid move → shake + blocked SFX; on isWon → particle+SFX celebration; render container fill states. anims.ts holds tweens/particles parameterized by theme (so a reskin changes look, not code). theme.ts defines the SortTheme interface (palette, atlas keys, per-color SYMBOL/shape for colorblind a11y, sfx keys, copy) — config shape only, no values. Use object pooling for segment sprites. NO game rules in the scene — all legality/win via the model. For any Phaser 4 API uncertainty, query Context7. Add a headless smoke test that constructs the scene class with fakes and asserts it wires the model + theme without throwing (do NOT boot a real Phaser.Game/canvas — test the controller logic by calling its tap handlers against a fake renderer or by extracting the input→model mapping into a testable pure function). Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-sort test` green incl. the view smoke/controller test; `git grep -nE "legalMoves|applyMove|isWon" packages/engine-sort/src/view` shows the scene CALLS the model, never re-implements it; the input→move mapping is unit-tested headless; typecheck + build clean.

---

### S13 — Shared game-shell (scene flow, overlays, coins, daily/streak, settings)
**Goal:** the cross-game shell — Boot/Preload → Menu → Game → overlays (Settings/Pause/Win/Lose/Shop/Daily), the coin economy, daily reward + streak, and the settings panel (sound/music/haptics/**colorblind + per-color symbols**/restore purchases/re-open consent/credits/**reduced-motion**) — all in `@blublux/engine`, driven by injected ports, reusable by every game.
**Depends on:** S4, S6, S7, S8.
**Edits:** `packages/engine/src/shell/{flow.ts,overlays/*.ts,economy.ts,daily.ts,settings.ts,index.ts}`, `packages/engine/src/shell/*.test.ts`.

```
Implement the shared game-shell in @blublux/engine (so all 3 apps reuse it). flow.ts: scene flow Boot/Preload → MainMenu → Game → overlays. overlays/: Settings, Pause, Win, Lose/GameOver, Shop, Daily — generic, theme-styled. economy.ts: a PURE coin economy (earn on completion + rewarded; spend on hints/undo/extra-tube/revive/theme-unlock; balances via the Storage port; reward/cost numbers from the RemoteConfig port with brief defaults) — write economy as a pure module + an adapter to Storage so it is unit-testable. daily.ts: once-per-day reward + visible streak, using the injected Clock (NOT Date.now) and Storage; same-day re-claim is a no-op. settings.ts: persisted toggles incl. colorblindMode (drives the per-color SYMBOL rendering), reduced-motion (respect prefers-reduced-motion), restore purchases (IAP port), re-open consent (ConsentManager port). Fire settings_changed / daily_claimed / streak_day via the Analytics port (post-consent). TEST-FIRST the pure parts: economy earn/spend/insufficient; daily claim-once-per-day across a FakeClock advancing a day; streak increments and resets. Rules: PURE economy/daily logic with injected Clock/Storage — NO Date.now; analytics post-consent. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine test` green incl. economy + daily-once-per-day (FakeClock) + streak; `git grep -nE "Date\.now" packages/engine/src/shell` empty (Clock injected); settings persist via Storage port; typecheck + build clean.

---

### S14 — Butterfly theme + monetization wiring + analytics (sort)
**Goal:** the Butterfly `SortTheme` (palette, butterfly segments, wing-pattern symbols, sfx, copy) plus the sort monetization wiring — interstitial every 3 cleared levels + on fail/restart, rewarded extra-tube/undo/hint/2×-coins, RevenueCat Remove-Ads — all through the adapters with test ids, and the brief §9 analytics events.
**Depends on:** S5, S6, S7, S10, S11, S12, S13.
**Edits:** `apps/sort-collection/src/themes/butterfly/**`, `apps/sort-collection/src/monetization.ts`, `apps/sort-collection/src/composition-root.ts`, `apps/sort-collection/src/**/*.test.ts`.

```
Create apps/sort-collection (copy .agents/skills/phaser4-game-factory/assets/templates/game/ → apps/sort-collection/, read references/02-dual-deploy.md). Replace placeholders: __GAME_ID__=sort-collection, __APP_ID__=com.blublux.sortcollection, __APP_NAME__="Sort Puzzle Collection". Implement:
- src/themes/butterfly/: a SortTheme config (bright garden pastels; butterfly segment art via ORIGINAL programmatic/vector + a generated atlas ≤2048²; per-color WING-PATTERN symbol for colorblind a11y; flutter/resettle anim params; sfx keys; copy incl. hook "Sort the butterflies. Calm your mind.").
- src/composition-root.ts: the DI root — construct concrete adapters (ads-adapter native/web by platform, RevenueCat IAP, Firebase Analytics, Capacitor Storage, local Leaderboard, Haptics, AudioBus, SystemClock, createRng(seed)) and inject into the SortScene + shell. This is the ONLY place concretions are wired.
- src/monetization.ts: interstitial via the ads-adapter every 3 cleared levels AND on fail/restart (cadence from RemoteConfig, default 3), within the §4 ad-UX policy + first-session grace; rewarded(type) for extra-tube/undo/hint/2×-coins, granted only on {rewarded:true}; Remove-Ads (IAP) disables interstitials, keeps rewarded.
- Fire analytics: level_start/level_complete(moves,stars,duration)/level_fail/hint_used/undo_used/addtube_used/ad_*; iap_* — post-consent.
TEST (headless, fakes injected): interstitial fires on the 3rd clear and on fail but NOT before first completion (grace); rewarded grants the tube only on {rewarded:true}; Remove-Ads suppresses interstitials; a 2× reward doubles the coin grant. Rules: NO direct SDK calls outside composition-root; theme is config only; original assets. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/sort-collection test` green incl. cadence-of-3 + grace + rewarded-grant-gating + Remove-Ads suppression; `git grep -nE "@capacitor|firebase|revenuecat|admob" apps/sort-collection/src` shows hits ONLY in `composition-root.ts`; typecheck + lint clean.

---

### S15 — `apps/sort-collection` shell + first signed AAB + web build  ⟵ ⛔ REVIEW GATE
**Goal:** Butterfly is playable end-to-end as `sort-collection` (in-app theme picker showing Butterfly) on **web** and as a **signed AAB**, `base:'./'` on native, passing the production checklist. **This proves the whole vertical; STOP for human review before scaling.**
**Depends on:** S14.
**Edits:** `apps/sort-collection/{vite.config.ts,capacitor.config.ts,src/ThemePicker.ts,src/main.ts,public/_headers,android/**}`.

```
Finish apps/sort-collection as a shippable shell. vite.config.ts: base via mode (native='./', web='/') per references/02-dual-deploy.md. capacitor.config.ts: appId com.blublux.sortcollection, appName "Sort Puzzle Collection", parameterize signing via env (no secrets in source). src/ThemePicker.ts: an in-app picker listing available sort themes (Butterfly only now; S16–S18 add the rest) — Option B's container shell. src/main.ts: boot via the composition root. Add public/_headers (immutable cache for /assets/*). Build web (vite build) and native: vite build --mode native → npx cap sync android → cd android && ./gradlew bundleRelease using a DEBUG/UPLOAD keystore from env (a real Play upload key is a later, human step — this proves the AAB pipeline, not store upload). Run the per-game checklist in .agents/skills/phaser4-game-factory/references/05-production-checklist.md against this build. Rules: base:'./' on native (verify in built index.html); test ad ids in dev; original assets. Report: web build output, the generated .aab path, checklist pass/fail line-by-line.
```
**Verify:** `pnpm --filter @blublux/sort-collection build` (web) succeeds; `vite build --mode native` then `npx cap sync android` clean; `grep -o 'src="\./' apps/sort-collection/dist/index.html` (native build) confirms `base:'./'`; `./gradlew bundleRelease` produces an `.aab` (paste path); Playwright/manual smoke: menu → start Butterfly → make one legal pour, no console errors; checklist items pass. **Then STOP — human review of the reference slice before S16+.**

---

# Phase 4 — Sort reskins ×3 (P4) — themes inside `sort-collection`, parallel, after the gate

### S16 — iColorcoin theme
**Goal:** the iColorcoin `SortTheme` (coin column/piggy slot, stacked-coin segments, coin-emblem symbols, clink-and-stack anim, metallic/jewel palette) added to `sort-collection` and listed in the picker — model untouched.
**Depends on:** S15.
**Edits:** `apps/sort-collection/src/themes/icolorcoin/**`, `apps/sort-collection/src/ThemePicker.ts` (registration line only).

```
Add the iColorcoin SortTheme to apps/sort-collection/src/themes/icolorcoin/ as a CONFIG-ONLY skin over the existing engine-sort view (brief §5.7): metallic/jewel palette; ORIGINAL stacked-coin segment art + atlas ≤2048²; per-color COIN-EMBLEM symbol (a11y); "coins clink & stack" anim params; sfx keys; copy hook "Stack. Sort. Cash in." Register it in ThemePicker.ts (one line). Do NOT touch the engine-sort model or view code. Add a theme-validity test (palette length===colors, every color has a distinct symbol asset, atlas dims ≤2048²). Rules: theme = config only; original assets; a11y symbol per color. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/sort-collection test` green incl. iColorcoin theme-validity; `git diff --name-only` for this step touches only `themes/icolorcoin/**` + the one ThemePicker registration line — **no `packages/engine-sort` changes**; picker shows Butterfly + iColorcoin; typecheck clean.

---

### S17 — Sand theme
**Goal:** the Sand `SortTheme` (test tube/vial, sand-layer segments, grain-texture symbols, pour-and-merge anim, warm desert + neon palette) added and registered — model untouched.
**Depends on:** S15. *(Disjoint from S16/S18 — parallel.)*
**Edits:** `apps/sort-collection/src/themes/sand/**`, `apps/sort-collection/src/ThemePicker.ts` (registration line only).

```
Add the Sand SortTheme to apps/sort-collection/src/themes/sand/ as a config-only skin (brief §5.7): warm desert + neon palette; ORIGINAL sand-layer segment art + atlas ≤2048²; per-color GRAIN-TEXTURE symbol (a11y); "sand pours & merges" anim params; sfx; copy hook "Pour. Sort. Relax." Register in ThemePicker.ts. Do NOT touch engine-sort. Add the theme-validity test (as S16). Rules: theme = config only; original assets; a11y symbol per color. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/sort-collection test` green incl. Sand theme-validity; `git diff --name-only` touches only `themes/sand/**` + one registration line; no `packages/engine-sort` changes; typecheck clean.

---

### S18 — Nuts & Bolts theme + screw interaction nuance
**Goal:** the Nuts & Bolts `SortTheme` (vertical bolt/screw container, nut segments, nut-shape/notch symbols, **unscrew→screw-onto-target** animation, industrial palette, optional per-bolt height limit) added and registered — the model stays the isomorphic sort model; the screw nuance is animation/config, not new rules.
**Depends on:** S15. *(Touches a view anim hook — see Verify for the disjointness rule.)*
**Edits:** `apps/sort-collection/src/themes/nutsbolts/**`, `apps/sort-collection/src/ThemePicker.ts` (registration line only).

```
Add the Nuts & Bolts SortTheme to apps/sort-collection/src/themes/nutsbolts/ (brief §5.7 + the §5.7 note): industrial primaries on metal; ORIGINAL bolt/screw container + nut segment art + atlas ≤2048²; per-color NUT-SHAPE/NOTCH symbol (a11y); the signature animation "unscrew the top nut(s), screw onto the target bolt" expressed via the engine-sort view's THEME-PROVIDED animation strategy (anims.ts from S12 exposes a pour-animation hook the theme overrides) — do NOT fork the scene; an optional per-bolt height limit is passed as a theme/config cap consumed by the existing model capacity (K), not new rules. Register in ThemePicker.ts. Copy hook "Unscrew. Sort. Satisfy." Add theme-validity + a test that the height-limit cap maps onto the model's K without changing rule code. Rules: mechanically isomorphic (bolt=container, nut=segment); theme = config + animation strategy only; original assets. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/sort-collection test` green incl. Nuts&Bolts theme-validity + the K-cap mapping; `git diff --name-only` touches only `themes/nutsbolts/**` + one registration line — **no `packages/engine-sort/src/model` change**; if `view/anims.ts` needed a new hook, that hook was added generically in S12, not here; typecheck clean.

---

### S19 — `sort-collection` meta: 4-theme picker + per-theme progression + shared daily
**Goal:** the in-app picker offers all four themes, each with its own persisted level progression (≥300 + infinite), sharing one daily challenge seeded by date.
**Depends on:** S16, S17, S18.
**Edits:** `apps/sort-collection/src/{ThemePicker.ts,progression.ts}`, `apps/sort-collection/src/*.test.ts`.

```
Finalize apps/sort-collection meta. ThemePicker.ts: present all four themes (Butterfly, iColorcoin, Sand, Nuts&Bolts) with thumbnails + names. progression.ts: per-theme progression state (current level index, stars) persisted via the Storage port under a theme-namespaced key, exposing ≥300 finite levels + infinite mode (level=index) per engine-sort gen; ONE shared daily challenge (engine-sort dailySeed(YYYYMMDD)) identical across themes/players for the day, using the injected Clock. Test (fakes): switching themes preserves each theme's own progress; the daily seed is identical across themes for a fixed date; progress survives a storage round-trip. Rules: server-free; Clock injected; no engine-sort changes. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/sort-collection test` green incl. per-theme isolation + shared-daily determinism + persistence; the four themes are selectable; `git grep -n "Date\.now" apps/sort-collection/src` empty; typecheck + web build clean.

---

# Phase 6 — Block game E2E: Knotwork (box9) (P6) — after the gate

### S22 — `engine-block` Phaser view (drag-snap, clear sweep, combos, game-over)
**Goal:** a Phaser scene renders any block `GridState`, supports drag-with-snap ghost (valid/invalid tint), animates line/box clear flash + particle sweep + combo popups + game-over transition — theme-swappable, no rules in the scene.
**Depends on:** S15 (slice-review learnings), S20.
**Edits:** `packages/engine-block/src/view/{BlockScene.ts,anims.ts,theme.ts,index.ts}`, `packages/engine-block/src/view/*.test.ts`.

```
Implement the engine-block Phaser 4 view on @blublux/engine BaseGameScene, applying any corrections from the S15 slice review. BlockScene takes (engine-block model API, a BlockTheme config, injected ports) by constructor injection. Interaction: drag a tray piece → a snap ghost shows valid (tinted ok) / invalid (tinted no) target cells → drop calls model place(); on clears, flash + particle sweep the cleared rows/cols/boxes, show combo popups, escalate juice on multi-line; on isGameOver → smooth game-over transition. anims.ts parameterized by theme; theme.ts defines BlockTheme (palette, tile art keys, sfx, copy) — config shape only. Object-pool tiles. NO rules in the scene — placement legality/clear/score/game-over via the model. Query Context7 for any Phaser 4 drag/input API. Headless test the input→model mapping (drag target → cell → place) as a pure function with fakes; do NOT boot a canvas. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/engine-block test` green incl. the drag→cell→place mapping + game-over transition trigger; `git grep -nE "canPlace|place\(|clear\(|isGameOver" packages/engine-block/src/view` shows the scene CALLS the model; purity of `model/` still intact; typecheck + build clean.

---

### S23 — Knotwork theme + box9 config + monetization + leaderboard + daily
**Goal:** the Knotwork `BlockTheme` (natural wood/stone, calm) + `box9` 9×9 config, on-game-over interstitial + rewarded revive/2×-score/theme-unlock, local `LeaderboardAdapter` best-score, and the daily seed — wired through adapters with test ids.
**Depends on:** S5, S6, S7, S8, S13, S21, S22.
**Edits:** `apps/knotwork/src/**` (theme, composition-root, monetization), `apps/knotwork/src/**/*.test.ts`.

```
Create apps/knotwork (copy assets/templates/game/ → apps/knotwork/). Placeholders: __GAME_ID__=knotwork, __APP_ID__=com.blublux.knotwork, __APP_NAME__="Knotwork". Implement:
- src/theme/: a BlockTheme — natural wood/stone tiles, calm palette; ORIGINAL programmatic tile art + atlas ≤2048²; sfx; copy hook "Drop. Clear. Repeat." Mode config = box9 (9×9, row/col/3×3-box clear).
- src/composition-root.ts: DI root wiring concrete adapters + the engine-block model(mode:box9) + BlockScene + shell + the LOCAL LeaderboardAdapter (GPGS off).
- src/monetization.ts: interstitial on GAME-OVER (within §4 policy + grace, cadence/min-seconds from RemoteConfig); rewarded(type) for revive/continue (clear-board), 2×-score, theme-unlock — granted only on {rewarded:true}; Remove-Ads disables interstitials.
- Best score persisted via Storage and submitted to the LeaderboardAdapter (local). Daily seeded by date (Clock injected). Fire round_start/game_over(score,lines,duration)/revive_used/ad_*/theme_unlocked — post-consent.
TEST (headless, fakes): interstitial fires on game-over but not before first game-over (grace); revive grants only on {rewarded:true}; best-score monotonic into the leaderboard; box9 model wired (a full row, col, and 3×3 box each clear via the model). Rules: SDKs only in composition-root; theme config only; original assets. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/knotwork test` green incl. game-over interstitial + grace + revive-gating + monotonic leaderboard + box9 clears; `git grep -nE "@capacitor|firebase|revenuecat|admob" apps/knotwork/src` only in `composition-root.ts`; typecheck + lint clean.

---

### S24 — `apps/knotwork` Capacitor app + AAB + web
**Goal:** Knotwork is playable on web and as a signed AAB, `base:'./'` native, leaderboard adapter functional, passing the checklist.
**Depends on:** S23.
**Edits:** `apps/knotwork/{vite.config.ts,capacitor.config.ts,src/main.ts,public/_headers,android/**}`.

```
Finish apps/knotwork as a shippable app (mirror S15 mechanics). vite.config.ts base via mode; capacitor.config.ts appId com.blublux.knotwork, env-parameterized signing; main.ts boots via the composition root. Build web + native (vite build --mode native → npx cap sync android → ./gradlew bundleRelease with env keystore). Run the production checklist. Rules: base:'./' native; test ad ids in dev; original assets. Report web output, .aab path, checklist line-by-line.
```
**Verify:** `pnpm --filter @blublux/knotwork build` (web) ok; native build + `cap sync` clean; `base:'./'` confirmed in native `dist/index.html`; `./gradlew bundleRelease` yields an `.aab` (paste path); smoke: menu → place pieces → clear a line/box → game-over overlay, no console errors; leaderboard best persists; checklist passes.

---

# Phase 7 — Beaver's Block (lines, 8×8) (P7)

### S25 — Beaver theme + lines 8×8 config + monetization + daily
**Goal:** the Beaver's Block `BlockTheme` (beaver/woodland dam, woody blocks) over the same `engine-block` view in `lines` mode at 8×8, with monetization + daily — reusing everything from S22/S23.
**Depends on:** S13, S22.
**Edits:** `apps/beaver-block/src/**` (theme, composition-root, monetization), `apps/beaver-block/src/**/*.test.ts`.

```
Create apps/beaver-block (copy assets/templates/game/). Placeholders: __GAME_ID__=beaver-block, __APP_ID__=com.blublux.beaverblock, __APP_NAME__="Beaver's Block". Implement a BlockTheme (beaver/woodland dam, woody blocks; ORIGINAL art + atlas ≤2048²; copy hook "Build the dam, block by block.") with mode config = lines, size 8×8 (DECIDED default; 10×10 is a one-line config flip). Reuse the engine-block view + shell + adapters via a composition-root (LOCAL leaderboard, GPGS off). monetization.ts mirrors Knotwork (game-over interstitial + grace; rewarded revive/2×/theme-unlock; Remove-Ads). Daily seeded by date (Clock). Fire the block analytics events post-consent. TEST (fakes): lines mode clears rows/cols but NOT boxes at 8×8; interstitial on game-over with grace; revive gating; best-score monotonic. Rules: theme/config only — NO engine-block model/view changes; original assets. Run vitest and paste output.
```
**Verify:** `pnpm --filter @blublux/beaver-block test` green incl. lines-mode (no box clear) at 8×8 + monetization gating; `git diff --name-only` shows **no `packages/engine-block` change** (config/theme only); `git grep -nE "@capacitor|firebase|revenuecat" apps/beaver-block/src` only in `composition-root.ts`; typecheck clean.

---

### S26 — `apps/beaver-block` Capacitor app + AAB + web
**Goal:** Beaver's Block playable on web + signed AAB, `base:'./'` native, checklist passing.
**Depends on:** S25.
**Edits:** `apps/beaver-block/{vite.config.ts,capacitor.config.ts,src/main.ts,public/_headers,android/**}`.

```
Finish apps/beaver-block as a shippable app (mirror S24). base via mode; appId com.blublux.beaverblock; env-parameterized signing; boot via composition root. Build web + native AAB (vite build --mode native → cap sync → gradlew bundleRelease). Run the checklist. Rules: base:'./' native; test ids in dev; original assets. Report web output, .aab path, checklist line-by-line.
```
**Verify:** web + native builds ok; `base:'./'` confirmed; `.aab` produced (paste path); smoke: menu → play → clear lines → game-over, no console errors; checklist passes.

---

# Phase 8 — Polish, QA, CI/CD, store (P8) — destructive/paid/sign-off LAST

### S27 — Playwright smoke per web app
**Goal:** a Playwright smoke test per native-listing web build (sort-collection, knotwork, beaver-block): menu → start → one core action → no crash/console errors.
**Depends on:** S19, S24, S26. *(Disjoint test files — parallel with S28/S29.)*
**Edits:** `apps/*/tests/smoke.spec.ts`, root Playwright config, `ci.yml` (smoke job).

```
Add a Playwright smoke spec per app (sort-collection, knotwork, beaver-block) that serves the web build, loads the menu, starts a game, performs ONE core action (sort: a legal pour; block: place a piece), and asserts no uncaught errors and no console.error. Wire a CI "smoke" job (affected). Rules: web build only; deterministic via a fixed seed; no live network (test ad ids / stubbed portal). Run the specs headless and paste output.
```
**Verify:** `pnpm -r --filter "./apps/*" test:e2e` (or `npx playwright test`) green for all 3 apps; zero console errors asserted; the CI smoke job is defined.

---

### S28 — Performance + reduced-motion pass
**Goal:** confirm 60 fps in each core scene, cold start < 2 s, atlases ≤ 2048², object pooling in hot paths, and `prefers-reduced-motion` honored; flag/fix regressions.
**Depends on:** S19, S24, S26.
**Edits:** perf notes in each app, any pooling/atlas fixes, `packages/engine/src/shell/settings.ts` (reduced-motion guard if missing).

```
Profile each core scene (sort pour scene, block grid scene) for sustained 60 fps on a low-end Android profile (use a throttled Chrome profile as a proxy; real-device check is deferred to S32). Confirm: atlases ≤2048² (assert via an asset-audit script), object pooling on segment/tile sprites (no per-frame allocation in the render loop), cold start <2s (measure time-to-interactive on the web build). Ensure prefers-reduced-motion disables non-essential tweens/particles across the shell + both views. Fix any regression in place. Rules: do not weaken gameplay; pooling not new allocations. Report the fps/cold-start numbers and any fixes.
```
**Verify:** measured ≥60 fps (proxy) in both core scenes with numbers pasted; an atlas-size audit script returns all ≤2048²; reduced-motion verified to drop particle/tween load; no per-frame allocations in the render loop (spot-checked).

---

### S29 — Asset IP audit + trademark verification (incl. Knotwork)
**Goal:** confirm **only original/CC0 assets** ship and that **Knotwork**, **Beaver's Block**, and the four sort theme titles are not live Play/Apple trademarks — before any store readiness.
**Depends on:** S19, S24, S26.
**Edits:** `docs/asset-ip-audit.md`, `docs/trademark-check.md` (findings).

```
Run two audits and record findings in docs/ (relative to the repository root). (1) Asset IP: enumerate every image/atlas/font/audio file across packages + apps; confirm each is original programmatic/vector art or self-made/CC0 audio (no copyrighted or AI-likeness assets); list provenance per asset. Flag anything uncertain. (2) Trademark: check the Google Play store + a basic trademark lookup for live marks named "Knotwork", "Beaver's Block", "Sort Puzzle Collection", "Butterfly Sort", "iColorcoin", "Sand Sort", "Nuts & Bolts" as GAME titles; record collisions. If a name collides, STOP and surface for a rename decision (cheap — it's theme/config, plan §4.6). Rules: no assets ship without provenance; a trademark collision blocks that listing. Report both audits.
```
**Verify:** `asset-ip-audit.md` lists provenance for every shipped asset, zero copyrighted/AI-likeness; `trademark-check.md` records the lookup for all listing names with a clear pass/collision verdict per name; any collision is surfaced (not silently shipped).

---

### S30 — Store readiness (icons/splash/screenshots/copy, privacy, Data Safety, consent, Remote-Config)
**Goal:** per native listing: app icon + splash, screenshots, store copy (the brief hooks), a privacy-policy URL, completed Play **Data Safety**, COPPA general-audience config, UMP/consent verified, and Remote-Config defaults seeded.
**Depends on:** S29.
**Edits:** `apps/*/store/**` (assets + listing copy), `apps/*/src` privacy/consent config, Remote-Config defaults doc.

```
For each native listing (sort-collection, knotwork, beaver-block) prepare store readiness per .agents/skills/phaser4-game-factory/references/05-production-checklist.md: original app icon + splash (programmatic/vector), portrait screenshots from the real build, store title/short/long description using the brief hooks, a privacy-policy URL (hosted), the Play Data Safety form answers (analytics + ads disclosed), COPPA/Families = general-audience with compliant ad config, and verify the UMP consent flow appears on a fresh EU profile. Seed Firebase Remote-Config with the brief defaults (interstitial cadence=3, min-seconds-between, free hint/undo quotas, coin rewards/costs) so live tuning needs no redeploy. Rules: original assets; consent before ad loading; disclose data accurately. Report the readiness checklist per app.
```
**Verify:** each app has icon/splash/screenshots/copy/privacy-URL committed; Data Safety answers drafted per app; a fresh-EU-profile run shows the consent form before any ad loads; Remote-Config defaults documented and matching the in-app fallback defaults.

---

### S31 — CI/CD release pipeline (Fastlane + Play upload, signing)  ⟵ [GATED: secrets/paid infra]
**Goal:** `release-android.yml` + `Fastfile.android` build + sign + upload each AAB to a Play internal track, with signing secrets and a Play service account configured — validated on the 3 native targets. **Requires human-provided secrets; do not invent them.**
**Depends on:** S30.
**Edits:** `.github/workflows/release-android.yml`, `apps/*/fastlane/Fastfile`, signing/versioning config.

```
Wire CI/CD per .agents/skills/phaser4-game-factory/references/04-ci-cd.md (copy assets/templates/ci/release-android.yml + Fastfile.android). For each native app: build --mode native, cap sync, gradlew bundleRelease signed with the UPLOAD KEY from CI secrets (env-parameterized, never in source), Fastlane upload to the Play INTERNAL track; versionCode auto-incremented (read Play API), versionName from package.json; source maps uploaded to Sentry. This step CONFIGURES the pipeline and validates a dry run on the 3 targets — the actual upload requires the human to provide: the upload keystore, Play service-account JSON, Sentry auth token, AdMob app ids, RevenueCat keys. STOP and request these; do not fabricate. Rules: no secrets in source; validate on 3 targets before any wider use. Report the pipeline + which secrets the human must supply.
```
**Verify:** `release-android.yml` + `Fastfile.android` present and lint-clean (`fastlane lint`/`actionlint`); a dry-run (or a real internal-track upload once the human supplies secrets) succeeds for all 3 apps; the exact list of required secrets is surfaced to the human. **Deferred/gated — needs real credentials; do not auto-run the live upload.**

---

### S32 — Device QA on low-end Android + production checklist  ⟵ ⛔ HUMAN SIGN-OFF
**Goal:** validate each app on a real low-end Android device — 60 fps, cold start < 2 s, the live UMP consent flow, a rewarded grant on real completion, Remove-Ads via RevenueCat sandbox, offline play — and complete the full production checklist per app, recording a written go/no-go.
**Depends on:** S31.
**Edits:** `docs/2026-06-27_blublux-games_device-qa.md` (sign-off record).

```
HUMAN-IN-THE-LOOP validation (not a code change). Install each app's signed AAB on a real low-end Android device. Verify per .agents/skills/phaser4-game-factory/references/05-production-checklist.md: sustained 60 fps in the core scene; cold start <2s; the UMP consent form appears and gates ad LOADING; an interstitial shows only at level-end/game-over within policy + first-session grace; a rewarded grants its reward only on real completion; RevenueCat sandbox Remove-Ads disables interstitials; coins/daily/streak/settings work OFFLINE; colorblind symbols render; prefers-reduced-motion honored; Sentry receives a test event with source maps. Record results + a written GO/NO-GO per app in docs/2026-06-27_blublux-games_device-qa.md. Do NOT proceed to S33 without GO. Needs a real device + live-ish services — outside the unattended loop.
```
**Verify:** `device-qa.md` records, per app: fps + cold-start numbers, consent-gates-loading confirmed, rewarded-on-completion confirmed, Remove-Ads confirmed, offline confirmed, a11y confirmed, and an explicit **GO/NO-GO**. **Do not proceed to S33 without a written GO.**

---

### S33 — Web deploy (all 6) + staged native store submission (3 AABs)  ⟵ ⛔ DESTRUCTIVE / PAID
**Goal:** deploy all six games to the web and submit the three native AABs to Play — **staged** (one listing first to build account track record, then the rest), each with its store listing complete. **Human-authorized; irreversible on the store side.**
**Depends on:** S32 (GO).
**Edits:** web host config; Play Console submissions (external).

```
HUMAN-AUTHORIZED release. (1) Web: deploy all six games to the web (sort-collection routes for the 4 sort themes + knotwork + beaver-block) on the chosen host (Cloudflare Pages/Vercel) — free distribution, the saturation hedge. (2) Native: submit the 3 signed AABs to Google Play, STAGED — promote ONE listing (recommend sort-collection) to production first to establish account track record, then the other two after it clears review; never spread across multiple developer accounts (ToS + pattern-matched). Each listing has its complete §S30 store assets + Data Safety + privacy policy. This is IRREVERSIBLE on the store side and is PAID/account-affecting — the human performs/authorizes every submission. Do NOT auto-submit. Report deploy URLs + submission status.
```
**Verify:** all six web builds reachable at their URLs (smoke each); the first native listing submitted to Play review with complete metadata; the remaining two staged behind it; nothing submitted without the S32 GO and explicit human authorization. **This is the only destructive/irreversible step — human-run.**

---

## Notes on "standalone & verifiable"
- **Foundation + pure models ship dark** — packages with no app consuming them yet; their Verify is unit/build, fully runnable in isolation.
- **The S15 review gate** is the cheapest moment to correct the engine/view/adapter/monetization shape before three apps copy it — do not skip it.
- **Reskins are config-only** — each reskin step's Verify asserts `git diff` does not touch the shared engine; that's the DRY guarantee made checkable.
- **Only S33 is destructive/irreversible** (store submission), gated on the S32 written GO; S31 needs human-supplied secrets; until then, rollback is just leaving a step unmerged on its branch.
- If a step's Verify fails, **stop and fix in that step** — never stack the next change on red.
