import { describe, it, expect, vi } from 'vitest';
import { SortController, SortView, SortScenePorts } from './SortScene';
import { SortTheme } from './theme';
import { applyMove, legalMoves, isWon } from '../model/rules';
import { SortState } from '../model/types';
import { FakeAds, FakeAnalytics, FakeAudioBus, NoopHaptics, FakeClock, createRng } from '@blublux/engine';

describe('SortController Smoke Test', () => {
  it('should wire model and theme and handle valid move without throwing', () => {
    const initialState: SortState = {
      capacity: 4,
      colors: 2,
      containers: [
        [1, 1],
        [1, 1],
        []
      ]
    };

    const theme: SortTheme = {
      palette: [{ color: 0xff0000, symbolFrame: 's1' }],
      atlasKeys: { game: 'game' },
      frames: { container: 'c', segment: 's' },
      sfx: { pour: 'pour', blocked: 'block', win: 'win', select: 'sel' },
      copy: { winMessage: 'You win!' }
    };

    const ports: SortScenePorts = {
      ads: new FakeAds(),
      analytics: new FakeAnalytics(),
      audio: new FakeAudioBus(),
      haptics: new NoopHaptics(),
      rng: createRng(123),
      clock: new FakeClock()
    };

    const view: SortView = {
      renderState: vi.fn(),
      playBlockedAnimation: vi.fn(),
      playPourAnimation: vi.fn((f, t, c, cb) => cb()),
      playWinAnimation: vi.fn(),
      highlight: vi.fn(),
      unhighlight: vi.fn()
    };

    const controller = new SortController(initialState, theme, ports, view);

    // Tap first container
    controller.handleTap(0);
    expect(controller.selectedContainerIndex).toBe(0);
    expect(view.highlight).toHaveBeenCalledWith(0);

    // Tap third container (empty) - valid move
    controller.handleTap(2);
    expect(controller.selectedContainerIndex).toBeNull();
    expect(view.unhighlight).toHaveBeenCalled();
    expect(view.playPourAnimation).toHaveBeenCalled();

    // The move should have been applied
    expect(controller.state.containers[0]).toEqual([]);
    expect(controller.state.containers[2]).toEqual([1, 1]);

    // Check win condition (not won yet since it's just 1,1 in 2)
    // Tap second container to move to third
    controller.handleTap(1);
    controller.handleTap(2);
    
    expect(controller.state.containers[2]).toEqual([1, 1, 1, 1]);
    expect(view.playWinAnimation).toHaveBeenCalled();
  });

  it('should shake on invalid move', () => {
    const initialState: SortState = {
      capacity: 4,
      colors: 2,
      containers: [
        [1],
        [2],
        []
      ]
    };

    const theme: SortTheme = {
      palette: [],
      atlasKeys: { game: 'game' },
      frames: { container: 'c', segment: 's' },
      sfx: { pour: 'pour', blocked: 'block', win: 'win', select: 'sel' },
      copy: { winMessage: 'You win!' }
    };

    const ports: SortScenePorts = {
      ads: new FakeAds(),
      analytics: new FakeAnalytics(),
      audio: new FakeAudioBus(),
      haptics: new NoopHaptics(),
      rng: createRng(123),
      clock: new FakeClock()
    };

    const view: SortView = {
      renderState: vi.fn(),
      playBlockedAnimation: vi.fn(),
      playPourAnimation: vi.fn((f, t, c, cb) => cb()),
      playWinAnimation: vi.fn(),
      highlight: vi.fn(),
      unhighlight: vi.fn()
    };

    const controller = new SortController(initialState, theme, ports, view);

    // Try to move 1 onto 2
    controller.handleTap(0);
    controller.handleTap(1);

    expect(view.playBlockedAnimation).toHaveBeenCalledWith(0);
    expect(controller.state.containers[0]).toEqual([1]); // State unchanged
  });
});
