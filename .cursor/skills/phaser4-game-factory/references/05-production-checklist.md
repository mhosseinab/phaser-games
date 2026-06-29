# 05 — Production Best Practices + Pre-Submission Checklist

Sourced June 2026. Citations `[n]` → `99-sources.md`.

## Testing — test logic, not the renderer
Don't test what Phaser provides (rendering, collisions, audio). Extract pure logic (scoring, state machines, level/loot generation, difficulty, validators) into framework-free functions and unit-test those with **Vitest** (reuses `vite.config.ts`, Jest-compatible). [test-vitest] Use `vitest-canvas-mock` only when a test must instantiate a Phaser object; `describe.each(LEVELS)` to assert structural integrity across all levels. **Playwright** for smoke tests: boots without console errors, loader completes, menu reachable, a session starts, ad calls fire (mock them). Avoid canvas pixel-diffing (fragile); visual-regress only DOM/CSS overlays. [test-playwright]

## Performance — 16.67ms/frame budget
- **Phaser ≥4.x** (or ≥3.60 if ever on v3) for the Mobile Pipeline; profile on a real low-end Android. [perf-mobilepipeline][perf-guide]
- **Texture atlases** are the biggest win (50 draws→1). ≤**2048²** for mobile, power-of-two, split by category. Free: `free-tex-packer-cli`, ilovesprites, ToolBuddy; paid: TexturePacker (CLI, mesh trim). [perf-guide][ftp]
- **Object pooling** for anything spawned often — avoids GC stutter. [perf-guide]
- **Preserve batching:** group by blend mode, minimize `Container` (breaks batching — use `Group`), bake static art with `RenderTexture`, minimize tint changes. [perf-guide]
- **Physics:** Arcade not Matter; `debug:false`; disable bodies off-screen; static bodies for immovable; `Geom.Rectangle.Overlaps` for detection-only. [perf-guide]
- **Memory:** clean listeners on scene `shutdown`; `textures.remove()` per level; `scene.sleep()/wake()` for pause (not stop/start). [perf-guide]
- **Images:** AVIF→WebP→PNG/JPEG fallback; Phaser supports GPU-compressed KTX/PVR (ASTC Android, PVRTC older iOS) — but Vite+basis/ktx2 toolchain integration is non-trivial (UNVERIFIED, test it). [perf-textures][webdev-img]
- **Renderer config:** `antialias:false`, `roundPixels:true`, `transparent:false`, `powerPreference:'high-performance'`. Add an adaptive-quality manager that drops particles/effects when sustained FPS falls. [perf-guide]
- Bundle budgets (UNVERIFIED, community guidance): initial JS <500KB gz, first-playable assets <2MB; dynamic-`import()` scenes to split.

## Asset pipeline
Separate source vs generated assets; generate atlases in a `prebuild` script (don't commit regenerables). Ship **OGG+MP3** (iOS WebKit has no OGG) and pack SFX into **audio sprites** (`load.audioSprite`) to cut requests. Scene-based progressive loading (Boot→Menu→Level), show a progress bar, unload prior-level assets. Vite content-hashes assets → 1-year immutable cache; **verify atlas JSON still resolves the hashed PNG after build (UNVERIFIED edge case).** [audio-sprite][cache-vite]

## Analytics / LiveOps
**Firebase Analytics (GA4)** — init only after consent. Use the official game events: `level_start`, `level_end`, `level_up`, `post_score`, `tutorial_begin`, `tutorial_complete`, `unlock_achievement`, `earn_/spend_virtual_currency`, `ad_impression`; plus custom `game_over{score,level,session_sec}`. Names ≤40 chars, no reserved prefixes. [ga4-events] **Firebase Remote Config + A/B Testing** to tune ad frequency (param e.g. `interstitial_freq`, goal = estimated AdMob revenue, per-platform experiments). Link AdMob↔Firebase for ad-revenue/ARPU/LTV. [fb-adfreq][fb-adrev]

## Crash reporting
**`@sentry/capacitor`** (captures WebView JS + native). Upload source maps (`@sentry/wizard`) and iOS dSYMs. Crashlytics is native-first and doesn't read WebView JS (UNVERIFIED for hybrid) — prefer Sentry. [sentry][crashlytics]

## Privacy (gating store acceptance)
Privacy policy URL (public, stable); Google Play Data Safety form; Apple App Privacy questionnaire + `PrivacyInfo.xcprivacy`; UMP consent before AdMob/analytics; documented COPPA decision; account-deletion flow if accounts exist. [play-datasafety][apple-privacy][coppa-2026]

## i18n + a11y
`typesafe-i18n` (~1KB, typed) or `i18next`; no hardcoded strings; load by `navigator.language`. [i18n] Accessibility lifts reach and ratings: ≥4.5:1 contrast on text/UI overlays; respect `prefers-reduced-motion` (disable shake/particles/zoom); touch targets ≥44×44pt; don't encode state by color alone. [a11y-contrast][a11y-motion]

---

## Per-game pre-submission checklist (definition of done)
**Testing:** logic in pure modules; Vitest passing; `describe.each` over level data; Playwright smoke (boot/load/menu/no errors); tested on real low-end Android + iPhone.
**Performance:** Phaser ≥4; all sprites atlased ≤2048²; pooling for frequent spawns; `debug:false`, `antialias:false`; 5-min memory-growth check across scene swaps; 60fps on lowest target; audio sprites OGG+MP3; images compressed.
**Assets:** atlas generation scripted; Vite content-hashed; loading screen with progress; per-scene lazy load + unload.
**Analytics:** Firebase init after consent; core events + `ad_impression`; verified in DebugView; Remote Config ad-frequency param present.
**Crashes:** Sentry init at entry; DSN set; source maps + iOS dSYMs uploaded; test error visible.
**Privacy:** policy URL live; Play Data Safety done; Apple App Privacy done; `PrivacyInfo.xcprivacy` present with required-reason entries; UMP gating verified (`canRequestAds`); COPPA decision documented; account-deletion if accounts.
**Ads:** test IDs in dev; interstitial cap ≤1/2 actions, never launch/exit/mid-game; rewarded opt-in + grant-on-complete; banner clear of tap targets; mute+freeze input during ads; playable with ad blocker (web).
**Localization/a11y:** locale files + fallback; no hardcoded strings; ≥4.5:1 overlay contrast; reduced-motion respected; touch targets ≥44px.
**Store:** version + build number bumped; release notes; screenshots/metadata accurate; privacy labels match real SDK behavior; internal test build distributed before public.
