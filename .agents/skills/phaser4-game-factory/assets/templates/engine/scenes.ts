// @studio/engine — reusable Boot + Preloader scenes. Pattern from references/01-phaser4.md §6.
import Phaser from 'phaser';

/** Boot: load ONLY the loading-bar art, then go to Preloader. Keep it <10KB. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // this.load.image('logo', 'assets/boot/logo.png');
    // this.load.image('bar', 'assets/boot/bar.png');
  }
  create() { this.scene.start('Preloader'); }
}

export interface PreloaderConfig {
  /** Asset pack JSON describing all game assets. Prefer PCT atlases (v4) for size. */
  pack: string;
  next: string; // scene key to start when done
}

/** Preloader: load the asset pack with a progress bar; unload happens per-scene later. */
export class PreloaderScene extends Phaser.Scene {
  private cfg: PreloaderConfig;
  constructor(cfg: PreloaderConfig) { super('Preloader'); this.cfg = cfg; }

  preload() {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, width * 0.6, 16, 0x222222);
    const bar = this.add.rectangle(barBg.x - barBg.width / 2, barBg.y, 0, 12, 0xffffff).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = barBg.width * v; });

    this.load.pack('game-pack', this.cfg.pack);
  }

  create() { this.scene.start(this.cfg.next); }
}

/** Base scene helpers: unlock audio on first input, clean up on shutdown. */
export class BaseScene extends Phaser.Scene {
  protected unlockAudioOnce() {
    this.input.once('pointerdown', () => {
      const ctx = (this.sound as any).context;
      if (ctx && ctx.state === 'suspended') ctx.resume();
    });
  }
  protected onShutdown(fn: () => void) {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, fn);
  }
}
