---
type: workflow
project: blublux-games
tags: [games, migration-orchestration, dynamic-workflow, subagents, dev]
status: READY TO EXECUTE
slug: blublux-games
date: 2026-06-27
runs: 2026-06-27_blublux-games_implementation-steps.md
tracker: 2026-06-27_blublux-games_progress.md
companion_driver: 2026-06-27_blublux-games_orchestrator-prompt.md
---

# BluBlux Games — Dynamic-Workflow Brief (the *driver*, gate-free segments)

The **second driver** under the "Both" decision (plan §4.8). The [[2026-06-27_blublux-games_orchestrator-prompt|orchestrator]] owns the whole build and every inline gate; **this doc hands the gate-free, heavily-parallel segments to Claude Code dynamic workflows** so the loop runs in the background at max parallelism with the orchestration kept out of context. Use it for the segments below; let the orchestrator keep the gated slice (S12–S15), the block/beaver apps, and P8.

Execution requires **Claude Code v2.1.154+, a paid plan, and Dynamic-workflows opt-in in `/config`**. You don't hand-write the script — you paste a brief after `ultracode:` (or say "use a workflow to…"); the runtime writes the script, shows the phases to approve, runs it, and lets you save it to `.claude/workflows/` as a rerunnable `/<name>`. The plan/steps/progress docs are the spec it executes.

## The two constraints that shape the run
A workflow **cannot pause for human input mid-run**, and its script has **no direct filesystem/shell access** — only its subagents read/write/build/test/commit. Therefore:
- **Every human gate is a SEGMENT BOUNDARY, not an in-run stop.** S15 (review), S31 (secrets), S32 (sign-off), S33 (submission) are gates → not inside any workflow.
- **Nothing irreversible/paid runs in an unattended segment.** No store upload, no live keys — dev uses Google TEST ad ids + RevenueCat sandbox.

## Step 1 — Partition the steps into segments at the gates
From the dependency graph in [[2026-06-27_blublux-games_implementation-steps]], the gate-free runs that are worth a workflow (and where parallelism actually pays):

```
WF-1  Foundation        S1 → {S2,S3,S4} → {S5,S6,S7,S8}            (gate-free; high fan-out)
WF-2  Pure models       {S9 → S10,S11}  ∥  {S20 → S21}            (gate-free; two disjoint engines in parallel)
        ────────────────  ⛔ S12–S15 = orchestrator (slice + REVIEW GATE; S15 needs a keystore) ──────────────
WF-3  Sort reskins      after S15 go:  {S16,S17,S18} → S19        (gate-free; theme folders disjoint)
        ────────────────  S22–S26 (block+beaver apps), S27–S30 (polish) = orchestrator or careful segments ──
        ────────────────  ⛔ S31 GATED · ⛔ S32 SIGN-OFF · ⛔ S33 DESTRUCTIVE = never a workflow ─────────────
```

WF-1 and WF-2 can themselves overlap: WF-2's pure-model packages depend only on S2 (the Rng/Clock seam), so once S2 is `passed` the two model engines can build while the adapters (S5–S8) finish. If you prefer one run, merge WF-1+WF-2 into a single "foundation + models" workflow and let the DAG schedule them.

## Step 2 — Launch a segment with a brief (the runtime writes the script)
Paste one of the briefs below after `ultracode:`. Approve the planned phases; watch with `/workflows`; save the run (`/workflows` → select → `s` → `.claude/workflows/`) so it becomes `/blublux-wf1` etc. for reruns.

### Brief — WF-1 (Foundation, S1–S8)
```
ultracode: Run the BluBlux Games FOUNDATION segment (steps S1..S8) as a dynamic workflow.
Read docs/2026-06-27_blublux-games_implementation-steps.md, docs/2026-06-27_blublux-games_plan.md (§4 decisions), the
.agents/skills/phaser4-game-factory/SKILL.md (plus references/00,03 + assets/templates), and .agents/AGENTS.md. Drive S1..S8 as a DAG: S1 first; then run {S2,S3,S4} in parallel (disjoint files); then
{S5,S6,S7,S8} in parallel after S3. Per step spawn:
 - WORKER: implement ONLY that step's prompt from the steps doc; honor model purity / DI / no-SDK-
   outside-adapters / UMP-gates-loading / events-post-consent; for Phaser 4 APIs use Context7 (v4);
   run `pnpm turbo run typecheck lint` + the package `test`; RUN the step's Verify block and capture
   actual output; commit on blublux-games/S<N> off blublux-games/main (stage by name, Conventional
   Commits, don't bypass hooks).
 - REVIEWER (inline checklist — a workflow can't target a named review agent): correctness; model
   purity (grep packages/engine-*/src for phaser/Date.now/Math.random); DI (concrete @capacitor/
   firebase/revenuecat imports confined to the adapter file the step names); the UMP load-gating test
   present and passing (S5); analytics drops events pre-consent (S7); Verify genuinely passed. Return
   VERDICT: PASS / CHANGES_REQUESTED + numbered file:line; do not fix.
 - FIX loop on CHANGES_REQUESTED (fresh subagent; re-run Verify; re-review); cap 3 cycles, else stop
   the segment and mark the step blocked.
On PASS, merge S<N> → blublux-games/main and have a subagent append (status, SHA, one-line note) to
docs/2026-06-27_blublux-games_progress.md. Parallelize {S2,S3,S4} and {S5,S6,S7,S8}; serialize anything
sharing a file. STOP after S8 and summarize — do NOT enter P2/P3.
```

