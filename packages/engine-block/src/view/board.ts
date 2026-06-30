import Phaser from 'phaser';
import { GridState, Piece } from '../model';
import { BlockTheme } from './BlockScene';
import { Pool } from '@blublux/engine';

export function createBoardBackground(scene: Phaser.Scene, container: Phaser.GameObjects.Container, grid: GridState, theme: BlockTheme) {
  const graphics = scene.add.graphics();
  graphics.lineStyle(1, 0x333333, 0.5);

  const boardWidth = grid.size * theme.cellSize;
  const boardHeight = grid.size * theme.cellSize;

  // Draw grid background
  graphics.fillStyle(0x1a1a1a, 1);
  graphics.fillRect(theme.boardX, theme.boardY, boardWidth, boardHeight);

  // Draw grid lines
  for (let i = 0; i <= grid.size; i++) {
    graphics.moveTo(theme.boardX + i * theme.cellSize, theme.boardY);
    graphics.lineTo(theme.boardX + i * theme.cellSize, theme.boardY + boardHeight);

    graphics.moveTo(theme.boardX, theme.boardY + i * theme.cellSize);
    graphics.lineTo(theme.boardX + boardWidth, theme.boardY + i * theme.cellSize);
  }

  // Draw thicker lines for 3x3 boxes if mode is box9
  if (grid.mode === 'box9' && grid.size === 9) {
    graphics.lineStyle(2, 0x666666, 1);
    for (let i = 0; i <= grid.size; i += 3) {
      graphics.moveTo(theme.boardX + i * theme.cellSize, theme.boardY);
      graphics.lineTo(theme.boardX + i * theme.cellSize, theme.boardY + boardHeight);

      graphics.moveTo(theme.boardX, theme.boardY + i * theme.cellSize);
      graphics.lineTo(theme.boardX + boardWidth, theme.boardY + i * theme.cellSize);
    }
  }
  
  graphics.strokePath();
  container.add(graphics);
}

export function renderBlocks(
  container: Phaser.GameObjects.Container, 
  grid: GridState, 
  theme: BlockTheme, 
  pool: Pool<Phaser.GameObjects.Sprite>,
  activeSprites: Phaser.GameObjects.Sprite[]
) {
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r]![c]) {
        const sprite = pool.acquire();
        sprite.setFrame(theme.frames.block);
        sprite.setPosition(
          theme.boardX + c * theme.cellSize + theme.cellSize / 2,
          theme.boardY + r * theme.cellSize + theme.cellSize / 2
        );
        sprite.setVisible(true);
        // Default color, or theme specific
        sprite.setTint(0xcccccc); 
        container.add(sprite);
        activeSprites.push(sprite);
      }
    }
  }
}

export function renderGhost(
  scene: Phaser.Scene, 
  container: Phaser.GameObjects.Container, 
  piece: Piece, 
  row: number, 
  col: number, 
  valid: boolean, 
  theme: BlockTheme
) {
  piece.cells.forEach(cell => {
    const r = row + cell.row;
    const c = col + cell.col;
    const sprite = scene.add.sprite(
      theme.boardX + c * theme.cellSize + theme.cellSize / 2,
      theme.boardY + r * theme.cellSize + theme.cellSize / 2,
      theme.atlasKeys.game,
      theme.frames.block
    );
    sprite.setAlpha(0.5);
    sprite.setTint(valid ? 0x00ff00 : 0xff0000);
    container.add(sprite);
  });
}
