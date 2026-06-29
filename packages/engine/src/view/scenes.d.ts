import Phaser from 'phaser';
export declare abstract class BaseGameScene extends Phaser.Scene {
    constructor(key: string);
    init(data?: any): void;
    preload(): void;
    create(data?: any): void;
    update(time: number, delta: number): void;
}
export declare class BootScene extends BaseGameScene {
    constructor();
}
export declare class PreloaderScene extends BaseGameScene {
    constructor();
}
//# sourceMappingURL=scenes.d.ts.map