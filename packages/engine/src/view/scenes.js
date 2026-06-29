import Phaser from 'phaser';
export class BaseGameScene extends Phaser.Scene {
    constructor(key) {
        super({ key });
    }
    init(data) { }
    preload() { }
    create(data) { }
    update(time, delta) { }
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
//# sourceMappingURL=scenes.js.map