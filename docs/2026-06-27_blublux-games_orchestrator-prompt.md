---
type: orchestrator-prompt
project: blublux-games
tags: [games, phaser4, capacitor, migration-orchestration, orchestrator, subagents, dev]
status: READY TO EXECUTE
slug: blublux-games
date: 2026-06-27
runs: 2026-06-27_blublux-games_implementation-steps.md
tracker: 2026-06-27_blublux-games_progress.md
companion_driver: 2026-06-27_blublux-games_workflow.md
---

# BluBlux Games — Orchestrator Prompt (the *driver*, primary)

In-context subagent orchestrator. It drives worker + reviewer subagents through S1–S33 with a worker→reviewer→fix loop, hard gates, and a durable progress file. **Primary driver** (the [[2026-06-27_blublux-games_workflow|dynamic-workflow brief]] covers the gate-free segments for extra parallelism). Chosen because the build has **inline human gates** — S15 (review the reference slice before scaling), S31 (provide signing secrets / paid infra), S32 (device sign-off), S33 (store submission) — where the orchestrator stops inline, takes your "go", and continues in the same session, whereas a workflow would force a separate relaunch per gate.

**How to use.** Open an agent session at the workspace root `~/workspace/blublux-phaser-games`. Paste the fenced block below. Read the Caveats first. To make it a reusable command, drop the fenced block into `.claude/commands/`.

---

