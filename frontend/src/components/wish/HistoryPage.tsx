import { useEffect, useState } from 'react';
import { useBannerStore } from '../../stores/bannerStore';
import { useEngineSync, getBannerHistory, clearBannerHistory } from '../../hooks/useEngineSync';

interface HistoryEntry {
  id: number;
  time?: string;
  banner?: string;
  bannerName?: string;
  type?: string | null;
  rarity?: number;
  name?: string | null;
  pity?: number;
  status?: string;
  isNew?: boolean;
  bonusType?: string;
  bonusQty?: number;
}

export function HistoryPage() {
  const { bannerList, activeBanner, setActiveBanner } = useBannerStore();
  const { tick } = useEngineSync();
  const currentBanner = bannerList[activeBanner];
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentBanner) return;
    let cancelled = false;
    setLoading(true);
    getBannerHistory(currentBanner.name)
      .then((h) => !cancelled && setHistory(h as HistoryEntry[]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentBanner, tick]);

  const handleClear = async () => {
    if (!currentBanner) return;
    await clearBannerHistory(currentBanner.name);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Wish History</h1>
          <a href="/wish" className="text-sm text-gray-400 hover:text-white">
            ← Back to Wish
          </a>
        </div>

        <div className="mb-6 flex gap-3 items-center">
          <select
            value={activeBanner}
            onChange={(e) => setActiveBanner(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm w-full max-w-xs"
          >
            {bannerList.map((b, i) => (
              <option key={b.bannerName} value={i}>
                {b.bannerName.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-red-400 px-3 py-2 border border-gray-700 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No history for this banner yet. Pull from the Wish page to record results.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Rarity</th>
                  <th className="pb-2">Pity</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <tr key={entry.id ?? index} className="border-b border-gray-800">
                      <td className="py-2 text-gray-400">{entry.time}</td>
                      <td className="py-2 font-medium capitalize">{entry.name?.replace(/-/g, ' ') ?? '-'}</td>
                      <td className="py-2 text-gray-400">{entry.type ?? '-'}</td>
                      <td className="py-2">
                        <span
                          className={
                            entry.rarity === 5 ? 'text-yellow-400' : entry.rarity === 4 ? 'text-purple-400' : 'text-blue-400'
                          }
                        >
                          {'★'.repeat(entry.rarity ?? 0)}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{entry.pity ?? '-'}</td>
                      <td className="py-2 text-gray-400">{entry.status || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
