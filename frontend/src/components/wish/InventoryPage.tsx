import { useMemo, useState } from 'react';
import { useEngineSync } from '../../hooks/useEngineSync';
import { owneditem } from '../../lib/gacha/storage';
import { data as charsDB } from '@/data/characters.json';
import { data as weaponsDB } from '@/data/weapons.json';

interface OwnedRow {
  itemID: number;
  name: string;
  type: 'character' | 'weapon';
  rarity: number;
  qty: number;
  vision?: string;
  weaponType?: string;
}

const charByName = new Map(charsDB.map((c) => [c.name, c]));
const wpByName = new Map(weaponsDB.map((w) => [w.name, w]));

const faceArt = (name: string, rarity: number) =>
  `/images/characters/face/${rarity === 5 ? '5star' : '4star'}/${name}.webp`;

const weaponArt = (weaponType: string, rarity: number, name: string) =>
  `/images/weapons/${weaponType}/${rarity === 5 ? '5star' : rarity === 4 ? '4star' : '3star'}/${name}.webp`;

export function InventoryPage() {
  const { tick } = useEngineSync();
  const [tab, setTab] = useState<'character' | 'weapon'>('character');

  const rows = useMemo<OwnedRow[]>(() => {
    void tick; // re-read engine storage on every storageUpdate
    const all = owneditem.getAll();
    const list: OwnedRow[] = [];
    for (const [id, { wish }] of Object.entries(all)) {
      if (wish < 1) continue;
      const itemID = Number(id);
      const char = charByName.get(id);
      if (char) {
        list.push({ itemID, name: char.name, type: 'character', rarity: char.rarity, qty: wish, vision: char.vision });
        continue;
      }
      const wp = wpByName.get(id);
      if (wp) {
        list.push({
          itemID,
          name: wp.name,
          type: 'weapon',
          rarity: wp.rarity,
          qty: wish,
          weaponType: wp.weaponType,
        });
      }
    }
    return list.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }, [tick]);

  const characters = rows.filter((r) => r.type === 'character');
  const weapons = rows.filter((r) => r.type === 'weapon');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <a href="/wish" className="text-sm text-gray-400 hover:text-white">
            ← Back to Wish
          </a>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('character')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'character' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Characters ({characters.length})
          </button>
          <button
            onClick={() => setTab('weapon')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'weapon' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Weapons ({weapons.length})
          </button>
        </div>

        {(tab === 'character' ? characters : weapons).length === 0 && (
          <div className="text-center text-gray-400 py-12">
            Nothing here yet. Pull from the Wish page to collect items.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(tab === 'character' ? characters : weapons).map((item) => (
            <div key={item.itemID} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
              <div
                className={`w-full aspect-square rounded-lg mb-2 flex items-center justify-center overflow-hidden border ${
                  item.rarity === 5
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : item.rarity === 4
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : 'border-blue-500/50 bg-blue-500/5'
                }`}
              >
                <img
                  src={item.type === 'character' ? faceArt(item.name, item.rarity) : weaponArt(item.weaponType ?? 'sword', item.rarity, item.name)}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <div className="font-medium capitalize truncate">{item.name.replace(/-/g, ' ')}</div>
              <div className="text-xs text-gray-400">
                {'★'.repeat(item.rarity)} · ×{item.qty}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
