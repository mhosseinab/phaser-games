# Quality-pattern workflows — use a workflow for more than the execution loop

A dynamic workflow's real edge isn't just running steps in parallel — it's the
**fan-out → reduce → synthesize** quality pattern (the shape `/deep-research` uses: decompose a
question into several angles, search them in parallel, then run an *adversarial* cross-check where
skeptics try to refute each finding before it's reported). That pattern is most valuable in this
skill's **weakest phases — grounding (Phase 2) and planning (Phase 2/§4)** — not the execution loop,
because those are where the named failure modes live (current-state fiction, under-examined design
forks).

This file is a small library of paste-ready **`ultracode:` briefs** for those phases. You paste a
brief, the runtime writes and runs the workflow, and you save the run to `.claude/workflows/` as a
`/<name>` command for reuse. **They work with either driver** — run them to produce a better plan and
step list, then execute with whichever driver the decision tree chose. **Before pasting any brief,
replace every `<…>` placeholder** (areas, slug, forks, step range) — they're fill-ins, not literal text.

## What's documented (and what isn't) — keep this honest

The workflow runtime exposes these primitives (names + roles are documented by Anthropic; the
**exact signatures are not published**, so you don't hand-write the script — the runtime writes it
from your brief):

- `agent(...)` — run one subagent from an inline prompt.
- `parallel(...)` — a **barrier**: wait for all prior agents before the next stage.
- `pipeline(...)` — stream items through stages with **no** barrier ("default to `pipeline()`").
- `workflow(name, args)` — run another saved workflow inline (composition).

Two constraints the briefs work around:

- **No typed/named subagents inside a workflow.** A workflow can't call a `.claude/agents/` reviewer
  (e.g. a security or schema reviewer) by type — only inline prompts. So each brief **inlines the
  reviewer's checklist** into the agent prompt. (Named review agents are for the in-context
  orchestrator mode — see `orchestrator-template.md`.)
- **No mid-run human input.** These briefs are for grounding/planning/validation/execution *within*
  a gate; human sign-off and destructive steps remain separate, manually-launched runs.

Anthropic's own guidance — "a workflow you keep tweaking by hand is a skill that needs another
revision" — is why these live here as briefs, not as committed `.js` you edit each time.

---

## Pattern 1 — Ground the current state (fan-out → refute → synthesize)

*Serves plan §2. Attacks the #1 failure mode (current-state fiction). Run BEFORE writing the plan.*

```
ultracode: Ground the current state of <change/area> in this repo for a migration plan — do NOT
propose the change yet. Fan out one agent per major area (<edit to this repo: e.g. src/, api/,
db/migrations/, tests/, config/, CI>); each reads the REAL files and returns current-state facts,
every one anchored to file:line — no claim without an anchor. Then run a skeptic pass: for each
collected fact, an independent agent opens the cited file and CONFIRMS or REFUTES it; drop or correct
anything refuted. Synthesize a single current-state table (Piece | Location file:line | Status today)
plus the list of invariants the change must not break. Output only verified, anchored facts.
```

Shape: fan-out `agent()` per area → `parallel()` skeptic refute → synthesize at a barrier. Save as
`/<slug>-ground`.

## Pattern 2 — Draft the plan from several angles (multi-angle → adversarial weigh)

*Serves plan §3–§4. Attacks under-examined design forks: a hard plan is worth drafting from several
independent angles before you commit.*

```
ultracode: Draft the approach for <change> from THREE independent angles, in parallel: (a) the
minimal-diff / expand-contract path, (b) a clean re-architecture, (c) the lowest-risk reversible
path. Each angle agent proposes: the target architecture, how it resolves EACH open design fork
[<list the forks>], the phased rollout, and its top risks. Then a judge agent weighs the three
against this repo's rules [<rules doc>] and the acceptance bar, recommends a resolution PER FORK, and
RECORDS the dissent (why the rejected angles lost). Escalate any product/founder/irreversible fork to
me instead of deciding it. Output: the §4 design decisions (decision + rationale + trade + recorded
dissent) and the phased plan.
```

Shape: parallel angle `agent()`s → judge at a `parallel()` barrier. Save as `/<slug>-plan-angles`.

## Pattern 3 — Validate the decomposition + dependency graph (makes parallelism safe)

*Serves the steps doc (Phase 3). Attacks "steps that aren't independently verifiable" and bad
edges/file overlaps — the things the parallel executor relies on being correct.*

```
ultracode: Validate the steps in <slug>-implementation-steps.md. Fan out one agent per step: each
checks the step is standalone and independently verifiable (its Verify runs without later steps),
that its prompt restates the rules it touches, and lists the EXACT files the step edits. Then a
reconcile agent (barrier) builds the dependency graph from the declared file-sets + prerequisites and
flags: (1) MISSING edges (a step uses another's output but no edge connects them); (2) FALSE edges
that needlessly serialize independent work; (3) FILE-OVERLAP collisions (two steps with no edge that
edit the same file — must be serialized for safe parallel runs). Output: a corrected dependency
graph, a per-step file-set table, and the concrete fixes to apply to the steps doc.
```

Shape: per-step `agent()` fan-out → reconcile at a barrier. Save as `/<slug>-validate-steps`.

## Pattern 4 — Execute a segment (pipeline + adversarial review for high-stakes steps)

*Serves execution. This is `workflow-template.md`'s loop, expressed in the primitives, with stronger
review for the steps that matter.*

```
ultracode: Execute segment <N> (steps <range>) of <slug>-implementation-steps.md as a workflow. Walk
the steps as a DAG: stream them through a pipeline (worker → review → fix), running independent
disjoint-file steps in PARALLEL and serializing dependent or same-file steps. Per step: a worker
agent implements ONLY that step, runs its Verify block (paste real output), commits on a per-step
branch off <slug>/main. Review — inline the right checklist into the reviewer prompt (workflows can't
target named review agents): for ORDINARY steps, one reviewer returns VERDICT + file:line issues; for
HIGH-STAKES steps (destructive-adjacent, security/identity, schema/persistence), run THREE
independent reviewers and require consensus — surface dissent, and treat a single serious objection
as CHANGES_REQUESTED (the /deep-research adversarial-vote pattern). On CHANGES_REQUESTED a fix agent
addresses the issues and re-verifies (cap 3 cycles, else mark blocked). On PASS, merge into
<slug>/main and append SHA + a one-line note to <slug>-progress.md. Stop at the segment's last step;
do NOT cross a human/destructive gate.
```

Shape: `pipeline()` worker→review→fix; `parallel()` fan-out for independent steps and for the 3-vote
review; merge + progress write at the end. Save as `/<slug>-exec-seg<N>`.

---

## How these fit the skill's flow

| SKILL.md phase | Pattern | Why a workflow helps |
|---|---|---|
| Phase 1–2: discover / ground (§2) | Pattern 1 | research-grade, refuted, file:line-anchored — not a single guessing pass |
| Phase 2: design forks / plan (§3–4) | Pattern 2 | several angles weighed adversarially → a more trustworthy decision |
| Phase 3: decompose / graph | Pattern 3 | catches bad edges + file overlaps → safe parallel execution |
| Phase 4–5: execute a segment | Pattern 4 | parallel where independent; consensus review where it's risky |

Each is `args`-parameterizable (slug, paths, step range) so a saved workflow reruns across segments
and migrations. Gates between phases stay human boundaries — these patterns make each *phase* better;
they don't remove the sign-offs.
