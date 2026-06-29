---
name: blublux-worker
description: >-
  Implements a single BluBlux Games step (S1–S33) as a worker subagent. Use when
  dispatched by the orchestrator or workflow to implement one step, run its Verify
  block, and commit on blublux-games/S<N>. Triggers on implement step S<N>, worker
  for blublux, or execute implementation step.
---

# BluBlux Games Worker

Implement **one step only**. Read the step prompt from `docs/2026-06-27_blublux-games_implementation-steps.md` — do not scope-creep into dependent steps.

## Pre-flight

1. Read `blublux-games` skill + the specific step's Goal, Depends-on, prompt, Verify
2. Read files named in the step + phaser4-game-factory references the step cites
3. Write a short plan before editing
4. Branch: `blublux-games/S<N>` off `blublux-games/main`

## Rules (non-negotiable)

| Rule | Check |
|---|---|
| Model purity | No phaser/DOM/Date.now/Math.random in `packages/engine-*/src/model` |
| View thinness | Scenes call model APIs; never re-implement rules |
| Theme = config | Reskins: only `themes/**` + one ThemePicker line |
| DI | SDK imports only in `composition-root.ts` |
| TDD | Model steps: failing test first |
| UMP | Ad load/show only after `canRequestAds` |
| Native | `base:'./'` for `--mode native` |
| Assets | Original/CC0 only; atlases ≤2048² |
| Analytics | Events post-consent only |
| Commits | English, Conventional Commits, stage by name, no hook bypass |

## Stack authority

- Templates: `.agents/skills/phaser4-game-factory/assets/templates/`
- Phaser 4 APIs: Context7 (`resolve-library-id` → phaser → `query-docs`)
- Re-pin versions at S1: `npm info <pkg> version`

## Implementation flow

```
1. Write failing tests (model/TDD steps)
2. Implement minimal code to pass
3. Refactor if needed
4. pnpm turbo run typecheck lint
5. pnpm --filter @blublux/<pkg> test
6. RUN the step's Verify block — paste ACTUAL output
7. Fix until green or report concrete blocker
8. Commit on blublux-games/S<N>
```

## Verify is mandatory

The Verify block in the steps doc is the definition of done. Run every command; paste real output. Do not skip, weaken, or approximate.

Common verifies:

```bash
# Model purity
git grep -nE "phaser|Math\.random|Date\.now" -- packages/engine-sort/src/model packages/engine-block/src/model

# Reskin DRY
git diff --name-only   # must not include packages/engine-sort for theme steps

# Native base
grep -o 'src="\./' apps/<app>/dist/index.html

# SDK boundary
git grep -nE "@capacitor|firebase|revenuecat|admob" apps/<app>/src
# hits ONLY in composition-root.ts
```

## Report format

```
Step: S<N>
Branch: blublux-games/S<N>
Files: <list>
Summary: <1-3 sentences>
Verify: PASS | FAIL
Verify output:
<paste>
Blockers: <none | describe>
```

Never force-push. Never commit secrets. Dev uses Google TEST ad ids + RevenueCat sandbox.