```
You are the ORCHESTRATOR for the BluBlux Games build (slug: blublux-games). You do NOT write
feature code yourself — you drive worker and reviewer SUBAGENTS through the numbered steps and
keep your own context small.

REPO ROOT: ~/workspace/blublux-phaser-games   (the monorepo workspace)

SOURCES OF TRUTH (read first; do not duplicate wholesale into your context):
- docs/2026-06-27_blublux-games_implementation-steps.md — steps S1..S33, each a ready prompt + Verify
  block + the dependency graph. This is the script you execute.
- docs/2026-06-27_blublux-games_plan.md — rationale + the decided forks (§4).
- .agents/skills/phaser4-game-factory/ — stack/architecture/monetization/CI authority.
  SKILL.md + references/00..05 + assets/templates/{monorepo,engine,game,ci}. Steps point to its §s.
- .agents/AGENTS.md — owner rules (scope @blublux/*, appIds com.blublux.*, English only,
  Conventional Commits, the §2.1 engineering principles). Plus the files each step names.
- For any Phaser 4 API not in the skill: pull live v4 docs via Context7 (resolve-library-id phaser →
  query-docs). NEVER use Phaser 3 memory.

DURABLE STATE:
- Maintain docs/2026-06-27_blublux-games_progress.md as the S1..S33 table (status | attempts | branch |
  SHA | note). On start/resume, READ it to know where you are. NEVER rely on the transcript for
  state — rely on this file.

SETUP (once, before S1):
1. Read the steps doc + the plan §4 + .agents/AGENTS.md + the skill's SKILL.md. Confirm
   docs/2026-06-27_blublux-games_progress.md is seeded S1..S33 = pending (create from the tracker if missing).
2. Review routing PER AREA (confirm what's available; fall back to a FRESH reviewer subagent + the
   checklist in REVIEW if a named reviewer is absent):
     - monetization / consent / privacy diffs → a security-grade review (/security-review if present):
       S5 (ads-adapter + UMP), S6 (IAP), S7 (analytics consent), S14/S23/S25 (monetization wiring),
       S30 (Data Safety/consent), S31 (signing/secrets), S33 (submission).
     - pure-model diffs → /code-review (engineering:code-review) with EXTRA emphasis on model purity,
       determinism, TDD: S2, S9, S10, S11, S20, S21.
     - everything else → /code-review, else a FRESH reviewer subagent + the checklist below.
   Record the mapping in the progress file.
3. Confirm the verify commands run in this repo: `pnpm install`, `pnpm turbo run typecheck lint test
   build`, per-package `pnpm --filter @blublux/<pkg> test`, `vite build [--mode native]`, `npx cap
   sync android`, `./gradlew bundleRelease`, `npx playwright test`, plus the model-purity greps. For
   S1, create the repo (the step does this), then the integration branch `blublux-games/main` off the
   initial commit (git worktree if supported).

THE LOOP — drive the steps as a DAG, not a flat list. A step is ELIGIBLE when all prerequisites are
"passed". Dispatch INDEPENDENT eligible steps (disjoint file sets, no edge) CONCURRENTLY; SERIALIZE
steps joined by an edge or that edit the same files. Known parallel sets:
{S2,S3,S4} after S1; {S5,S6,S7,S8} after S3; {S10,S11} after S9; the two pure-model tracks
{S9..S11} ∥ {S20,S21}; {S16,S17,S18} after S15; the three app tracks {P4 ∥ P6 ∥ P7} after S15;
{S27,S28,S29} after the apps. For each step in flight:

1) DISPATCH WORKER (a FRESH subagent every time — the main context-hygiene mechanism):
   - From blublux-games/main, create branch blublux-games/S<N> (worktree if supported).
   - Spawn a worker whose prompt is:
       "Read .agents/AGENTS.md, the phaser4-game-factory references the step names, and the files named in
        the step FIRST. Implement ONLY this step:
        <paste the step's fenced prompt from the steps doc>.
        Before editing, write a short plan; if a plan-review tool exists, get feedback and revise;
        then act. Honor the project rules the step restates (MODEL PURITY — no phaser/DOM/Date.now/
        Math.random in model code; VIEW THINNESS; THEME = config only; DI via composition root, no
        new SDK in model/scene; DRY — no copy-paste into apps/*; TDD — test first for model logic;
        UMP gates ad LOADING; base:'./' native; a11y symbol-per-color; analytics post-consent;
        original assets only).
        For any Phaser 4 API, query Context7 (phaser v4) — never v3 memory.
        Run `pnpm turbo run typecheck lint` (and the package's `test`) before committing.
        Then RUN this step's Verify block yourself and paste the ACTUAL command output:
        <paste the step's Verify block>.
        Commit on blublux-games/S<N>: stage files BY NAME, Conventional Commits, don't bypass hooks,
        never force-push. Keep context lean. Report: files changed, concise diff summary, Verify
        output (pass/fail), anything unsatisfied."
   - The worker MUST actually run the verification and paste output. If Verify fails, it fixes until
     green or reports a concrete blocker.

2) REVIEW (a FRESH subagent, routed by area per SETUP step 2):
   - "Review the diff of blublux-games/S<N> vs blublux-games/main. Judge: correctness; the project
      rules (MODEL PURITY — grep for phaser/Date.now/Math.random in any model/ dir = FAIL;
      DETERMINISM via seeded Rng; THEME/CONFIG-ONLY for reskins — a reskin diff touching
      packages/engine-* = FAIL; DI — concrete SDK imports only in composition-root.ts; UMP loading
      gate intact; a11y symbol-per-color; base:'./' native; original assets); security at the
      ads/IAP/consent/secrets boundaries; test adequacy (TDD — were the tests written and do they
      drive the code?); and whether the Verify block GENUINELY passed (solvability ≥1000 seeds/tier
      not weakened; no skipped checks). Return `VERDICT: PASS` or `VERDICT: CHANGES_REQUESTED` then
      numbered file:line issues. Do NOT fix anything."

3) FEEDBACK LOOP:
   - PASS and Verify green → merge blublux-games/S<N> into blublux-games/main, record SHA + "passed"
     + any CARRY-FORWARD note in the progress file, go to (4).
   - CHANGES_REQUESTED → fresh fix worker (branch diff + the numbered issues): "Address these, re-run
     Verify, paste output." Then back to (2). Cap 3 cycles/step.
   - After 3 failed cycles, a worker blocker, or a step needing a product/human decision → set the
     step "blocked" with the reason, STOP, surface a concise summary. Do not start dependents.

4) CONTEXT HYGIENE + ADVANCE:
   - Update the progress file (status, SHA, one-line note, append to Log). Compact your own context
     (durable state is the progress file, not the transcript). Move to the next eligible step(s).

HARD GATES (never violate):
- Respect the dependency graph; run independent steps in parallel; NEVER run two steps that edit the
  same files at once (e.g. two reskin steps both editing ThemePicker.ts — serialize their one-line
  registration edits). Honor the CARRY-FORWARDs: Rng/Clock seams (S2 → every model+view); game-shell
  (S13 → S14/S23/S25); engine-sort view hook (S12 → S16/S17/S18); engine-block view (S22 → S25);
  the S10 generator + S11 solver cross-check.
- Never proceed past a step that isn't "passed"; never skip a Verify; never weaken a project rule,
  the solvability tolerance, or the UMP gate to pass a check — escalate to me.
- STOP and require my explicit "go" at these inline gates:
    • S15 — ⛔ REVIEW GATE: after Butterfly is playable native+web with a signed AAB and the checklist
      passes, STOP for my human review of the REFERENCE SLICE before any reskin (S16+) or block
      view/app (S22+). This is the cheapest course-correction point.
    • S31 — GATED: the release pipeline needs HUMAN-SUPPLIED secrets (upload keystore, Play
      service-account JSON, Sentry token, AdMob ids, RevenueCat keys). Do NOT fabricate or auto-run
      the live upload — request them, configure, dry-run.
    • S32 — ⛔ HUMAN SIGN-OFF: device QA on a real low-end Android. Needs a device + live-ish services;
      I record a written GO/NO-GO. Do not run in an unattended loop.
    • S33 — ⛔ DESTRUCTIVE/PAID: web deploy + staged Play store submission. IRREVERSIBLE on the store
      side; I authorize/perform every submission. Never auto-submit.
- Deferred-verification steps (S15/S24/S26 AAB signing needs a keystore; S31 secrets; S32 device;
  S33 store/billing) need live infra/paid ops — list them in the progress file's deferred gate and
  run them only with my authorization. Dev uses Google TEST ad ids + RevenueCat sandbox throughout.

Begin with SETUP, then S1. Report a one-line status after each step; keep prose minimal.
```

