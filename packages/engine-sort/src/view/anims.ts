import Phaser from 'phaser';
import { SortTheme } from './theme';

export const playShakeTween = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject[],
  theme: SortTheme,
  onComplete?: () => void
) => {
  scene.tweens.add({
    targets,
    x: '+=10',
    yoyo: true,
    repeat: 3,
    duration: 50,
    ease: 'Sine.easeInOut',
    onComplete
  });
};

export const playPourTween = (
  scene: Phaser.Scene,
  segments: Phaser.GameObjects.Sprite[],
  destX: number,
  destY: number,
  theme: SortTheme,
  onComplete?: () => void
) => {
  scene.tweens.add({
    targets: segments,
    x: destX,
    y: destY,
    duration: 300,
    ease: 'Quad.easeOut',
    delay: scene.tweens.stagger(50),
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });
};

export const playCelebrationParticles = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  theme: SortTheme
) => {
  if (!theme.frames.particle) return;
  const emitter = scene.add.particles(x, y, theme.atlasKeys.game, {
    frame: theme.frames.particle,
    speed: { min: -200, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    lifespan: 1000,
    quantity: 30,
    blendMode: 'ADD'
  });
  
  scene.time.delayedCall(1000, () => {
    emitter.destroy();
  });
};
