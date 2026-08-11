import { useHistoryStore } from '../../stores/historyStore';
import { useBannerStore } from '../../stores/bannerStore';

export function HistoryPage() {
  const { getHistory } = useHistoryStore();
  const { bannerList, activeBanner } = useBannerStore();
  const currentBanner = bannerList[activeBanner];
  const history = currentBanner ? getHistory(currentBanner.name) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Wish History</h1>

      <div className="mb-6">
        <select
          value={activeBanner}
          onChange={(e) => useBannerStore.getState().setActiveBanner(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm w-full max-w-xs"
        >
          {bannerList.map((b, i) => (
            <option key={b.name} value={i}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-2">Time</th>
              <th className="pb-2">Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Rarity</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.slice().reverse().map((entry, index) => (
              <tr key={index} className="border-b border-gray-800">
                <td className="py-2 text-gray-400">{entry.time}</td>
                <td className="py-2 font-medium">{entry.name}</td>
                <td className="py-2 text-gray-400">{entry.type}</td>
                <td className="py-2">
                  <span className={entry.rarity === 5 ? 'text-yellow-400' : entry.rarity === 4 ? 'text-purple-400' : 'text-blue-400'}>
                    {'★'.repeat(entry.rarity)}
                  </span>
                </td>
                <td className="py-2 text-gray-400">{entry.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          No history for this banner yet.
        </div>
      )}
    </div>
  );
}