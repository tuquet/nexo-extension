import { useCallback, useState } from 'react';
import type { Asset } from './use-gallery-assets';

interface UseAssetSelectionReturn {
  isSelectionMode: boolean;
  selectedAssetKeys: Set<string>;
  selectedCount: number;
  toggleSelectionMode: () => void;
  toggleAsset: (asset: Asset) => void;
  clearSelection: () => void;
  selectAll: (assets: Asset[]) => void;
  isSelected: (asset: Asset) => boolean;
  getAssetKey: (asset: Asset) => string;
}

const useAssetSelection = (): UseAssetSelectionReturn => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<Set<string>>(new Set());

  const getAssetKey = useCallback((asset: Asset): string => `${asset.type}-${asset.id}`, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedAssetKeys(new Set());
  }, []);

  const toggleAsset = useCallback((asset: Asset) => {
    const key = `${asset.type}-${asset.id}`;
    setSelectedAssetKeys(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAssetKeys(new Set());
  }, []);

  const selectAll = useCallback((assets: Asset[]) => {
    const allKeys = new Set(assets.map(asset => `${asset.type}-${asset.id}`));
    setSelectedAssetKeys(allKeys);
  }, []);

  const isSelected = useCallback(
    (asset: Asset): boolean => {
      const key = `${asset.type}-${asset.id}`;
      return selectedAssetKeys.has(key);
    },
    [selectedAssetKeys],
  );

  return {
    isSelectionMode,
    selectedAssetKeys,
    selectedCount: selectedAssetKeys.size,
    toggleSelectionMode,
    toggleAsset,
    clearSelection,
    selectAll,
    isSelected,
    getAssetKey,
  };
};

export { useAssetSelection };
export type { UseAssetSelectionReturn };
