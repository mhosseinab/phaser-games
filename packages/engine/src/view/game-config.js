import Phaser from 'phaser';
export function makeGameConfig(opts) {
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
//# sourceMappingURL=game-config.js.map