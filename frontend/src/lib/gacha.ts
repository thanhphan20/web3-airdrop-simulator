// ---------------------------------------------------------------------------
// Soft-pity rate curve + weighted picker.
//
// `rates` and `prob` below are ported verbatim (logic unchanged) from
// Mantan21/Genshin-Impact-Wish-Simulator, file src/lib/helpers/gacha/
// probabilities.js, which is MIT-licensed. Only the algorithm is reused —
// no Genshin art, fonts, audio, or other Hoyoverse assets are used anywhere
// in this project. Original repo: https://github.com/Mantan21/Genshin-Impact-Wish-Simulator
// ---------------------------------------------------------------------------

type RatesArgs = {
  currentPity?: number;
  maxPity?: number;
  baseRate?: number;
  rateIncreasedAt?: number;
};

// Returns the percent chance for the "featured" pull at a given pity.
// Flat baseRate until `rateIncreasedAt` (soft pity), then a linear ramp to
// 100% at `maxPity` (hard pity / guarantee).
export function rates({
  currentPity = 0,
  maxPity = 90,
  baseRate = 0.6,
  rateIncreasedAt = 74,
}: RatesArgs = {}): number {
  if (baseRate <= 0 && currentPity < maxPity) return 0;
  if (currentPity < rateIncreasedAt) return baseRate;
  if (currentPity >= maxPity) return 100;
  const rateIncreasedBy = (100 - baseRate) / (maxPity + 1 - rateIncreasedAt);
  const rateBeforeCurrentPity = (currentPity + 1 - rateIncreasedAt) * rateIncreasedBy;
  return rateBeforeCurrentPity + baseRate;
}

// Weighted random pick: each item has a `chance`; returns one item.
export function prob<T extends { chance: number }>(items: T[]): T {
  const chances: number[] = [];
  for (let i = 0; i < items.length; i++) chances[i] = items[i].chance + (chances[i - 1] || 0);
  const random = Math.random() * chances[chances.length - 1];
  const idx = chances.findIndex((chance) => chance > random);
  return items[idx === -1 ? items.length - 1 : idx];
}

// ---------------------------------------------------------------------------
// Our cosmetic 4-tier model built on top of the ported curve.
// Two independent pity tracks, mirroring the real dual-pity structure:
//   - Legendary (like a 5★): baseRate 0.6%, soft pity from 74, guaranteed at 90
//   - Epic      (like a 4★): baseRate 5.1%, soft pity from 9,  guaranteed at 10
// Everything else resolves to Rare / Common by weight.
// Pity is persisted so "Pull again" demonstrates the ramp toward a guarantee.
// tierIdx: 0 Common · 1 Rare · 2 Epic · 3 Legendary
// ---------------------------------------------------------------------------

const KEY = "mrkl_gacha_pity_v1";
const HARD5 = 90;
const SOFT5 = 74;
const BASE5 = 0.6;
const HARD4 = 10;
const SOFT4 = 9;
const BASE4 = 5.1;

type PityState = { p5: number; p4: number; count: number };

export function getPity(): PityState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") || { p5: 0, p4: 0, count: 0 };
  } catch {
    return { p5: 0, p4: 0, count: 0 };
  }
}

function save(s: PityState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

export function resetPity() {
  save({ p5: 0, p4: 0, count: 0 });
}

// Advances pity and returns { tierIdx, pity }.
export function drawTier(): { tierIdx: number; pity: PityState } {
  const s = getPity();
  s.count++;
  let tierIdx: number;

  const r5 = rates({ currentPity: s.p5, maxPity: HARD5, baseRate: BASE5, rateIncreasedAt: SOFT5 });
  if (Math.random() * 100 < r5) {
    tierIdx = 3; // Legendary
    s.p5 = 0;
    s.p4 += 1; // 4★ track keeps counting
  } else {
    s.p5 += 1;
    const r4 = rates({ currentPity: s.p4, maxPity: HARD4, baseRate: BASE4, rateIncreasedAt: SOFT4 });
    if (Math.random() * 100 < r4) {
      tierIdx = 2; // Epic
      s.p4 = 0;
    } else {
      s.p4 += 1;
      tierIdx = prob([
        { v: 0, chance: 78 },
        { v: 1, chance: 22 },
      ]).v; // Common / Rare
    }
  }

  save(s);
  return { tierIdx, pity: { ...s } };
}

// Next-pull odds, for display.
export function currentOdds() {
  const s = getPity();
  return {
    p5: s.p5,
    p4: s.p4,
    count: s.count,
    hard5: HARD5,
    legendary: rates({ currentPity: s.p5, maxPity: HARD5, baseRate: BASE5, rateIncreasedAt: SOFT5 }),
  };
}
