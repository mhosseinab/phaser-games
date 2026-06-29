---
type: plan
project: blublux-games
tags: [games, phaser4, capacitor, migration-orchestration, monorepo, plan, dev, entrepreneur]
status: READY TO EXECUTE
slug: blublux-games
date: 2026-06-27
companions: [2026-06-27_blublux-games_implementation-steps.md, 2026-06-27_blublux-games_orchestrator-prompt.md, 2026-06-27_blublux-games_workflow.md, 2026-06-27_blublux-games_progress.md]
skills: ["[[phaser4-game-factory]]", "[[migration-orchestration]]"]
---

# BluBlux Games — Orchestration Plan (the *why*)

**Status: READY TO EXECUTE (2026-06-27).** Build six puzzle games from **one [[Phaser 4]] + [[Capacitor]] monorepo** over **two reusable pure-model engines** (`engine-sort`, `engine-block`), each game a thin theme/config skin, dual-deployed to web and native AAB — sequenced as **33 standalone, independently verifiable steps**. **The single load-bearing boundary: this is a greenfield build of a SHARED-CORE game factory; players never see the core, the mechanic is written once per engine, and the same code dual-deploys to web — so distribution is packaged as Option B (3 native listings, not 6).**

> Authority for the stack, monorepo, ad+consent adapter, CI/CD, store policy, and the per-game production checklist: the **[[phaser4-game-factory]]** skill (`~/Documents/Claude/Skills/phaser4-game-factory`). The *how* (steps S1–S33) lives in [[2026-06-27_blublux-games_implementation-steps]]; the *drivers* in [[2026-06-27_blublux-games_orchestrator-prompt]] (primary) and [[2026-06-27_blublux-games_workflow]] (gate-free segments); durable state in [[2026-06-27_blublux-games_progress]]. Format precedent: the [[2026-06-27_casino-games_plan|casino-games]] kit.

---

## 1. Why, and the honest scope

