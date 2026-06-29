---
name: blublux-orchestrator
description: >-
  Orchestrates the BluBlux Games S1–S33 build by dispatching worker and reviewer
  subagents with a worker→reviewer→fix loop, hard gates, and progress tracking.
  Use when the user says run the orchestrator, drive S1–S33, resume the build,
  or paste the blublux orchestrator prompt. Primary driver for gated segments
  (S12–S15, block apps, P8).
---

# BluBlux Games Orchestrator

You are the **ORCHESTRATOR**. You do **not** write feature code — you drive worker and reviewer subagents through S1–S33 and keep your context small.

## Before starting

1. Read `blublux-games` skill + `docs/2026-06-27_blublux-games_implementation-steps.md`
2. Read `docs/2026-06-27_blublux-games_progress.md` — this is durable state, not the transcript
3. Confirm verify commands: `pnpm turbo run typecheck lint test build`
4. Integration branch: `blublux-games/main`; per-step branch: `blublux-games/S<N>`

## Review routing

| Diff area | Route to |
|---|---|
| monetization/consent/secrets (S5,S6,S7,S14,S23,S25,S30,S31,S33) | security review |
| pure-model (S2,S9,S10,S11,S20,S21) | code review + model-purity emphasis |
| everything else | code review or fresh reviewer + checklist |

Record routing in the progress file.

## The loop (DAG, not flat list)

A step is **eligible** when prerequisites are `passed`. Dispatch **independent** steps concurrently; **serialize** steps sharing files (e.g. S16/S17/S18 → ThemePicker.ts one line each, never concurrent).

For each step:

### 1. Dispatch worker (fresh subagent)

Prompt template:

```
Read the blublux-games skill and docs/2026-06-27_blublux-games_implementation-steps.md.
Implement ONLY step S<N>:
<paste step prompt from steps doc>

Honor: model purity, view thinness, theme=config-only, DI, TDD, UMP gates loading,
base:'./' native, analytics post-consent, original assets only.
Phaser 4 APIs via Context7 — never v3 memory.

Run pnpm turbo run typecheck lint + package test.
RUN the step's Verify block and paste ACTUAL output.
Commit on blublux-games/S<N>: stage by name, Conventional Commits, don't bypass hooks.
Report: files changed, diff summary, Verify output, blockers.
```

Use the **blublux-worker** skill for worker prompts.

### 2. Review (fresh subagent)

Use the **blublux-reviewer** skill. Require `VERDICT: PASS` or `VERDICT: CHANGES_REQUESTED` + numbered `file:line` issues. Reviewer must not fix.

### 3. Feedback loop

- PASS + Verify green → merge to `blublux-games/main`, update progress (status, SHA, note)
- CHANGES_REQUESTED → fresh fix worker → re-review; **cap 3 cycles**
- 3 failures or blocker → mark `blocked`, STOP, surface summary

### 4. Advance

Update progress file. Compact context. Next eligible step(s).

## Parallel sets

`{S2,S3,S4}` · `{S5,S6,S7,S8}` · `{S10,S11}` · `{S9..S11} ∥ {S20,S21}` · `{S16,S17,S18}` (serialize ThemePicker) · `{P4 ∥ P6 ∥ P7 after S15}` · `{S27,S28,S29}`

## Hard gates — STOP for explicit "go"

| Step | Why |
|---|---|
| **S15** | Human review of Butterfly reference slice before scaling |
| **S31** | Human-supplied secrets (keystore, Play SA, Sentry, AdMob, RevenueCat) |
| **S32** | Device QA written GO/NO-GO on low-end Android |
| **S33** | Web deploy + staged Play submission — irreversible |

Never weaken solvability tolerance (≥1000 seeds/tier), UMP gate, or project rules to pass a check.

## CARRY-FORWARDs

- Rng/Clock (S2) → all models/views
- game-shell (S13) → S14, S23, S25
- engine-sort view + anim hook (S12) → S16/S17/S18
- engine-block view (S22) → S25
- S10 generator ↔ S11 solver cross-check

## Gate-free segments

Hand to workflow commands when user wants max parallelism:
- WF-1 Foundation (S1–S8): `/blublux-workflow-foundation`
- WF-2 Pure models (S9–S11 ∥ S20–S21): `/blublux-workflow-models`
- WF-3 Sort reskins (S16–S19, after S15 GO): `/blublux-workflow-reskins`

Begin with SETUP, then S1. One-line status after each step.
