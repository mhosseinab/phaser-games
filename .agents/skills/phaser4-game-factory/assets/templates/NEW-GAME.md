# Scaffolding a new game (agent playbook)

Steps to create `apps/<game-id>/` from these templates. Replace placeholders:
`__GAME_ID__` (e.g. `game-001`), `__APP_ID__` (e.g. `com.studio.puzzle01`), `__APP_NAME__` (e.g. `Puzzle Quest`).

1. **Copy** `game/` → `apps/<game-id>/`. Substitute placeholders in `package.json`, `capacitor.config.ts`, `index.html`.
2. **Install**: from repo root, `pnpm install` (links `@studio/engine` via `workspace:*`).
3. **Build the game** in `apps/<game-id>/src/`:
   - Add scenes (extend the engine's `BaseScene`); register them in `main.ts`.
   - Author `public/assets/preload-asset-pack.json` (prefer PCT atlases). Pack sprites with `free-tex-packer-cli` in a `prebuild` script.
   - All ad calls go through `createAds()` — never call AdMob/portal SDKs directly.
4. **Run web**: `pnpm --filter @studio/<game-id> dev`.
5. **Add native (only if this game ships to stores)**:
   - `pnpm --filter @studio/<game-id> exec cap add ios android`
   - Put AdMob app IDs in `AndroidManifest.xml` / `Info.plist` (references/03 §A3).
   - Add icons/splash via `@capacitor/assets`.
   - `pnpm --filter @studio/<game-id> sync` then `open:ios` / `open:android`.
6. **Set env** (`.env.production`, `.env.native`): `VITE_ADMOB_BANNER/INTERSTITIAL/REWARDED`. Dev uses Google test IDs automatically.
7. **Quality gate**: run the per-game checklist in `references/05-production-checklist.md` before considering it done.
8. **CI/CD**: copy `ci/Fastfile.android` + `ci/Fastfile.ios` into `apps/<game-id>/fastlane/`; add per-game secrets; tag `<game-id>-vX.Y.Z` to release.

Reminder: before mass-producing native apps, re-read `references/00-architecture.md` §Strategic-Risk. Default to web-first; submit only differentiated native titles or genre container apps.
