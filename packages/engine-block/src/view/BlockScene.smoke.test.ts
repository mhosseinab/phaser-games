import { describe, it, expect, vi } from 'vitest';
import { BlockController, BlockGameState, BlockTheme, BlockScenePorts, BlockView } from './BlockScene';
import { Piece } from '../model';

describe('BlockScene controller logic', () => {
  const dummyPiece: Piece = { cells: [{ row: 0, col: 0 }] };

  const createMockView = (): BlockView => ({
    renderState: vi.fn(),
    playClearAnimation: vi.fn(),
    playGameOverAnimation: vi.fn(),
    showGhost: vi.fn(),
    hideGhost: vi.fn(),
    snapPieceBack: vi.fn(),
  });

  const createMockPorts = (): BlockScenePorts => ({
    ads: {} as any,
    analytics: { log: vi.fn() } as any,
    audio: { play: vi.fn() } as any,
    haptics: { impact: vi.fn() } as any,
    rng: {} as any,
    clock: {} as any,
  });

  const createDummyTheme = (): BlockTheme => ({
    cellSize: 40,
    boardX: 0,
    boardY: 0,
    trayY: 400,
    colors: {},
    atlasKeys: { game: 'game' },
    frames: { block: 'block', empty: 'empty' },
    sfx: { place: 'place', clear: 'clear', gameover: 'gameover', invalid: 'invalid', select: 'select' }
  });

  it('handles valid drag and drop', () => {
    const state: BlockGameState = {
      grid: {
        size: 8,
        mode: 'lines',
        cells: Array.from({ length: 8 }, () => Array(8).fill(false))
      },
      tray: [dummyPiece],
      score: 0
    };
    
    const view = createMockView();
    const ports = createMockPorts();
    const controller = new BlockController(state, createDummyTheme(), ports, view);

    // Start drag
    controller.onDragStart(0);
    expect(ports.audio.play).toHaveBeenCalledWith('select');

    // Drag move to valid spot
    controller.onDragMove(0, 4, 4);
    expect(view.showGhost).toHaveBeenCalledWith(dummyPiece, 4, 4, true);

    // Drop
    controller.onDragEnd(0, 4, 4);
    
    // Asserts
    expect(state.grid.cells[4]![4]).toBe(true); // Place logic applied
    expect(ports.audio.play).toHaveBeenCalledWith('place');
    expect(view.renderState).toHaveBeenCalled();
    expect(state.tray.length).toBe(0); // Piece removed from tray
  });

  it('handles invalid drag drop', () => {
    const state: BlockGameState = {
      grid: {
        size: 8,
        mode: 'lines',
        cells: Array.from({ length: 8 }, () => Array(8).fill(false))
      },
      tray: [dummyPiece],
      score: 0
    };
    // Block cell (4,4)
    state.grid.cells[4]![4] = true;
    
    const view = createMockView();
    const ports = createMockPorts();
    const controller = new BlockController(state, createDummyTheme(), ports, view);

    // Drag move to invalid spot
    controller.onDragMove(0, 4, 4);
    expect(view.showGhost).toHaveBeenCalledWith(dummyPiece, 4, 4, false);

    // Drop on invalid spot
    controller.onDragEnd(0, 4, 4);
    
    expect(ports.audio.play).toHaveBeenCalledWith('invalid');
    expect(view.snapPieceBack).toHaveBeenCalledWith(0);
    expect(state.tray.length).toBe(1); // Piece not removed
  });

  it('triggers clear logic and animation', () => {
    const state: BlockGameState = {
      grid: {
        size: 8,
        mode: 'lines',
        cells: Array.from({ length: 8 }, () => Array(8).fill(false))
      },
      tray: [dummyPiece],
      score: 0
    };
    // Fill almost full row 0
    for (let c = 1; c < 8; c++) {
      state.grid.cells[0]![c] = true;
    }
    
    const view = createMockView();
    const ports = createMockPorts();
    const controller = new BlockController(state, createDummyTheme(), ports, view);

    // Drop piece at (0,0) to complete the row
    controller.onDragEnd(0, 0, 0);

    // The row should be cleared (all false)
    for (let c = 0; c < 8; c++) {
      expect(state.grid.cells[0]![c]).toBe(false);
    }
    
    expect(ports.audio.play).toHaveBeenCalledWith('clear');
    expect(view.playClearAnimation).toHaveBeenCalled();
  });
});
