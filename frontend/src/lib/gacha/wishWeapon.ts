import { course } from './appState';
import { fatepointManager, guaranteedStatus } from './storage';
import {
  rand,
  get3StarItem,
  get4StarItem,
  get5StarItem,
  isRateup,
  checkGuaranteed,
} from './itemdrop-base';
import { getRate, prob } from './probabilities';

class Fatepoint {
  _fatesystemON = false;
  _featured: Array<{ name: string }> = [];
  _version = '';
  _fatepointManager = fatepointManager;
  _info: { selected: number | null; point: number | null; type: string; banner: string } = { selected: null, point: null, type: 'weapon', banner: 'weapon-event' };

  init({ version, phase, featured, fatesystemON }: { version: string; phase: number; featured: Array<{ name: string }>; fatesystemON: boolean }) {
    this._fatesystemON = fatesystemON;
    if (!fatesystemON) return null;
    this._featured = featured;
    this._version = version;
    this._fatepointManager = fatepointManager.init({ version, phase });
    return this;
  }

  check() {
    this._info = this._fatepointManager.getInfo();
    return this._info;
  }

  verify(result: { name: string }) {
    if (!this._fatesystemON) return null;
    const { _featured, _info, _fatepointManager, _version } = this;
    const { selected, point } = _info;
    if (selected === null) return false;

    const { name: resultName } = result;
    const { name: selectedWeapon } = _featured[selected];

    if (resultName === selectedWeapon) {
      _fatepointManager.remove();
      course.set({ point: 0, selected: null });
      const maxPoint = parseFloat(_version) >= 5.0 ? 1 : 2;
      return point === maxPoint;
    }

    _fatepointManager.set(point + 1, selected);
    course.set({ point: point + 1, selected });
    return false;
  }
}

class WeaponWish {
  _version = '';
  _phase = 0;
  _rateup: string[] = [];
  _featured: Array<{ name: string }> = [];
  _fatesystem: ReturnType<Fatepoint['init']> = null;

  init({ rateup, version, phase, featured, fatesystemON }: { rateup: string[]; version: string; phase: number; featured: Array<{ name: string }>; fatesystemON: boolean } = {}) {
    this._version = version;
    this._phase = phase;
    this._rateup = rateup;
    this._featured = featured;
    this._fatesystem = new Fatepoint().init({ version, phase, featured, fatesystemON });
    return this;
  }

  get(rarity: number) {
    if (rarity === 3) {
      const droplist = get3StarItem();
      return rand(droplist);
    }

    if (rarity === 4) {
      const { _version: version, _phase: phase, _rateup: rateup } = this;
      const { status: isGuaranteed, never, always } = checkGuaranteed('weapon-event', 4);
      const useRateup = (isGuaranteed && !never) || always || isRateup('weapon-event');

      const droplist = get4StarItem({
        banner: 'weapon-event',
        rateupNamelist: rateup,
        useRateup,
        version,
        phase,
      });

      guaranteedStatus.set('weapon-event-4star', !useRateup);
      return rand(droplist);
    }

    if (rarity === 5) {
      const { _featured, _fatesystem, _version: version } = this;
      const { status: isGuaranteed, never, always } = checkGuaranteed('weapon-event', 5);
      let useRateup = (isGuaranteed && !never) || always || isRateup('weapon-event');

      let calculateFatepoint = false;
      let rateupItem = _featured.map(({ name }) => name);

      if (_fatesystem) {
        const { selected, point } = _fatesystem.check();
        calculateFatepoint = selected !== null && selected > -1;
        let useSelected = false;

        if (calculateFatepoint && useRateup) {
          const selectedRate = getRate('weapon-event', 'selectedRate');
          const { item } = prob([
            { item: 'selected', chance: selectedRate },
            { item: 'random', chance: 100 - selectedRate },
          ]);
          useSelected = item === 'selected';
        }

        const maxPoint = parseFloat(version) >= 5.0 ? 1 : 2;
        if (useSelected || (calculateFatepoint && point >= maxPoint)) {
          useRateup = true;
          rateupItem = [rateupItem[selected]];
        }
      }

      const droplist = get5StarItem({
        banner: 'weapon-event',
        rateupItem,
        useRateup,
      });

      const result = rand(droplist);
      const isFatepointFull = _fatesystem?.verify(result);

      const statusGuaranteed = (isGuaranteed && !never) || always;
      const rateUpStatus = statusGuaranteed ? 'guaranteed' : 'win';
      const fatepointstatus = calculateFatepoint && isFatepointFull ? 'selected' : rateUpStatus;
      const status = useRateup ? fatepointstatus : 'lose';
      guaranteedStatus.set('weapon-event-5star', !useRateup);

      return { ...result, status };
    }

    return { type: null, rarity: 0, name: null };
  }
}

export default new WeaponWish();