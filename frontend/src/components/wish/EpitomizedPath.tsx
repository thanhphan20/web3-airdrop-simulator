import { useCallback } from 'react';
import type { BannerItem } from '../../stores/bannerStore';
import { useEngineSync } from '../../hooks/useEngineSync';
import { fatepointManager } from '../../lib/gacha/storage';
import { course, chronicledCourse } from '../../lib/gacha/appState';

interface EpitomizedPathProps {
  banner?: BannerItem;
  version: { patch: string; phase: number };
}

export function EpitomizedPath({ banner, version }: EpitomizedPathProps) {
  const { tick } = useEngineSync();
  const bannerName = banner?.name;
  const isWeapon = banner?.type === 'weapon-event';
  const isChronicled = banner?.type === 'chronicled';
  const fatesystem = banner?.fatepointsystem ?? banner?.weapons?.fatepointsystem ?? false;

  const selectCourse = useCallback(
    (index: number) => {
      const localFate = fatepointManager.init({ version: version.patch, phase: version.phase, banner: bannerName });
      localFate.set(0, index);
      course.set({ selected: index, point: 0 });
    },
    [version, bannerName]
  );

  const cancelCourse = useCallback(() => {
    const localFate = fatepointManager.init({ version: version.patch, phase: version.phase, banner: bannerName });
    localFate.remove();
    if (isWeapon) course.set({ point: 0, selected: null });
    else chronicledCourse.set({ selected: null, point: 0, type: null });
  }, [version, bannerName, isWeapon]);

  if (!banner || (!isWeapon && !isChronicled) || (isWeapon && !fatesystem)) return null;

  const featured = isChronicled ? [] : (banner.weapons?.featured ?? banner.featured ?? []);
  const fate = fatepointManager.init({ version: version.patch, phase: version.phase, banner: bannerName }).getInfo();
  const selected = typeof fate.selected === 'number' ? fate.selected : null;
  const point = fate.point ?? 0;

  void tick;

  return (
    <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Epitomized Path</h3>
        {selected !== null && (
          <button onClick={cancelCourse} className="text-xs text-gray-400 hover:text-red-400">
            Cancel Course
          </button>
        )}
      </div>

      {featured.length === 0 ? (
        <p className="text-sm text-gray-400">Chronicled banners don&apos;t use the Epitomized Path.</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            {featured.map((w: { name: string }, i: number) => (
              <button
                key={w.name}
                onClick={() => selectCourse(i)}
                className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors ${
                  selected === i ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                  <img
                    src={`/images/weapons/bow/5star/${w.name}.webp`}
                    alt={w.name}
                    className="w-full h-full object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
                <div className="text-sm font-medium">{w.name.replace(/-/g, ' ')}</div>
                {selected === i && <div className="text-xs text-orange-400 mt-1">Course Set</div>}
              </button>
            ))}
          </div>

          <div className="mt-4 h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${Math.min(point / 2, 1) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>{point} point(s)</span>
            <span>2</span>
          </div>
        </>
      )}
    </div>
  );
}
