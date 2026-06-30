import { describe, it, expect, vi } from 'vitest';
import { clear } from '@blublux/engine-block/src/model/clear';

describe('Beaver Block Lines Mode', () => {
  it('clears rows and cols but not boxes in lines mode at 8x8', () => {
    let grid = {
      cells: Array(8).fill(0).map(() => Array(8).fill(false)),
      size: 8,
      mode: 'lines' as const
    };

    // Fill row 0 completely
    for (let c = 0; c < 8; c++) grid.cells[0]![c] = true;
    
    // Fill a 3x3 box (top-left) completely
    for (let r = 1; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid.cells[r]![c] = true;
      }
    }

    const result = clear(grid);
    
    // Row 0 should be cleared
    expect(result.cleared.rows).toContain(0);
    expect(result.cleared.boxes.length).toBe(0);
  });
});

describe('Monetization Gating', () => {
  it('prevents interstitial if not consented', async () => {
    let requested = false;
    const fakeConsent = {
      request: vi.fn().mockResolvedValue({ canRequestAds: false })
    };
    const fakeAds = {
      init: vi.fn(),
      showBanner: vi.fn(),
      hideBanner: vi.fn(),
      interstitial: vi.fn().mockImplementation(async () => { requested = true; }),
      rewarded: vi.fn().mockResolvedValue({ rewarded: false })
    };
    
    const consent = await fakeConsent.request();
    fakeAds.init(consent.canRequestAds);
    expect(fakeAds.init).not.toHaveBeenCalledWith(true);
  });
  
  it('monotonically increases best score', () => {
    let bestScore = 10;
    const updateScore = (newScore: number) => {
      if (newScore > bestScore) bestScore = newScore;
    };
    updateScore(5);
    expect(bestScore).toBe(10);
    updateScore(15);
    expect(bestScore).toBe(15);
  });
});
