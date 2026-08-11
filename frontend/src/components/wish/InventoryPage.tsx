import { useInventoryStore } from '../../stores/inventoryStore';

export function InventoryPage() {
  const { getCharacters, getWeapons } = useInventoryStore();
  const characters = getCharacters();
  const weapons = getWeapons();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Inventory</h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Characters ({characters.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {characters.map((char) => (
            <div key={char.itemID} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
              <div className="font-medium">{char.name}</div>
              <div className="text-xs text-gray-400">×{char.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Weapons ({weapons.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {weapons.map((weapon) => (
            <div key={weapon.itemID} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
              <div className="font-medium">{weapon.name}</div>
              <div className="text-xs text-gray-400">×{weapon.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}