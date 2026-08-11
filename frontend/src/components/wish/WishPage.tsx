import { useState } from 'react';
import { useBannerStore } from '../../stores/bannerStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { usePityStore } from '../../stores/pityStore';
import { WISH } from '../../lib/gacha/Wish';
import { roll } from '../../lib/gacha/roll';
import { WishResultModal } from './WishResultModal';
import { BannerCard } from './BannerCard';
import { EpitomizedPath } from './EpitomizedPath';

export function WishPage() {
  const { activeVersion, activeBanner, bannerList, setActiveVersion, setActiveBanner, setBannerList } = useBannerStore();
  const { intertwined, acquaint, addStardust, addStarglitter } = useCurrencyStore();
  const { getPity5, getPity4 } = usePityStore();
  const [showResult, setShowResult] = useState<{ data: any; isMulti: boolean } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const currentBanner = bannerList[activeBanner];
  const pity5 = currentBanner ? getPity5(currentBanner.name) : 0;
  const pity4 = currentBanner ? getPity4(currentBanner.name) : 0;

  const handleRoll = async (count: number) => {
    if (isRolling) return;
    setIsRolling(true);

    try {
      await WISH.init(activeVersion.patch, activeVersion.phase);
      const results = [];
      for (let i = 0; i < count; i++) {
        const result = await roll({
          banner: currentBanner?.name ?? 'character-event',
          WishInstance: WISH,
          indexOfBanner: 0,
        });
        results.push(result);
      }

      if (results.length === 1) {
        setShowResult({ data: results[0], isMulti: false });
      } else {
        setShowResult({ data: results, isMulti: true });
      }
    } catch (error) {
      console.error('Roll failed:', error);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Wish Simulator</h1>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>Primogems: {8000}</span>
            <span>Intertwined Fate: {intertwined}</span>
            <span>Acquaint Fate: {acquaint}</span>
          </div>
        </div>

        <BannerCard
          banner={currentBanner}
          pity5={pity5}
          pity4={pity4}
          onBannerChange={setActiveBanner}
          banners={bannerList}
        />

        <EpitomizedPath banner={currentBanner} />

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => handleRoll(1)}
            disabled={isRolling}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
          >
            {isRolling ? 'Rolling...' : 'Wish x1'}
          </button>
          <button
            onClick={() => handleRoll(10)}
            disabled={isRolling}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium"
          >
            {isRolling ? 'Rolling...' : 'Wish x10'}
          </button>
        </div>
      </div>

      {showResult && (
        <WishResultModal
          data={showResult.data}
          isMulti={showResult.isMulti}
          onClose={() => setShowResult(null)}
        />
      )}
    </div>
  );
}