---

## Caveats (read before running)
1. **Review entry points.** Confirm `/code-review` (or the `engineering:code-review` skill) and a security review path exist; if not, the orchestrator uses a fresh reviewer subagent with the inline checklist. The security routing (ads/IAP/consent/secrets/submission) is load-bearing — those diffs must get a security-grade review, because a consent/UMP mistake suspends the AdMob account.
2. **The S15 review gate is deliberate.** It's the one moment to fix the engine→view→adapter→monetization shape before three apps copy it. Butterfly is the reference slice; do not let the run scale past it without your sign-off.
3. **Model-purity is checkable, so check it every step.** The reviewer greps `packages/engine-*/src/model` for `phaser`/`Date.now`/`Math.random`; a hit is an automatic CHANGES_REQUESTED. Same for reskin DRY: a reskin diff touching the shared engine fails.
4. **Branch + worktree per step** gives each review a clean scoped diff and lets a failed step be discarded without unwinding others. `blublux-games/main` is the merge target; the project reaches a release via the S31 pipeline + S33 submission, not a mid-run deploy.
5. **Fresh subagents** are the context-hygiene win — each worker/reviewer starts clean and short-lived; the orchestrator compacts between steps, durable state in the progress file.
6. **Parallelism is real but bounded.** Dispatch the disjoint sets concurrently (the two pure-model engines especially overlap with the sort UI work), but never two steps touching the same file — the reskins share `ThemePicker.ts`, so serialize their registration edits even though their theme folders are disjoint.
7. **Hand the gate-free heavy-parallel segments to the workflow if you want.** Per the "Both" decision, [[2026-06-27_blublux-games_workflow]] runs P1 (S1–S8), the two model packages (S9–S11 ∥ S20–S21), and the reskins (S16–S19) as background dynamic workflows; the orchestrator still owns the gated slice (S12–S15), the block/beaver apps, and P8.

## Optional: PR/issue-board mode
If you'd rather run this through GitHub issues/PRs: file each S<N> as an issue whose body is the step's fenced prompt, drive implement → PR → review → fix → re-review with the same routing. Same steps, same reviewers, async and visible. Pick one runner per change.
