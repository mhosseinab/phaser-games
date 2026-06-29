# 01 — Phaser 4 Framework

Sourced June 2026. Citations `[n]` → `99-sources.md`. Re-verify the version with `npm info phaser version` before pinning.

## Status: GA, production-ready

Phaser 4 is stable and the official recommendation for **all new projects**. Do not start a new game on Phaser 3. [ph7]

| Version | Codename | Date |
|---|---|---|
| 4.0.0 | Caladan | 10 Apr 2026 |
| 4.1.0 | Salusa | 30 Apr 2026 (fixes ESM default export) |
| 4.2.0 | Giedi | 19 Jun 2026 (npm `latest`) |

npm `latest` = `4.2.0` (authoritative: dist-tags endpoint). [ph5] Phaser 3 (≈3.90) is still maintained for legacy, but no reason to choose it new. [ph7]

## The Beam renderer (WebGL2, not WebGPU)

Ground-up WebGL2 rebuild. RenderNodes replace Pipelines (each node does one thing). [ph9] Wins that matter for Capacitor/mobile:
- **Automatic WebGL context restoration** — backgrounding a Capacitor app no longer black-screens. No code needed. [ph9]
- **33% less per-frame GPU data** (4 vertices/quad via index buffers). [ph9]
- **Mobile shader optimizations** (no excess texture-unit requests, better branching). [ph9]
- **Canvas renderer deprecated** — target WebGL only; all new features (filters, lighting, GPU layers) are WebGL-exclusive. [ph9]
- `roundPixels` now defaults to `false`. [ph12]

New high-performance objects: **SpriteGPULayer** (1M+ sprites, single draw call, GPU-driven; single power-of-two texture) and **TilemapGPULayer** (fixed cost regardless of tile count) — both especially valuable on mobile. [ph10] New unified, stackable **filter system** (Bloom/Glow/Shadow/Blur/Blend…). New **PCT atlas** format is 90–95% smaller than JSON atlases — big first-load win on mobile. [ph7] `render.stencil:false` (4.2.0) saves video memory if you don't use Stencil objects. [ph4] `Timestep.setFPSLimit` (4.2.0) caps FPS at runtime to save battery. [ph4]

**Stable from v3 (no migration):** physics (Arcade + Matter), input, audio, scenes, tweens, timelines. [ph7]

## TypeScript + Vite

- Native types ship in the package (`types: ./types/phaser.d.ts`). [ph14]
- ESM works from 4.1.0+: `import Phaser from 'phaser'`. (4.0.0 ESM was broken.) [ph3] ESM build does not attach `window.Phaser`; assign it explicitly only if a plugin needs it.
- Official CLI: `npm create @phaserjs/game@latest` → choose "Vite TypeScript". [ph7]
- Official template: `github.com/phaserjs/template-vite-ts`; Phaser-4 editor template: `github.com/phaserjs/editor-starter-template-phaser4-vite`. [ph15][ph16]
- **`base: './'` in the Vite config is mandatory for Capacitor builds.** Split Phaser into its own chunk (`manualChunks: { phaser: ['phaser'] }`) so the WebView caches it across game updates. [ph20]

See the full mobile-tuned config in `assets/templates/engine/game-config.ts`.

## Production patterns

**Scene flow:** `Boot` (load only the loading-bar art) → `Preloader` (load the asset pack, show progress) → game scenes. Run a persistent `GameManager`/UI scene in parallel via `scene.launch()` for HUD, pause, and the ad bridge. Pass data with `scene.start(key, data)`. Lifecycle: `init → preload → create → update`. [ph19]

**Asset packs** are the production loading pattern: `this.load.pack('game-pack','assets/preload-asset-pack.json')`. Use a shared `assets/common/` for cross-game UI/audio loaded once; per-game packs for the rest. Prefer **PCT atlases** for new games. Native font loading: `this.load.font('Name','assets/font.otf','opentype')`. [ph16][ph7]

**Scale Manager (mobile-correct):**
```ts
scale: {
  mode: Phaser.Scale.FIT,             // FIT (letterbox) | ENVELOP (crop-fill) | RESIZE
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: window.innerWidth * window.devicePixelRatio,   // Retina-correct — required
  height: window.innerHeight * window.devicePixelRatio,
}
```
Add `viewport-fit=cover` to the viewport meta and pad UI with `env(safe-area-inset-*)` for notch/Dynamic Island. [ph20]

**Input:** unified pointer API for mouse+touch: `this.input.on('pointerdown', …)`; per-object after `setInteractive()`; dragging via `setInteractive({draggable:true})` + `'drag'`. Branch with `this.game.device.os.desktop` or `Capacitor.isNativePlatform()`. [ph19]

**Audio:** Phaser auto-unlocks the AudioContext on first gesture — never autoplay before a touch. `this.sound.add(key,{loop,volume})`. Ship OGG+MP3 (iOS WebKit lacks OGG). [ph7]

**Object pooling:** Groups with `maxSize` + `get()`/`getFirstDead()`; return via `setActive(false).setVisible(false)` and disable the body. For huge counts use SpriteGPULayer and set scale/alpha to 0 instead of removing. [ph10]

**Physics:** **Arcade** for almost everything (AABB, mobile-cheap); Matter only when you need rigid-body/polygon (5–10× cost). Always `debug:false` in production.

**State:** game registry across scenes (`this.game.registry.set/get`), scene data (`this.data`), change events (`registry.events.on('changedata-score',…)`).

**Plugins:** register the ad bridge, analytics, and shared UI once at boot as global/scene plugins so every scene gets them. [ph]

## Capacitor/WebView gotchas (verify on real mid-range Android, not emulator)
1. `base: './'` mandatory. [ph20]
2. `devicePixelRatio` scaling mandatory for Retina. [ph20]
3. `viewport-fit=cover` + safe-area insets for iOS notch. [ph20]
4. `render.stencil:false` if no stencil use; `setFPSLimit` to save battery. [ph4]
5. Audio only after a user gesture (Phaser handles unlock). [ph20]
6. Context loss auto-recovers in v4 — still verify by backgrounding during test. [ph9]
7. Keep texture memory bounded (atlases + compressed textures); unload per scene.
