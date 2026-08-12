import { useEffect, useMemo, useState } from 'react';
import { useBannerStore } from '../../stores/bannerStore';
import { useEngineSync } from '../../hooks/useEngineSync';
import { WISH } from '../../lib/gacha/Wish';
import roll from '../../lib/gacha/roll';
import { initializeBanner, getVersionList } from '../../lib/gacha/bannerLoader';
import { WishResultModal } from './WishResultModal';
import { BannerCard } from './BannerCard';
import { EpitomizedPath } from './EpitomizedPath';

export function WishPage() {
  const { activeVersion, activeBanner, bannerList, versionList, setActiveVersion, setActiveBanner, setBannerList, setVersionList } = useBannerStore();
  const { getPity } = useEngineSync();
  const [showResult, setShowResult] = useState<{ data: any; isMulti: boolean } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBanner = bannerList[activeBanner];

  // Load the version selector once.
  useEffect(() => {
    getVersionList().then(setVersionList).catch(() => {});
  }, [setVersionList]);

  // Reload banner list whenever the version/phase changes.
  useEffect(() => {
    if (!activeVersion.patch) return;
    initializeBanner(activeVersion)
      .then((list) => {
        setBannerList(list);
        setError(null);
      })
      .catch((e) => setError(`Failed to load version ${activeVersion.patch}: ${String(e)}`));
  }, [activeVersion, setBannerList]);

  const pity5 = currentBanner ? getPity(currentBanner.name, 5) : 0;
  const pity4 = currentBanner ? getPity(currentBanner.name, 4) : 0;

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    const v = versionList[idx];
    if (v) setActiveVersion(v);
  };

  const handleRoll = async (count: number) => {
    if (isRolling || !currentBanner) return;
    setIsRolling(true);
    setError(null);

    try {
      const engine = await WISH.init(activeVersion.patch, activeVersion.phase);
      const results = [];
      for (let i = 0; i < count; i++) {
        const result = await roll({ banner: currentBanner.name, WishInstance: engine, indexOfBanner: 0 });
        results.push(result);
      }
      setShowResult({ data: count === 1 ? results[0] : results, isMulti: count > 1 });
    } catch (e) {
      setError(`Roll failed: ${String(e)}`);
      console.error('Roll failed:', e);
    } finally {
      setIsRolling(false);
    }
  };

  const versionLabel = useMemo(() => {
    const idx = versionList.findIndex((v) => v.patch === activeVersion.patch && v.phase === activeVersion.phase);
    return idx < 0 ? 0 : idx;
  }, [versionList, activeVersion]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Wish Simulator</h1>

          <div className="flex flex-wrap justify-center gap-3 items-center text-sm text-gray-400 mb-4">
            <select
              value={versionLabel}
              onChange={handleVersionChange}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
              aria-label="Version"
            >
              {versionList.map((v, i) => (
                <option key={`${v.patch}-${v.phase}`} value={i}>
                  Version {v.patch} · Phase {v.phase}
                </option>
              ))}
            </select>
            <span>
              Primogems: <span className="text-yellow-400 font-medium">∞</span>
            </span>
            <nav className="flex gap-3">
              <a href="/wish/history" className="hover:text-white underline underline-offset-2">
                History
              </a>
              <a href="/wish/inventory" className="hover:text-white underline underline-offset-2">
                Inventory
              </a>
              <a href="/wish/shop" className="hover:text-white underline underline-offset-2">
                Shop
              </a>
            </nav>
          </div>

          {error && <div className="text-center text-red-400 text-sm mb-4">{error}</div>}
        </div>

        <BannerCard
          banner={currentBanner}
          pity5={pity5}
          pity4={pity4}
          onBannerChange={setActiveBanner}
          banners={bannerList}
        />

        <EpitomizedPath banner={currentBanner} version={activeVersion} />

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => handleRoll(1)}
            disabled={isRolling || !currentBanner}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
          >
            {isRolling ? 'Rolling...' : 'Wish x1'}
          </button>
          <button
            onClick={() => handleRoll(10)}
            disabled={isRolling || !currentBanner}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium"
          >
            {isRolling ? 'Rolling...' : 'Wish x10'}
          </button>
        </div>
      </div>

      {showResult && (
        <WishResultModal data={showResult.data} isMulti={showResult.isMulti} onClose={() => setShowResult(null)} />
      )}
    </div>
  );
}
