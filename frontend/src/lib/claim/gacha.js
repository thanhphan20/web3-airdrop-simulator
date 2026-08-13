// ---------------------------------------------------------------------------
// Soft-pity rate curve + weighted picker (ported verbatim from the claim
// page's lib/gacha.ts). The algorithm comes from
// Mantan21/Genshin-Impact-Wish-Simulator (MIT); all visuals are original.
// ---------------------------------------------------------------------------

export function rates({ currentPity = 0, maxPity = 90, baseRate = 0.6, rateIncreasedAt = 74 } = {}) {
	if (baseRate <= 0 && currentPity < maxPity) return 0;
	if (currentPity < rateIncreasedAt) return baseRate;
	if (currentPity >= maxPity) return 100;
	const rateIncreasedBy = (100 - baseRate) / (maxPity + 1 - rateIncreasedAt);
	const rateBeforeCurrentPity = (currentPity + 1 - rateIncreasedAt) * rateIncreasedBy;
	return rateBeforeCurrentPity + baseRate;
}

export function prob(items) {
	const chances = [];
	for (let i = 0; i < items.length; i++) chances[i] = items[i].chance + (chances[i - 1] || 0);
	const random = Math.random() * chances[chances.length - 1];
	const idx = chances.findIndex((chance) => chance > random);
	return items[idx === -1 ? items.length - 1 : idx];
}

// Cosmetic 4-tier model with two pity tracks (mirrors dual-pity structure):
//   - Legendary (like 5★): baseRate 0.6%, soft pity from 74, guaranteed at 90
//   - Epic (like 4★): baseRate 5.1%, soft pity from 9, guaranteed at 10
// tierIdx: 0 Common · 1 Rare · 2 Epic · 3 Legendary

const KEY = 'mrkl_gacha_pity_v1';
const HARD5 = 90;
const SOFT5 = 74;
const BASE5 = 0.6;
const HARD4 = 10;
const SOFT4 = 9;
const BASE4 = 5.1;

export function getPity(key = KEY) {
	try {
		return JSON.parse(localStorage.getItem(key) || '') || { p5: 0, p4: 0, count: 0 };
	} catch {
		return { p5: 0, p4: 0, count: 0 };
	}
}

function save(s, key = KEY) {
	try {
		localStorage.setItem(key, JSON.stringify(s));
	} catch {
		/* storage unavailable */
	}
}

function pull(s) {
	s.count++;
	const r5 = rates({ currentPity: s.p5, maxPity: HARD5, baseRate: BASE5, rateIncreasedAt: SOFT5 });
	if (Math.random() * 100 < r5) {
		s.p5 = 0;
		s.p4 += 1;
		return 3; // Legendary
	}
	s.p5 += 1;
	const r4 = rates({ currentPity: s.p4, maxPity: HARD4, baseRate: BASE4, rateIncreasedAt: SOFT4 });
	if (Math.random() * 100 < r4) {
		s.p4 = 0;
		return 2; // Epic
	}
	s.p4 += 1;
	return prob([
		{ v: 0, chance: 78 },
		{ v: 1, chance: 22 }
	]).v; // Common / Rare
}

export function drawTier(key = KEY) {
	const s = getPity(key);
	const tierIdx = pull(s);
	save(s, key);
	return { tierIdx, pity: { ...s } };
}

export function currentOdds(key = KEY) {
	const s = getPity(key);
	return {
		p5: s.p5,
		p4: s.p4,
		count: s.count,
		hard5: HARD5,
		legendary: rates({ currentPity: s.p5, maxPity: HARD5, baseRate: BASE5, rateIncreasedAt: SOFT5 })
	};
}

export function resetPity(key = KEY) {
	save({ p5: 0, p4: 0, count: 0 }, key);
}
