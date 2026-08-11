interface BannerCardProps {
  banner: any;
  pity5: number;
  pity4: number;
  onBannerChange: (index: number) => void;
  banners: any[];
}

export function BannerCard({ banner, pity5, pity4, onBannerChange, banners }: BannerCardProps) {
  if (!banner) return null;

  const isCharacter = banner.type === 'character-event' || banner.type === 'chronicled';
  const isWeapon = banner.type === 'weapon-event';
  const isBeginner = banner.type === 'beginner';
  const isStandard = banner.type === 'standard';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold capitalize">{banner.type.replace('-', ' ')}</h2>
        <select
          value={banners.findIndex(b => b.name === banner.name)}
          onChange={(e) => onBannerChange(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
        >
          {banners.map((b, i) => (
            <option key={b.name} value={i}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">5★ Pity</span>
            <span className="font-bold text-yellow-400">{pity5} / 90</span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${Math.min(pity5 / 90, 1) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">4★ Pity</span>
            <span className="font-bold text-purple-400">{pity4} / 10</span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(pity4 / 10, 1) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {banner.events?.featured?.map((f: any, i: number) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="font-medium">{f.character}</div>
            <div className="text-xs text-gray-400">{f.bannerName}</div>
          </div>
        ))}
        {banner.weapons?.featured?.map((w: any, i: number) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="font-medium">{w.name}</div>
            <div className="text-xs text-gray-400">{banner.weapons?.bannerName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}