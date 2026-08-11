import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HistoryEntry {
  id: number;
  time: string;
  banner: string;
  type: 'character' | 'weapon' | null;
  rarity: number;
  name: string | null;
  itemID?: number;
  pity: number;
  isNew: boolean;
  bonusType: string;
  bonusQty: number;
  status?: string;
  captured?: boolean;
  bannerName?: string;
}

interface HistoryState {
  history: Record<string, HistoryEntry[]>;
  addEntry: (banner: string, entry: HistoryEntry) => void;
  getHistory: (banner: string) => HistoryEntry[];
  clearHistory: (banner: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: {},
      addEntry: (banner, entry) =>
        set((state) => ({
          history: {
            ...state.history,
            [banner]: [entry, ...(state.history[banner] ?? [])].slice(0, 1000),
          },
        })),
      getHistory: (banner) => get().history[banner] ?? [],
      clearHistory: (banner) =>
        set((state) => {
          const { [banner]: _, ...rest } = state.history;
          return { history: rest };
        }),
    }),
    { name: 'genshin-history-store' }
  )
);