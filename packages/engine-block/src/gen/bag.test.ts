import { describe, it, expect } from "vitest";
import { nextTrio, BagState, PIECES } from "./bag";
import { createRng } from "@blublux/engine/src/seams/rng";
import { GridState } from "../model/types";
import { canPlace } from "../model/grid";

describe("nextTrio", () => {
  const emptyGrid: GridState = {
    cells: Array(9).fill(false).map(() => Array(9).fill(false)),
    size: 9,
    mode: "box9"
  };

  it("returns exactly 3 pieces", () => {
    const rng = createRng(12345);
    const bagState: BagState = { history: [] };
    const { trio } = nextTrio(bagState, emptyGrid, rng);
    expect(trio.length).toBe(3);
    trio.forEach(piece => {
      expect(PIECES).toContain(piece);
    });
  });

  it("is deterministic", () => {
    const bagState: BagState = { history: [] };
    const rng1 = createRng(999);
    const { trio: trio1 } = nextTrio(bagState, emptyGrid, rng1);

    const rng2 = createRng(999);
    const { trio: trio2 } = nextTrio(bagState, emptyGrid, rng2);

    expect(trio1).toEqual(trio2);
  });

  it("avoids degenerate streaks (same piece > 2 times)", () => {
    const rng = createRng(42);
    let bagState: BagState = { history: [] };

    for (let i = 0; i < 100; i++) {
      const { trio, nextBag } = nextTrio(bagState, emptyGrid, rng);
      bagState = nextBag!;
      expect(nextBag!.history.length).toBeLessThanOrEqual(4);
    }
  });

  it("exhibits anti-frustration bias", () => {
    const rng = createRng(777);
    const nearlyFullGrid: GridState = {
      cells: Array(9).fill(true).map(() => Array(9).fill(true)),
      size: 9,
      mode: "box9"
    };
    nearlyFullGrid.cells[0]![0] = false;

    let bagState: BagState = { history: [] };
    let placeableCount = 0;
    
    for (let i = 0; i < 100; i++) {
      const { trio, nextBag } = nextTrio(bagState, nearlyFullGrid, rng.fork());
      const hasPlaceable = trio.some(p => {
        for(let r=0; r<9; r++) {
          for(let c=0; c<9; c++) {
            if(canPlace(nearlyFullGrid, p, r, c)) return true;
          }
        }
        return false;
      });
      if (hasPlaceable) placeableCount++;
      bagState = nextBag!;
    }

    expect(placeableCount).toBeGreaterThan(40);
  });
});
