import { chronicledCourse } from './appState';
import { fatepointManager } from './storage';
import { get3StarItem, get4StarItem, get5StarItem, rand } from './itemdrop-base';
import { getRate, prob } from './probabilities';

class FatepointChronicled {
  _fatepointManager = fatepointManager;
  _info: { selected: number | null; point: number | null; type: string; banner: string } = { selected: null, point: null, type: 'weapon', banner: 'chronicled' };

  init({ version, phase }: { version: string; phase: number }) {
    this._fatepointManager = fatepointManager.init({ version, phase, banner: 'chronicled' });
    return this;
  }

  check() {
    this._info = this._fatepointManager.getInfo();
    return this._info;
  }

  verify(result: { name: string; type: string }) {
    const { _info, _fatepointManager } = this;
    const { selected, point, type } = _info;
    if (!selected) return false;

    if (result.name === selected) {
      _fatepointManager.set(0, null, result.type);
      chronicledCourse.set({ point: 0, selected: null, type: null });
      return point === 1;
    }

    _fatepointManager.set(1, selected, type);
    chronicledCourse.set({ point: 1, selected, type });
    return false;
  }
}

class ChronicledWish {
  _version = '';
  _phase = 0;
  _characters: Record<string, string[]> = {};
  _weapons: Record<string, string[]> = {};
  _stdver = 1;
  _region = '';
  _epitomized = new FatepointChronicled();

  init({ version, phase, stdver, characters, weapons, region }: { version: string; phase: number; stdver: number; characters: Record<string, string[]>; weapons: Record<string, string[]>; region: string } = {}) {
    this._version = version;
    this._phase = phase;
    this._characters = characters;
    this._weapons = weapons;
    this._stdver = stdver;
    this._region = region;
    this._epitomized = new FatepointChronicled().init({ version, phase });
    return this;
  }

  get(rarity: number) {
    const { _characters: ch, _weapons: wp } = this;
    if (rarity === 3) {
      const droplist = get3StarItem();
      return rand(droplist);
    }

    if (rarity === 4) {
      const droplist = get4StarItem({
        banner: 'chronicled',
        version: this._version,
        phase: this._phase,
        region: this._region,
        rateupNamelist: [...ch['4star'], ...wp['4star']],
      });
      return rand(droplist);
    }

    if (rarity === 5) {
      const { _characters: ch, _weapons: wp, _region, _stdver, _epitomized } = this;
      const { point, selected, type } = _epitomized.check();

      const rateUpNameList = type === 'weapon' ? wp['5star'] : ch['5star'];
      const rateupList = rateUpNameList.filter((name) => name !== selected);
      let useRateup = point > 0 && !!selected;

      if (point < 1 && !!selected) {
        const selectedRate = getRate('chronicled', 'selectedRate');
        const { item } = prob([
          { item: 'selected', chance: selectedRate },
          { item: 'random', chance: 100 - selectedRate },
        ]);
        useRateup = item === 'selected';
      }

      const droplist = get5StarItem({
        banner: 'chronicled',
        region: _region,
        stdver: _stdver,
        rateupItem: useRateup ? [selected] : rateupList,
        useRateup,
        type,
      });

      const result = rand(droplist);
      const isFatepointFull = _epitomized?.verify(result);
      const randomStatus = !selected ? 'unset' : 'lose';
      const fatepointstatus = isFatepointFull ? 'selected' : randomStatus;
      result.status = point < 1 && result?.name === selected ? 'win' : fatepointstatus;
      return result;
    }

    return { type: null, rarity: 0, name: null };
  }
}

export default new ChronicledWish();