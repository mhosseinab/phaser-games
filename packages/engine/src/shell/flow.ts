import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() { super({ key: 'Boot' }); }
  preload() {
    // load minimal assets for preload scene
  }
  create() {
    this.scene.start('Preload');
  }
}

export class PreloadScene extends Scene {
  constructor() { super({ key: 'Preload' }); }
  preload() {
    // load game assets
  }
  create() {
    this.scene.start('MainMenu');
  }
}

export class MainMenuScene extends Scene {
  constructor() { super({ key: 'MainMenu' }); }
  create() {
    // generic main menu
  }
}

export class GameScene extends Scene {
  constructor() { super({ key: 'Game' }); }
  create() {
    // generic game wrapper
  }
}
