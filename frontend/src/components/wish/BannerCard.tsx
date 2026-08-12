import type { BannerItem } from '../../stores/bannerStore';

interface BannerCardProps {
  banner?: BannerItem;
  pity5: number;
  pity4: number;
  onBannerChange: (index: number) => void;
  banners: BannerItem[];
}

const bannerArt = (banner?: BannerItem): string => {
  if (!banner) return '';
  switch (banner.type) {
    case 'beginner':
      return '/images/banner/beginner/beginner.webp';
    case 'weapon-event':
      return `/images/banner/weapons/${banner.bannerName}.webp`;
    case 'standard':
      return `/images/banner/standard/${banner.bannerName}.webp`;
    case 'chronicled':
      return banner.region ? `/images/utility/chronicled-${banner.region}.webp` : '';
    default:
      return `/images/banner/character-events/${banner.bannerName}.webp`;
  }
};

export function BannerCard({ banner, pity5, pity4, onBannerChange, banners }: BannerCardProps) {
  if (!banner) return null;

  const art = bannerArt(banner);
  const isBeginner = banner.type === 'beginner';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold capitalize">{banner.bannerName.replace(/-/g, ' ')}</h2>
        <select
          value={banners.findIndex((b) => b.bannerName === banner.bannerName)}
          onChange={(e) => onBannerChange(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
          aria-label="Banner"
        >
          {banners.map((b, i) => (
            <option key={`${b.type}-${b.bannerName}`} value={i}>
              {b.bannerName.replace(/-/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {art && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 aspect-[16/9] max-h-72">
          <img
            src={art}
            alt={banner.bannerName}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">5★ Pity</span>
            <span className="font-bold text-yellow-400">
              {pity5} / {banner.type === 'weapon-event' ? 80 : 90}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${Math.min(pity5 / (banner.type === 'weapon-event' ? 80 : 90), 1) * 100}%` }}
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
        {banner.type === 'character-event' && (
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="font-medium">{banner.character}</div>
            <div className="text-xs text-gray-400">Featured</div>
          </div>
        )}
        {banner.featured?.map((f: { name: string }, i: number) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="font-medium">{f.name}</div>
            <div className="text-xs text-gray-400">Featured Weapon</div>
          </div>
        ))}
        {isBeginner && (
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="font-medium">{banner.character}</div>
            <div className="text-xs text-gray-400">Noelle guaranteed in 20</div>
          </div>
        )}
      </div>
    </div>
  );
}
