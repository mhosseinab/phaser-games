export interface TierConfig {
  colors: number;
  capacity: number;
  empties: number;
  minDepth: number;
}

export const TIERS: Record<string, TierConfig> = {
  Tutorial: { colors: 2, capacity: 4, empties: 2, minDepth: 5 },
  Easy: { colors: 4, capacity: 4, empties: 2, minDepth: 15 },
  Medium: { colors: 8, capacity: 4, empties: 2, minDepth: 30 },
  Hard: { colors: 10, capacity: 4, empties: 2, minDepth: 45 },
  Expert: { colors: 12, capacity: 4, empties: 2, minDepth: 60 },
};
