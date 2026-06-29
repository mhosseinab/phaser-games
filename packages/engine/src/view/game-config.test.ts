import { describe, it, expect } from 'vitest';
import { makeGameConfig } from './game-config';
import { BootScene } from './scenes';
import Phaser from 'phaser';

describe('game-config', () => {
  it('creates a mobile-first game config', () => {
    const config = makeGameConfig({ parent: 'game', scenes: [BootScene] });
    expect(config.scale?.mode).toBe(Phaser.Scale.FIT);
    expect(config.scale?.width).toBe(1080);
    expect(config.scale?.height).toBe(1920);
    expect(config.render?.stencil).toBe(false);
  });
});
