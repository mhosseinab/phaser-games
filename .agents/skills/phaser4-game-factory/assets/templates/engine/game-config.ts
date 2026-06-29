// @studio/engine — mobile-correct Phaser 4 config factory.
// Verified patterns from references/01-phaser4.md. Pin Phaser with `npm info phaser version`.
import Phaser from 'phaser';

export interface GameConfigOptions {
  width?: number;            // design width (logical). Default 720.
  height?: number;           // design height (logical). Default 1280 (portrait).
  backgroundColor?: string;
  scenes: Phaser.Types.Scenes.SceneType[];
  /** FIT = letterbox (fixed ratio). ENVELOP = crop-fill. RESIZE = match viewport. */
  scaleMode?: Phaser.Scale.ScaleModeType;
}

export function createGameConfig(opts: GameConfigOptions): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO, // WebGL (Beam) with Canvas fallback; Canvas is deprecated in v4 — WebGL is the target
    parent: 'game',
    backgroundColor: opts.backgroundColor ?? '#000000',
    scale: {
      mode: opts.scaleMode ?? Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // Retina-correct sizing — required in a WebView, see references/01 & 02.
      width: (opts.width ?? 720),
      height: (opts.height ?? 1280),
    },
    render: {
      antialias: false,           // crisper + faster on mobile
      roundPixels: true,
      transparent: false,         // opaque canvas is faster
      powerPreference: 'high-performance',
      stencil: false,             // saves video memory if you don't use Stencil objects (v4.2+)
    },
    fps: { target: 60, min: 30 },
    // Arcade is the mobile-cheap default; switch to 'matter' only if you need rigid bodies.
    physics: { default: 'arcade', arcade: { debug: false } },
    dom: { createContainer: false },
    scene: opts.scenes,
    // DPR handling: keep a fixed design resolution (e.g. 720x1280) with FIT — Phaser's WebGL
    // renderer draws to the device backing store. If you need sharper HiDPI output, switch to
    // Scale.RESIZE and set width/height to innerWidth/Height * devicePixelRatio, then reposition
    // objects on resize (references/01-phaser4.md §Scale Manager). For pixel-art set pixelArt:true.
  } as Phaser.Types.Core.GameConfig;
}

// Apply once at boot: respect reduced-motion (a11y) and expose a global toggle.
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
