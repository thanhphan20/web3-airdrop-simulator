import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PityState {
  pity5: Record<string, number>;
  pity4: Record<string, number>;
  getPity5: (banner: string) => number;
  getPity4: (banner: string) => number;
  setPity5: (banner: string, value: number) => void;
  setPity4: (banner: string, value: number) => void;
  incrementPity5: (banner: string) => void;
  incrementPity4: (banner: string) => void;
  resetPity5: (banner: string) => void;
  resetPity4: (banner: string) => void;
}

export const usePityStore = create<PityState>()(
  persist(
    (set, get) => ({
      pity5: {},
      pity4: {},
      getPity5: (banner) => get().pity5[banner] ?? 0,
      getPity4: (banner) => get().pity4[banner] ?? 0,
      setPity5: (banner, value) => set((state) => ({ pity5: { ...state.pity5, [banner]: value } })),
      setPity4: (banner, value) => set((state) => ({ pity4: { ...state.pity4, [banner]: value } })),
      incrementPity5: (banner) => set((state) => ({ pity5: { ...state.pity5, [banner]: (state.pity5[banner] ?? 0) + 1 } })),
      incrementPity4: (banner) => set((state) => ({ pity4: { ...state.pity4, [banner]: (state.pity4[banner] ?? 0) + 1 } })),
      resetPity5: (banner) => set((state) => ({ pity5: { ...state.pity5, [banner]: 0 } })),
      resetPity4: (banner) => set((state) => ({ pity4: { ...state.pity4, [banner]: 0 } })),
    }),
    { name: 'genshin-pity-store' }
  )
);