### Brief — WF-2 (Pure models, S9–S11 ∥ S20–S21)
```
ultracode: Run the BluBlux Games PURE-MODEL segment (S9,S10,S11 for engine-sort and S20,S21 for
engine-block) as a dynamic workflow — the two engines are disjoint packages, run them as parallel
tracks. Prereq: S2 (Rng/Clock seam) is passed. Read docs/2026-06-27_blublux-games_implementation-steps.md, docs/2026-06-27_blublux-games_plan.md (§4.2/§4.5), and .agents/AGENTS.md.
DAG: S9 → {S10,S11} (engine-sort) ∥ S20 → S21 (engine-block). These are TDD steps — the WORKER must
write the failing Vitest FIRST, then implement, then refactor; the REVIEWER must confirm the tests
drove the code and that:
 - model code is PURE (grep packages/engine-sort/src/model + packages/engine-block/src/model for
   phaser/Date.now/Math.random → must be empty), randomness only via injected Rng, determinism holds;
 - the sort generator's solvability gate runs ≥1000 seeds/tier at 100% solvable and was NOT weakened;
 - block clear logic clears 3×3 BOXES in box9 and does NOT in lines mode; scoring/combo math matches
   the brief; game-over is correct; the bag is deterministic with the anti-frustration bias.
Worker runs each step's Verify and pastes output; commit per step; reviewer returns VERDICT + file:line;
3-cycle fix cap. For the heavy solvability test, consider Pattern 4 (3-vote consensus review) from
the migration-orchestration workflow-patterns reference for S10. Merge on PASS, append to docs/2026-06-27_blublux-games_progress.md. STOP after S11 and S21 — do NOT start S12 (the slice is the orchestrator's gated work).
```

### Brief — WF-3 (Sort reskins, S16–S19 — only after the S15 GO)
```
ultracode: Run the BluBlux Games SORT-RESKIN segment (S16,S17,S18 → S19) as a dynamic workflow.
ONLY launch this after I have given the S15 review-gate GO. Read docs/2026-06-27_blublux-games_implementation-steps.md + docs/2026-06-27_blublux-games_plan.md (§4.1 Option B + §5.7). DAG: {S16,S17,S18} in parallel (disjoint theme folders under apps/sort-collection/src/themes/)
→ S19. CRITICAL serialization: all three register in apps/sort-collection/src/ThemePicker.ts — that
file is SHARED, so the worker for each reskin must make ONLY its one-line registration edit and the
runtime must serialize those three edits (never concurrent) even though the theme folders are disjoint;
the reviewer FAILS any reskin whose diff touches packages/engine-sort (DRY/Option-B guarantee — themes
are config only). Worker runs the theme-validity Verify (palette length, symbol-per-color a11y, atlas
≤2048²) and pastes output; commit per step; 3-cycle fix cap; merge on PASS; append to docs/2026-06-27_blublux-games_progress.md. STOP
after S19 — hand back to the orchestrator for the block apps.
```

## Step 3 — Honor the runtime's behavior and limits
| Documented behavior | What to do here |
|---|---|
| **No mid-run user input** | Gates = boundaries: S15/S31/S32/S33 are never inside a workflow. |
| **Script has no FS/shell** | All edits/builds/tests/commits happen inside subagents; each step's Verify is run by its worker and pasted back. |
| **Subagents inherit your tool allowlist; edits auto-approve** | **Pre-add to the allowlist** before launching: `pnpm`, `pnpm turbo`, `vitest`, `vite`, `tsc`, `eslint`, `npx playwright`, `git`, and (later) `npx cap`, `./gradlew`. Context7 MCP calls may still prompt — allow them. |
| **≤16 concurrent subagents, ≤1000/run** | Fan-out is modest here ({S2,S3,S4}=3, {S5..S8}=4, two model tracks, {S16,S17,S18}=3) — each + its reviewer/fixers stays well under 16. |
| **Resumable only within a session** | `2026-06-27_blublux-games_progress.md` is the CROSS-session source of truth — a subagent appends to it each step; a fresh session resumes from it. |
| **Cost scales with subagents** | Gauge on WF-1 first (8 steps); `/workflows` shows per-subagent tokens; `x` stops without losing completed work. Route the lightest steps to a smaller model in the brief. |

## Step 4 — Inputs via `args`
Parameterize the slug, the step range, and the integration branch so a saved segment reruns without editing the script — e.g. "Run `/blublux-wf1` on steps S5–S8 only" after a partial failure.

## Done-when (this driver doc is finished)
- [x] Segments drawn with each gate (S15/S31/S32/S33) as a boundary; gate-free runs identified (WF-1/2/3).
- [x] A reusable brief per segment, each with the inline reviewer checklist filled in (purity, DI, UMP, solvability, DRY).
- [x] The allowlist of commands the subagents need is listed (Step 3) for you to pre-add.
- [x] `2026-06-27_blublux-games_progress.md` named as the cross-session source of truth the workflow updates per step.

> A built-in example to study first: run `/deep-research <question>` once to watch the
> worker→cross-check→synthesize shape before launching WF-1.
