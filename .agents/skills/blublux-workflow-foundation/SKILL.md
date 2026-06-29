---
name: blublux-workflow-foundation
description: >-
  Runs the gate-free Foundation segment (WF-1, steps S1–S8) as parallel subagent work.
  Use when the user wants to start/run the foundation workflow, WF-1, steps S1 to S8, or foundation segment.
---

# BluBlux Workflow — Foundation (WF-1, S1–S8)

Run the gate-free **Foundation** segment as parallel subagent work.

## Prerequisite

None — this is the first segment.

## Instructions

Drive steps **S1 through S8** as a DAG:

```
S1 → {S2, S3, S4} in parallel → {S5, S6, S7, S8} in parallel (after S3)
```

For each step:

1. Spawn a **blublux-worker** subagent with that step's prompt from `docs/2026-06-27_blublux-games_implementation-steps.md`
2. Spawn a **blublux-reviewer** subagent on the diff
3. Fix loop (max 3 cycles) → merge to `blublux-games/main` → update `docs/2026-06-27_blublux-games_progress.md`

## Review focus (this segment)

- S2: model purity, Rng/Clock determinism
- S5: **security review** — UMP load-gating test must pass
- S6/S7: security review — IAP boundary, analytics post-consent
- S3: no SDK imports in ports/fakes
- S4: Phaser imports only under `view/`

## Parallelism rules

- Run {S2,S3,S4} concurrently (disjoint files)
- Run {S5,S6,S7,S8} concurrently after S3 passes
- Never edit the same file from two steps at once

## Stop condition

STOP after S8 passes. Do **not** enter P2 (engine-sort model) or P3 (Butterfly slice). Hand back to orchestrator or launch WF-2.

## Verify gate

All of these must be green before marking segment done:

```bash
pnpm turbo run typecheck lint test build
```
