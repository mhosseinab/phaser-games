---
name: blublux-games
description: >-
  BluBlux Games monorepo — six puzzle games from two pure-model engines (sort/block)
  over Phaser 4 + Capacitor, dual-deployed web + Android. Use when working in this
  repo, implementing S1–S33 steps, scaffolding packages/apps, writing game logic,
  wiring ads/IAP/analytics, or any @blublux/* code. Triggers on blublux-games,
  engine-sort, engine-block, sort-collection, knotwork, beaver-block, Phaser 4 game
  factory build, or references to docs/2026-06-27_blublux-games_*.md.
---

# BluBlux Games

Six puzzle games from **one Phaser 4 + Capacitor monorepo** over two pure-model engines. Authority for stack, ads, CI/CD, and production checklist: **phaser4-game-factory** (`.agents/skills/phaser4-game-factory/`). Orchestration spec: `docs/2026-06-27_blublux-games_*.md`.

## End state

```
packages/{config,engine,ads-adapter,engine-sort,engine-block}
apps/{sort-collection,knotwork,beaver-block}
```

- **3 native listings** (Option B): `sort-collection` (4 sort themes in-app), `knotwork`, `beaver-block`
- **6 web builds**: all games free on web
- Scope `@blublux/*`, appIds `com.blublux.*`

## Locked decisions (do not reopen without escalation)

| Decision | Value |
|---|---|
| Distribution | Option B — 3 native apps, 4 sort themes in one container |
| Engines | `engine-sort` (K=4 color sort) + `engine-block` (box9 \| lines) |
| Beaver grid | 8×8 lines mode |
| 9×9 game name | **Knotwork** (`com.blublux.knotwork`) |
| Leaderboards | Local default; GPGS behind adapter, OFF |
| IAP | RevenueCat behind `IAPAdapter` |
| iOS | Out of scope v1 (do not architect against it) |

## Stack (re-pin at S1 with `npm info`)

| Package | Version |
|---|---|
| phaser | 4.2.0 |
| @capacitor/core + cli | 8.4.1 |
| @capacitor-community/admob | 8.0.0 |
| turbo | 2.10.0 |
| @revenuecat/purchases-capacitor | 13.2.0 |
| @sentry/capacitor | 4.2.0 |
| vitest | 4.1.9 |

Node 22+, Android API 24+. Phaser 4 APIs via Context7 — **never Phaser 3 memory**.

## Architecture invariants

1. **Model purity** — `packages/engine-*/src/model` imports zero Phaser/DOM; no `Date.now()`/`Math.random()`; time/random via injected `Clock`/`Rng`
2. **View thinness** — Phaser scenes render state; no rules in scenes
3. **Theme = config only** — reskins touch `apps/*/src/themes/**` + one ThemePicker line; never `packages/engine-*`
4. **DI** — SDK imports only in `composition-root.ts`; interfaces everywhere else
5. **UMP gates loading** — consent before any ad load/show (see ads-adapter)
6. **Native base** — `base:'./'` via Vite `--mode native`
7. **Determinism** — one seeded Rng (mulberry32); same seed → same stream
8. **TDD** — model logic: failing Vitest first, then impl

## Verify commands

```bash
pnpm install
pnpm turbo run typecheck lint test build
pnpm --filter @blublux/<pkg> test
pnpm --filter @blublux/<app> build
vite build --mode native   # per app
```

Model purity grep (must return empty in model dirs):

```bash
git grep -nE "phaser|Math\.random|Date\.now" -- packages/engine-sort/src/model packages/engine-block/src/model
```

## Sources of truth (read order)

1. `docs/2026-06-27_blublux-games_implementation-steps.md` — S1–S33 prompts + Verify
2. `docs/2026-06-27_blublux-games_plan.md` — rationale + §4 decisions
3. `docs/2026-06-27_blublux-games_progress.md` — durable step state
4. `.agents/skills/phaser4-game-factory/SKILL.md` + `references/00..05`
5. [reference.md](reference.md) — package map, APIs, gates

## Human gates (never auto-cross)

| Step | Gate |
|---|---|
| S15 | Review Butterfly reference slice before scaling |
| S31 | Human-supplied signing secrets |
| S32 | Device QA written GO/NO-GO |
| S33 | Store submission — irreversible |

## Drivers

- **Orchestrator** (primary): `.agents/skills/blublux-orchestrator/` or `/blublux-orchestrator` command
- **Workflows** (gate-free segments): `/blublux-workflow-foundation`, `-models`, `-reskins`
