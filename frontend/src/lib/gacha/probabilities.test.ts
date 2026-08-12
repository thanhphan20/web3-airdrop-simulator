import { test, expect, beforeEach } from 'bun:test';
import './test-setup';
import { rates, prob, getRate, setRate } from './probabilities';

beforeEach(() => {
  localStorage.clear();
});

test('rates: character event soft pity curve', () => {
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 73 })).toBeCloseTo(0.6, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 74 })).toBeCloseTo(6.45, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 75 })).toBeCloseTo(12.3, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 76 })).toBeCloseTo(18.14, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 77 })).toBeCloseTo(23.99, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 78 })).toBeCloseTo(29.83, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 79 })).toBeCloseTo(35.68, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 80 })).toBeCloseTo(41.53, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 81 })).toBeCloseTo(47.38, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 82 })).toBeCloseTo(53.22, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 83 })).toBeCloseTo(59.07, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 84 })).toBeCloseTo(64.92, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 85 })).toBeCloseTo(70.76, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 86 })).toBeCloseTo(76.61, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 87 })).toBeCloseTo(82.46, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 88 })).toBeCloseTo(88.3, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 89 })).toBeCloseTo(94.15, 1);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 90 })).toBe(100);
  expect(rates({ baseRate: 0.6, rateIncreasedAt: 74, maxPity: 90, currentPity: 95 })).toBe(100);
});

test('rates: weapon event soft pity curve', () => {
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 62 })).toBeCloseTo(0.7, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 63 })).toBeCloseTo(6.21, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 64 })).toBeCloseTo(11.77, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 65 })).toBeCloseTo(17.25, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 66 })).toBeCloseTo(22.76, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 67 })).toBeCloseTo(28.28, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 68 })).toBeCloseTo(33.8, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 69 })).toBeCloseTo(39.31, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 70 })).toBeCloseTo(44.83, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 71 })).toBeCloseTo(50.35, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 72 })).toBeCloseTo(55.86, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 73 })).toBeCloseTo(61.38, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 74 })).toBeCloseTo(66.9, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 75 })).toBeCloseTo(72.41, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 76 })).toBeCloseTo(77.93, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 77 })).toBeCloseTo(83.45, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 78 })).toBeCloseTo(88.96, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 79 })).toBeCloseTo(94.48, 1);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 80 })).toBe(100);
  expect(rates({ baseRate: 0.7, rateIncreasedAt: 63, maxPity: 80, currentPity: 85 })).toBe(100);
});

test('prob: returns valid item from weighted list', () => {
  const items = [
    { id: 'a', chance: 50 },
    { id: 'b', chance: 30 },
    { id: 'c', chance: 20 },
  ];
  const result = prob(items);
  expect(['a', 'b', 'c']).toContain(result.id);
});

test('getRate: beginner maps to character-event', () => {
  expect(getRate('beginner', 'baseRate5')).toBe(getRate('character-event', 'baseRate5'));
  expect(getRate('beginner', 'max5')).toBe(getRate('character-event', 'max5'));
});

test('setRate and getRate: local override', () => {
  setRate('character-event', 'baseRate5', 1.5);
  expect(getRate('character-event', 'baseRate5')).toBe(1.5);
});