# Template — `<slug>-plan.md` (the *why*)

Annotated skeleton for the **plan** document (SKILL.md Phase 2). It carries rationale, scope, the
current state (grounded in real code), the design forks resolved up front, the phased rollout, and
the rollback story — everything a reader needs to trust the *direction* before reading the
step-by-step *how*.

**How to use:**

1. Copy the fenced skeleton below into `<slug>-plan.md`.
2. Delete every `> guidance` line as you fill the section under it.
3. Fill each section. A section that genuinely doesn't apply (a pure refactor with no decommission,
   no privacy surface) is **dropped with one line saying why** — never left as an empty heading.
4. Keep the numbered `§`-anchors: the steps doc and the driver reference them (e.g. "decided in
   §4.1", "the §7 decommission checklist").

**The two load-bearing sections are §2 (current state) and §4 (design forks).** Most bad plans die
there — a guessed "today" table, or a fork left open that the steps then trip over. Spend your time
there; keep the rest tight.

---

```markdown
# <Change title> — <one-line what-and-where>

**Status: PROPOSED (<date>).** <2–3 sentences: what moves, the end state, and the single most
important boundary. Update this header as the change advances:
PROPOSED → READY TO EXECUTE → IN PROGRESS (S<k>) → DONE.

> Supersedes / relates to: <other docs>. Specs to read for mechanics: <files that define the wire
> format / API / schema this change touches>.

---

## 1. Why, and the honest scope

**End state:** <what is true when this is done>.

**What does NOT change (say it plainly):** <the boundary — the thing readers will wrongly assume
also changed>. Spend as much ink here as on the change itself; a fuzzy boundary produces fuzzy steps.

**Why it's lower-risk than it sounds:** <the parts already designed or dormant; the genuinely new
work>. Be honest about where the real risk sits.

## 2. Current state (verified against the repo <date>)

> Ground EVERY row in real code — grep/read the file and cite `file:line`. Do NOT write this table
> from memory; wrong "today" facts make every downstream step edit the wrong lines.

| Piece | Location (`file:line`) | Status today |
|---|---|---|
| <component> | `path/to/file.ext:LINE` | <what it does now> |
| _e.g. order-state read path_ | `src/orders/read.ts:42` | _reads `legacy_state`; no `status` column yet_ |
| … | … | … |

<Any invariant the change must preserve — a wire shape, an API contract, a data format — stated
explicitly here so a step doesn't silently break it.>

## 3. Target architecture

> A BEFORE/AFTER sketch beats paragraphs. ASCII is fine.

```
BEFORE                                  AFTER
──────                                  ─────
<current flow>                          <new flow>
```

<1–2 sentences naming what the new shape buys and what it costs.>

## 4. Key design decisions (the real forks — decide before S1)

> The most important section. Each entry is a genuine fork that, left open, would force step
> rework. State the decision, the rationale, the trade accepted, and the consequences to plan for.
> Escalate any product / irreversible call to the user and record their answer here. The steps doc
> copies the *resolved* decisions into its "Decisions baked in".

### 4.1 <Fork name> — <the decision, stated in the heading>
**Decision (<date>):** <what was chosen>.
Why: <reasoning>. Trade accepted: <honest cost>. Consequences: <concrete follow-ons — versions,
owners, flags, formats>.

### 4.2 <next fork> …

## 5. Protocol / interface changes

> Any change to a wire format, endpoint, request/response shape, public API, DB schema, or
> cross-module contract. Note the backward-compat behavior ("absent fields ⇒ identical to today") —
> that compatibility is what lets independent pieces land separately.

- **`<endpoint / type / table / file>`**: <what changes; what stays compatible>.

## 6. Phased plan (P1 … Pn)

> Group the steps into independently shippable phases. State the ordering invariant: build and
> VALIDATE the new path BEFORE deleting the old one; flag/config-gate anything on the live path;
> destructive + human-sign-off phases last. Each phase names its acceptance bar.

### P1 — <phase name> (gated; ships dark)
<what lands; **Acceptance:** the measurable bar>.

### … Pn — Validate, then decommission (destructive LAST)
<the validation phase, then the destructive phase gated on its sign-off>.

## 7. Decommission / cleanup checklist (exact removals)

> Only if the change removes something. List EXACT files/lines/configs/secrets/infra to delete, so
> the destructive step is mechanical and reviewable. Include the doc/rule edits that land in the
> same commit.

```
path/to/file ............ DELETE (whole file)
path/to/other ........... remove <symbol> (Lx–Ly) + its metric/log
config/env .............. remove <VAR>; rotate/revoke <SECRET>
<infra/console> ......... delete <resource>
<rules doc> ............. rewrite "<rule>"; update the docs index
<task tracker> .......... close the items
```

## 8. Rule & doc updates (keep the docs truthful)

> Which project rules (the rules doc you found in Phase 1), architecture notes, or other docs
> change, and the new wording. Land doc edits in the SAME commit as the behavior change.

## 9. Privacy / security / compatibility impact

> Only if the change touches data egress, storage location, identity/auth, trust boundaries, a
> public contract, or backward compatibility. State precisely what changed and what did NOT — don't
> oversell.

## 10. Risks & rollback

| Risk | Mitigation / rollback |
|---|---|
| <risk> | <how it's caught (which gate) + how to back out — usually: leave the flag off; the destructive step is last> |

## 11. Acceptance criteria (whole change)

> The end-to-end bar — the union of the phase acceptances, plus any quality gate and validation
> metric.

- <criterion> …

## 12. Implementation map

> Where the work lands, by area/module, and the sources you verified against, with the date. This
> is what makes the plan auditable.

- **<area / module>**: <files>.

Sources (verified in-repo <date>): <the paths you actually read to write §2>.
```

---

## Author checklist (the Phase 2 done-when bar)

Before you move to the steps doc, confirm:

- [ ] §1 states the end state **and** an explicit "what does NOT change" boundary.
- [ ] Every §2 row cites a real `file:line` you opened — none written from memory.
- [ ] Every invariant the change must preserve is named in §2.
- [ ] Every §4 fork is **decided** (no "TBD"); product/irreversible ones were escalated to the user.
- [ ] §6 puts destructive + human-sign-off phases **last**, each with a measurable acceptance bar.
- [ ] §7 (if anything is removed) lists exact paths/lines/secrets, not "clean up the old stuff".
- [ ] This file stays the *why*. If you wrote a `git checkout -b` or a Verify command, it belongs in
      the steps doc — move it.
