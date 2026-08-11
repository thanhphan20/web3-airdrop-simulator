interface EpitomizedPathProps {
  banner: any;
}

export function EpitomizedPath({ banner }: EpitomizedPathProps) {
  if (!banner || banner.type !== 'weapon-event' || !banner.weapons?.fatepointsystem) {
    return null;
  }

  return (
    <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="font-bold mb-3">Epitomized Path</h3>
      <div className="flex items-center gap-4">
        {banner.weapons.featured?.map((w: any, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-2">
              {w.name}
            </div>
            <div className="text-sm font-medium">{w.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 bg-gray-700 rounded overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: '50%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0</span>
        <span>1</span>
        <span>2</span>
      </div>
    </div>
  );
}