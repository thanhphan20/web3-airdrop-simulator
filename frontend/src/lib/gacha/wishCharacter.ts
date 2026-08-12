import { guaranteedStatus, rollCounter } from './storage';
import { prob } from './probabilities';
import type { WishResult } from './types';
import {
  get3StarItem,
  get4StarItem,
  rand,
  get5StarItem,
  isRateup,
  checkGuaranteed,
} from './itemdrop-base';

class CharacterWish {
  _featured: Array<{ bannerName: string; character: string }> = [];
  _rateup: string[] = [];
  _indexOfBanner = 0;
  _version = '';
  _phase = 0;
  _stdver = 1;
  _customData: Record<string, unknown> = {};

  init({
    indexOfBanner,
    featured,
    rateup,
    version,
    phase,
    stdver,
    customData,
  }: {
    indexOfBanner: number;
    featured: Array<{ bannerName: string; character: string }>;
    rateup: string[];
    version: string;
    phase: number;
    stdver: number;
    customData: Record<string, unknown>;
  }) {
    this._featured = featured;
    this._rateup = rateup;
    this._indexOfBanner = indexOfBanner;
    this._version = version;
    this._phase = phase;
    this._stdver = stdver;
    this._customData = customData;
    return this;
  }

  get(rarity: number): WishResult {
    if (rarity === 3) {
      const droplist = get3StarItem();
      return rand(droplist);
    }

    if (rarity === 4) {
      const { _version: version, _phase: phase, _rateup: rateup } = this;
      const { status: isGuaranteed, never, always } = checkGuaranteed('character-event', 4);
      const useRateup = (isGuaranteed && !never) || always || isRateup('character-event');

      const droplist = get4StarItem({
        banner: 'character-event',
        rateupNamelist: rateup,
        useRateup,
        version,
        phase,
      });

      guaranteedStatus.set('character-event-4star', !useRateup);
      return rand(droplist);
    }

    if (rarity === 5) {
      const { _featured, _indexOfBanner, _stdver, _customData, _version } = this;
      const { status: isGuaranteed, never, always } = checkGuaranteed('character-event', 5);
      const useRateup = (isGuaranteed && !never) || always || isRateup('character-event');

      let captured = false;
      if (parseFloat(_version) >= 5.0 && !useRateup) {
        const radianceRoll = (rollCounter.get('radiance') ?? 0) + 1;
        const radianceRate = radianceRoll < 2 ? 0 : radianceRoll * 25;
        const { captureRadiance } = prob([
          { captureRadiance: 'lose', chance: 100 - radianceRate },
          { captureRadiance: 'win', chance: radianceRate },
        ]);
        captured = captureRadiance === 'win';
        rollCounter.set('radiance', captured ? 0 : radianceRoll);
      }

      const droplist = get5StarItem({
        banner: 'character-event',
        stdver: _stdver,
        rateupItem: [_featured[_indexOfBanner].character],
        customData: _customData,
        useRateup: useRateup || captured,
      });
      const result = rand(droplist);

      const statusGuaranteed = (isGuaranteed && !never) || always;
      const rateUpStatus = statusGuaranteed ? 'guaranteed' : 'win';
      const regularStatus = useRateup ? rateUpStatus : 'lose';
      const status = captured ? 'captured' : regularStatus;
      guaranteedStatus.set('character-event-5star', !(useRateup || captured));
      if (status === 'win') rollCounter.set('radiance', 0);
      return { ...result, status, captured };
    }

    return { type: null, rarity: 0, name: null };
  }
}

export default new CharacterWish();