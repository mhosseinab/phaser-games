# Template — `<slug>-progress.md` (durable state)

The driver's memory (SKILL.md Phase 5). It exists so a context compaction or a fresh session never
loses the place: state lives in this file, **never** in a transcript.

**How to use:** seed this at SETUP with every step `pending`, update the row after each step, and
append a Log line. On start/resume, READ this file first. Both drivers use it — the orchestrator
writes it inline, the workflow has a subagent append to it after each merged step.

---

```markdown
# <Change title> — Orchestration Progress

**Durable state for the driver.** On start/resume, READ this file to know where you are.
Source script: `<slug>-implementation-steps.md` (S1..S<n>).
Worktree: `<path>` · Integration branch: `<slug>/main`
Review routing: <diff-type → reviewer mapping you confirmed at SETUP, or "fresh reviewer subagent +
checklist">.

## Rules in force
- Respect the dependency graph: start a step only when its prerequisites are `passed`; run
  independent steps (disjoint file sets, no edge) in parallel; never let two steps edit the same file
  concurrently.
- Cap 3 review cycles per step → else mark `blocked`, stop, surface a summary.
- STOP before destructive steps and human-sign-off steps; require an explicit "go".
  <Name them: "S<k> = human sign-off. S<k+1> = DESTRUCTIVE (deletes …) — require go.">
- Never auto-run paid/live operations (a deploy, a production migration, a paid eval, secret
  rotation).

## ⚠️ Deferred verification gate (run before the sign-off / destructive steps)
> Steps whose Verify needs live infra, a deploy, paid calls, or a production migration can't be fully
> run in an offline loop. List them here so they're not forgotten — they prove the change WORKS
> end-to-end, not just that the code compiles.
- S<k>: <command/scenario that needs live infra>.
- S<k>: <the validation that proves the behavior on real data/load>.
- S<k>: <the paid/quality gate — run AFTER the relevant steps land>.

## Status table

| Step | Title | Status | Attempts | Branch | Commit SHA | Note |
|------|-------|--------|----------|--------|-----------|------|
| S1 | <title> | pending | 0 | — | — | |
| S2 | <title> | pending | 0 | — | — | |
| …  | … | pending | 0 | — | — | |

> Status values: pending | in_progress | passed | blocked. The Note is one line: review outcome,
> test count, any CARRY-FORWARD for a later step (a constraint a downstream step must honor), and why
> a blocked step is blocked.

## Dependency graph
\```
<paste the graph from the steps doc>
\```

## Log
> Append-only. One line per state change: what passed/blocked, merge SHA, what's next.
- <date>: SETUP done. Worktree + integration branch created, progress seeded. Next: S1.
- <date>: S1 PASSED (1 cycle, <reviewer>). Merged <sha> → <slug>/main. Next: S2 (depends S1 ✓).
```

---

## Why the table columns are what they are

| Column | Pulls its weight by… |
|---|---|
| Status | the driver's gate: a step runs only when its deps are `passed` |
| Attempts | surfaces a thrashing step before it hits the 3-cycle cap |
| Branch | where the work is, for a re-review or a discard |
| Commit SHA | the merge point on the integration branch — the audit trail |
| Note | carries **CARRY-FORWARD** constraints between steps (the thing a downstream step must not assume), which is where multi-step changes silently break |

## The two patterns that make this durable

- **State in the file, not the transcript.** After every step the driver writes the row and a Log
  line, then compacts. A crashed or compacted session resumes by reading this file — nothing is lost.
- **CARRY-FORWARD notes.** When a step establishes a constraint a later step must honor (an edge
  case, a "caller must flush/commit", a "still validate these inputs"), record it in the Note column
  and repeat it in the dependent step's Log line. These are what keep a long chain of steps coherent.
