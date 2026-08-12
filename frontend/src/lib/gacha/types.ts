// Shared types for the Genshin wish engine (ported from
// Mantan21/Genshin-Impact-Wish-Simulator, MIT-licensed).
// Mirrors the shapes of src/data/*.json.

export interface CharacterData {
  type: 'character';
  itemID: number;
  name: string;
  vision: string;
  rarity: number;
  origin: string;
  release?: string;
  offset?: {
    splashArt?: { x?: number; y?: number; scale?: number };
    wishCard?: { x?: number; y?: number; scale?: number };
    button?: { w?: number; t?: number; l?: number };
  };
}

export interface WeaponData {
  type: 'weapon';
  itemID: number;
  name: string;
  rarity: number;
  weaponType: string;
  limited?: boolean;
  origin?: string;
  release?: string;
  offset?: {
    splashArt?: { x?: number; y?: number; scale?: number };
    wishCard?: { x?: number; y?: number; scale?: number };
    button?: { w?: number; t?: number; l?: number };
  };
}

export type ItemWithRelease = CharacterData | WeaponData;

/** Any item a wish can return, plus status fields added by the wish classes. */
export type WishItem = (CharacterData | WeaponData) & {
  status?: string;
  captured?: boolean;
  bannerName?: string;
  custom?: boolean;
  vision?: string;
};

/** Final result of a single pull (what gets saved to history / shown in UI). */
export interface WishResult {
  type: 'character' | 'weapon' | null;
  rarity: number;
  name: string | null;
  itemID?: number;
  vision?: string;
  origin?: string;
  offset?: unknown;
  release?: string;
  limited?: boolean;
  banner?: string;
  bannerName?: string;
  time?: string;
  pity?: number;
  isNew?: boolean;
  bonusType?: string;
  bonusQty?: number;
  status?: string;
  captured?: boolean;
  stelaFortuna?: boolean;
  custom?: boolean;
}

export interface EventFeatured {
  bannerName: string;
  character: string;
  textOffset?: Record<string, number>;
}

export interface EventWeapon {
  bannerName: string;
  fatepointsystem: boolean;
  featured: Array<{ name: string; buttonPosition?: Record<string, number> }>;
  rateup: string[];
  textOffset?: Record<string, unknown>;
}

export interface EventChronicled {
  bannerName: string;
  region: string;
  characters: Record<string, string[]>;
  weapons: Record<string, string[]>;
}

/** One version's event banner data (src/data/banners/events/<version>.json). */
export interface EventData {
  patch: number;
  data: Array<{
    phase: number;
    banners: {
      standardVersion: number;
      events: {
        featured: EventFeatured[];
        rateup: string[];
      };
      weapons: EventWeapon;
      chronicled?: EventChronicled;
    };
  }>;
}

/** Banner shapes consumed by WishEngine. */
export interface BannerData {
  events: {
    featured: Array<{ bannerName: string; character: string }>;
    rateup: string[];
  };
  weapons: {
    bannerName: string;
    fatepointsystem: boolean;
    featured: Array<{ name: string }>;
    rateup: string[];
  };
  chronicled?: EventChronicled;
}
