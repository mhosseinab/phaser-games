import Phaser from 'phaser';

export interface GameConfigOpts {
  parent: string;
  width?: number;
  height?: number;
  scenes: typeof Phaser.Scene[];
}

export function makeGameConfig(opts: GameConfigOpts): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    parent: opts.parent,
    width: opts.width || 1080,
    height: opts.height || 1920,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: opts.width || 1080,
      height: opts.height || 1920,
    },
    render: {
      stencil: false,
      transparent: false,
    },
    scene: opts.scenes,
  };
}
