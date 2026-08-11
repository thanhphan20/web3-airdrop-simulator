import { useState, useEffect } from 'react';

interface WishResultModalProps {
  data: any;
  isMulti: boolean;
  onClose: () => void;
}

export function WishResultModal({ data, isMulti, onClose }: WishResultModalProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const results = isMulti ? data : [data];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Wish Results</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {results.map((result: any, index: number) => (
              <div key={index} className={`relative p-4 rounded-lg border-2 ${
                result.rarity === 5 ? 'border-yellow-400 bg-yellow-500/10' :
                result.rarity === 4 ? 'border-purple-400 bg-purple-500/10' :
                'border-blue-400 bg-blue-500/10'
              }`}>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">{result.bannerName || result.banner}</div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-xs text-gray-400">{result.type}</div>
                  <div className={`text-xs mt-1 ${result.rarity === 5 ? 'text-yellow-400' : result.rarity === 4 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {'★'.repeat(result.rarity)}
                  </div>
                  {result.status && <div className="text-xs text-gray-400 mt-1">{result.status}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}