# Template — `<slug>-orchestrator-prompt.md` (driver B: in-context subagent orchestrator)

A paste-ready orchestrator prompt that runs the steps via fresh **worker** and **reviewer**
subagents, with a worker→reviewer→fix loop, hard gates, and a durable progress file. This is the
**in-context** driver: the orchestrator holds the loop in its own session, so — unlike a dynamic
workflow — it can **stop mid-run at a human gate, take your "go", and continue in the same session**.
Reach for it when the change needs a human in the loop inline, when you want turn-by-turn control, or
when dynamic workflows aren't available. (See the decision tree in `SKILL.md`; for a gate-light
change where you want maximum parallelism with the loop out of context, use `workflow-template.md`.)

**Placeholders to fill before pasting:** `<slug>`, `<change title>`, `<flag>`, the step range
`S1..S<n>`, the rules-doc path, the diff-area → reviewer mapping (SETUP step 2), the discovered
verify/codegen commands, and the specific destructive/sign-off step numbers (HARD GATES).

**How to use:** fill the placeholders, then paste the fenced block into an agent session at the repo
root. Read the **Caveats** first. To make it a reusable command, drop the fenced block into your
agent's command/skill location and invoke it by name.

---

```
You are the ORCHESTRATOR for the <change title> (<slug>). You do NOT write feature code yourself —
you drive worker and reviewer SUBAGENTS through the numbered steps and keep your own context small.

SOURCES OF TRUTH (read first; do not duplicate them wholesale into your context):
- <slug>-implementation-steps.md — steps S1..S<n>, each a ready prompt + a Verify block + a
  dependency graph. This is the script you execute.
- <slug>-plan.md — rationale + the decided design forks (§4).
- <the repo's rules doc, e.g. CLAUDE.md / AGENTS.md / CONTRIBUTING.md> — project rules. Plus the
  files each step names.

DURABLE STATE (so a context compaction never loses your place):
- Maintain <slug>-progress.md as a table of S1..S<n>: status (pending|in_progress|passed|blocked),
  attempts, branch, commit SHA, one-line note. On start or resume, READ this file to know where you
  are. NEVER rely on your transcript for state — rely on this file.

SETUP (once, before S1):
1. Read the steps doc + the rules doc. Seed <slug>-progress.md with S1..S<n> = pending.
2. Confirm the review entry point(s) and which you'll use PER AREA:
   - <if the repo ships review agents/skills, list the diff-type → reviewer mapping here, e.g.
     "schema/migration diff → <schema-review agent>; security-sensitive diff → <security reviewer>">
   - otherwise: a built-in `/review` if present, else a FRESH reviewer subagent with the checklist
     in the REVIEW step below.
   Record the mapping. If a needed reviewer is missing, note it and fall back to the checklist.
3. Confirm the verification commands from the steps doc actually run in this repo (the discovered
   test/build/lint invocations). Create a git worktree (if supported) and an integration branch
   `<slug>/main` off the current HEAD.

THE LOOP — drive the steps as a DAG, not a flat list. A step is ELIGIBLE when all its prerequisites
are "passed". Dispatch INDEPENDENT eligible steps (disjoint file sets, no dependency edge)
CONCURRENTLY — several worker subagents in flight at once; SERIALIZE steps joined by an edge or that
edit the same files (concurrent edits to one file collide on the integration branch). For each step
in flight:

1) DISPATCH WORKER (a FRESH subagent every time — the main context-hygiene mechanism):
   - From the integration branch, create `<slug>/S<N>` (in a worktree if supported).
   - Spawn a worker subagent whose prompt is:
       "Read the rules doc and the files named in the step first. Implement ONLY this step:
        <paste the step's prompt text from <slug>-implementation-steps.md>.
        Before editing, write a short plan (and, if an advisor/plan-review tool exists, get feedback
        on it and revise). Then act.
        Honor the project rules the step touches (restated in the step prompt).
        Run the codegen/build trigger if the step hits it (<the discovered regen/lint cmds>).
        Then RUN this step's Verify block yourself and paste the ACTUAL command output:
        <paste the step's Verify block>.
        Commit on `<slug>/S<N>`: stage files BY NAME (not add-all), use the repo's commit convention,
        don't bypass hooks, never force-push.
        Keep your context lean; compact during a long fix.
        Report back: files changed, a concise diff summary, the Verify output (pass/fail), and
        anything you could not satisfy."
   - The worker must actually run the verification and paste output. If Verify fails, it fixes until
     green or reports a concrete blocker.

2) REVIEW (a FRESH subagent, the reviewer chosen by the diff's area from SETUP step 2):
   - Spawn a reviewer subagent: "Review the diff of branch `<slug>/S<N>` vs `<slug>/main`. Judge:
     correctness, security at trust boundaries, the project rules (<name the load-bearing ones>),
     test adequacy, and whether the Verify block genuinely passed. Return a verdict line
     `VERDICT: PASS` or `VERDICT: CHANGES_REQUESTED` then a numbered list of specific, actionable
     issues with file:line. Do NOT fix anything. Compact if your context grows."

3) FEEDBACK LOOP:
   - PASS and Verify green → commit `<slug>/S<N>`, rebase/merge onto `<slug>/main`, record SHA +
     "passed" in the progress file, go to (4).
   - CHANGES_REQUESTED → dispatch a fix worker (fresh subagent given the branch diff + the reviewer's
     numbered issues): "Address these review issues, re-run the Verify block, paste output." Then
     back to (2). Cap at 3 review cycles per step.
   - After 3 failed cycles, OR a worker blocker, OR a step needing a human/product decision → set the
     step "blocked" with the reason in the progress file, STOP, and surface a concise summary to me.
     Do not start later steps.

4) CONTEXT HYGIENE + ADVANCE:
   - Update <slug>-progress.md (status, SHA, one-line note, append to the Log).
   - Compact your own context (your durable state is the progress file, not the transcript).
   - Move to the next eligible step.

HARD GATES (never violate):
- Respect the dependency graph — start a step only when its prerequisites are "passed"; run
  independent steps (disjoint files, no edge) in parallel; never run two steps that edit the same
  files at once.
- Never proceed past a step that isn't "passed"; never skip a Verify; never weaken a project rule to
  pass a check — escalate to me instead.
- STOP and require my explicit "go" before any DESTRUCTIVE step (file/data deletes, infra
  decommission, secret rotation, irreversible migration) and before any HUMAN-SIGN-OFF step
  (validation/dogfood/load test). Never auto-run a paid operation, a deploy, or a production
  migration — surface that I must run/authorize them.
- <List the specific destructive/sign-off step numbers here, e.g. "S8 is a HUMAN sign-off and S9 is
  DESTRUCTIVE — STOP before S9 and require my explicit go.">

Begin now with SETUP, then S1. Report a one-line status after each step; keep prose minimal.
```

