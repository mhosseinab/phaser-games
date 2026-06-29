# 04 — CI/CD and Store Delivery

Sourced June 2026. Citations `[n]` → `99-sources.md`. Templates: `assets/templates/ci/`.

## CI — affected lint/typecheck/test/build (GitHub Actions)

Run `turbo run lint typecheck test build --affected` so a PR touching one game doesn't rebuild the other 59. [t2][t-affected]

Two non-obvious requirements:
- **`fetch-depth: 0`** on checkout — `--affected` needs full history to diff against `origin/main`, else it runs everything. [t-affected]
- **Cache the pnpm store, not `node_modules`.** `actions/cache` keyed on `hashFiles('**/pnpm-lock.yaml')` pointing at `pnpm store path`. (`setup-node` `cache:'pnpm'` only covers root node_modules in a workspace.) [t5]
- `TURBO_TOKEN`/`TURBO_TEAM` for Vercel Remote Cache across runners.

See `ci.yml`. For native builds, derive a matrix of changed games from `turbo run build --dry-run=json --affected` and only build those.

## Native build + release

### Android (`ubuntu-latest`) [capgo-android]
`pnpm install` → `pnpm --filter <game> build:native` → `npx cap sync` → Fastlane. Keystore stored as a Base64 GitHub secret, decoded to a temp file; signing injected via Gradle properties. Auto-increment `versionCode` by reading the current Play track. Target **API 35** (required for new submissions). Upload AAB to the `internal` track, promote later.

```ruby
lane :beta do
  keystore = "#{Dir.tmpdir}/ks.keystore"
  File.write(keystore, Base64.decode64(ENV['ANDROID_KEYSTORE_FILE']))
  json = Base64.decode64(ENV['PLAY_CONFIG_JSON'])
  code = google_play_track_version_codes(package_name: ENV['PKG'], track: 'internal', json_key_data: json)[0] + 1
  gradle(task: 'clean bundleRelease', project_dir: 'android/', properties: {
    'android.injected.signing.store.file' => keystore,
    'android.injected.signing.store.password' => ENV['KEYSTORE_STORE_PASSWORD'],
    'android.injected.signing.key.alias' => ENV['KEYSTORE_KEY_ALIAS'],
    'android.injected.signing.key.password' => ENV['KEYSTORE_KEY_PASSWORD'],
    'versionCode' => code })
  upload_to_play_store(package_name: ENV['PKG'], json_key_data: json, track: 'internal', release_status: 'completed')
end
```

### iOS (`macos-latest`, billed ~$0.08/min — verify current pricing before scaling to 60) [capgo-ios]
`pnpm --filter <game> build:native` → `npx cap sync` → Fastlane **match** (`readonly: true` in CI — never create/upload there) → App Store Connect API key → `pilot` to TestFlight. `skip_waiting_for_build_processing: true` saves minutes (then mark compliance manually). **Don't copy old Fastfiles using `template_name` — removed May 2025.** [capgo-ios][f-match]

Required iOS secrets: `APPLE_KEY_ID`, `APPLE_ISSUER_ID`, `APPLE_KEY_CONTENT` (p8), `MATCH_PASSWORD`, `CERTIFICATE_STORE_URL`, `GIT_USERNAME`/`GIT_TOKEN`, plus per-game `DEVELOPER_APP_ID`, `DEVELOPER_APP_IDENTIFIER`, `PROVISIONING_PROFILE_SPECIFIER`.

## Store upload automation

- **Google Play:** Fastlane `supply`/`upload_to_play_store` over a Google Cloud **service account** JSON (enable "Google Play Android Developer API"; grant "Release to testing/production"). Tracks `internal→alpha→beta→production`. [f-supply][f-upload-play]
- **Apple:** Fastlane `pilot`/`deliver` with an **App Store Connect API key** (`app_store_connect_api_key`), App Manager role minimum. [f-pilot][f-asc-api]

## Web release CD
Affected web builds → deploy. Mind the **Cloudflare Pages 5-projects-per-repo** limit (`02-dual-deploy.md`): use `wrangler pages deploy` Direct Upload from CI, request an increase, or a single path-based project. Vercel/Netlify are alternatives. [cf-monorepo]

## Versioning
Changesets (independent mode) for JS versions; native build numbers auto-incremented in Fastlane (see Android lane; iOS via `increment_build_number`/ASC API). [cs26]

## Reality check at 60 apps
60 sets of Apple/Play records and per-game secrets is real operational weight; structure secret names (`GAME_001_*`) and select dynamically. **Build and validate the pipeline on 3–5 games first**, then template. And re-read the store-saturation risk in `00-architecture.md` before mass-submitting — the bottleneck is policy, not pipeline.
