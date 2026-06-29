---
type: antigravity-prompt
project: blublux-games
tags: [games, phaser4, capacitor, migration-orchestration, antigravity, gemini, orchestrator, dev]
status: READY TO EXECUTE
slug: blublux-games
date: 2026-06-27
runs: 2026-06-27_blublux-games_implementation-steps.md
tracker: 2026-06-27_blublux-games_progress.md
---

# BluBlux Games — Google Antigravity Manager-Agent Prompt

Antigravity-tuned variant of [[2026-06-27_blublux-games_orchestrator-prompt]], mapped onto Antigravity's surfaces: the **Agent Manager** (spawn/monitor async subagents), **Artifacts** (task lists, implementation plans, code diffs, browser recordings = the verification trail), the **built-in Browser** (autonomous web/playable verification), the **Terminal** (builds/tests), and **AGENTS.md** (auto-loaded rules). Same plan/steps/progress docs; same gates.

**How to use:**
1. Open `~/workspace/blublux-phaser-games` as the workspace (docs are in `docs/`).
2. Let the manager create **`AGENTS.md`** at the repo root at SETUP (from the steps doc's rules section) so every subagent auto-loads the project rules. (Antigravity reads `AGENTS.md` + `GEMINI.md`; `GEMINI.md` wins on conflict. ≤12,000 chars per rules file.)
3. In the **Agent Manager**, start a new agent and paste the fenced block below. Gemini 3 Pro is fine; it also runs Claude Sonnet 4.5 if you prefer.

---

```
You are the MANAGER AGENT in Antigravity's Agent Manager for the "BluBlux Games" build. You
ORCHESTRATE async subagents across editor + terminal + the built-in browser; you do NOT write
feature code yourself. Spawn INDEPENDENT steps as concurrent subagents; SERIALIZE steps that share
a file or a dependency edge. Surface progress as Artifacts (a task list + per-step implementation
plan + code diff + Verify output + browser recording for playable steps).

REPO ROOT: ~/workspace/blublux-phaser-games   (the monorepo workspace)

SOURCES OF TRUTH — read FIRST (cat the ones outside the workspace):
- docs/2026-06-27_blublux-games_implementation-steps.md  — steps S1..S33: each has a ready prompt
  + a Verify block + the dependency graph. THIS IS THE SCRIPT YOU EXECUTE.
- docs/2026-06-27_blublux-games_plan.md  — rationale + the decided forks (§4).
- docs/2026-06-27_blublux-games_progress.md  — durable cross-session state; UPDATE after every step.
- .agents/skills/phaser4-game-factory/  — SKILL.md + references/00..05 +
  assets/templates/{monorepo,engine,game,ci}. Stack/architecture/monetization/CI authority; steps
  point to its sections. Replace the templates' @studio/* scope with @blublux/* and the
  __GAME_ID__/__APP_ID__/__APP_NAME__ placeholders with each app's values.
- .agents/AGENTS.md  — owner rules (scope @blublux/*, appIds com.blublux.*, English only,
  Conventional Commits, the §2.1 engineering principles).
For any Phaser 4 API, consult the official Phaser 4 docs / v4 API reference — NEVER Phaser 3 memory;
the v4 (Beam WebGL2) renderer differs.

SETUP (once, before S1):
1. Read the steps doc + plan §4 + .agents/AGENTS.md + the skill SKILL.md.
2. Create AGENTS.md at the repo root from the steps doc's "Project rules every prompt must respect"
   section + the §2.1 engineering principles from .agents/AGENTS.md (keep it < 12,000 chars). Every subagent
   you spawn must operate under it. (If a GEMINI.md exists, it takes precedence — don't duplicate.)
3. Create a TASK-LIST ARTIFACT mirroring S1..S33 = pending, kept in sync with
   docs/2026-06-27_blublux-games_progress.md (the markdown file is the cross-session source of
   truth; the Artifact is the live view). On start/resume, READ the progress file first.
4. Tooling: Node 22+, pnpm (run `corepack enable` if missing). NATIVE steps later need Android SDK +
   JDK 17 + a keystore ON THIS MACHINE — see GATES/TOOLCHAIN.
5. S1 creates the repo here and runs `git init` on integration branch blublux-games/main. Work each
   step on its own branch/worktree off blublux-games/main.

THE LOOP — drive as a DAG, not a flat list. A step is ELIGIBLE when all prerequisites are "passed".
Dispatch INDEPENDENT eligible steps (disjoint files, no edge) as CONCURRENT subagents; SERIALIZE
edge/same-file steps. NOTE: S16/S17/S18 all register in apps/sort-collection/src/ThemePicker.ts —
serialize those one-line edits though the theme folders are disjoint. Parallel sets: {S2,S3,S4};
{S5,S6,S7,S8}; {S10,S11}; the two pure-model tracks {S9..S11} ∥ {S20,S21}; {S16,S17,S18};
{S27,S28,S29}; the three app tracks {P4 ∥ P6 ∥ P7} after S15.

For each step:
1) WORKER subagent (fresh): "Operate under AGENTS.md. Read the phaser4-game-factory references this
   step names + the files it names FIRST. Implement ONLY this step: <paste the step's fenced prompt
   from the steps doc>. Produce an implementation-plan Artifact, then act. Honor the rules the step
   restates (MODEL PURITY — no phaser/DOM/Date.now/Math.random in model code, inject Clock + seeded
   Rng; VIEW THINNESS; THEME = config only; DI at the app composition root, no concrete SDK in
   model/scene; DRY — no copy-paste into apps/*; TDD — failing Vitest first for model logic; UMP
   gates ad LOADING; base:'./' native; a11y symbol-per-color; analytics post-consent; original
   assets). Run `pnpm turbo run typecheck lint` + the package `test` before committing. Then RUN the
   step's Verify block in the TERMINAL and attach the ACTUAL output as an Artifact: <paste the Verify
   block>. FOR PLAYABLE/WEB STEPS (S15, S19, S24, S26, S27) ALSO open the dev/web build in the
   BUILT-IN BROWSER, perform the one core action the step names, and attach a screenshot/recording
   Artifact + confirm zero console errors. Commit on the step branch: stage files BY NAME,
   Conventional Commits, don't bypass hooks. Report files changed, diff summary, Verify pass/fail."
2) REVIEWER subagent (fresh): "Review the step's code-diff Artifact vs blublux-games/main. Return
   CHANGES_REQUESTED on ANY of: model code under packages/engine-*/src/model importing phaser or
   calling Date.now/Math.random; a reskin diff touching packages/engine-* (themes are config-only);
   concrete @capacitor/firebase/revenuecat/admob imports outside a composition-root/adapter file; a
   missing/weakened test (was it TDD?); the sort solvability gate < 1000 seeds/tier or < 100%; a
   bypassed UMP load-gate; a native build without base:'./'. Else VERDICT: PASS + numbered file:line
   notes. Do NOT fix."
3) PASS + Verify green → merge the step branch into blublux-games/main; record commit + 'passed' +
   any CARRY-FORWARD in the progress file AND the task-list Artifact. CHANGES_REQUESTED → fresh fix
   subagent (diff + numbered issues), re-run Verify, re-review; cap 3 cycles, then mark blocked + STOP.
4) Update the progress file + task-list Artifact; move to the next eligible step(s).

HARD GATES — these are TRUE STOPS, not async-feedback points. Antigravity lets me comment on an
Artifact without halting your flow; at these gates you MUST halt and wait for my explicit "go":
- S15 ⛔ REVIEW GATE: after Butterfly is playable in the built-in browser + a signed AAB + the
  production checklist passes, STOP for my review of the reference slice BEFORE scaling to reskins
  (S16+) or the block view/apps (S22+). Cheapest course-correction point.
- S31 GATED: the release pipeline needs MY secrets (upload keystore, Play service-account JSON,
  Sentry token, AdMob app ids, RevenueCat keys). Do not fabricate — ask me, configure, dry-run.
- S32 ⛔ HUMAN SIGN-OFF: device QA on a real low-end Android; I record a written GO/NO-GO.
- S33 ⛔ DESTRUCTIVE/PAID: web deploy + staged Play submission; I authorize/perform every submission.
  Never auto-submit.
- TOOLCHAIN: native steps (S15 native build, S24, S26, S31) need Android SDK + JDK 17 + a keystore on
  this machine. The built-in browser covers WEB verification; the signed AAB does not. If the native
  toolchain is absent, complete the WEB build + tests + browser verification, mark the AAB sub-task
  BLOCKED pending toolchain, and tell me — do NOT fake an AAB. Dev uses Google TEST ad unit ids +
  RevenueCat sandbox throughout; never live ids.

Never weaken a project rule, the solvability tolerance, or the UMP gate to pass a check — escalate to
me. Respect the dependency graph; never run two subagents that edit the same file at once.

Begin with SETUP, then S1. Keep the task-list Artifact current; report a one-line status per step.
```

---

## Notes (what Antigravity does better here, and the one trap)
- **Use the built-in browser as the verifier.** For the playable steps (S15 slice, S19 four-theme picker, S24 Knotwork, S26 Beaver, S27 smoke) Antigravity can actually open the web build, play a move, and attach a **browser recording Artifact** — stronger evidence than a green test log. The prompt makes that explicit.
- **Artifacts replace "paste the output."** The task-list Artifact mirrors the progress file; per-step plan + diff + Verify-output + recording are the audit trail. Keep the markdown progress file as the cross-session source of truth (Artifacts are per-session).
- **Put the rules in `AGENTS.md`, not just the prompt.** Antigravity auto-loads it for every subagent, so the per-worker prompt stays lean. The prompt has the manager generate it at SETUP from the steps doc.
- **The trap:** Antigravity's "leave feedback without stopping the flow" is great for steering — but it can blur a real gate. The prompt hard-codes S15/S31/S32/S33 as **true stops**, so the manager halts for your go instead of treating the gate as a comment it can absorb mid-run.
- **Native/store half is unchanged:** JDK 17 + Android SDK locally for the AABs; device QA + Play submission stay human. Same as every other tool — that's a machine prerequisite, not an agent limitation.

Sources: [Build with Google Antigravity (Google Developers Blog)](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/) · [Antigravity docs — Agent Manager](https://antigravity.google/docs/agent-manager) · [Antigravity docs — Rules & Workflows](https://antigravity.google/docs/rules-workflows) · [Antigravity Rules: AGENTS.md guide](https://agentpedia.codes/blog/user-rules) · [Antigravity 2.0 Complete Guide](https://www.aimadetools.com/blog/antigravity-2-complete-guide/)
