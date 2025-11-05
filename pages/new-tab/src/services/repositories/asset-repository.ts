/**
 * Asset Repository
 *
 * Purpose: Abstract database operations for assets (images, videos, audio)
 * Benefits:
 * - Single place for all asset DB operations
 * - URL caching to prevent memory leaks
 * - Easy to test and mock
 * - Follows Repository Pattern
 */

import { db } from '@src/db';
import type { AssetData, IAssetRepository } from './types';

/**
 * Base asset repository implementation
 * Can be extended for specific asset types
 */
abstract class BaseAssetRepository implements IAssetRepository {
  protected abstract get table(): 'images' | 'videos' | 'audios';

  // Cache for object URLs to prevent memory leaks
  private urlCache = new Map<number, string>();

  /**
   * Add asset and return ID
   * DB v7: Assets are independent, scriptId is stored in scriptAssetMappings
   */
  async add(data: Blob, scriptId: number, sceneId?: string, role?: string): Promise<number> {
    try {
      // Step 1: Add asset without scriptId
      const assetId = await db[this.table].add({
        data,
        uploadSource: 'ai-generated' as const,
        uploadedAt: new Date(),
        mimeType: this.getMimeType(),
      });

      // Step 2: Create mapping
      await db.scriptAssetMappings.add({
        scriptId,
        assetType: this.getAssetType(),
        assetId: assetId as number,
        linkedAt: new Date(),
        role: (role || this.getDefaultRole()) as
          | 'scene-image'
          | 'scene-video'
          | 'dialogue-audio'
          | 'full-script-audio'
          | 'background',
        sceneId,
      });

      return assetId as number;
    } catch (error) {
      console.error(`[AssetRepository] Failed to add ${this.table}:`, error);
      throw new Error(`Không thể lưu ${this.table}`);
    }
  }

  private getMimeType(): string {
    switch (this.table) {
      case 'images':
        return 'image/png';
      case 'videos':
        return 'video/mp4';
      case 'audios':
        return 'audio/mpeg';
      default:
        return 'application/octet-stream';
    }
  }

  private getAssetType(): 'image' | 'video' | 'audio' {
    switch (this.table) {
      case 'images':
        return 'image';
      case 'videos':
        return 'video';
      case 'audios':
        return 'audio';
      default:
        return 'image';
    }
  }

  private getDefaultRole(): string {
    switch (this.table) {
      case 'images':
        return 'scene-image';
      case 'videos':
        return 'scene-video';
      case 'audios':
        return 'dialogue-audio';
      default:
        return 'background';
    }
  }

  /**
   * Get asset by ID
   */
  async get(id: number): Promise<AssetData | undefined> {
    try {
      return await db[this.table].get(id);
    } catch (error) {
      console.error(`[AssetRepository] Failed to get ${this.table} ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get asset as object URL for display
   * Caches URLs to prevent recreating them
   */
  async getAsUrl(id: number): Promise<string | null> {
    try {
      // Check cache first
      if (this.urlCache.has(id)) {
        return this.urlCache.get(id) || null;
      }

      // Load from DB
      const asset = await this.get(id);
      if (!asset?.data) return null;

      // Create object URL and cache it
      const url = URL.createObjectURL(asset.data);
      this.urlCache.set(id, url);

      return url;
    } catch (error) {
      console.error(`[AssetRepository] Failed to get ${this.table} URL ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all assets for a script (DB v7: use scriptAssetMappings)
   */
  async getByScriptId(scriptId: number): Promise<AssetData[]> {
    try {
      // Get asset IDs from mappings
      const mappings = await db.scriptAssetMappings
        .where({ scriptId })
        .and(m => m.assetType === this.getAssetType())
        .toArray();

      // Get actual assets
      const assetIds = mappings.map(m => m.assetId);
      const assets = await db[this.table].where('id').anyOf(assetIds).toArray();

      return assets as AssetData[];
    } catch (error) {
      console.error(`[AssetRepository] Failed to get ${this.table} for script ${scriptId}:`, error);
      return [];
    }
  }

  /**
   * Delete asset and revoke cached URL
   */
  async delete(id: number): Promise<void> {
    try {
      // Revoke cached URL to free memory
      const cachedUrl = this.urlCache.get(id);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        this.urlCache.delete(id);
      }

      await db[this.table].delete(id);
    } catch (error) {
      console.error(`[AssetRepository] Failed to delete ${this.table} ${id}:`, error);
      throw new Error(`Không thể xóa ${this.table}`);
    }
  }

  /**
   * Delete all assets for a script
   */
  async deleteByScriptId(scriptId: number): Promise<void> {
    try {
      // Get all asset IDs first to revoke URLs
      const assets = await this.getByScriptId(scriptId);
      assets.forEach(asset => {
        if (asset.id) {
          const cachedUrl = this.urlCache.get(asset.id);
          if (cachedUrl) {
            URL.revokeObjectURL(cachedUrl);
            this.urlCache.delete(asset.id);
          }
        }
      });

      await db[this.table].where({ scriptId }).delete();
    } catch (error) {
      console.error(`[AssetRepository] Failed to delete ${this.table} for script ${scriptId}:`, error);
      throw new Error(`Không thể xóa ${this.table} của kịch bản`);
    }
  }

  /**
   * Clear all assets and revoke all cached URLs
   */
  async clear(): Promise<void> {
    try {
      // Revoke all cached URLs
      this.urlCache.forEach(url => URL.revokeObjectURL(url));
      this.urlCache.clear();

      await db[this.table].clear();
    } catch (error) {
      console.error(`[AssetRepository] Failed to clear ${this.table}:`, error);
      throw new Error(`Không thể xóa tất cả ${this.table}`);
    }
  }

  /**
   * Count total assets
   */
  async count(): Promise<number> {
    try {
      return await db[this.table].count();
    } catch (error) {
      console.error(`[AssetRepository] Failed to count ${this.table}:`, error);
      return 0;
    }
  }

  /**
   * Cleanup: Revoke all cached URLs
   * Call this when component unmounts or app closes
   */
  cleanup(): void {
    this.urlCache.forEach(url => URL.revokeObjectURL(url));
    this.urlCache.clear();
  }
}

/**
 * Image repository
 */
class ImageRepository extends BaseAssetRepository {
  protected get table(): 'images' {
    return 'images';
  }
}

/**
 * Video repository
 */
class VideoRepository extends BaseAssetRepository {
  protected get table(): 'videos' {
    return 'videos';
  }
}

/**
 * Audio repository
 */
class AudioRepository extends BaseAssetRepository {
  protected get table(): 'audios' {
    return 'audios';
  }
}

/**
 * Singleton instances
 * Use these throughout the application
 */
export const imageRepository = new ImageRepository();
export const videoRepository = new VideoRepository();
export const audioRepository = new AudioRepository();

/**
 * Cleanup all asset repositories
 * Call this on app unmount or before page unload
 */
export const cleanupAllAssetRepositories = (): void => {
  imageRepository.cleanup();
  videoRepository.cleanup();
  audioRepository.cleanup();
};
