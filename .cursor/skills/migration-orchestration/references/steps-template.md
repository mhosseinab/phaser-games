# Template — `<slug>-implementation-steps.md` (the *how*)

Annotated skeleton for the **step-by-step** document (SKILL.md Phase 3) — the script the driver
executes. It turns the plan into an ordered list of **standalone, independently verifiable**
changes, each a paste-ready prompt plus a real Verify block.

**The non-negotiable property:** every step lands, verifies, and commits **on its own**. If a
step's Verify can't run until the next step exists, the split is wrong — that property is what makes
the worker→reviewer→fix loop and per-step rollback cheap.

**Before you write a single step, confirm:**

- [ ] The plan's §4 forks are all decided — a step must never carry an open decision.
- [ ] You know each step's **exact file set** (it drives the dependency graph and safe parallelism).
- [ ] You have the repo's **real** test/build/lint commands from Phase 1 (Verify blocks use them).

---

```markdown
# <Change title> — Step-by-Step Implementation

**Status: READY TO EXECUTE (<date>).** Companion to `<slug>-plan.md` (the *why*); this is the
*how* — ordered, **standalone, independently verifiable** changes, each a paste-ready prompt with an
explicit verification.

## How to use this

Run steps **in order** (or in parallel where the graph allows). Each is a self-contained change with
its own acceptance check — land it, verify it, commit it, then move on. Paste the fenced **prompt**
into a worker, then run the **Verify** block before proceeding. Nothing destructive ships until the
new path is validated — `<flag/config gate>` keeps every earlier step dark until you flip it.

## Decisions baked in (final, <date> — from plan §4)

> Copy the RESOLVED forks from plan §4, one bullet each. A worker reads these instead of
> re-litigating a settled decision.

- <decision 1> …

## Project rules every prompt must respect (stated once)

> The subset of the repo's rules (from the rules doc / CONTRIBUTING / ADRs you found in Phase 1)
> that THIS change touches. Stated once here; each step's prompt restates only the ones it hits. If
> the repo has no rules doc, capture the invariants you inferred from the code/CI.

- <rule the change must not break, e.g. "public API in `api/` stays backward-compatible">.
- <rule, e.g. "every DB migration ships with a reversible `down` migration">.
- <rule, e.g. "no secrets in source; config via env only">.
- <codegen trigger, e.g. "after touching the schema, run `<codegen cmd>` and commit the generated files">.
- <"run `<lint/typecheck>` before any commit">.
- <"keep docs truthful — update the doc describing a behavior in the same commit">.

## Dependency graph (quick view)

> The execution order, as a graph. The driver runs a step only when its prerequisites are `passed`.
> Group by phase. `A→B` = B depends on A; steps on separate lines with no edge run in parallel.

```
Phase A (foundations)   S1→S2→S3 ; S4→S5
Phase B (…)             S5→S6→S7
Phase C (validate→cut)  all → S8(sign-off) → S9(destructive) → S10(flip)
```

---

# Phase A — <name> (gated; ships dark)

### S1 — <imperative title>
**Goal:** <the one observable outcome that means this step is done>.
**Depends on:** none.
**Edits:** `<the exact files this step touches>`  ← declared so the graph can parallelize safely.

\```
<REPLACE THIS ENTIRE BLOCK with the real, imperative worker prompt (see the two worked examples at
the bottom of this file) — do NOT paste these meta-bullets. The prompt runs verbatim with no
context beyond the repo + the named files. It MUST:
 - name the files/specs to read FIRST;
 - describe ONLY this step's change (no scope creep);
 - restate the project rules THIS step touches (and nothing else — keep it lean);
 - name the codegen/build trigger if it applies ("after editing the schema, run `<cmd>` and commit
   the generated files");
 - end by telling the worker to RUN the Verify block and paste the ACTUAL output.>
\```

**Verify:** <ACTUAL commands + expected result — never "should pass". Draw from the repo's real
tooling, e.g. "`pytest -q tests/foo` green incl. the new case; `mypy pkg` clean; the diff touches
only `pkg/foo.py`.">

---

### S2 — <title>
**Goal:** … **Depends on:** S1. **Edits:** `<files>`.

\```
<prompt>
\```

**Verify:** …

---

# Phase C — Validate, then decommission (destructive LAST)

### S8 — <Validation / dogfood> (HUMAN sign-off — no code cut)
**Goal:** prove the new path before deleting anything.
**Depends on:** <all prior>.

\```
Turn `<flag>` ON in a <staging/canary> environment (old path stays as fallback). Run <the
validation: N real scenarios / a load test / a shadow comparison>. Capture <the key metric + bar>
and any failures. Confirm <quality/perf gate> holds. Record findings + a go/no-go in
<slug>-plan.md. This is VALIDATION + written sign-off, not a code change.
\```

**Verify:** <validation ran>; <metric> ≥ <bar>; no regressions; written go/no-go recorded.
**Do not proceed to the destructive step without sign-off.**

---

### S9 — <Decommission> (DESTRUCTIVE)
**Goal:** delete the old path. **Depends on:** S8 (sign-off).

\```
Execute the §7 decommission checklist of <slug>-plan.md: <the exact deletes>. Update the rules doc
+ docs index + task tracker in the same commit.
Verify: `grep -ri <oldthing> <dir>` empty; <lint/build>; <regression suite>; <quality gate> green;
<deploy/release> clean.
\```

**Verify:** `grep -ri <oldthing>` empty; checks green; docs updated in the same commit.

---

## Notes on "standalone & verifiable"

- **Early phases ship dark** behind `<flag>`, and additive changes behave identically when the new
  path is off — safe to release before anything uses them.
- **Additive middle phases** keep behavior identical when the new fields/paths are absent (assert it
  in a test).
- **Only the decommission is destructive**, gated on the sign-off step; until then rollback is just
  leaving `<flag>` off.
- If a step's Verify fails, **stop and fix in that step** — never stack the next change on red.
```

