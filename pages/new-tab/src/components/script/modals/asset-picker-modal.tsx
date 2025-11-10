/**
 * Asset Picker Modal
 * Allows selecting assets from gallery to link to a scene
 * Features: Filter by type, search, pagination, preview
 */

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@extension/ui';
import { useAssetPicker } from '@src/hooks/use-asset-picker';
import { Check, Search } from 'lucide-react';
import type React from 'react';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: number) => void;
  assetType: 'image' | 'video' | 'audio';
  currentAssetId?: number;
}

const AssetPickerModal: React.FC<AssetPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  assetType,
  currentAssetId,
}) => {
  // Use custom hook for asset management
  const {
    filteredAssets,
    searchTerm,
    setSearchTerm,
    uploadSourceFilter,
    setUploadSourceFilter,
    isLoading,
    selectedAssetId,
    handleAssetClick,
  } = useAssetPicker({
    assetType,
    isOpen,
    currentAssetId,
  });

  const handleSelect = () => {
    if (selectedAssetId !== null) {
      onSelect(selectedAssetId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select {assetType}</DialogTitle>
          <DialogDescription>Choose an asset from your gallery to link to this scene</DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 border-b pb-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={uploadSourceFilter} onValueChange={v => setUploadSourceFilter(v as typeof uploadSourceFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="ai-generated">AI Generated</SelectItem>
              <SelectItem value="manual-upload">Manual Upload</SelectItem>
              <SelectItem value="imported">Imported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No assets found</p>
              <p className="mt-1 text-sm">Try adjusting your filters or create new assets</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAssetClick(asset.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAssetClick(asset.id);
                    }
                  }}
                  className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
                    selectedAssetId === asset.id
                      ? 'border-primary ring-primary/20 ring-2'
                      : 'border-border hover:border-primary/50'
                  }`}>
                  {/* Asset Preview */}
                  <div
                    className="bg-muted aspect-video"
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleAssetClick(asset.id);
                      }
                    }}>
                    {assetType === 'image' ? (
                      <img src={asset.url} alt={asset.originalFilename} className="size-full object-cover" />
                    ) : assetType === 'video' ? (
                      <video src={asset.url} className="size-full object-cover" muted>
                        <track kind="captions" />
                      </video>
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <div className="text-center">
                          <div className="mb-2 text-4xl">🎵</div>
                          <p className="text-muted-foreground">Audio</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {selectedAssetId === asset.id && (
                    <div className="bg-primary absolute right-2 top-2 flex size-6 items-center justify-center rounded-full">
                      <Check className="text-primary-foreground size-4" />
                    </div>
                  )}

                  {/* Current Asset Badge */}
                  {currentAssetId === asset.id && (
                    <div className="bg-primary/90 text-primary-foreground absolute left-2 top-2 rounded px-2 py-1 font-medium">
                      Current
                    </div>
                  )}

                  {/* Asset Info */}
                  <div className="bg-card p-2">
                    <p className="truncate font-medium">{asset.originalFilename || `Asset #${asset.id}`}</p>
                    {asset.uploadSource && (
                      <p className="text-muted-foreground capitalize">{asset.uploadSource.replace('-', ' ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={selectedAssetId === null}>
            Select Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AssetPickerModal };
export type { AssetPickerModalProps };
