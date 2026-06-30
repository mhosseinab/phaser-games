import Phaser from 'phaser';
import { BaseGameScene } from '@blublux/engine';
import { SortState, SortTheme, generate, TIERS } from '@blublux/engine-sort';
import { createPorts } from '../composition-root';

export class BootScene extends BaseGameScene {
  private ports = createPorts();
  
  constructor() {
    super('BootScene');
  }

  override preload() {
    // Generate a placeholder atlas for development
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // container: 80x150
    graphics.lineStyle(4, 0xaaaaaa);
    graphics.strokeRect(0, 0, 80, 150);
    
    // segment: 70x25
    graphics.fillStyle(0xffffff);
    graphics.fillRect(100, 0, 70, 25);
    
    // particle: 10x10
    graphics.fillStyle(0xffd700);
    graphics.fillCircle(205, 5, 5);

    graphics.generateTexture('game-atlas', 250, 150);
    graphics.clear();
    
    const tex = this.textures.get('game-atlas');
    // Ensure frames are added. add(name, sourceIndex, x, y, width, height)
    if (!tex.has('container')) tex.add('container', 0, 0, 0, 80, 150);
    if (!tex.has('segment')) tex.add('segment', 0, 100, 0, 70, 25);
    if (!tex.has('particle')) tex.add('particle', 0, 200, 0, 10, 10);
  }

  override create() {
    // Provide a basic butterfly-sort Theme
    const theme: SortTheme = {
      palette: [
        { color: 0xff4444, symbolFrame: 'sym-1' },
        { color: 0x44ff44, symbolFrame: 'sym-2' },
        { color: 0x4444ff, symbolFrame: 'sym-3' },
        { color: 0xffff44, symbolFrame: 'sym-4' },
      ],
      atlasKeys: {
        game: 'game-atlas',
      },
      frames: {
        container: 'container',
        segment: 'segment',
        particle: 'particle'
      },
      sfx: {
        pour: 'sfx-pour',
        blocked: 'sfx-blocked',
        win: 'sfx-win',
        select: 'sfx-select'
      },
      copy: {
        winMessage: 'You Win!'
      }
    };

    const tier = TIERS.Easy || { colors: 4, capacity: 4, empties: 2, minDepth: 15 };
    const state = generate(tier, this.ports.rng);

    this.scene.start('SortScene', { state, theme, ports: this.ports });
  }
}
