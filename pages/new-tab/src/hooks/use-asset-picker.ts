/**
 * Asset Picker Hook
 * Manages asset loading, filtering, and selection for asset picker modal
 * Extracted from asset-picker-modal.tsx to improve reusability and testability
 */

import { db } from '@src/db';
import { useCallback, useEffect, useState } from 'react';

interface AssetItem {
  id: number;
  url: string;
  uploadSource?: 'ai-generated' | 'manual-upload' | 'imported';
  originalFilename?: string;
  uploadedAt?: Date;
  mimeType?: string;
}

interface UseAssetPickerOptions {
  assetType: 'image' | 'video' | 'audio';
  isOpen: boolean;
  currentAssetId?: number | null;
}

const useAssetPicker = (options: UseAssetPickerOptions) => {
  const { assetType, isOpen, currentAssetId } = options;

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadSourceFilter, setUploadSourceFilter] = useState<'all' | 'ai-generated' | 'manual-upload' | 'imported'>(
    'all',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(currentAssetId || null);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const table = assetType === 'image' ? db.images : assetType === 'video' ? db.videos : db.audios;
      const records = await table.toArray();

      const assetItems: AssetItem[] = records.map(record => ({
        id: record.id!,
        url: URL.createObjectURL(record.data),
        uploadSource: record.uploadSource,
        originalFilename: record.originalFilename,
        uploadedAt: record.uploadedAt,
        mimeType: record.mimeType,
      }));

      setAssets(assetItems);
      setFilteredAssets(assetItems);
    } catch (error) {
      console.error('[useAssetPicker] Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [assetType]);

  // Load assets when modal opens
  useEffect(() => {
    if (isOpen) {
      void loadAssets();
    }
    return () => {
      // Cleanup object URLs
      assets.forEach(asset => URL.revokeObjectURL(asset.url));
    };
  }, [isOpen, loadAssets, assets]);

  // Filter assets based on search and upload source
  useEffect(() => {
    let filtered = assets;

    // Filter by upload source
    if (uploadSourceFilter !== 'all') {
      filtered = filtered.filter(asset => asset.uploadSource === uploadSourceFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset => asset.originalFilename?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    setFilteredAssets(filtered);
  }, [assets, uploadSourceFilter, searchTerm]);

  // Handle asset click
  const handleAssetClick = useCallback((assetId: number) => {
    setSelectedAssetId(assetId);
  }, []);

  return {
    assets,
    filteredAssets,
    searchTerm,
    setSearchTerm,
    uploadSourceFilter,
    setUploadSourceFilter,
    isLoading,
    selectedAssetId,
    handleAssetClick,
    loadAssets,
  };
};

export { useAssetPicker };
export type { AssetItem };
