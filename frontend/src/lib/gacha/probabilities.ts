import { probabilityRates } from '@/data/wish-setup.json';
import { localrate } from './storage';

export interface RateConfig {
  currentPity?: number;
  maxPity?: number;
  baseRate?: number;
  rateIncreasedAt?: number;
}

export const rates = ({
  currentPity = 0,
  maxPity = 90,
  baseRate = 0.6,
  rateIncreasedAt = 74,
}: RateConfig = {}): number => {
  if (baseRate <= 0 && currentPity < maxPity) return 0;
  if (currentPity < rateIncreasedAt) return baseRate;
  if (currentPity >= maxPity) return 100;

  const rateIncreasedBy = (100 - baseRate) / (maxPity + 1 - rateIncreasedAt);
  const rateBeforeCurrentPity = (currentPity + 1 - rateIncreasedAt) * rateIncreasedBy;
  const increasedRate = rateBeforeCurrentPity + baseRate;
  return increasedRate;
};

export interface ProbItem {
  chance: number;
  [key: string]: unknown;
}

export const prob = <T extends ProbItem>(items: T[]): T => {
  const chances: number[] = [];
  for (let i = 0; i < items.length; i++) {
    chances[i] = items[i].chance + (chances[i - 1] ?? 0);
  }
  const random = Math.random() * chances[chances.length - 1];
  const result = items[chances.findIndex((chance) => chance > random)];
  return result;
};

export const getRate = (banner: string, key: string): number => {
  if (banner === 'beginner') {
    const initial = probabilityRates['character-event'];
    return initial[key] ?? 0;
  }

  const initial = probabilityRates[banner as keyof typeof probabilityRates];
  if (!initial) return 0;

  const local = localrate.get(banner) as Record<string, unknown>;
  if (!(local[key] ?? local[key] >= 0)) return initial[key] ?? 0;

  const val = parseFloat(local[key] as string);
  if (Number.isNaN(val)) return local[key] ?? 0;
  return val ?? 0;
};

export const setRate = (banner: string, key: string, val: string | number | boolean): void => {
  const local = localrate.get(banner) as Record<string, unknown>;
  if (typeof val === 'boolean') {
    local[key] = val;
  } else {
    const value = parseFloat(val as string);
    if (Number.isNaN(value)) local[key] = val;
    else local[key] = value;
  }
  localrate.set(banner, local);
};