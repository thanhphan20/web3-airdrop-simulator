import { standard } from '@/data/banners/standard.json';
import { data as weaponsDB } from '@/data/weapons.json';
import { data as charsDB, onlyStandard } from '@/data/characters.json';
import { getRate, prob } from './probabilities';
import { guaranteedStatus } from './storage';
import type { CharacterData, WeaponData, ItemWithRelease } from './types';

export const regionElement = (region: string): string => {
  const base: Record<string, string> = {
    mondstadt: 'anemo',
    liyue: 'geo',
    inazuma: 'electro',
    sumeru: 'dendro',
    fontaine: 'hydro',
    natlan: 'pyro',
    snezhnaya: 'cryo',
  };
  return base[region] ?? '';
};

const standardWeapons = (star: number, includes: string[] = []): WeaponData[] =>
  getAllWeapons(star).filter(({ limited, name }) => !limited || includes.includes(name));

const filterByReleased = (charlist: ItemWithRelease[], version: string | null = null, phase: number | null = null): ItemWithRelease[] =>
  charlist.filter(({ release }) => {
    if (!release) return true;
    const [v, phs] = release.split('-');
    if (parseFloat(version ?? '0') < parseFloat(v)) return false;
    if (parseFloat(version ?? '0') === parseFloat(v) && (phase ?? 0) <= parseInt(phs)) return false;
    return true;
  });

export const rand = <T>(array: T[]): T => {
  if (!Array.isArray(array)) return array as T;
  if (array.length < 2) return array[0];
  return array[Math.floor(Math.random() * array.length)];
};

export const randomNumber = (min = 1, max = 9): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

const getAllChars = (star: number): CharacterData[] =>
  charsDB
    .filter(({ rarity }) => rarity === star)
    .map((arr) => ({ type: 'character' as const, ...arr }));

const getAllWeapons = (star: number): WeaponData[] =>
  weaponsDB
    .filter(({ rarity }) => rarity === star)
    .map((arr) => ({ type: 'weapon' as const, ...arr }));

export const getCharDetails = (charName: string) => {
  if (!charName) return {};
  const findChar = charsDB.find(({ name }) => charName === name);
  return findChar ?? {};
};

export const getWpDetails = (weaponName: string) => {
  if (!weaponName) return {};
  const findWP = weaponsDB.find(({ name }) => name === weaponName);
  return findWP ?? {};
};

export const getDetails = (itemName: string) => {
  if (!itemName) return {};
  const characterList = charsDB.map((d) => ({ type: 'character' as const, ...d }));
  const weaponList = weaponsDB.map((d) => ({ type: 'weapon' as const, ...d }));
  const list = [...characterList, ...weaponList];
  const findItems = list.find(({ name }) => itemName === name);
  return findItems ?? {};
};

const char4starList = (banner: string): CharacterData[] => {
  if (banner === 'standard') return getAllChars(4);
  return getAllChars(4).filter(({ name }) => !onlyStandard.includes(name));
};

export const get3StarItem = (): WeaponData[] => standardWeapons(3);

export const get4StarItem = ({
  banner = 'standard',
  region = null,
  version = null,
  phase = null,
  type = null,
  useRateup = false,
  rateupNamelist = [],
}: {
  banner?: string;
  region?: string | null;
  version?: string | null;
  phase?: number | null;
  type?: string | null;
  useRateup?: boolean;
  rateupNamelist?: string[];
} = {}) => {
  if (useRateup) {
    const isChar = banner === 'character-event' || banner === 'beginner';
    const DBList = isChar ? getAllChars(4) : getAllWeapons(4);
    const rateupList = DBList.filter(({ name }) => rateupNamelist.includes(name));
    return rateupList;
  }

  if (banner === 'beginner') {
    const charList = char4starList(banner).filter(({ release }) => release === '1.0-0');
    return charList;
  }

  const isChron = banner === 'chronicled';
  const lsChars = isChron ? getAllChars(4) : char4starList(banner);
  const lsWp = isChron ? getAllWeapons(4) : standardWeapons(4);

  let items: (CharacterData | WeaponData)[];
  if (type === 'all') {
    items = [...lsChars, ...lsWp];
  } else if (type === 'character') {
    items = lsChars;
  } else if (type === 'weapon') {
    items = lsWp;
  } else {
    const charRate = getRate(banner, 'charRate');
    const { itemType } = prob([
      { itemType: 'char', chance: charRate },
      { itemType: 'wp', chance: 100 - charRate },
    ]);
    items = itemType === 'wp' ? lsWp : lsChars;
  }

  const result = filterByReleased(items, version, phase);
  if (!isChron) return result.filter(({ name }) => !rateupNamelist.includes(name));
  return result.filter(({ origin, name }) => origin === region || rateupNamelist.includes(name));
};

