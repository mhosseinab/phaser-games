# Template — `<slug>-workflow.md` (driver A: Claude Code dynamic workflow)

The **driver** deliverable when you picked a dynamic workflow (SKILL.md Phase 4, decision-tree
branch 3). It explains how to execute the plan + steps as one or more Claude Code dynamic workflows.
Execution requires Claude Code v2.1.154+, a paid plan, and the Dynamic-workflows opt-in in `/config`.

You do **not** hand-write the workflow script. You describe the orchestration (a brief); the runtime
writes the script, shows you the planned phases to approve, runs it in the background, and lets you
save it to `.claude/workflows/` as a rerunnable `/<name>` command. The plan/steps/progress docs are
the spec it executes.

**Placeholders to fill before this doc is usable:** `<slug>`, the segment boundaries (Step 1), the
integration branch name, the per-area reviewer checklist (Step 2), and the discovered build/test
commands the subagents will run.

> Why a workflow fits: it runs "independent agents [that] adversarially review each other's findings
> before they're reported" and "moves the plan into code", so the loop, branching, and intermediate
> state stay out of the model's context. That is exactly the worker→reviewer→fix loop.
> Source: https://code.claude.com/docs/en/workflows

## The two constraints that shape the run

A workflow **cannot pause for human input mid-run** ("for sign-off between stages, run each stage as
its own workflow"), and the workflow script has **no direct filesystem or shell access** — only its
subagents read, write, build, test, and commit. So:

- **Every human-sign-off and every destructive/irreversible step is a WORKFLOW BOUNDARY, not an
  in-run stop.** Split the step list into segments at the gates; each segment is one run; you review
  the result + the progress doc, then *manually launch* the next segment.
- **Nothing irreversible runs inside an unattended segment.** Deletes, decommissions, secret
  rotation, a production migration, a deploy, a paid eval — each is its own explicitly-launched,
  single-purpose run (or a manual command), never a step a loop crosses on its own.

## Step 1 — Partition the steps into segments at the gates

Take the dependency graph from `<slug>-implementation-steps.md` and cut it at every:

- human-sign-off step (validation / dogfood / load test),
- destructive step (deletes, decommission, secret rotation, prod data migration),
- paid or live operation that needs explicit authorization (a deploy, a paid eval).

Each contiguous run of auto-runnable steps **between** gates is one segment → one workflow.

```
Steps:   S1 S2 S3 S4 S5 │ S6(sign-off) │ S7(destructive) │ S8(flip)
Segments:└── workflow 1 ─┘   (human go)    (human go)         workflow 2
```

Workflow 1 builds + lands S1–S5 and **ends before** the sign-off. You read its report and the
progress doc, give the go, run the validation (itself a small workflow or manual), then launch the
decommission as its own approved run, and so on.

## Step 2 — Launch a segment with a brief (the runtime writes the script)

For each segment, start a workflow by pasting a brief after the `ultracode:` keyword — or just ask
in your own words ("use a workflow to…"). Claude writes the script; approve the planned phases; watch
with `/workflows`. When a run does what you want, save it (`/workflows` → select the run → `s` →
`.claude/workflows/` for the repo, or `~/.claude/workflows/` for just you) so it becomes
`/<slug>-seg1` for reruns.

A good segment brief tells the runtime to:

1. Read `<slug>-implementation-steps.md`, `<slug>-plan.md`, and the repo's rules doc.
2. Drive the segment's steps as a **DAG** using the dependency graph — **respect the sequence, but
   exploit parallelism**:
   - A step is **eligible** once all its dependency-graph prerequisites are `passed`.
   - Run **eligible steps with disjoint file sets in parallel**, each on its own branch, up to the
     runtime's concurrency cap — independent tracks should overlap, not wait. This is where a
     workflow beats a serial orchestrator.
   - **Serialize** steps joined by a dependency edge, and any two steps that touch the **same files**
     (concurrent edits to one file collide on the integration branch — even if the graph leaves them
     unordered, file overlap forces a sequence).
   - Each step runs the full loop below and merges on PASS before its dependents become eligible.

   Per step, the workflow spawns:
   - **Worker subagent** — implement ONLY this step (its prompt from the steps doc), restate the
     project rules it touches, run any codegen/build trigger, **run the step's Verify block and
     capture the actual output**, and commit on a per-step branch off the integration branch.
   - **Reviewer subagent** — review the step's branch diff against an **inline checklist**: a
     workflow can't target a named `.claude/agents/` reviewer, so paste the relevant checks into the
     prompt (named review agents are the in-context orchestrator's advantage). Return `VERDICT: PASS`
     / `CHANGES_REQUESTED` + numbered `file:line` issues; it does not fix. For high-stakes steps,
     use the **3-vote consensus** review in `workflow-patterns.md` (Pattern 4).
   - **Fix loop** — on `CHANGES_REQUESTED`, a fresh subagent addresses the issues, re-runs Verify,
     re-reviews; cap at 3 cycles, then stop the segment and report the step blocked.
   - On PASS, merge the step branch into the integration branch and have a subagent **append the
     result (status, SHA, one-line note) to `<slug>-progress.md`**.
3. Stop at the segment's last step and surface a summary. **Do not cross into the next (gated)
   segment.**

This is the adversarial worker/reviewer pattern the workflow runtime is built for — the loop, the
3-cycle cap, and the merge all live in the script the runtime writes from this brief.

## Step 3 — Honor the runtime's behavior and limits

| Documented behavior | What to do |
|---|---|
| **No mid-run user input** | Gates = segment boundaries (Step 1). Never await a human inside a run. |
| **Script has no FS/shell** | All edits/builds/tests/commits/`git` happen **inside subagents** — that's why each step's Verify is run by its worker and pasted back. |
| **Subagents run in acceptEdits + inherit your tool allowlist; file edits auto-approve** | **Pre-add** the commands subagents need (test, build, lint, `git`, any CLI) to your allowlist before a long run, so it doesn't stall on prompts. Non-allowlisted shell/web/MCP calls can still prompt mid-run. |
| **≤16 concurrent subagents, ≤1000 per run** | **Parallelize independent steps** (disjoint files, no edge) per the graph; serialize dependent or file-sharing steps. Each step also spawns a reviewer (+ up to 3 fixers), which count toward the cap — keep effective fan-out well under 16. Add read-only parallel work (the current-state survey) on top. |
| **Resumable only within the same session** (exit = fresh next session) | Keep `<slug>-progress.md` as the **cross-session** source of truth (a subagent updates it each step). In-session, `/workflows` → `p` resumes; cached results aren't re-run. |
| **Cost scales with subagent count** | Gauge spend on a small slice first (one directory / a 2–3 step segment). `/workflows` shows per-subagent tokens; `x` stops without losing completed work. Route light stages to a smaller model in the brief. |

## Step 4 — Inputs via `args`

A saved segment workflow can take `args` (read as a global; structured data, or `undefined` if
omitted). Parameterize the slug, the step range, and the integration branch so you rerun a segment
without editing the script — e.g. "Run `/<slug>-seg1` on steps S3–S5".

## Approval & control quick reference

- **Launch approval**: default/acceptEdits prompt every run (until "don't ask again for this
  workflow in this project"); auto mode prompts first launch only; `bypass` / `claude -p` / Agent
  SDK never prompt. `Ctrl+G` opens the script; `Tab` lets you adjust the brief first.
- **Watch / control**: `/workflows` → select a run → `p` pause/resume, `x` stop a subagent or the
  run, `r` restart a subagent, `s` save the script.
- **Disable**: toggle Dynamic workflows in `/config`, or `"disableWorkflows": true` in settings, or
  `CLAUDE_CODE_DISABLE_WORKFLOWS=1`.

A built-in example to study first: run `/deep-research <question>` to watch the
worker→cross-check→synthesize shape before launching your own.

## Done-when (this driver doc is finished)

- [ ] Segments are drawn, with each gate (sign-off / destructive / paid) as a boundary.
- [ ] A reusable segment brief is written, with the inline reviewer checklist filled in.
- [ ] The allowlist of build/test/`git` commands the subagents need is listed for the user to pre-add.
- [ ] The progress file is named as the cross-session source of truth the workflow updates per step.