---

## Caveats (read before running)

1. **Review entry points.** The prompt has the orchestrator confirm them in SETUP. Point each diff
   area at whatever the repo ships (a review agent/skill, a `/review` command, or the fallback
   reviewer-subagent checklist). Don't assume an agent exists — check.
2. **Branch + worktree per step** gives review a clean, scoped diff and lets a failed step be
   discarded without unwinding others. The integration branch `<slug>/main` is the merge target; the
   change reaches the trunk via a normal PR at the end. If the repo's workflow doesn't use worktrees,
   plain branches are fine.
3. **Fresh subagents are the real context-hygiene win** — each step's worker/reviewer starts clean
   and stays short-lived. The orchestrator's own compaction between steps, backed by the progress
   file as durable state, is the reliable part.
4. **Fix worker = fresh by default.** One-shot subagents mean the fixer is a fresh worker given the
   branch diff + the review issues (same outcome). If your environment can resume a prior agent with
   its context, the prompt may do that instead.
5. **Deferred gate.** Steps whose Verify needs live infra, a deploy, paid calls, or a production
   migration can't be fully run in an offline loop — record them in the progress file's "Deferred
   verification gate" and run them, with human authorization, before the sign-off/destructive steps.

## Optional: PR/issue-board mode instead of the direct loop

If the repo runs a PR or issue-board pipeline you'd rather use: file each step as a ticket whose body
is the step's fenced prompt, then drive it through that pipeline (implement → PR → review → fix →
re-review). Same steps, same reviewers, but async and visible on the board. Pick one runner per
change.
