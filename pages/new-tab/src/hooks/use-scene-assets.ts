/**
 * Hook to fetch assets linked to a specific scene via ScriptAssetMapping
 * Supports schema v7 many-to-many relationship between scripts/scenes and assets
 */

import { db } from '@src/db';
import { useCallback, useEffect, useState } from 'react';

interface SceneAssetUrls {
  imageUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  imageId: number | null;
  videoId: number | null;
  audioId: number | null;
}

interface UseSceneAssetsOptions {
  scriptId: number;
  sceneId: string;
  // Legacy support: If scene has old generatedImageId/videoId
  legacyImageId?: number;
  legacyVideoId?: number;
}

interface UseSceneAssetsReturn extends SceneAssetUrls {
  isLoading: boolean;
  reloadAssets: () => Promise<void>;
  linkAsset: (assetType: 'image' | 'video' | 'audio', assetId: number) => Promise<void>;
  unlinkAsset: (assetType: 'image' | 'video' | 'audio', assetId: number) => Promise<void>;
  replaceAsset: (assetType: 'image' | 'video' | 'audio', oldAssetId: number, newAssetId: number) => Promise<void>;
}

const useSceneAssets = (options: UseSceneAssetsOptions): UseSceneAssetsReturn => {
  const { scriptId, sceneId, legacyImageId, legacyVideoId } = options;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null);
  const [audioId, setAudioId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cleanup object URLs on unmount
  useEffect(() => {
    const urls = [imageUrl, videoUrl, audioUrl].filter(Boolean) as string[];
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrl, videoUrl, audioUrl]);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);

    try {
      // Query ScriptAssetMapping for this scene
      const mappings = await db.scriptAssetMappings.where({ scriptId, sceneId }).toArray();

      // Group by asset type
      const imageMapping = mappings.find(m => m.assetType === 'image');
      const videoMapping = mappings.find(m => m.assetType === 'video');
      const audioMapping = mappings.find(m => m.assetType === 'audio');

      // Load image
      if (imageMapping) {
        const imageRecord = await db.images.get(imageMapping.assetId);
        if (imageRecord?.data) {
          const url = URL.createObjectURL(imageRecord.data);
          setImageUrl(url);
          setImageId(imageRecord.id!);
        }
      } else if (legacyImageId) {
        // Fallback to legacy schema
        const imageRecord = await db.images.get(legacyImageId);
        if (imageRecord?.data) {
          const url = URL.createObjectURL(imageRecord.data);
          setImageUrl(url);
          setImageId(imageRecord.id!);
        }
      } else {
        setImageUrl(null);
        setImageId(null);
      }

      // Load video
      if (videoMapping) {
        const videoRecord = await db.videos.get(videoMapping.assetId);
        if (videoRecord?.data) {
          const url = URL.createObjectURL(videoRecord.data);
          setVideoUrl(url);
          setVideoId(videoRecord.id!);
        }
      } else if (legacyVideoId) {
        // Fallback to legacy schema
        const videoRecord = await db.videos.get(legacyVideoId);
        if (videoRecord?.data) {
          const url = URL.createObjectURL(videoRecord.data);
          setVideoUrl(url);
          setVideoId(videoRecord.id!);
        }
      } else {
        setVideoUrl(null);
        setVideoId(null);
      }

      // Load audio (new schema only, no legacy)
      if (audioMapping) {
        const audioRecord = await db.audios.get(audioMapping.assetId);
        if (audioRecord?.data) {
          const url = URL.createObjectURL(audioRecord.data);
          setAudioUrl(url);
          setAudioId(audioRecord.id!);
        }
      } else {
        setAudioUrl(null);
        setAudioId(null);
      }
    } catch (error) {
      console.error('[useSceneAssets] Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scriptId, sceneId, legacyImageId, legacyVideoId]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const linkAsset = useCallback(
    async (assetType: 'image' | 'video' | 'audio', assetId: number) => {
      try {
        // Check if mapping already exists
        const existing = await db.scriptAssetMappings.where({ scriptId, sceneId, assetType }).first();

        if (existing) {
          // Update existing mapping
          await db.scriptAssetMappings.update(existing.id!, { assetId });
        } else {
          // Create new mapping
          await db.scriptAssetMappings.add({
            scriptId,
            sceneId,
            assetType,
            assetId,
            linkedAt: new Date(),
          });
        }

        // Reload to reflect changes
        await loadAssets();

        // Trigger gallery refresh
        window.dispatchEvent(new CustomEvent('assets-changed'));
      } catch (error) {
        console.error('[useSceneAssets] Failed to link asset:', error);
        throw error;
      }
    },
    [scriptId, sceneId, loadAssets],
  );

  const unlinkAsset = useCallback(
    async (assetType: 'image' | 'video' | 'audio', assetId: number) => {
      try {
        await db.scriptAssetMappings.where({ scriptId, sceneId, assetType, assetId }).delete();

        // Reload to reflect changes
        await loadAssets();

        // Trigger gallery refresh
        window.dispatchEvent(new CustomEvent('assets-changed'));
      } catch (error) {
        console.error('[useSceneAssets] Failed to unlink asset:', error);
        throw error;
      }
    },
    [scriptId, sceneId, loadAssets],
  );

  const replaceAsset = useCallback(
    async (assetType: 'image' | 'video' | 'audio', oldAssetId: number, newAssetId: number) => {
      try {
        // Find existing mapping
        const existing = await db.scriptAssetMappings
          .where({ scriptId, sceneId, assetType, assetId: oldAssetId })
          .first();

        if (existing) {
          // Update with new asset
          await db.scriptAssetMappings.update(existing.id!, {
            assetId: newAssetId,
            linkedAt: new Date(),
          });
        } else {
          // No existing mapping, just create new one
          await db.scriptAssetMappings.add({
            scriptId,
            sceneId,
            assetType,
            assetId: newAssetId,
            linkedAt: new Date(),
          });
        }

        // Reload to reflect changes
        await loadAssets();

        // Trigger gallery refresh
        window.dispatchEvent(new CustomEvent('assets-changed'));
      } catch (error) {
        console.error('[useSceneAssets] Failed to replace asset:', error);
        throw error;
      }
    },
    [scriptId, sceneId, loadAssets],
  );

  return {
    imageUrl,
    videoUrl,
    audioUrl,
    imageId,
    videoId,
    audioId,
    isLoading,
    reloadAssets: loadAssets,
    linkAsset,
    unlinkAsset,
    replaceAsset,
  };
};

export { useSceneAssets };
export type { SceneAssetUrls, UseSceneAssetsOptions, UseSceneAssetsReturn };
