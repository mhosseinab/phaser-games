import Phaser from 'phaser';
import { makeGameConfig, BootScene, PreloaderScene } from '@blublux/engine';
import { BlockScene } from '@blublux/engine-block/src/view/BlockScene';
import { dailySeed } from '@blublux/engine-block/src/gen/daily';
import { createPorts } from './composition-root';
import { beaverTheme } from './theme';
import { initMonetization } from './monetization';

async function boot() {
  const seedStr = new Date().toISOString().split('T')[0]!;
  const seed = dailySeed(seedStr);
  const ports = createPorts(seed);
  
  const consentGiven = await initMonetization(ports.ads, ports.consentManager);
  if (consentGiven) {
    ports.analytics.log('game_start', { mode: 'lines', size: 8 });
  }

  class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }
    create() {
       this.scene.start('BlockScene', {
         state: {
           grid: { cells: Array(8).fill(0).map(() => Array(8).fill(false)), size: 8, mode: 'lines' },
           tray: [],
           score: 0
         },
         theme: beaverTheme,
         ports: ports
       });
    }
  }

  const config = makeGameConfig({
    width: 720,
    height: 1280,
    parent: 'game',
    scenes: [
      BootScene,
      GameScene,
      BlockScene
    ],
  });
  
  new Phaser.Game(config);
}

boot();
