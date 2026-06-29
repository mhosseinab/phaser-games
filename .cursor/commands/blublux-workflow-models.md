# BluBlux Workflow — Pure Models (WF-2, S9–S11 ∥ S20–S21)

Run the gate-free **pure-model** segment — two disjoint engine packages in parallel.

## Prerequisite

S2 (Rng/Clock seam) must be `passed`.

## Instructions

Two parallel tracks:

```
Track A (engine-sort):  S9 → {S10, S11}
Track B (engine-block): S20 → S21
```

For each step: **blublux-worker** → **blublux-reviewer** → fix (max 3) → merge → update progress.

## TDD required

Workers must write failing Vitest **first**, then implement, then refactor.

## Review focus

- Model purity grep must be empty in both `packages/engine-*/src/model`
- S10: solvability gate ≥1,000 seeds/tier @ 100% — **never weaken**
- S20: box9 clears 3×3 boxes; lines mode does NOT
- S21: anti-frustration bias (statistical, not guarantee)
- Randomness only via injected `Rng`; determinism holds

## Stop condition

STOP after S11 and S21 pass. Do **not** start S12 (orchestrator's gated Butterfly slice).

## Verify gate

```bash
pnpm --filter @blublux/engine-sort test
pnpm --filter @blublux/engine-block test
git grep -nE "phaser|Math\.random|Date\.now" -- packages/engine-sort/src/model packages/engine-block/src/model
# must return empty
```
