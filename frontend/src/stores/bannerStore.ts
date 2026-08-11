import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BannerState {
  activeVersion: { patch: string; phase: number };
  activeBanner: number;
  bannerList: Array<{ type: string; name: string; version: string; phase: number }>;
  setActiveVersion: (version: { patch: string; phase: number }) => void;
  setActiveBanner: (index: number) => void;
  setBannerList: (list: Array<{ type: string; name: string; version: string; phase: number }>) => void;
}

export const useBannerStore = create<BannerState>()(
  persist(
    (set) => ({
      activeVersion: { patch: '6.6', phase: 1 },
      activeBanner: 0,
      bannerList: [],
      setActiveVersion: (version) => set({ activeVersion: version }),
      setActiveBanner: (index) => set({ activeBanner: index }),
      setBannerList: (list) => set({ bannerList: list }),
    }),
    { name: 'genshin-banner-store' }
  )
);