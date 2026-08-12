import { probabilityRates } from '@/data/wish-setup.json';
import { localrate } from './storage';

type RateKey =
  | 'baseRate5'
  | 'max5'
  | 'hard5'
  | 'baseRate4'
  | 'max4'
  | 'hard4'
  | 'winRate'
  | 'radRate'
  | 'charRate'
  | 'selectedRate'
  | 'guaranteed';

type RateTable = Partial<Record<RateKey, number>>;

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

export const getRate = (banner: string, key: RateKey): number => {
  if (banner === 'beginner') {
    const initial = probabilityRates['character-event'] as RateTable;
    return initial[key] ?? 0;
  }

  const initial = probabilityRates[banner as keyof typeof probabilityRates] as RateTable | undefined;
  if (!initial) return 0;

  const local = localrate.get(banner) as Partial<Record<RateKey, number>>;
  if (!(local[key] ?? local[key]! >= 0)) return initial[key] ?? 0;

  const val = parseFloat(String(local[key]));
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