---

## The step shape (what every `S<n>` must contain)

| Field | Why it's there |
|---|---|
| `### S<n> — <title>` | a stable label the progress table and any per-step runner key on |
| **Goal** | the single observable outcome — keeps the worker from over-building |
| **Depends on** | drives the dependency graph and the "only when prereqs passed" gate |
| **Edits** | the file set — lets the driver parallelize disjoint steps and serialize same-file ones |
| fenced **prompt** | pasted verbatim into a worker; self-contained; restates only the rules it touches |
| **Verify** | real commands + expected result the worker runs and pastes output from |

## Per-step self-check (the Phase 3 done-when bar)

For each `S<n>`, confirm before you call the steps doc finished:

- [ ] Its **Verify runs without any later step existing**. (If not — merge with its dependency or
      re-split. This is the whole game.)
- [ ] The prompt names the files to read and restates **only** the rules this step touches.
- [ ] The Verify is exact commands + an expected result, not "should pass".
- [ ] **Edits** is declared, and no two parallel-eligible steps share a file.
- [ ] Anything destructive / sign-off / paid is in the last phase, gated.

## Verify-block sources (use the repo's real tooling)

Derive each Verify from what Phase-1 discovery found — prefer the exact CI invocations:

| Stack | Typical verify |
|---|---|
| JS/TS | `npm test` / `vitest run`; `tsc --noEmit`; `eslint .`; `npm run build` |
| Python | `pytest -q`; `mypy <pkg>`; `ruff check`; `python -m build` |
| Go | `go test ./...`; `go vet ./...`; `golangci-lint run`; `go build ./...` |
| Rust | `cargo test`; `cargo clippy -- -D warnings`; `cargo build` |
| JVM | `./gradlew test` / `mvn -q verify` |
| DB migration | apply on a scratch DB → assert schema/rowcount → assert the down/rollback path |
| Service / API | contract or smoke test against a locally-run instance; golden-response diff |
| Anything live/paid/deploy | mark **deferred / gated** — not for the offline loop |

## Two worked step examples (the shape, language-neutral)

**A schema-migration step (expand-contract, additive):**

> ### S2 — Add the `status` column (nullable, backfilled) — expand phase
> **Goal:** the new column exists and is populated, with the app still reading the old path.
> **Depends on:** S1. **Edits:** `migrations/0007_add_status.sql`.
> ````
> Add a migration that adds `orders.status` as NULLABLE with a default, and a backfill that sets it
> from `orders.legacy_state`. Do NOT change any read path yet (that's S4) — this step only expands
> the schema. Rule: every migration ships a reversible `down`. Run the migration on a scratch DB and
> paste the result, then paste the down-migration reverting cleanly.
> ````
> **Verify:** migration applies on a scratch DB; `SELECT count(*) FROM orders WHERE status IS NULL`
> returns 0 after backfill; the `down` migration drops the column cleanly; existing test suite green.

**A module-extraction step:**

> ### S5 — Extract `auth/` behind its current public interface
> **Goal:** auth code moves to `auth/` with the existing call sites unchanged.
> **Depends on:** S4. **Edits:** `auth/**`, callers' import lines only.
> ````
> Move the auth functions into a new `auth/` module, keeping the exact public signatures so no
> caller changes. Update imports. Do NOT change behavior or add features. Rule: no public API break.
> Run `<test>` and `<typecheck>` and paste output.
> ````
> **Verify:** `<test>` green (unchanged count); `<typecheck>` clean; `git grep` shows no caller
> signature changed; the diff is moves + import updates only.
