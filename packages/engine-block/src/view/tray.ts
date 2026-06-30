import Phaser from 'phaser';
import { Piece } from '../model';
import { BlockTheme } from './BlockScene';

export function renderTray(
  scene: Phaser.Scene,
  theme: BlockTheme,
  initialPieces: Piece[],
  onDragStart: (idx: number) => void,
  onDragMove: (idx: number, row: number, col: number) => void,
  onDragEnd: (idx: number, row: number, col: number) => void
) {
  const container = scene.add.container(0, theme.trayY);
  const piecesData: { container: Phaser.GameObjects.Container, originalX: number, originalY: number }[] = [];

  const trayWidth = scene.cameras.main.width;
  const slotWidth = trayWidth / 3;

  function createPiece(piece: Piece, index: number) {
    if (!piece) return;

    const pieceContainer = scene.add.container(slotWidth * index + slotWidth / 2, 0);
    // Find piece bounds to center it
    let minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;
    if (piece.cells.length > 0) {
      minRow = Math.min(...piece.cells.map(c => c.row));
      maxRow = Math.max(...piece.cells.map(c => c.row));
      minCol = Math.min(...piece.cells.map(c => c.col));
      maxCol = Math.max(...piece.cells.map(c => c.col));
    }
    const width = (maxCol - minCol + 1) * theme.cellSize;
    const height = (maxRow - minRow + 1) * theme.cellSize;
    const offsetX = -width / 2;
    const offsetY = -height / 2;

    piece.cells.forEach(cell => {
      const sprite = scene.add.sprite(
        offsetX + (cell.col - minCol) * theme.cellSize + theme.cellSize / 2,
        offsetY + (cell.row - minRow) * theme.cellSize + theme.cellSize / 2,
        theme.atlasKeys.game,
        theme.frames.block
      );
      sprite.setTint(theme.colors.trayBlock || 0xffaa00);
      pieceContainer.add(sprite);
    });

    // Invisible hit area
    const hitArea = scene.add.rectangle(0, 0, width, height, 0xff0000, 0);
    pieceContainer.add(hitArea);
    hitArea.setInteractive({ useHandCursor: true, draggable: true });

    scene.input.setDraggable(hitArea);

    hitArea.on('dragstart', () => {
      onDragStart(index);
      pieceContainer.setDepth(100);
    });

    hitArea.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      pieceContainer.x += dragX - hitArea.x;
      pieceContainer.y += dragY - hitArea.y;

      // Calculate row and col relative to board
      // Assuming drag pointer represents the top-left of the piece's bounding box
      // Actually, pieceContainer.x is center of piece. We need board coordinates.
      // piece center is pieceContainer.x, pieceContainer.y
      // top-left of piece is pieceContainer.x + offsetX, pieceContainer.y + offsetY
      const ptX = pieceContainer.x + offsetX;
      const ptY = pieceContainer.y + offsetY + theme.trayY; // absolute Y

      const col = Math.round((ptX - theme.boardX) / theme.cellSize);
      const row = Math.round((ptY - theme.boardY) / theme.cellSize);

      onDragMove(index, row, col);
    });

    hitArea.on('dragend', () => {
      pieceContainer.setDepth(0);
      const ptX = pieceContainer.x + offsetX;
      const ptY = pieceContainer.y + offsetY + theme.trayY;

      const col = Math.round((ptX - theme.boardX) / theme.cellSize);
      const row = Math.round((ptY - theme.boardY) / theme.cellSize);
      onDragEnd(index, row, col);
    });

    container.add(pieceContainer);
    piecesData[index] = {
      container: pieceContainer,
      originalX: pieceContainer.x,
      originalY: pieceContainer.y
    };
  }

  function update(pieces: Piece[]) {
    // Recreate pieces that still exist
    container.removeAll(true);
    piecesData.length = 0;
    for (let i = 0; i < 3; i++) {
      if (pieces[i]) {
        createPiece(pieces[i] as Piece, i);
      }
    }
  }

  update(initialPieces);

  return {
    snapBack: (index: number) => {
      const p = piecesData[index];
      if (p) {
        scene.tweens.add({
          targets: p.container,
          x: p.originalX,
          y: p.originalY,
          duration: 200,
          ease: 'Back.easeOut'
        });
      }
    },
    update,
    destroy: () => container.destroy()
  };
}
