import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InventoryItem {
  itemID: number;
  name: string;
  type: 'character' | 'weapon';
  rarity: number;
  count: number;
  isNew: boolean;
}

interface InventoryState {
  items: Record<number, InventoryItem>;
  addItem: (item: Omit<InventoryItem, 'count'>) => void;
  getItem: (itemID: number) => InventoryItem | undefined;
  getAllItems: () => InventoryItem[];
  getCharacters: () => InventoryItem[];
  getWeapons: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: {},
      addItem: (item) =>
        set((state) => {
          const existing = state.items[item.itemID];
          return {
            items: {
              ...state.items,
              [item.itemID]: {
                ...item,
                count: (existing?.count ?? 0) + 1,
                isNew: !existing,
              },
            },
          };
        }),
      getItem: (itemID) => get().items[itemID],
      getAllItems: () => Object.values(get().items),
      getCharacters: () => Object.values(get().items).filter((i) => i.type === 'character'),
      getWeapons: () => Object.values(get().items).filter((i) => i.type === 'weapon'),
    }),
    { name: 'genshin-inventory-store' }
  )
);