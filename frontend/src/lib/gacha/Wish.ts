import { standard } from '@/data/banners/standard.json';
import { fatepointManager } from './storage';
import { course, chronicledCourse } from './appState';
import characterWish from './wishCharacter';
import beginerWish from './wishBeginner';
import weaponWish from './wishWeapon';
import standardWish from './wishStandard';
import roll from './roll';
import chronicledWish from './wishChronicled';
import type { EventData, BannerData, WishResult } from './types';

const initLoadFatepoint = (version: string, phase: number) => {
  ['weapon-event', 'chronicled'].forEach((banner) => {
    const localFate = fatepointManager.init({ phase, version, banner });
    const { selected, point, type } = localFate.getInfo();
    if (banner.match('weapon')) return course.set({ point, selected });
    chronicledCourse.set({ point, selected, type });
  });
};

class WishEngine {
  _version = '';
  _phase = 0;
  _characters: BannerData['events'] = { featured: [], rateup: [] };
  _isDualBanner = false;
  _weapons: BannerData['weapons'] = { bannerName: '', fatepointsystem: false, featured: [], rateup: [] };
  _chronicled: BannerData['chronicled'] | undefined;
  _standardVer = 1;
  _customData: Record<string, unknown> = {};

  async init(version: string, phase: number, customData?: Record<string, unknown>) {
    this._version = version;
    this._phase = phase;

    if (version.match(/(custom|local)/gi)) return this._initCustom(customData ?? {});

    const eventModules = import.meta.glob('../../data/banners/events/*.json', { eager: true, import: 'default' });
    const moduleKey = `../../data/banners/events/${version}.json`;
    const data = eventModules[moduleKey] as EventData | undefined;
    if (!data) throw new Error(`Event data not found for version ${version}`);

    const phaseData = data.data.find((d) => d.phase === phase);
    if (!phaseData) throw new Error(`Phase ${phase} not found for version ${version}`);

    const { standardVersion, weapons, events, chronicled } = phaseData.banners;
    initLoadFatepoint(version, phase);

    this._characters = events;
    this._isDualBanner = events.featured?.length > 1;
    this._weapons = weapons;
    this._chronicled = chronicled;
    this._standardVer = standardVersion;
    this._customData = customData ?? {};
    return this;
  }

  _initCustom(customData: Record<string, unknown>) {
    this._customData = customData;
    this._standardVer = standard[standard.length - 1]?.version ?? 1;
    const { character = '', rateup = [], bannerName = '' } = customData as { character?: string; rateup?: string[]; bannerName?: string };
    this._characters = {
      rateup,
      featured: [{ bannerName, character }],
    };
    return this;
  }

  _characterWish(rarity: number, indexOfBanner: number) {
    const { featured, rateup } = this._characters;
    const eventBanner = characterWish.init({
      version: this._version,
      phase: this._phase,
      stdver: this._standardVer,
      customData: this._customData,
      indexOfBanner,
      featured,
      rateup,
    });
    const result = eventBanner.get(rarity);
    result.bannerName = featured[indexOfBanner].bannerName;
    return result;
  }

  _weaponWish(rarity: number) {
    const { _weapons, _phase: phase, _version: version } = this;
    const { fatepointsystem: fatesystem = false, featured, rateup } = _weapons;
    const weaponBanner = weaponWish.init({
      fatesystemON: fatesystem,
      featured,
      phase,
      version,
      rateup,
    });
    const result = weaponBanner.get(rarity);
    result.bannerName = _weapons.bannerName;
    return result;
  }

  _chronicledWish(rarity: number) {
    const { _chronicled } = this;
    if (!_chronicled) return { type: null, rarity: 0, name: null, time: '', banner: '' };
    const { bannerName, characters, weapons, region } = _chronicled;
    const chronicledBanner = chronicledWish.init({
      version: this._version,
      phase: this._phase,
      stdver: this._standardVer,
      characters,
      weapons,
      region,
    });
    const result = chronicledBanner.get(rarity);
    result.bannerName = bannerName;
    return result;
  }

  _beginnerWish(rarity: number) {
    const result = beginerWish.get(rarity);
    result.bannerName = 'beginner';
    return result;
  }

  _standardWish(rarity: number) {
    const { _standardVer: stdver, _phase: phase, _version: version } = this;
    const standardBanner = standardWish.init({ stdver, phase, version });
    const result = standardBanner.get(rarity);
    result.bannerName = `wanderlust-invocation-${stdver}`;
    return result;
  }

  getItem(rarity: number, banner: string, indexOfBanner = 0): WishResult {
    const date = new Date();
    const time = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const resultObj = { time, banner };

    if (banner === 'beginner') return { ...resultObj, ...this._beginnerWish(rarity) };
    if (banner === 'standard') return { ...resultObj, ...this._standardWish(rarity) };
    if (banner === 'weapon-event') return { ...resultObj, ...this._weaponWish(rarity) };
    if (banner === 'chronicled') return { ...resultObj, ...this._chronicledWish(rarity) };
    if (banner === 'character-event') {
      return { ...resultObj, ...this._characterWish(rarity, indexOfBanner) };
    }
    return { type: null, rarity: 0, name: null, time, banner, pity: 0, isNew: false, bonusType: '', bonusQty: 0 };
  }
}

export const WISH = new WishEngine();
export { roll };
export default WISH;