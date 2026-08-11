import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  primogem: number;
  intertwined: number;
  acquaint: number;
  stardust: number;
  starglitter: number;
  addPrimogem: (amount: number) => void;
  addIntertwined: (amount: number) => void;
  addAcquaint: (amount: number) => void;
  addStardust: (amount: number) => void;
  addStarglitter: (amount: number) => void;
  spendIntertwined: (amount: number) => boolean;
  spendAcquaint: (amount: number) => boolean;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      primogem: 8000,
      intertwined: 25,
      acquaint: 25,
      stardust: 0,
      starglitter: 0,
      addPrimogem: (amount) => set((state) => ({ primogem: state.primogem + amount })),
      addIntertwined: (amount) => set((state) => ({ intertwined: state.intertwined + amount })),
      addAcquaint: (amount) => set((state) => ({ acquaint: state.acquaint + amount })),
      addStardust: (amount) => set((state) => ({ stardust: state.stardust + amount })),
      addStarglitter: (amount) => set((state) => ({ starglitter: state.starglitter + amount })),
      spendIntertwined: (amount) => {
        const { intertwined } = get();
        if (intertwined >= amount) {
          set({ intertwined: intertwined - amount });
          return true;
        }
        return false;
      },
      spendAcquaint: (amount) => {
        const { acquaint } = get();
        if (acquaint >= amount) {
          set({ acquaint: acquaint - amount });
          return true;
        }
        return false;
      },
    }),
    { name: 'genshin-currency-store' }
  )
);