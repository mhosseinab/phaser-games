import Phaser from 'phaser';
import { BaseGameScene, Ads, Analytics, AudioBus, Haptics, Rng, Clock, Pool } from '@blublux/engine';
import { GridState, Piece, canPlace, place, clear, isGameOver, ClearedLines } from '../model';
import { renderBlocks, renderGhost, createBoardBackground } from './board';
import { renderTray } from './tray';

export interface BlockTheme {
  cellSize: number;
  boardX: number;
  boardY: number;
  trayY: number;
  colors: Record<string, number>;
  atlasKeys: { game: string };
  frames: { block: string, empty: string };
  sfx: { place: string; clear: string; gameover: string; invalid: string; select: string };
}

export interface BlockScenePorts {
  ads: Ads;
  analytics: Analytics;
  audio: AudioBus;
  haptics: Haptics;
  rng: Rng;
  clock: Clock;
}

export interface BlockGameState {
  grid: GridState;
  tray: Piece[];
  score: number;
}

export interface BlockView {
  renderState(): void;
  playClearAnimation(lines: ClearedLines, onComplete: () => void): void;
  playGameOverAnimation(): void;
  showGhost(piece: Piece, row: number, col: number, valid: boolean): void;
  hideGhost(): void;
  snapPieceBack(pieceIndex: number): void;
}

export class BlockController {
  constructor(
    public state: BlockGameState,
    private theme: BlockTheme,
    private ports: BlockScenePorts,
    private view: BlockView
  ) {}

  onDragStart(pieceIndex: number) {
    this.ports.audio.play(this.theme.sfx.select);
    this.ports.haptics.impact('light');
  }

  onDragMove(pieceIndex: number, targetRow: number, targetCol: number) {
    const piece = this.state.tray[pieceIndex];
    if (!piece) return;

    if (targetRow < 0 || targetCol < 0 || targetRow >= this.state.grid.size || targetCol >= this.state.grid.size) {
      this.view.hideGhost();
      return;
    }

    const valid = canPlace(this.state.grid, piece, targetRow, targetCol);
    this.view.showGhost(piece, targetRow, targetCol, valid);
  }

  onDragEnd(pieceIndex: number, targetRow: number, targetCol: number) {
    this.view.hideGhost();
    const piece = this.state.tray[pieceIndex];
    if (!piece) return;

    if (!canPlace(this.state.grid, piece, targetRow, targetCol)) {
      this.ports.audio.play(this.theme.sfx.invalid);
      this.ports.haptics.impact('medium');
      this.view.snapPieceBack(pieceIndex);
      return;
    }

    this.state.grid = place(this.state.grid, piece, targetRow, targetCol);
    this.ports.audio.play(this.theme.sfx.place);
    this.ports.haptics.impact('medium');
    
    const clearResult = clear(this.state.grid);
    this.state.grid = clearResult.state;
    
    const linesCleared = clearResult.cleared.rows.length + clearResult.cleared.cols.length + clearResult.cleared.boxes.length;
    
    this.state.tray.splice(pieceIndex, 1);

    if (linesCleared > 0) {
      this.ports.audio.play(this.theme.sfx.clear);
      this.ports.haptics.impact('heavy');
      this.view.playClearAnimation(clearResult.cleared, () => {
        this.checkGameOver();
        this.view.renderState();
      });
    } else {
      this.checkGameOver();
      this.view.renderState();
    }
  }

  private checkGameOver() {
    if (this.state.tray.length > 0 && isGameOver(this.state.grid, this.state.tray)) {
      this.ports.audio.play(this.theme.sfx.gameover);
      this.ports.haptics.impact('heavy');
      this.ports.analytics.log('game_over', { score: this.state.score });
      this.view.playGameOverAnimation();
    }
  }
}

export class BlockScene extends BaseGameScene implements BlockView {
  public controller!: BlockController;
  private theme!: BlockTheme;
  
  private blockPool!: Pool<Phaser.GameObjects.Sprite>;
  private bgContainer!: Phaser.GameObjects.Container;
  private blocksContainer!: Phaser.GameObjects.Container;
  private ghostContainer!: Phaser.GameObjects.Container;
  private activeSprites: Phaser.GameObjects.Sprite[] = [];
  
  private trayManager!: { snapBack: (idx: number) => void, destroy: () => void, update: (tray: Piece[]) => void };

  constructor() {
    super('BlockScene');
  }

  override init(data: { state: BlockGameState; theme: BlockTheme; ports: BlockScenePorts }) {
    this.theme = data.theme;
    this.controller = new BlockController(data.state, data.theme, data.ports, this);
  }

  override create() {
    this.blockPool = new Pool(() => {
      const sprite = this.add.sprite(0, 0, this.theme.atlasKeys.game, this.theme.frames.block);
      sprite.setVisible(false);
      return sprite;
    });

    this.bgContainer = this.add.container(0, 0);
    this.blocksContainer = this.add.container(0, 0);
    this.ghostContainer = this.add.container(0, 0);

    createBoardBackground(this, this.bgContainer, this.controller.state.grid, this.theme);

    this.trayManager = renderTray(
      this, 
      this.theme, 
      this.controller.state.tray,
      (idx) => this.controller.onDragStart(idx),
      (idx, row, col) => this.controller.onDragMove(idx, row, col),
      (idx, row, col) => this.controller.onDragEnd(idx, row, col)
    );

    this.renderState();
  }

  renderState() {
    this.activeSprites.forEach(s => {
      s.setVisible(false);
      this.blockPool.release(s);
    });
    this.activeSprites = [];
    this.blocksContainer.removeAll();

    renderBlocks(this.blocksContainer, this.controller.state.grid, this.theme, this.blockPool, this.activeSprites);
    this.trayManager.update(this.controller.state.tray);
    this.hideGhost();
  }

  playClearAnimation(lines: ClearedLines, onComplete: () => void) {
    const clearedCells = new Set<string>();
    lines.rows.forEach(r => {
      for (let c = 0; c < this.controller.state.grid.size; c++) clearedCells.add(`\${r},\${c}`);
    });
    lines.cols.forEach(c => {
      for (let r = 0; r < this.controller.state.grid.size; r++) clearedCells.add(`\${r},\${c}`);
    });
    lines.boxes.forEach(b => {
      const br = Math.floor(b / 3) * 3;
      const bc = (b % 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) clearedCells.add(`\${br + r},\${bc + c}`);
      }
    });

    const spritesToAnimate = this.activeSprites.filter(s => {
      const row = Math.round((s.y - this.theme.boardY - this.theme.cellSize / 2) / this.theme.cellSize);
      const col = Math.round((s.x - this.theme.boardX - this.theme.cellSize / 2) / this.theme.cellSize);
      return clearedCells.has(`\${row},\${col}`);
    });

    if (spritesToAnimate.length === 0) {
      onComplete();
      return;
    }

    this.tweens.add({
      targets: spritesToAnimate,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        spritesToAnimate.forEach(s => {
          s.setAlpha(1);
          s.setScale(1);
        });
        onComplete();
      }
    });
  }

  playGameOverAnimation() {
    this.cameras.main.shake(500, 0.01);
  }

  showGhost(piece: Piece, row: number, col: number, valid: boolean) {
    this.ghostContainer.removeAll();
    renderGhost(this, this.ghostContainer, piece, row, col, valid, this.theme);
  }

  hideGhost() {
    this.ghostContainer.removeAll();
  }

  snapPieceBack(pieceIndex: number) {
    this.trayManager.snapBack(pieceIndex);
  }
}
