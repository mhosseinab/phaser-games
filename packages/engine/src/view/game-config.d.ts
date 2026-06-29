import Phaser from 'phaser';
export interface GameConfigOpts {
    parent: string;
    width?: number;
    height?: number;
    scenes: typeof Phaser.Scene[];
}
export declare function makeGameConfig(opts: GameConfigOpts): Phaser.Types.Core.GameConfig;
//# sourceMappingURL=game-config.d.ts.map