const std5StarCharlist = (stdver = 1, includes: string[] = []): CharacterData[] => {
  const { characters: stdCharNames } = standard.find(({ version }) => version === stdver) ?? { characters: [] };
  return getAllChars(5).filter(({ name }) => {
    return stdCharNames.includes(name) || includes.includes(name);
  });
};

export const get5StarItem = ({
  banner = 'standard',
  region = null,
  stdver = 1,
  type = null,
  useRateup = false,
  rateupItem = [],
  customData = {},
}: {
  banner?: string;
  region?: string | null;
  stdver?: number;
  type?: string | null;
  useRateup?: boolean;
  rateupItem?: string[];
  customData?: Record<string, unknown>;
} = {}) => {
  if (useRateup && (banner === 'character-event' || banner === 'chronicled')) {
    if (Object.keys(customData).length > 0) {
      const { vision, character, artPosition, itemID } = customData as { vision?: string; character?: string; artPosition?: unknown; itemID?: string | number };
      const result = { name: character, offset: artPosition ?? {}, type: 'character' as const };
      return { vision, itemID, rarity: 5, custom: true, ...result };
    }
    const loadItems = type === 'weapon' ? getAllWeapons : getAllChars;
    const featured = loadItems(5).find(({ name }) => name === rateupItem[0]);
    return featured ?? {};
  }

  if (banner === 'chronicled') {
    let resultList: Array<{ origin?: string; name: string }> = [];
    if (!type || type === 'all') {
      resultList = [...std5StarCharlist(stdver, rateupItem), ...standardWeapons(5, rateupItem)];
    } else if (type === 'weapon') {
      resultList = standardWeapons(5, rateupItem);
    } else {
      resultList = std5StarCharlist(stdver, rateupItem);
    }

    const filtered = resultList.filter(({ origin, name }) => {
      return rateupItem.includes(name);
    });
    return filtered;
  }

  if (useRateup && banner === 'weapon-event') {
    const featured = getAllWeapons(5).filter(({ name }) => rateupItem.includes(name));
    return featured;
  }

  if (banner === 'weapon-event') {
    const rateupRemoved = standardWeapons(5).filter(({ name }) => !rateupItem.includes(name));
    return rateupRemoved;
  }

  if (banner === 'beginner') {
    const result = std5StarCharlist(1);
    return result;
  }

  if (banner === 'standard' || !banner) {
    let resultList: (CharacterData | WeaponData)[];
    if (type === 'all') {
      resultList = [...std5StarCharlist(stdver), ...standardWeapons(5)];
    } else if (type === 'character') {
      resultList = std5StarCharlist(stdver);
    } else if (type === 'weapon') {
      resultList = standardWeapons(5);
    } else {
      const charRate = getRate(banner, 'charRate');
      const { itemType } = prob([
        { itemType: 'char', chance: charRate },
        { itemType: 'wp', chance: 100 - charRate },
      ]);
      resultList = itemType === 'wp' ? standardWeapons(5) : std5StarCharlist(stdver);
    }
    return resultList;
  }

  return std5StarCharlist(stdver).filter(({ name }) => !rateupItem.includes(name));
};

export const isRateup = (banner: string): boolean => {
  const winRate = getRate(banner, 'winRate');
  const { item } = prob([
    { item: 'rateup', chance: winRate },
    { item: 'std', chance: 100 - winRate },
  ]);

  return item === 'rateup';
};

export const checkGuaranteed = (banner: string, rarity: number) => {
  const status = guaranteedStatus.get(`${banner}-${rarity}star`);
  const guaranteedSystem = getRate(banner, 'guaranteed');
  const never = guaranteedSystem === 'never';
  const always = guaranteedSystem === 'always';
  return { status, never, always };
};