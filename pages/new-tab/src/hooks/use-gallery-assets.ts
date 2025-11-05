import { ASSET_EVENTS } from './use-assets';
import { db } from '@src/db';
import { useStoreHydration } from '@src/hooks/use-store-hydration';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Asset {
  id: number;
  scriptId?: number; // Optional - may not exist after schema v7 migration
  sceneId?: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  scriptTitle?: string;
  dataType: string;
  data: Blob;
  uploadSource?: 'ai-generated' | 'manual-upload' | 'imported'; // New in schema v7
  originalFilename?: string; // New in schema v7
  uploadedAt?: Date; // New in schema v7
}

interface UseGalleryAssetsOptions {
  itemsPerPage?: number;
}

interface UseGalleryAssetsReturn {
  assets: Asset[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalAssets: number;
  setCurrentPage: (page: number) => void;
  reloadAssets: () => Promise<void>;
}

const useGalleryAssets = (options: UseGalleryAssetsOptions = {}): UseGalleryAssetsReturn => {
  const { itemsPerPage = 30 } = options;
  const hasHydrated = useStoreHydration();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const objectUrlsRef = useRef<string[]>([]);

  const cleanupUrls = useCallback(() => {
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
  }, []);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    cleanupUrls();

    try {
      // After schema v7: assets are independent, no need for scriptMap
      // Script titles will be fetched via ScriptAssetMapping when needed
      const [imageCount, videoCount, audioCount] = await Promise.all([
        db.images.count(),
        db.videos.count(),
        db.audios.count(),
      ]);
      const totalCount = imageCount + videoCount + audioCount;
      setTotalAssets(totalCount);

      const offset = (currentPage - 1) * itemsPerPage;
      const [imageKeys, videoKeys, audioKeys] = await Promise.all([
        db.images.toCollection().keys() as Promise<number[]>,
        db.videos.toCollection().keys() as Promise<number[]>,
        db.audios.toCollection().keys() as Promise<number[]>,
      ]);

      const allAssetKeys = [
        ...imageKeys.map(id => ({ type: 'image' as const, id })),
        ...videoKeys.map(id => ({ type: 'video' as const, id })),
        ...audioKeys.map(id => ({ type: 'audio' as const, id })),
      ].sort((a, b) => b.id - a.id);

      const paginatedKeys = allAssetKeys.slice(offset, offset + itemsPerPage);
      const imageIdsToGet = paginatedKeys.filter(k => k.type === 'image').map(k => k.id);
      const videoIdsToGet = paginatedKeys.filter(k => k.type === 'video').map(k => k.id);
      const audioIdsToGet = paginatedKeys.filter(k => k.type === 'audio').map(k => k.id);

      const [imageRecords, videoRecords, audioRecords] = await Promise.all([
        db.images.bulkGet(imageIdsToGet),
        db.videos.bulkGet(videoIdsToGet),
        db.audios.bulkGet(audioIdsToGet),
      ]);

      const loadedAssets: Asset[] = [];
      const newUrls: string[] = [];

      [...imageRecords, ...videoRecords, ...audioRecords].forEach(record => {
        if (record?.id && record?.data) {
          const mimeType = record.data.type;
          const type = mimeType.startsWith('audio') ? 'audio' : mimeType.startsWith('video') ? 'video' : 'image';
          const url = URL.createObjectURL(record.data);
          newUrls.push(url);

          // After schema v7: assets are independent, scriptId comes from ScriptAssetMapping
          // For now, we show all assets without script assignment
          loadedAssets.push({
            id: record.id,
            type,
            url,
            dataType: record.data.type,
            data: record.data,
            uploadSource: record.uploadSource,
            originalFilename: record.originalFilename,
            uploadedAt: record.uploadedAt,
            // scriptId and scriptTitle will be populated by ScriptAssetMapping later
          });
        }
      });

      objectUrlsRef.current = newUrls;
      setAssets(loadedAssets.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('[useGalleryAssets] Failed to load assets:', error);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, cleanupUrls]);

  const reloadAssets = useCallback(async () => {
    await fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (hasHydrated) {
      fetchAssets();
      window.addEventListener(ASSET_EVENTS.CHANGED, fetchAssets);
      return () => {
        window.removeEventListener(ASSET_EVENTS.CHANGED, fetchAssets);
      };
    }
    setIsLoading(true);
    return undefined;
  }, [fetchAssets, hasHydrated]);

  useEffect(
    () => () => {
      cleanupUrls();
    },
    [cleanupUrls],
  );

  const totalPages = Math.ceil(totalAssets / itemsPerPage);

  return {
    assets,
    isLoading,
    currentPage,
    totalPages,
    totalAssets,
    setCurrentPage,
    reloadAssets,
  };
};

export type { Asset, UseGalleryAssetsOptions, UseGalleryAssetsReturn };
export { useGalleryAssets };
