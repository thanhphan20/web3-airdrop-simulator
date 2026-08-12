import weaponsDB from '@/data/weapons.json';
import charsDB from '@/data/characters.json';
import type { CharacterData, WeaponData, ItemWithRelease } from './types';

const rand = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const getAllChars = (star: number): CharacterData[] =>
  charsDB.data
    .filter(({ rarity }) => rarity === star)
    .map((arr) => ({ ...arr, type: 'character' as const }));

const getAllWeapons = (star: number): WeaponData[] =>
  weaponsDB.data
    .filter(({ rarity }) => rarity === star)
    .map((arr) => ({ ...arr, type: 'weapon' as const }));

const standardChars5Star = (chars: string[]): CharacterData[] => getAllChars(5).filter(({ name }) => chars.includes(name));

const standardWeapons = (star: number, exclude: string[] = []): WeaponData[] =>
  getAllWeapons(star)
    .filter(({ limited }) => !limited)
    .filter(({ name }) => !exclude.includes(name));

const get4StarChars = getAllChars(4).filter(({ name }) => !charsDB.onlyStandard.includes(name));

const filterCharByReleased = (charlist: ItemWithRelease[], version: string | null = null, phase: number | null = null): ItemWithRelease[] =>
  charlist.filter(({ release }) => {
    if (!release) return true;
    const [v, phs] = release.split('-');
    if (parseFloat(version ?? '0') < parseFloat(v)) return false;
    if (parseFloat(version ?? '0') === parseFloat(v) && (phase ?? 0) <= parseInt(phs)) return false;
    return true;
  });

export const get3StarItem = (): WeaponData => rand(standardWeapons(3));

export const get4StarItem = ({
  banner = 'allExcludeStandard',
  version = null,
  phase = null,
  exclude = [],
  list = [],
}: {
  banner?: string;
  version?: string | null;
  phase?: number | null;
  exclude?: string[];
  list?: string[];
} = {}) => {
  let charList = get4StarChars;

  if (banner === 'beginner') {
    charList = charList.filter(({ name }) => list.includes(name));
    return rand(charList);
  }

  if (banner === 'standard') charList = getAllChars(4);

  const itemType = rand(['wp', 'char']);
  const items = itemType === 'wp' ? standardWeapons(4) : charList;

  let filtered = filterCharByReleased(items, version, phase);
  if (exclude.length > 0) {
    filtered = filtered.filter(({ name }) => !exclude.includes(name));
  }

  return rand(filtered);
};

export const getStandard5StarItem = ({ exclude }: { exclude: string[] }) => {
  const itemType = rand(['wp', 'char']);
  const items: (WeaponData | CharacterData)[] = itemType === 'wp' ? standardWeapons(5) : standardChars5Star(exclude);
  return rand(items);
};

export { rand, getAllChars, getAllWeapons, get4StarChars, standardWeapons, standardChars5Star };