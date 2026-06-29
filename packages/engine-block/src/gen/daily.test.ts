import { describe, it, expect } from "vitest";
import { dailySeed } from "./daily";

describe("dailySeed", () => {
  it("returns a stable number for a given date string", () => {
    expect(dailySeed("2026-06-29")).toBe(dailySeed("2026-06-29"));
    expect(dailySeed("20260629")).toBe(dailySeed("20260629"));
  });

  it("returns different numbers for different dates", () => {
    expect(dailySeed("2026-06-29")).not.toBe(dailySeed("2026-06-30"));
  });
});
