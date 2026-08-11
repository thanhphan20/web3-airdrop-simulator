import { useCurrencyStore } from '../../stores/currencyStore';

export function ShopPage() {
  const { primogem, intertwined, acquaint, stardust, starglitter, addIntertwined, addAcquaint, spendIntertwined, spendAcquaint } = useCurrencyStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Shop</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-yellow-400">{primogem}</div>
          <div className="text-gray-400">Primogems</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-blue-400">{intertwined}</div>
          <div className="text-gray-400">Intertwined Fate</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-blue-400">{acquaint}</div>
          <div className="text-gray-400">Acquaint Fate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-gray-300">{stardust}</div>
          <div className="text-gray-400">Stardust</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-yellow-300">{starglitter}</div>
          <div className="text-gray-400">Starglitter</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Paimon's Bargains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => spendIntertwined(160) && addIntertwined(1)}
            disabled={primogem < 160}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <div className="font-medium">Intertwined Fate</div>
              <div className="text-sm text-gray-400">160 Primogems</div>
            </div>
            <div className="text-blue-400 font-bold">×1</div>
          </button>
          <button
            onClick={() => spendAcquaint(160) && addAcquaint(1)}
            disabled={primogem < 160}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <div className="font-medium">Acquaint Fate</div>
              <div className="text-sm text-gray-400">160 Primogems</div>
            </div>
            <div className="text-blue-400 font-bold">×1</div>
          </button>
        </div>
      </div>
    </div>
  );
}