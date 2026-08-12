import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BannerType = 'beginner' | 'character-event' | 'weapon-event' | 'chronicled' | 'standard';

/** One selectable banner in the list (mirrors reference banner-loader output). */
export interface BannerItem {
  type: BannerType;
  /** Banner key used by the engine (== type for most; never displayed). */
  name: string;
  /** Art key (images/banner/character-events/{bannerName}.webp etc). */
  bannerName: string;
  character?: string;
  vision?: string;
  rateup?: string[];
  stdver?: number;
  fatepointsystem?: boolean;
  featured?: Array<{ name: string; buttonPosition?: Record<string, number> }>;
  weapons?: {
    bannerName: string;
    fatepointsystem: boolean;
    featured: Array<{ name: string; buttonPosition?: Record<string, number> }>;
    rateup: string[];
  };
  chronicled?: {
    bannerName: string;
    region: string;
    characters: Record<string, string[]>;
    weapons: Record<string, string[]>;
  };
  region?: string;
  characters?: Record<string, string[]>;
}

export interface ActiveVersion {
  patch: string;
  phase: number;
}

interface BannerState {
  activeVersion: ActiveVersion;
  activeBanner: number;
  bannerList: BannerItem[];
  versionList: ActiveVersion[];
  setActiveVersion: (version: ActiveVersion) => void;
  setActiveBanner: (index: number) => void;
  setBannerList: (list: BannerItem[]) => void;
  setVersionList: (list: ActiveVersion[]) => void;
}

export const useBannerStore = create<BannerState>()(
  persist(
    (set) => ({
      activeVersion: { patch: '6.6', phase: 1 },
      activeBanner: 0,
      bannerList: [],
      versionList: [],
      setActiveVersion: (version) => set({ activeVersion: version, activeBanner: 0 }),
      setActiveBanner: (index) => set({ activeBanner: index }),
      setBannerList: (list) => set({ bannerList: list }),
      setVersionList: (list) => set({ versionList: list }),
    }),
    { name: 'genshin-banner-store' }
  )
);
