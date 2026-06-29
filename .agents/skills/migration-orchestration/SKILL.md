---
name: migration-orchestration
description: >-
  Plan and orchestrate a LARGE, multi-step, multi-PR change in any codebase as a Claude Code
  dynamic workflow. Produces four hand-off documents — a plan (the *why*), independently
  verifiable step-by-step prompts (the *how*), a driver guide (a dynamic workflow OR an in-context
  subagent orchestrator, chosen by a decision tree), and a durable progress tracker. It discovers
  the target repo's own conventions at runtime (rules doc, build/test/lint commands, CI, codegen,
  review agents, branch/commit style), so it adapts to any stack. Use this whenever the user wants
  to scope, plan, sequence, de-risk, parallelize, or orchestrate a migration, refactor,
  decommission, re-architecture, schema change, dependency upgrade, or any multi-step feature too
  big for one PR — e.g. "plan the X migration", "how do we move Y off the server", "break this
  refactor into reviewable steps", "turn this into a workflow", "give me an execution plan with
  subagents", "stage the rollout for Z" — even if they never say "orchestrate" or "migration". Do
  NOT use it for a one-PR change (edit directly) or for executing one already-written step.
---

# Migration & Refactor Orchestration

Large changes succeed when they are **planned as a sequence of small, independently verifiable
steps** and **executed through a worker → reviewer → fix loop** backed by a **durable progress
file** — not when one agent tries to land a giant diff. This skill turns that method into four
hand-off documents plus a runnable driver, so a migration becomes reviewable, resumable, and
partly parallel.

Your output is **planning documents + a driver**, never hand-written production code. You write the
spec; the worker/reviewer subagents (a dynamic workflow, or an in-context orchestrator) write and
verify the code against it.

Two ideas carry the whole method — every rule below exists to protect one of them:

- **Standalone, independently verifiable steps.** Each step lands, verifies, and commits on its
  own. This is what makes review, rollback, and parallel attempts cheap. If a step can't be
  verified without the next one, the split is wrong.
- **State lives in a file, not a transcript.** The progress tracker is the source of truth, so a
  run resumes — and a *fresh* session picks up — without losing its place.

## Use this when / don't

**Use it when the user wants to:**

- plan or scope a large change — "plan the X migration", "re-architect Y", "decommission Z";
- break a change into ordered, reviewable, independently verifiable steps;
- get a workflow / subagent execution plan for a multi-step change;
- backfill a plan that already exists but lacks per-step prompts, a driver, or a progress tracker.

**Don't use it for:** a one-PR change (edit directly), or *running* a single already-written step.

## What you produce — the four deliverables

Write these to the repo's design-doc location, resolved deterministically: **`docs/` if it exists →
else the directory holding the rules doc (next to `CLAUDE.md` / `CONTRIBUTING.md`) → else a new
`docs/` at the repo root.** Name them after the change. `<slug>` = a short kebab id, e.g. `pg-partitioning`,
`auth-extraction`, `react-18-upgrade`.

| File | Role | Holds |
|---|---|---|
| `<slug>-plan.md` | **the why** | rationale, honest scope, current state (verified, `file:line`), target architecture, design forks resolved up front, phased rollout, decommission checklist, risks/rollback, acceptance criteria |
| `<slug>-implementation-steps.md` | **the how** | ordered `S1..Sn`, each a *standalone, independently verifiable* change with a Goal, a Depends-on, a paste-ready **prompt**, and a real **Verify block**; plus a dependency graph and the project rules every prompt restates |
| `<slug>-workflow.md` **or** `<slug>-orchestrator-prompt.md` | **the driver** | how to run the steps — a **dynamic workflow** (segmented at every gate) or an **in-context subagent orchestrator** (inline gates, turn-by-turn); pick via the decision tree below |
| `<slug>-progress.md` | **durable state** | the `S1..Sn` status table (status/attempts/branch/SHA/note), rules in force, deferred gates, dependency graph, append-only log |

Each deliverable has an annotated, fill-in template under `references/`. **Read the matching
template before you write that file** — they carry detail kept out of this overview:

- `references/plan-template.md`
- `references/steps-template.md`
- `references/workflow-template.md` — driver A: dynamic workflow
- `references/orchestrator-template.md` — driver B: in-context subagent orchestrator
- `references/workflow-patterns.md` — fan-out → refute → synthesize briefs for the grounding & planning phases
- `references/progress-template.md`

## Operating procedure

