# AGENTS.md — BluBlux Games (Antigravity Config)

Phaser 4 + Capacitor monorepo building six puzzle games from two pure-model engines. Orchestrated build: S1–S33.

## Project skills (`.agents/skills/`)

| Skill | Role |
|---|---|
| [blublux-games](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/blublux-games) | Project context: architecture, locked decisions, verify commands, doc map |
| [blublux-orchestrator](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/blublux-orchestrator) | Primary driver: worker→reviewer→fix loop, gates, progress tracking |
| [blublux-worker](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/blublux-worker) | Implements one step; runs Verify; commits on `blublux-games/S<N>` |
| [blublux-reviewer](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/blublux-reviewer) | Reviews diffs; returns `VERDICT: PASS \| CHANGES_REQUESTED` |

## Linked authority skills (symlinked or copied into `.agents/skills/`)

| Skill | Project path | Canonical source | Use for |
|---|---|---|---|
| [phaser4-game-factory](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/phaser4-game-factory) | `.agents/skills/phaser4-game-factory/` | `~/Documents/Claude/Skills/phaser4-game-factory/` | Stack, ads, CI/CD, templates, production checklist |
| [migration-orchestration](file:///Users/zen/workspace/blublux-phaser-games/.agents/skills/migration-orchestration) | `.agents/skills/migration-orchestration/` | `~/Documents/Claude/Skills/migration-orchestration/` | Orchestration patterns (already applied in `docs/`) |

## Commands (`.cursor/commands/` or manual execution)

| Command | When |
|---|---|
| `/blublux-orchestrator` | Start or resume full S1–S33 build |
| `/blublux-workflow-foundation` | WF-1: S1–S8 (parallel foundation) |
| `/blublux-workflow-models` | WF-2: S9–S11 ∥ S20–S21 (pure models) |
| `/blublux-workflow-reskins` | WF-3: S16–S19 (after S15 GO) |

## Docs (source of truth)

| File | Role |
|---|---|
| [plan.md](file:///Users/zen/workspace/blublux-phaser-games/docs/2026-06-27_blublux-games_plan.md) | Why — architecture, decisions, phases |
| [implementation-steps.md](file:///Users/zen/workspace/blublux-phaser-games/docs/2026-06-27_blublux-games_implementation-steps.md) | How — S1–S33 prompts + Verify blocks |
| [progress.md](file:///Users/zen/workspace/blublux-phaser-games/docs/2026-06-27_blublux-games_progress.md) | Durable state — read on every resume |
| [orchestrator-prompt.md](file:///Users/zen/workspace/blublux-phaser-games/docs/2026-06-27_blublux-games_orchestrator-prompt.md) | Original orchestrator spec (Claude Code) |
| [workflow.md](file:///Users/zen/workspace/blublux-phaser-games/docs/2026-06-27_blublux-games_workflow.md) | Original workflow brief (Claude Code dynamic workflows) |

## Project-Scoped Rules (Automatically Applied)

### Rule 1: Project Conventions (blublux-games)
* **Scope:** Applies globally to all workspace actions.
* **Architecture Rules:**
  * **Model purity**: `packages/engine-*/src/model` — zero Phaser/DOM; no `Date.now()`/`Math.random()`; use injected `Clock`/`Rng`
  * **View thinness**: Phaser scenes render model state; no game rules in scenes
  * **Theme = config only**: reskins edit `apps/*/src/themes/**` only; never copy logic into `apps/*`
  * **DI**: SDK imports only in `composition-root.ts` and adapter packages
  * **UMP**: consent before ad loading — never bypass `@blublux/ads-adapter`
  * **Native**: Vite `base:'./'` for `--mode native`
  * **TDD**: model logic written test-first
* **Build commands:**
  ```bash
  pnpm turbo run typecheck lint test build
  pnpm --filter @blublux/<pkg> test
  ```
* **Phaser 4:** Use Context7 for v4 APIs. Never use Phaser 3 memory.
* **Human gates (never auto-cross):** S15 (review slice), S31 (secrets), S32 (device QA), S33 (store submission).

### Rule 2: DI & Adapter Boundaries (adapters-di)
* **Scope:** `apps/**/src/composition-root.ts`, `packages/ads-adapter/**`, `packages/engine/src/adapters/**`
* Concrete SDK imports belong **only** in:
  * `apps/*/src/composition-root.ts` — wires all ports for that app
  * `packages/ads-adapter/src/` — AdMob, UMP, web ads
  * `packages/engine/src/adapters/` — IAP, Analytics, Storage, Leaderboard, Sentry
* Everywhere else: depend on **interfaces** from `@blublux/engine` ports.
* **UMP invariant (ads-adapter):**
  ```
  initialize() → requestConsentInfo() → showConsentForm() if required
  → canRequestAds === true → ONLY THEN load/show
  ```
  Unit test must assert `interstitial()`/`rewarded()` reject when `canRequestAds===false`.
* **Dev vs prod:**
  * Test ad unit IDs when `import.meta.env.DEV`
  * Never hardcode live `ca-app-pub-*` IDs in source
  * Analytics: drop events until `setConsent(true)`
* **Verify:**
  ```bash
  git grep -nE "@capacitor|firebase|revenuecat|admob" apps/*/src
  # hits ONLY composition-root.ts
  ```

### Rule 3: Model Purity (model-purity)
* **Scope:** `packages/engine-*/src/model/**/*`
* Code in `packages/engine-*/src/model` must be **headless-playable in Node**.
* **Forbidden:**
  * `import` from `phaser` or any canvas/DOM API
  * `Date.now()` or `Math.random()` — use injected `Clock` / `Rng` from `@blublux/engine`
  * Direct SDK calls (ads, firebase, capacitor, revenuecat)
* **Required:**
  * Immutable state transitions (return new state, don't mutate)
  * Deterministic: same inputs + seed → same outputs
  * TDD: write failing Vitest first, then implement
* **Verify before commit:**
  ```bash
  git grep -nE "phaser|Math\.random|Date\.now" -- packages/engine-sort/src/model packages/engine-block/src/model
  # must return empty

  pnpm --filter @blublux/engine-sort test   # or engine-block
  ```
* Sort generator must pass ≥1,000 seeds/tier @ 100% solvable in CI.

## How to start

1. **Full build (recommended):** run `/blublux-orchestrator` — handles gates inline
2. **Parallel segments:** run workflow commands for gate-free phases; orchestrator owns S12–S15, block apps, P8
3. **Single step:** invoke **blublux-worker** with the step prompt from the steps doc

## Integration branch

- Merge target: `blublux-games/main`
- Per-step branches: `blublux-games/S1` ... `blublux-games/S33`
