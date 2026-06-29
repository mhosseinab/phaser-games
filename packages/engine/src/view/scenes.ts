import Phaser from 'phaser';

export abstract class BaseGameScene extends Phaser.Scene {
  constructor(key: string) {
    super({ key });
  }

  init(data?: any): void {}
  preload(): void {}
  create(data?: any): void {}
  override update(time: number, delta: number): void {}
}

export class BootScene extends BaseGameScene {
  constructor() {
    super('BootScene');
  }
}

export class PreloaderScene extends BaseGameScene {
  constructor() {
    super('PreloaderScene');
  }
}
