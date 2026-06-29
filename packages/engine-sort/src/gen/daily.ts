import { createRng } from '@blublux/engine';
import { generate } from './generate';
import { TIERS } from './tiers';

export const dailySeed = (yyyymmdd: number): number => {
  return parseInt(`1337${yyyymmdd}`, 10);
};

export const generateDaily = (yyyymmdd: number) => {
  const rng = createRng(dailySeed(yyyymmdd));
  return generate(TIERS.Expert!, rng);
};
