import { useCallback, useEffect, useState } from 'react';
import { localPity, owneditem, guaranteedStatus, rollCounter } from '@/lib/gacha/storage';
import { HistoryManager } from '@/lib/gacha/history';

// The engine (ported from the reference) persists to its own
// localStorage (key 'WishSimulator.App') and IndexedDB, and dispatches
// a 'storageUpdate' DOM event on every write. This hook re-reads that
// state on each event so React components stay in sync with pulls.

const eventName = 'storageUpdate';

export function useEngineSync() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((t) => t + 1);
    document.addEventListener(eventName, onUpdate);
    return () => document.removeEventListener(eventName, onUpdate);
  }, []);

  const getPity = useCallback(
    (banner: string, star: 5 | 4) => localPity.get(`pity${star}-${banner}`),
    [tick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getOwned = useCallback(
    (itemID?: number) => (itemID == null ? 0 : owneditem.get(itemID).qty),
    [tick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getGuaranteed = useCallback(
    (banner: string, star: 4 | 5) => guaranteedStatus.get(`${banner}-${star}star`),
    [tick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getRolls = useCallback((banner: string) => rollCounter.get(banner), [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tick, getPity, getOwned, getGuaranteed, getRolls };
}

export async function getBannerHistory(banner: string) {
  return HistoryManager.getListByBanner(banner);
}

export async function getAllHistory() {
  return HistoryManager.getAllHistories();
}

export async function clearBannerHistory(banner: string) {
  return HistoryManager.clearHistory(banner);
}
