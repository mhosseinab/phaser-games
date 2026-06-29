import Phaser from 'phaser';
import { BaseGameScene, Ads, Analytics, AudioBus, Haptics, Rng, Clock } from '@blublux/engine';
import { SortTheme } from './theme';
import { applyMove, legalMoves, isWon } from '../model/rules';
import { SortState } from '../model/types';
import { playShakeTween, playPourTween, playCelebrationParticles } from './anims';

export interface SortScenePorts {
  ads: Ads;
  analytics: Analytics;
  audio: AudioBus;
  haptics: Haptics;
  rng: Rng;
  clock: Clock;
}

export interface SortView {
  renderState(): void;
  playBlockedAnimation(index: number): void;
  playPourAnimation(from: number, to: number, count: number, onComplete: () => void): void;
  playWinAnimation(): void;
  highlight(index: number): void;
  unhighlight(): void;
}

export class SortController {
  public selectedContainerIndex: number | null = null;

  constructor(
    public state: SortState,
    private theme: SortTheme,
    private ports: SortScenePorts,
    private view: SortView
  ) {}

  public handleTap(index: number) {
    if (this.selectedContainerIndex === null) {
      const container = this.state.containers[index];
      if (!container || container.length === 0) return;
      
      this.selectedContainerIndex = index;
      this.view.highlight(index);
      this.ports.audio.play(this.theme.sfx.select);
      this.ports.haptics.impact('light');
    } else {
      const from = this.selectedContainerIndex;
      const to = index;
      this.selectedContainerIndex = null;
      this.view.unhighlight();

      if (from === to) return;

      const moves = legalMoves(this.state);
      const move = moves.find(m => m.from === from && m.to === to);

      if (!move) {
        // Invalid move
        this.view.playBlockedAnimation(from);
        this.ports.audio.play(this.theme.sfx.blocked);
        this.ports.haptics.impact('medium');
      } else {
        // Apply move
        this.state = applyMove(this.state, move);
        this.ports.audio.play(this.theme.sfx.pour);
        this.ports.haptics.impact('medium');
        
        this.view.playPourAnimation(from, to, move.count, () => {
          this.view.renderState();
          this.checkWin();
        });
      }
    }
  }

  private checkWin() {
    if (isWon(this.state)) {
      this.ports.audio.play(this.theme.sfx.win);
      this.ports.haptics.impact('medium');
      this.ports.analytics.log('level_complete', { moves: 1 });
      this.view.playWinAnimation();
    }
  }
}

export class SortScene extends BaseGameScene implements SortView {
  private controller!: SortController;
  private theme!: SortTheme;
  
  private containerSprites: Phaser.GameObjects.Sprite[] = [];
  private segmentSprites: Phaser.GameObjects.Sprite[][] = [];

  constructor() {
    super('SortScene');
  }

  override init(data: { state: SortState; theme: SortTheme; ports: SortScenePorts }) {
    this.theme = data.theme;
    this.controller = new SortController(data.state, data.theme, data.ports, this);
  }

  override create() {
    this.renderState();
  }

  renderState() {
    this.containerSprites.forEach(s => s.destroy());
    this.segmentSprites.flat().forEach(s => s.destroy());
    this.containerSprites = [];
    this.segmentSprites = [];

    const startX = 100;
    const startY = 300;
    const spacingX = 80;

    this.controller.state.containers.forEach((container: number[], i: number) => {
      const cx = startX + i * spacingX;
      const cy = startY;

      const containerSprite = this.add.sprite(cx, cy, this.theme.atlasKeys.game, this.theme.frames.container)
        .setInteractive()
        .on('pointerdown', () => this.controller.handleTap(i));
      this.containerSprites.push(containerSprite);

      const segments: Phaser.GameObjects.Sprite[] = [];
      container.forEach((color: number, j: number) => {
        const sx = cx;
        const sy = cy + 100 - j * 20; // Bottom to top
        const colorConfig = this.theme.palette.find(p => p.color === color);
        
        const segSprite = this.add.sprite(sx, sy, this.theme.atlasKeys.game, this.theme.frames.segment);
        segSprite.setTint(colorConfig?.color || 0xffffff);
        segments.push(segSprite);
      });
      this.segmentSprites.push(segments);
    });
  }

  highlight(index: number) {
    const segments = this.segmentSprites[index];
    if (!segments || segments.length === 0) return;
    
    const container = this.controller.state.containers[index]!;
    const topColor = container[container.length - 1];
    let runLength = 1;
    for (let i = container.length - 2; i >= 0; i--) {
      if (container[i] === topColor) runLength++;
      else break;
    }

    const topSegments = segments.slice(-runLength);
    topSegments.forEach(s => s.y -= 20);
  }

  unhighlight() {
    this.renderState();
  }

  playBlockedAnimation(index: number) {
    playShakeTween(this, [this.containerSprites[index]!, ...this.segmentSprites[index]!], this.theme);
  }

  playPourAnimation(from: number, to: number, count: number, onComplete: () => void) {
    const movingSegments = this.segmentSprites[from]!.slice(-count);
    this.segmentSprites[from] = this.segmentSprites[from]!.slice(0, -count);
    
    const destX = this.containerSprites[to]!.x;
    const destY = this.containerSprites[to]!.y - 50;

    playPourTween(this, movingSegments, destX, destY, this.theme, onComplete);
  }

  playWinAnimation() {
    this.containerSprites.forEach(sprite => {
      playCelebrationParticles(this, sprite.x, sprite.y, this.theme);
    });
  }
}