Work top-down. Each phase names what to **Do**, **How** (the tools/subagents to reach for), and the
**Done-when** bar that gates moving on. Don't advance on a half-finished phase: a vague plan
produces vague steps, and the cost compounds at every layer below it.

### Phase 0 — Confirm the change in one breath (with the human)

**Do:** state, in 2–3 sentences, the end state, *why now*, and — critically — an explicit *"what
does NOT change"* boundary. Resolve anything genuinely ambiguous, and escalate any
product/irreversible call, to the user **now**, not mid-build.
**How:** ask the user directly when scope, target, or a fork is unclear — guessing here is the
expensive mistake. A good boundary line spends as much ink on what stays as on what moves.
**Done when:** you can name the end state and the boundary in one breath, and no product or
irreversible fork is still open in your head.

### Phase 1 — Discover the repo's conventions (once, up front)

This is the phase that replaces hard-coded, project-specific knowledge — it's what lets the
generated docs stand alone for a worker that has only the repo + the docs.
**Do:** detect, from the real source (never assumption):

- **Rules doc / invariants** — `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `CONTRIBUTING.md`, `docs/`
  architecture notes, `ADR/`. These carry the "must not break" rules.
- **Build / test / lint / typecheck commands** — `package.json` scripts,
  `Makefile`/`Justfile`/`Taskfile`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `build.gradle`, and
  the **CI workflow** (`.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`). CI is the most
  reliable list of "what must pass". Record the exact invocations.
- **Codegen / generated artifacts** — anything a change must regenerate and commit (protobuf, ORM
  migrations, GraphQL/OpenAPI types, project files). A step touching the source MUST run the regen.
- **Review setup** — review subagents/skills/commands, `CODEOWNERS`, PR templates.
- **Branch / commit / PR conventions** — Conventional Commits? a trailer? squash vs merge? trunk
  vs integration-branch? a PR/issue board?
- **Flag / rollout mechanism** — feature flags, config gates, env switches, expand-contract
  patterns: how this repo ships risky changes dark and rolls back.

**How:** a few `ls`/`cat`/glob calls, or fan out parallel read-only `Explore` subagents when the
surface is wide (more than ~3 distinct areas, or a large or unfamiliar repo). Concrete starting probes:

```bash
ls CLAUDE.md AGENTS.md .cursorrules CONTRIBUTING.md 2>/dev/null   # rules docs
ls -d docs ADR adr .github/workflows 2>/dev/null                  # design docs + CI
cat package.json 2>/dev/null | jq -r '.scripts'                   # JS/TS commands
cat Makefile Justfile Taskfile.yml 2>/dev/null                    # task runners
sed -n '1,80p' .github/workflows/*.y*ml 2>/dev/null               # the real "what must pass"
```

**Done when:** you have written down the exact build/test/lint commands, the rules subset the
change touches, the codegen triggers, the review entry points, and the flag mechanism — ready to
paste into the docs. If the repo genuinely lacks something (no test suite), record that and plan
Verify around what exists (a build, a smoke run) rather than inventing checks.

### Phase 2 — Write the plan (`<slug>-plan.md`)

**Do:** capture the *why*. Ground EVERY current-state claim in real code with `file:line` anchors —
never plan against memory; wrong "today" facts poison every downstream step. Surface the genuine
design forks and **resolve them now**, escalating product/irreversible calls to the user.
**How:** read `references/plan-template.md` and fill it. If you assert "X lives in Y", open Y and
confirm. For a wide surface, run `workflow-patterns.md` Pattern 1 (ground current state) and
Pattern 2 (draft from several angles).
**Done when:** the current-state table is verified (not guessed), every fork in §4 is decided, and
the phased rollout puts destructive / sign-off work last.

### Phase 3 — Decompose into standalone, verifiable steps (`<slug>-implementation-steps.md`)

**Do:** turn the plan into ordered `S1..Sn`, each landing, verifying, and committing on its own.
Give each step a Goal, a Depends-on, a paste-ready prompt, and a real Verify block. Draw an explicit
**dependency graph**; keep behavior-changing steps behind a **flag/config** so early steps ship
dark (if the repo
has no flag mechanism, dark-shipping reduces to **additive-only** changes that stay inert until a
later step wires them — don't invent a flag framework); put **destructive** and **human-sign-off**
steps **last**.
**How:** read `references/steps-template.md` (it has the step shape + worked examples). The
dependency graph doubles as the parallelism plan: steps with no edge between them and disjoint file
sets run concurrently — so declare each step's file set, make real edges explicit, and don't invent
false edges that needlessly serialize. Validate the graph with `workflow-patterns.md` Pattern 3.
**Done when:** every step's Verify can run without the next step; each prompt restates only the
rules it touches and names the files to read; the graph has no missing edges and no same-file
overlap left unordered. (See the worked step below for the bar.)

### Phase 4 — Choose and write the driver

**Do:** pick the execution approach with the decision tree below, then write the matching driver
doc, wired to the review/verify specifics from Phase 1.
**How:** read `references/workflow-template.md` (dynamic workflow) or
`references/orchestrator-template.md` (in-context orchestrator). Segment the steps at every gate.
**Done when:** the driver names the integration branch, the per-area reviewer, the verify commands,
and exactly where each human/destructive gate falls.

### Phase 5 — Seed progress and hand off (`<slug>-progress.md`)

**Do:** seed the progress file with `S1..Sn = pending` (status values: `pending | in_progress |
passed | blocked`) and the dependency graph, so a run — and a
later session — picks up from the file, never a transcript.
**How:** read `references/progress-template.md` and fill it.
**Done when:** the four docs are internally consistent (same slug, same step ids, same dependency
graph), and you can hand the user a 3-line summary + how to start. For a workflow, they launch the
first segment with `ultracode:` / "use a workflow"; for the orchestrator, they paste its prompt
into a session.

## Choosing the driver (decision tree)

Both drivers run the *same* plan/steps/progress docs and the *same* worker→reviewer→fix loop. They
differ in **who holds the loop** and **whether a human can act mid-run**.

1. **Are Claude Code dynamic workflows available** (v2.1.154+, paid plan, opt-in in `/config`)? You
   can't detect this from inside a session — **ask the user one question**, or default to the
   orchestrator (it runs everywhere) if they don't know.
   - **No / unknown** → **in-context subagent orchestrator** (`orchestrator-template.md`). Runs in
     any agent session that can spawn subagents.
2. **Does the run need a human in the loop *mid-orchestration*** — an inline sign-off, a
   product/founder judgment call, or a "review this, then continue" point you do **not** want to
   handle by stopping and relaunching a fresh run?
   - **Yes** → **orchestrator.** A workflow has **zero mid-run human interaction**, so each such
     point would force a separate, manually-launched run. The orchestrator stops inline, takes your
     "go", and continues in the same session.
3. **Otherwise** — gate-free or cleanly segmentable, and you want **maximum parallelism** with the
   loop out of context:
   - → **dynamic workflow** (`workflow-template.md`). The runtime runs the loop in the background
     and parallelizes independent disjoint-file steps natively.

| | Dynamic workflow | Subagent orchestrator |
|---|---|---|
| Mid-run human interaction | none — gates become separate, relaunched runs | inline — stop → "go" → continue, same session |
| Where the loop lives | a script the runtime runs in the background | the orchestrator's own context (turn-by-turn) |
| Parallelism | native, ≤16 concurrent | yes — dispatch independent disjoint-file steps at once |
| Resume | in-session only (the progress file is the cross-session memory) | re-paste the prompt anytime/anywhere |
| Needs | CC v2.1.154+, paid, opt-in | any agent that can spawn subagents |
| Best for | large, gate-light or cleanly-segmentable changes | frequent inline gates; turn-by-turn control |

Whichever you pick, the **Hard gates** below hold — a workflow enforces them *between* runs, an
orchestrator enforces them *inline*. Workflows also pay off in **grounding** and **planning**, not
just execution: `references/workflow-patterns.md` has ready `ultracode:` briefs for those phases.

## What a good step looks like (the bar to hit)

A step is right when its Verify runs on its own. Worked example (language-neutral):

> ### S2 — Add the `status` column (nullable, backfilled) — expand phase
> **Goal:** the new column exists and is populated; the app still reads the old path.
> **Depends on:** S1.
> ```
> Add a migration that adds `orders.status` as NULLABLE with a default, plus a backfill that sets
> it from `orders.legacy_state`. Do NOT change any read path yet (that's S4) — this step only
> expands the schema. Rule: every migration ships a reversible `down`. Run the migration on a
> scratch DB and paste the result, then paste the `down` reverting cleanly.
> ```
> **Verify:** migration applies on a scratch DB; `SELECT count(*) FROM orders WHERE status IS NULL`
> returns 0 after backfill; the `down` migration drops the column cleanly; existing test suite green.

Why it works: one observable goal, no scope creep, the single rule it touches is restated inline,
and the Verify is **exact commands with expected results** — not "should pass". More examples in
`references/steps-template.md`.

## Verification (derive each Verify block from Phase 1)

A Verify block = the discovered command(s) for the step's area **plus the expected result** (exit 0,
a test count, a grep that returns nothing). Prefer the exact CI invocations. Cheat-sheet — always
use the repo's real ones over these defaults:

| Stack | Typical verify |
|---|---|
| JS/TS | `npm test` / `pnpm test` / `vitest run`; `tsc --noEmit`; `eslint .`; `npm run build` |
| Python | `pytest -q`; `mypy <pkg>`; `ruff check`; `python -m build` |
| Go | `go test ./...`; `go vet ./...`; `golangci-lint run`; `go build ./...` |
| Rust | `cargo test`; `cargo clippy -- -D warnings`; `cargo build` |
| JVM | `./gradlew test` / `mvn -q verify` |
| DB migration | apply on a scratch DB → assert schema/rowcount → **and** assert the down/rollback |
| Service / API | contract test or a `curl` smoke against a locally-run instance; golden-response diff |
| Any | the change's own new/extended test, run RED→GREEN; CI green on the branch |

Anything needing live infra, paid calls, or a deploy is a **deferred / gated** check — it runs at a
segment boundary with human authorization, never inside an unattended run. Record these in the
progress file's deferred gate.

## Review routing

- If the repo ships **review agents/skills**, route by diff type to the matching one (a security
  reviewer for auth/crypto/IO-boundary changes; a schema reviewer for migrations; etc.).
- Else use a built-in `/review` if present, or a **fresh reviewer subagent** with an explicit
  checklist: correctness, the project rules from the rules doc, security at trust boundaries, test
  adequacy, and whether the Verify block genuinely passed. The reviewer returns a verdict line +
  numbered `file:line` issues and **does not fix**.

## Execution conventions (bake into the driver)

- **Branch per step** off an integration branch (`<slug>/main`), in a worktree if the repo's
  workflow supports it, so each review sees a clean scoped diff and a failed step is discarded
  without unwinding others. The change reaches the trunk via a normal PR at the end.
- **Plan before acting.** If an advisor/plan-review mechanism exists, the worker uses
  plan → feedback → revise → act. Otherwise it writes a short plan in its prompt before editing. No
  blind edits.
- **Commit hygiene:** stage files by name (not a blanket add-all), use the repo's commit
  convention, don't bypass pre-commit hooks, never force-push a shared branch.
- **A fresh subagent per step and per fix** is the main context-hygiene win; durable state is the
  progress file, not the transcript.

## Hard gates (never auto-cross)

- **Respect the dependency graph** — never start a step before its prerequisites are `passed`, and
  never run two steps that edit the **same files** concurrently. Independent steps (disjoint files,
  no edge) **should** run in parallel within a segment, up to the concurrency cap.
- **Never skip a Verify**, never advance past a step that isn't `passed`, and **never weaken a
  project rule to make a check pass** — escalate instead.
- **Destructive steps** (file/data deletes, decommission, secret rotation, dropping a column) and
  **paid/live operations** (a deploy, a paid eval, a production migration) require an explicit human
  "go" — a workflow makes each its own relaunched run; an orchestrator STOPs inline and waits. Never
  folded into an unattended stretch either way.
- **Human-sign-off steps** (validation, dogfood, load test) are validation, not code — the run
  stops, you record a written go/no-go, then you continue.

## Quality bar / common failure modes

- **Steps that aren't independently verifiable.** If a step's Verify can't run without the next
  step, the decomposition is wrong — merge or re-split. This is the property the whole loop relies on.
- **Current-state fiction.** A "today" section guessed instead of grepped produces steps that edit
  the wrong lines. Anchor with `file:line`.
- **Undecided forks smuggled into steps.** A step that says "decide whether to…" isn't ready — lift
  the decision into the plan's §4 and resolve it first.
- **"Should pass" verifies.** Replace with the exact command + the exact expected result.
- **Inventing commands the repo doesn't have.** Verify with what Phase 1 found, not a generic ideal.
  No test suite? Say so; verify with a build + smoke.
- **Destructive-first ordering.** Anything irreversible goes last, as its own gated run.
- **Bloated step prompts.** Restate only the rules the step actually touches; point to files by path
  rather than pasting them.
