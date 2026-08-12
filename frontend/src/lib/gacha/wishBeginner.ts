import { guaranteedStatus } from './storage';
import { get3StarItem, get4StarItem, get5StarItem, rand } from './itemdrop-base';
import type { WishResult } from './types';

class BeginnerWish {
  get(rarity: number): WishResult {
    const alreadyGetFeatured = guaranteedStatus.get('beginner');

    if (rarity === 3) {
      const droplist = get3StarItem();
      return rand(droplist);
    }

    if (rarity === 4) {
      if (!alreadyGetFeatured) {
        const result = get4StarItem({
          rateupNamelist: ['noelle'],
          banner: 'beginner',
          useRateup: true,
        });
        guaranteedStatus.set('beginner', true);
        return rand(result);
      }
      const droplist = get4StarItem({ banner: 'beginner' });
      return rand(droplist);
    }

    if (rarity === 5) {
      const droplist = get5StarItem({ banner: 'beginner' });
      return rand(droplist);
    }

    return { type: null, rarity: 0, name: null };
  }
}

export default new BeginnerWish();