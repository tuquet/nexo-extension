import { Card } from '@extension/ui';
import { CheckCircle2, Eye, Music } from 'lucide-react';
import type { Asset } from '@src/hooks/use-gallery-assets';
import type React from 'react';

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, isSelected, isSelectionMode, onClick }) => (
  <Card
    role="button"
    tabIndex={0}
    aria-label={`Chon tai san ${asset.type} #${asset.id}`}
    className={`group relative cursor-pointer overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}>
    <div className="relative">
      {asset.type === 'image' ? (
        <img src={asset.url} alt={`Asset ${asset.id}`} className="aspect-square h-full w-full object-cover" />
      ) : asset.type === 'video' ? (
        <video src={asset.url} className="aspect-video h-full w-full bg-black object-cover">
          <track kind="captions" />
        </video>
      ) : (
        <div className="flex aspect-square flex-col items-center justify-center bg-slate-100 p-4 dark:bg-slate-800">
          <Music className="h-16 w-16 text-slate-400 dark:text-slate-500" />
          <p className="mt-3 font-mono text-xs text-slate-500">Audio Asset</p>
        </div>
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <Eye className="h-8 w-8 text-white" />
      </div>

      <div
        className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white/80 text-blue-600 backdrop-blur-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isSelected && <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />}
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-12">
      <p className="truncate text-sm font-semibold text-white">{asset.scriptTitle || 'Kich ban khong ro'}</p>
      <p className="truncate font-mono text-xs text-slate-300">{asset.dataType}</p>
    </div>
  </Card>
);

export { AssetCard };
export type { AssetCardProps };
