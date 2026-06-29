# AGENTS.md — BluBlux Games Project Rules

These rules apply globally to all workspace actions for the BluBlux Games monorepo. Every worker must operate under these rules.

## 1. Project Conventions
* **Scope:** `@blublux/*`, appIds `com.blublux.*`. English only, Conventional Commits.
* **Stack:** Phaser 4 (Beam WebGL2), Capacitor. Never use Phaser 3 memory. Use Context7 for v4 APIs.
* **Model Purity:** `engine-sort`/`engine-block` model code imports **only TS/stdlib** — **no `phaser`, no DOM/canvas, no `Date.now()`, no `Math.random()`**. Time/randomness enter only via injected `Clock`/seeded `Rng`. A model must play a full game in a Node test.
* **View Thinness:** Phaser scenes render model state; **no rules in scenes**. **Theme = config only**, no logic. Reskins edit `apps/*/src/themes/**` only; never copy logic into `apps/*`.
* **DI (Dependency Injection):** Depend on interfaces, never concretions; construct providers at the app composition root (`apps/*/src/composition-root.ts`). No service-locator/singleton inside engines/models.
* **DRY:** Shared logic lives in `packages/*`; a fix happens in exactly one place; a step that adds rules under `apps/*` is wrong.
* **TDD:** Model logic is written test-first (failing Vitest → impl → refactor).
* **Determinism:** One seeded `Rng` (mulberry32/xorshift); same seed → same stream.
* **Native Build:** `base:'./'` via Vite `--mode native` (or black screen). Portrait-locked 1080x1920, Scale FIT, dPR-aware, safe areas, `render.stencil:false`.
* **a11y:** Every color **also** carries a distinct shape/symbol/pattern (colorblind-safe); large tap targets; banners clear of tap targets.
* **Assets:** Original vector/programmatic art + CC0/self-made audio only; **no copyrighted/AI-likeness assets**; atlases ≤ 2048².
* **Per commit:** `pnpm turbo run typecheck` (tsc `--noEmit`, strict) + `pnpm turbo run lint` (eslint) clean; `pnpm turbo run test` (vitest) green; stage files **by name**; update docs in the same commit as behavior; **never weaken a rule or a test/solvability tolerance to pass a check — escalate.**

## 2. DI & Adapter Boundaries
* **Concrete SDK imports belong ONLY in:**
  * `apps/*/src/composition-root.ts` — wires all ports for that app
  * `packages/ads-adapter/src/` — AdMob, UMP, web ads
  * `packages/engine/src/adapters/` — IAP, Analytics, Storage, Leaderboard, Sentry
* Everywhere else: depend on **interfaces** from `@blublux/engine` ports.
* **UMP Invariant:** `initialize()` → `requestConsentInfo()` → `showConsentForm()` if required → `canRequestAds === true` → ONLY THEN load/show.
* **Analytics:** Events fire **only post-consent**. Server-free, offline-first.
* **Dev vs prod:** Test ad unit IDs when `import.meta.env.DEV`. Never hardcode live IDs.

## 3. Human Gates (Never Auto-Cross)
* **S15 (REVIEW GATE):** Review slice before scaling to reskins or block apps.
* **S31 (GATED):** Secrets required. Ask for configuration.
* **S32 (SIGN-OFF):** Device QA on low-end Android.
* **S33 (DESTRUCTIVE/PAID):** Web deploy + staged native store submission. Never auto-submit.