**End state:** a runnable Turborepo with `packages/{config,engine,ads-adapter,engine-sort,engine-block}` and `apps/{sort-collection,knotwork,beaver-block}`, where every game rule lives in a Phaser-free, headless-tested pure-TS model; every external dependency (ads, IAP, analytics, leaderboard, storage, **time, randomness**) is reached through an injected seam; and a root build produces **three signed AABs plus six deployable web builds**. The six games collapse into two mechanics: four **sort** skins (Butterfly, iColorcoin, Sand, Nuts & Bolts) over `engine-sort`, two **block** games (Knotwork = 9×9 box-clear, Beaver's Block = 8×8 line-clear) over `engine-block`.

**What does NOT change / is NOT in scope (say it plainly):**
- **No new mechanic per game.** One mechanic = one engine. Zero copy-paste of game logic into `apps/*`. A bug is fixed in exactly one place. If a step adds rules to an `apps/*` folder, the decomposition is wrong.
- **No server.** Server-free, offline-first. Persistence is Capacitor Preferences (KV) + IndexedDB (blobs). Platform services (AdMob, RevenueCat, Firebase, GPGS) are the only remote calls, all behind adapters.
- **No iOS build now.** Android/AAB primary; web parity mandatory. The stack supports iOS and we do **not** architect against it, but no iOS app is built or submitted in v1.
- **No 6 native listings.** Option B is decided (§4.1): the four sort skins ship as **in-app selectable themes inside one `sort-collection` app**. The per-skin appIds in the brief (`com.blublux.butterflysort`, …) are reserved for web identity / a future Option C — they are **not** separate native listings now.
- **No real ad/IAP revenue validation in the loop.** All development uses Google **test** ad unit IDs and RevenueCat sandbox. Live monetization is verified only at the device-QA sign-off (S32), never in an unattended step.

**Why it's lower-risk than it sounds:** the architecture, ad+consent adapter, CI/CD, and per-game checklist are already specified by the [[phaser4-game-factory]] skill, and the mechanics are simple and well-understood. The genuinely new work is **implementation discipline** — model purity, seam/DI hygiene, generator solvability, TDD — not research or novel design. The real risk concentrates in three places: **(1) store saturation** (§0.1 / §4.1 — a business risk, mitigated by Option B), **(2) sort-level solvability** (a generator that ships an unsolvable level is a 1-star magnet — gated at ≥1,000 seeds/tier, 100% solvable), and **(3) UMP consent gating** (showing an ad before `canRequestAds` suspends the AdMob account — enforced by the shared adapter, never bypassed).

## 2. Current state (verified against the workspace 2026-06-27)

> Greenfield for the games monorepo. Grounded by `ls`/`Read`/`npm info` this session, not memory.

| Piece | Location (`file:line` / path) | Status today |
|---|---|---|
| Games monorepo `blublux-games/` | `Projects/blublux-games/` | **Does not exist** except `docs/` (this kit). S1 creates it. |
| Authority skill | `Skills/phaser4-game-factory/SKILL.md` + `references/00..05` + `assets/templates/{monorepo,engine,game,ci}` | Present, read this session. Templates use `@studio/*` scope + `__GAME_ID__`/`__APP_ID__`/`__APP_NAME__` placeholders to replace. |
| Orchestration skill | `Skills/migration-orchestration/` | Present; templates drove this kit. |
| `BluBlux` (web lead-gen site) | `Projects/BluBlux/` | **Unrelated** — a Cloudflare/Vite local-services site (dentists/salons/home-services). Do **not** put game code here. |
| Format precedent | `Projects/casino-games/docs/2026-06-27_casino-games_*` | Same skill, same author, today. This kit mirrors its conventions. |
| Market research that seeded this | `OUTPUTS/2026-06-27_android-ad-games_top100*.xlsx`, `OUTPUTS/2026-06-27-20-39_1001spiele_games_with_complexity_and_descriptions.csv` | Present; informs theme/monetization choices, not consumed by the build. |

**Invariants the build must preserve (stated once, enforced everywhere):**
- **Model purity:** `engine-sort`/`engine-block` model code imports **zero Phaser**, touches no DOM/canvas, and never calls `Date.now()` or `Math.random()` — time and randomness enter only via injected `Clock` and seeded `Rng`. The model must play a full game start-to-finish in a Node test.
- **View thinness:** Phaser scenes render model state and contain no rules.
- **Theme = config only:** palette/atlas/copy/sfx/appId/ad-unit-ids — no logic.
- **One seeded Rng** (mulberry32/xorshift) drives level-gen, daily, piece bags, and tests: same seed → same stream.
- **`base: './'` on every native build** (Vite `--mode native`) or assets 404 → black screen on device.

## 3. Target architecture

```
BEFORE                              AFTER (Option B)
──────                              ────────────────
nothing (greenfield)               blublux-games/  (pnpm + Turborepo 2.x)
                                    ├─ packages/
                                    │  ├─ config         @blublux/config   (eslint/tsconfig/vite presets)
                                    │  ├─ engine         @blublux/engine    (boot→preload→scene, pools,
                                    │  │                   scale, audio unlock, mobile Phaser cfg, game-shell,
                                    │  │                   seams: Clock/Rng/Ads/IAP/Analytics/Leaderboard/
                                    │  │                   Storage/Haptics/Consent/AudioBus + fakes)
                                    │  ├─ ads-adapter     @blublux/ads-adapter (Ads iface; AdMob+UMP native;
                                    │  │                   web H5/portal; test-ids on DEV)
                                    │  ├─ engine-sort     @blublux/engine-sort  (pure model+gen+solver / view)
                                    │  └─ engine-block    @blublux/engine-block (pure model+bag / view)
                                    └─ apps/   (3 native listings + 6 web builds)
                                       ├─ sort-collection  com.blublux.sortcollection
                                       │                   (Butterfly·iColorcoin·Sand·Nuts&Bolts themes)
                                       ├─ knotwork         com.blublux.knotwork        (box9, 9×9)
                                       └─ beaver-block     com.blublux.beaverblock     (lines, 8×8)
```

Each app depends on `@blublux/engine` + its mechanic engine + `@blublux/ads-adapter` via `workspace:*`, supplies theme config + `capacitor.config.ts` + test ad-unit ids, and builds to AAB (native) and a static bundle (web). What this shape buys: ~⅓ the code, one bug-fix site per defect, free web distribution as a saturation hedge. What it costs: an up-front shared-core investment (Phase 1) before the first game is playable, and the discipline tax of keeping models Phaser-free.

## 4. Key design decisions (the real forks — decided before S1)

### 4.1 Distribution shape — **Option B (genre bundle), DECIDED by founders**
**Decision (2026-06-27):** ship **3 native listings** — one `sort-collection` app (4 sort themes selectable in-app), `knotwork`, and `beaver-block` — plus **all six games to the web** (free with this stack). Why: four near-identical sort reskins as separate native apps is the #1 account-level risk — Google's repetitive-content policy and Apple 4.3/4.2.6 banned **80,000+ developer accounts in 2025** ([[phaser4-game-factory]] `references/00-architecture.md §Strategic-Risk`). One container app per genre is exactly what Apple 4.3(a) recommends. Trade accepted: the four sort skins share one store listing / rating / install base instead of four shots at discovery. Consequences: `apps/sort-collection` carries an in-app theme picker + per-theme progression persistence; only **one** sort appId is a native listing (`com.blublux.sortcollection`); the per-skin appIds are web/Option-C only.

### 4.2 Engine split — **two pure-model engines, model/view/theme three-layer**
**Decision:** `engine-sort` (color/segment sort, K=4) and `engine-block` (grid block-fit + line/box clear), each split into **pure model (zero Phaser, headless-tested) → Phaser view → per-app theme config**. Why: testability, reskinnability, and the DRY mandate. Trade accepted: more packages and an interface boundary to maintain. Consequences: every rule is TDD'd in Vitest before a scene exists; views are thin; `apps/*` hold only config.

### 4.3 Seams & DI — **inject every external dependency, no singletons**
**Decision:** `Ads`, `IAP`, `Analytics`, `Leaderboard`, `Storage`, `Haptics`, `ConsentManager`, `AudioBus`, **`Clock`, `Rng`** are interfaces with injected providers, constructed at each app's **composition root** and passed down by constructor injection. No `new SomeSDK()`, `Date.now()`, or `Math.random()` in model or scene logic; no global singletons / service-locator in engines. Why: SOLID + Feathers seams make headless TDD trivial and the view thin. Consequences: each adapter ships a **fake** for tests; high-level engine code never imports a concrete SDK.

### 4.4 IAP provider — **RevenueCat, behind `IAPAdapter`**
**Decision:** `@revenuecat/purchases-capacitor` (DECIDED in brief §13) wrapped behind an `IAPAdapter` (`getProducts/purchase/restore/isRemoveAds`). Why: hosted receipt backend, free tier suffices, server-free. Trade accepted: a third-party receipt dependency. Consequences: Remove-Ads kills interstitials (rewarded stays); the adapter is fakeable for tests.

### 4.5 §13 open calls — **proceed with documented defaults (logged as assumptions)**
**Decision (per founder direction 2026-06-27):**
- **Leaderboards:** local-only by default; **GPGS behind a `LeaderboardAdapter`, OFF**. Block games persist best-score locally and push to the adapter only if GPGS is later enabled.
- **Beaver's Block grid:** **8×8**, row/col clear. (10×10 is a config flip, not a code change.)
- **Monetization numbers:** **Remote-Config defaults** — sort interstitial every **3** cleared levels + on fail/restart; block interstitial on game-over; rewarded opt-in (extra-tube/undo/hint/2×/revive/theme-unlock); first-session grace (no interstitial before first completion / first ~60–90 s); coin rewards/costs and free hint/undo quotas as Remote-Config keys.
Each is logged in [[2026-06-27_blublux-games_progress]] as an assumption; any can be overridden later without reworking steps (config/Remote-Config only).

### 4.6 The 9×9 "Woodoku" rename — **Knotwork (`com.blublux.knotwork`)**
**Decision (founder pick 2026-06-27):** the 9×9 row/col/3×3-box game ships as **Knotwork** (wood-knot + puzzle "knot"), `com.blublux.knotwork`, natural wood/stone theme, store hook "Drop. Clear. Repeat." The mechanic is free; only the name/branding "Woodoku" is protected. Trade accepted: a less genre-obvious search term than "…Blocks". Consequences: a **trademark-verification step (S29)** confirms `Knotwork` (and `Beaver's Block` + the four sort titles) are not live Play/Apple marks **before** submission — a fail there reopens this decision.

### 4.7 Locked stack & versions (pinned live via `npm info`, 2026-06-27)
**Decision:** [[Phaser 4]] **4.2.0** (Beam WebGL2 — never v4-from-v3-memory; pull v4 APIs via Context7), TypeScript strict + Vite, [[Capacitor]] **8.4.1** (`@capacitor/core` + `@capacitor/cli`; Node 22+, Android API 24+), Turborepo **2.10.0** (`turbo.json` uses `tasks`, not `pipeline`), `@capacitor-community/admob` **8.0.0** (major == Capacitor major) + AdMob mediation, `@revenuecat/purchases-capacitor` **13.2.0**, Firebase Analytics (GA4) + Remote Config, `@sentry/capacitor` **4.2.0**, Vitest **4.1.9** (logic) + Playwright (smoke). Re-pin with `npm info <pkg> version` at S1; do not assume from memory.

### 4.8 Execution model — **Both drivers**
**Decision:** the **in-context subagent orchestrator** ([[2026-06-27_blublux-games_orchestrator-prompt]]) is the primary driver (inline human gates: S15 slice review, S31 pipeline/secrets, S32 device sign-off, S33 store submission). A **dynamic-workflow brief** ([[2026-06-27_blublux-games_workflow]]) covers the gate-free, heavily-parallel segments (Phase 1 foundation, the two pure-model packages, the reskins) for maximum parallelism with the loop out of context. Same plan/steps/progress docs drive both.

## 5. Protocol / interface changes

Greenfield — no existing contracts to preserve. The **new** interfaces this build establishes (and which every later step depends on staying stable):

- **`Rng` / `Clock` seams** (`@blublux/engine`): `Rng.next(): number` in [0,1), seedable + forkable; `Clock.now()`. The only entry points for randomness/time in any model.
- **`Ads` interface** (`@blublux/ads-adapter`): `init(consent)`, `showBanner`, `interstitial()`, `rewarded(type): Promise<{rewarded:boolean}>` — native AdMob+UMP+mediation impl + web H5/portal impl. Game code calls the interface; it never branches on platform. **UMP order is invariant:** `initialize()` → `requestConsentInfo()` → `showConsentForm()` if required → check `canRequestAds` → only then load/show.
- **`engine-sort` model API:** `legalMoves(s)`, `applyMove(s,m)`, `isWon(s)`, `isStuck(s)`, `undo()`, `solve(s)`, `generate(tier, seed)` over `SortState { containers, capacity, colors }` / `Move { from, to, count }`.
- **`engine-block` model API:** `place(s, piece, cell)`, `clear(s)`, `score(...)`, `isGameOver(s)`, `bag(seed)` over a grid state parameterized by mode (`box9` | `lines`) and size.
- **`IAPAdapter` / `AnalyticsAdapter` / `LeaderboardAdapter` / `StorageAdapter`:** minimal segregated interfaces (§4.3), each with a fake.

## 6. Phased plan (P1 … P8)

Ordering invariant: **build the shared core first, validate the full vertical on ONE game (Butterfly) behind a human review gate, then replicate; destructive/paid/sign-off steps last.** Pure-model phases are TDD (red→green→refactor). Each phase names its acceptance bar.

### P1 — Foundation (S1–S8; ships nothing user-facing)
Monorepo + Turborepo + `@blublux/config` + CI; `@blublux/engine` Phaser scaffold; the `Rng`/`Clock` seams; the full interface/fake set; `@blublux/ads-adapter` (AdMob+UMP+web); IAP/Analytics/Sentry/RemoteConfig/Storage/Leaderboard adapters. **Acceptance:** `pnpm turbo run build|typecheck|lint|test` green on the empty engine; every adapter unit-tested with its fake; the UMP gating-order test green.

### P2 — `engine-sort` model (S9–S11; pure, TDD)
Core model (legality/win/stuck/undo), generator (reverse-moves + solver-validated; tiers; ≥300-level progression + infinite seeded + daily), solver (powers Hint). **Acceptance:** generator **100% solvable across ≥1,000 seeds/tier**; solver correctness + hint validity; undo integrity; daily determinism — all headless.

### P5 — `engine-block` model (S20–S21; pure, TDD; runs parallel to P2)
Grid model (`box9` row/col/**3×3-box** clear + `lines` row/col clear), scoring/combo, game-over; fair-bag generator + daily. **Acceptance:** clear correctness (3×3-box explicit), scoring/combo math, game-over detection, bag + daily determinism — all headless. *(Pure model, no gate — can be built before the P3 review gate.)*

### P3 — First sort game E2E: Butterfly in `sort-collection` (S12–S15; REVIEW GATE)
`engine-sort` Phaser view; shared game-shell (scene flow, overlays, coin economy, daily/streak, settings incl. colorblind+symbols + reduced-motion); Butterfly theme + monetization via adapters (test ids) + RevenueCat Remove-Ads + analytics; the `sort-collection` Capacitor app shell → web build + **first signed AAB**. **Acceptance:** playable native + web, AAB produced, [[phaser4-game-factory]] `references/05-production-checklist.md` passes → **STOP for human review of the reference slice before any scaling.**

### P4 — Sort reskins ×3 (S16–S19; parallel themes; after the gate)
iColorcoin, Sand, Nuts & Bolts (incl. the unscrew/screw interaction nuance) as **themes inside `sort-collection`** + the 4-theme in-app picker + per-theme progression. **Acceptance:** all four themes selectable; `git diff` shows the shared `engine-sort` model untouched.

### P6 — Block game E2E: Knotwork (`box9`) (S22–S24; after the gate)
`engine-block` Phaser view (drag-snap ghost, line/box clear sweep, combos, game-over); Knotwork theme + box9 config + on-game-over interstitial + rewarded revive/2×/theme-unlock + `LeaderboardAdapter` (local) + daily; `apps/knotwork` → AAB + web. **Acceptance:** playable native + web, AAB, leaderboard adapter functional, checklist passes.

### P7 — Beaver's Block (`lines`, 8×8) (S25–S26)
Beaver/woodland theme + lines config (8×8) over the same `engine-block` view; `apps/beaver-block` → AAB + web. **Acceptance:** target builds native + web; AAB; shared block engine untouched.

### P8 — Polish, QA, CI/CD, store (S27–S33; destructive/paid/sign-off LAST)
Playwright smoke per web app; perf pass (60 fps, cold start < 2 s, atlases ≤ 2048², pooling, reduced-motion); **asset IP audit + trademark verification**; store readiness (icons/splash/screenshots/copy, privacy policy, Play Data Safety, COPPA general-audience, Remote-Config defaults); **[GATED]** CI/CD release pipeline (Fastlane + Play upload, signing secrets); **[SIGN-OFF]** device QA on low-end Android + full checklist per app; **[DESTRUCTIVE/PAID]** web deploy (all 6) + staged native store submission (3 AABs). **Acceptance:** all targets build from root; §11 met; checklist passes per app; written go/no-go recorded before submission. *(Validate the pipeline on the 3 native targets before any wider templating.)*

## 7. Decommission / cleanup checklist

Greenfield — **nothing is removed.** The only "deletions" are mechanical placeholder swaps inside the copied templates, done as part of the step that copies them, not as a destructive phase:

```
@studio/*  scope ............ replace → @blublux/*  (every package.json + import)
__GAME_ID__ ................. replace → sort-collection | knotwork | beaver-block
__APP_ID__ .................. replace → com.blublux.{sortcollection|knotwork|beaverblock}
__APP_NAME__ ................ replace → "Sort Puzzle Collection" | "Knotwork" | "Beaver's Block"
test ad unit IDs ............ wired to import.meta.env.DEV (never live IDs in dev)
```
No secrets, infra, or files are destroyed; the only genuinely destructive/irreversible actions are the **store submissions (S33)**, gated behind human sign-off.

## 8. Rule & doc updates (keep the docs truthful)

- This kit is the source of truth for the build; the **progress tracker** ([[2026-06-27_blublux-games_progress]]) is updated after every step (status/SHA/CARRY-FORWARD note).
- The owner rules doc (`~/Documents/Claude/CLAUDE.md`) already encodes scope (`@blublux/*`), appIds (`com.blublux.*`), the locked stack, and the §2.1 engineering principles — every worker prompt restates the subset it touches.
- Suggested (not auto-applied): add a `[[blublux-games]]` link under the Dev/Entrepreneur MOC when the first AAB lands.

## 9. Privacy / security / compatibility impact

- **Consent (EU):** UMP gates ad **loading**, not just display — the load-bearing compliance item; enforced by `@blublux/ads-adapter`, never bypassed. ATT on iOS is out of scope (no iOS v1) but the adapter retains the hook.
- **Analytics after consent only:** Firebase GA4 events fire only post-consent; pre-consent events are dropped, not buffered to disk.
- **COPPA / Families:** default general-audience rating; ads configured compliant; no AI-likeness/PII assets.
- **Data Safety / privacy policy:** per native listing, completed at S30 before submission.
- **No new trust boundary on the wire:** server-free; the only egress is the platform SDKs (AdMob/RevenueCat/Firebase/GPGS), each isolated behind an adapter.

## 10. Risks & rollback

| Risk | Mitigation / rollback |
|---|---|
| **Store account ban** from repetitive sort reskins | Option B (§4.1): 3 native listings, not 6; web-first for the rest; staged submission (1 then the rest) at S33; never spread across accounts. |
| **Unsolvable sort level shipped** | Generator is reverse-moves-from-solved **and** solver-validated; CI gate ≥1,000 seeds/tier @ 100% solvable (S10). A regression fails CI, never ships. |
| **AdMob suspension** from showing ads pre-consent | UMP order enforced in the adapter + a unit test asserting no load before `canRequestAds` (S5); test IDs on DEV. |
| **Model purity erosion** (Phaser/`Date.now`/`Math.random` creeping into models) | `git grep` purity check in every model step's Verify + reviewer checklist; CI lint rule. |
| **Black screen on device** | `base:'./'` on native builds asserted in the app-step Verify (grep the built `index.html`). |
| **Trademark collision** (Knotwork or any title) | S29 verification before submission; a hit reopens §4.6 — cheap because the name is theme/config, not logic. |
| **Capacitor/Phaser 4 API drift** | Versions pinned at S1 via `npm info`; v4 APIs pulled live via Context7, never v3 memory. |
| A step lands on red | Per-step branch off `blublux-games/main`; a failed step is discarded without unwinding others; rollback = leave it unmerged. |

## 11. Acceptance criteria (whole change) — Definition of Done per game (brief §14)

- [ ] Boots to menu, full session, **no console errors, 60 fps in core scene**, cold start < 2 s, `prefers-reduced-motion` honored.
- [ ] Engine logic in **pure TS**, headless-tested (sort: solvability/solver/undo; block: clear-correctness incl. 3×3-box/scoring/game-over); RNG determinism.
- [ ] Interstitial + every rewarded hook + RevenueCat Remove-Ads wired (test ids in dev) **behind UMP consent**; ad-UX policy enforced by the adapter.
- [ ] Coins, daily challenge/reward + streak, settings (colorblind + per-color symbols) work **offline**.
- [ ] Firebase events fire **post-consent**; Sentry wired with source maps.
- [ ] **Original assets only**; appId/name/icon/splash/store copy set; trademark verified.
- [ ] Produces a **signed AAB from root build** AND a deployable web build (`base:'./'` native).
- [ ] (Block) `LeaderboardAdapter` functional; (Sort) **≥300-level progression + infinite mode + daily**.
- [ ] [[phaser4-game-factory]] `references/05-production-checklist.md` passes.

## 12. Implementation map

- **`packages/config`**: eslint/tsconfig/vite presets (S1).
- **`packages/engine`**: Phaser scaffold + game-shell + all seams/fakes (S2–S4, S13). Templates: `Skills/phaser4-game-factory/assets/templates/engine/`.
- **`packages/ads-adapter`**: Ads iface + AdMob/UMP + web (S5). Template: `assets/templates/engine/ads-adapter.ts` + `consent.ts`.
- **`packages/engine-sort`**: model+gen+solver (S9–S11) + view (S12).
- **`packages/engine-block`**: model+bag (S20–S21) + view (S22).
- **`apps/sort-collection`**: 4 sort themes + picker (S14–S19). **`apps/knotwork`**: box9 (S23–S24). **`apps/beaver-block`**: lines 8×8 (S25–S26). Templates: `assets/templates/game/`.
- **CI/CD**: `assets/templates/ci/` (S1 for `ci.yml`; S31 for `release-android.yml` + `Fastfile.android`).
- **Adapters (IAP/Analytics/Sentry/Storage/Leaderboard)**: `packages/engine` or sibling packages (S6–S8).

Sources (verified in-workspace 2026-06-27): `Skills/phaser4-game-factory/SKILL.md` + `references/00-architecture.md`, `references/03-monetization.md` (read/cited), `Skills/migration-orchestration/references/*` (templates), `Projects/casino-games/docs/*` (format), `~/Documents/Claude/CLAUDE.md` (owner rules), and `npm info` for the pinned versions in §4.7.
