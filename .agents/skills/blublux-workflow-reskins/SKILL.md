---
name: blublux-workflow-reskins
description: >-
  Runs the gate-free sort reskins segment (WF-3, steps S16–S19) for four themes inside sort-collection.
  Use when the user wants to start/run the sort reskins workflow, WF-3, steps S16-S19, or reskin segment.
---

# BluBlux Workflow — Sort Reskins (WF-3, S16–S19)

Run the gate-free **sort reskin** segment — four themes inside `sort-collection`.

## Prerequisite

**S15 review gate GO required.** Do not launch until the user has reviewed the Butterfly reference slice and approved scaling.

## Instructions

DAG:

```
{S16, S17, S18} in parallel → S19
```

### Critical serialization

S16/S17/S18 each add **one line** to `apps/sort-collection/src/ThemePicker.ts`. Theme folders are disjoint, but ThemePicker edits must be **serialized** — never concurrent.

For each step: **blublux-worker** → **blublux-reviewer** → fix (max 3) → merge → update progress.

## Review focus — AUTO-FAIL if violated

- Diff must **not** touch `packages/engine-sort` (themes are config only)
- Each reskin: palette, symbol-per-color (a11y), atlas ≤2048²
- S18: screw animation via theme-provided anim hook, not forked scene

## Stop condition

STOP after S19. Hand back to orchestrator for block apps (S22+).

## Verify gate

```bash
pnpm --filter @blublux/sort-collection test
pnpm --filter @blublux/sort-collection build
# Four themes selectable in ThemePicker
```
