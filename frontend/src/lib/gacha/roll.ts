import { beginnerRemaining, showBeginner } from './appState';
import { HistoryManager } from './history';
import { localPity, owneditem, rollCounter } from './storage';
import { getRate, prob, rates } from './probabilities';
import type { WishResult } from './types';

const { addHistory } = HistoryManager;

interface RollOptions {
  banner: string;
  WishInstance: typeof import('./Wish').default;
  indexOfBanner?: number;
}

const roll = async ({ banner, WishInstance, indexOfBanner = 0 }: RollOptions): Promise<WishResult> => {
  const pity5 = localPity.get(`pity5-${banner}`) + 1;
  const pity4 = localPity.get(`pity4-${banner}`) + 1;
  const maxPity = getRate(banner, 'max5');

  const rate5star = () =>
    rates({
      baseRate: getRate(banner, 'baseRate5'),
      rateIncreasedAt: getRate(banner, 'hard5'),
      currentPity: pity5,
      maxPity,
    });

  const rate4star = () =>
    rates({
      baseRate: getRate(banner, 'baseRate4'),
      currentPity: pity4,
      rateIncreasedAt: getRate(banner, 'hard4'),
      maxPity: getRate(banner, 'max4'),
    });

  let chance5star = rate5star();
  let chance4star = rate4star();
  let chance3star = 100 - chance4star - chance5star;

  if ((chance3star < 0 && pity5 >= maxPity) || chance5star === 100) chance4star = 0;
  if (chance3star < 0) chance3star = 0;
  if (chance4star === 100) chance5star = 0;

  const item = [
    { rarity: 3, chance: chance3star },
    { rarity: 4, chance: chance4star },
    { rarity: 5, chance: chance5star },
  ];

  const { rarity } = prob(item);
  let pity = 1;

  const rollQty = rollCounter.get(banner);
  rollCounter.set(banner, rollQty + 1);

  if (banner === 'beginner') {
    beginnerRemaining.update((v: number) => (v < 1 ? 0 : v - 1));
    if (rollQty >= 19) showBeginner.set(false);
  }

  if (rarity === 5) {
    localPity.set(`pity4-${banner}`, pity4);
    localPity.set(`pity5-${banner}`, 0);
    pity = pity5;
  }
  if (rarity === 4) {
    localPity.set(`pity4-${banner}`, 0);
    localPity.set(`pity5-${banner}`, pity5);
    pity = pity4;
  }
  if (rarity === 3) {
    localPity.set(`pity4-${banner}`, pity4);
    localPity.set(`pity5-${banner}`, pity5);
  }

  const randomItem = WishInstance.getItem(rarity, banner, indexOfBanner);
  const { manual, wish } = owneditem.put({ itemID: randomItem.itemID ?? 0 });
  const numberOfOwnedItem = manual + wish - 1;
  const isNew = numberOfOwnedItem < 1;

  await saveResult({ pity, ...randomItem });

  const isFullConstellation = numberOfOwnedItem > 6;
  if (randomItem.type === 'character' && !isNew) {
    randomItem.stelaFortuna = !isFullConstellation;
  }

  const bonusType = randomItem.rarity === 3 ? 'stardust' : 'starglitter';
  const bonusQty = getMilestoneQty(randomItem.rarity, randomItem.type as string, isFullConstellation, isNew);

  const result = { pity, isNew, bonusType, bonusQty, ...randomItem };
  return result;
};

const saveResult = async (result: Record<string, unknown>) => {
  const data = { ...result };
  delete data.release;
  delete data.limited;
  delete data.offset;
  await addHistory(data);
};

export const getMilestoneQty = (rarity: number, type: string, isFullConstellation: boolean, isNew: boolean): number => {
  if (type === 'weapon') {
    if (rarity === 3) return 15;
    if (rarity === 4) return 2;
    return 10;
  }
  if (isNew) return 0;
  if (rarity === 4) return isFullConstellation ? 5 : 2;
  return isFullConstellation ? 25 : 10;
};

export default roll;