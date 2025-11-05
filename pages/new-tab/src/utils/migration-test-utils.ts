/**
 * Database Migration Test Utilities
 * Helper functions to verify schema v7 migration integrity
 */

import { db } from '@src/db';

interface MigrationTestResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalAssets: number;
    totalMappings: number;
    assetsWithMetadata: number;
    orphanedAssets: number;
    duplicateMappings: number;
  };
}

/**
 * Comprehensive migration verification
 */
const verifyMigration = async (): Promise<MigrationTestResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Check if scriptAssetMappings table exists
    const tables = db.tables.map(t => t.name);
    if (!tables.includes('scriptAssetMappings')) {
      errors.push('scriptAssetMappings table does not exist');
    }

    // 2. Count assets
    const imageCount = await db.images.count();
    const videoCount = await db.videos.count();
    const audioCount = await db.audios.count();
    const totalAssets = imageCount + videoCount + audioCount;

    // 3. Count mappings
    const mappingCount = await db.scriptAssetMappings.count();

    // 4. Verify all assets have metadata
    const [images, videos, audios] = await Promise.all([db.images.toArray(), db.videos.toArray(), db.audios.toArray()]);

    let assetsWithMetadata = 0;
    const allAssets = [...images, ...videos, ...audios];

    for (const asset of allAssets) {
      if (asset.uploadSource && asset.uploadedAt && asset.mimeType) {
        assetsWithMetadata++;
      } else {
        warnings.push(
          `Asset ${asset.id} missing metadata: uploadSource=${asset.uploadSource}, uploadedAt=${asset.uploadedAt}, mimeType=${asset.mimeType}`,
        );
      }
    }

    // 5. Check for orphaned assets (no mappings)
    const mappings = await db.scriptAssetMappings.toArray();
    const linkedAssetIds = new Set<string>();
    for (const mapping of mappings) {
      linkedAssetIds.add(`${mapping.assetType}-${mapping.assetId}`);
    }

    let orphanedAssets = 0;
    for (const asset of allAssets) {
      const isImage = images.some(img => img.id === asset.id);
      const isVideo = videos.some(vid => vid.id === asset.id);
      const assetType = isImage ? 'image' : isVideo ? 'video' : 'audio';
      const key = `${assetType}-${asset.id}`;
      if (!linkedAssetIds.has(key)) {
        orphanedAssets++;
        warnings.push(`Asset ${assetType} #${asset.id} is not linked to any script`);
      }
    }

    // 6. Check for duplicate mappings
    const mappingKeys = new Set<string>();
    let duplicateMappings = 0;

    for (const mapping of mappings) {
      const key = `${mapping.scriptId}-${mapping.sceneId || 'null'}-${mapping.assetType}-${mapping.assetId}`;
      if (mappingKeys.has(key)) {
        duplicateMappings++;
        warnings.push(`Duplicate mapping: ${key}`);
      } else {
        mappingKeys.add(key);
      }
    }

    // 7. Verify scripts can still load assets
    const scripts = await db.scripts.toArray();
    for (const script of scripts) {
      const scriptMappings = await db.scriptAssetMappings.where({ scriptId: script.id }).toArray();
      if (scriptMappings.length === 0) {
        warnings.push(`Script #${script.id} "${script.title}" has no asset mappings`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalAssets,
        totalMappings: mappingCount,
        assetsWithMetadata,
        orphanedAssets,
        duplicateMappings,
      },
    };
  } catch (error) {
    errors.push(`Migration verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      errors,
      warnings,
      stats: {
        totalAssets: 0,
        totalMappings: 0,
        assetsWithMetadata: 0,
        orphanedAssets: 0,
        duplicateMappings: 0,
      },
    };
  }
};

/**
 * Export database to JSON for backup
 */
const exportDatabase = async () => {
  const backup = {
    version: 7,
    exportedAt: new Date().toISOString(),
    data: {
      scripts: await db.scripts.toArray(),
      images: await db.images.toArray(),
      videos: await db.videos.toArray(),
      audios: await db.audios.toArray(),
      prompts: await db.prompts.toArray(),
      scriptAssetMappings: await db.scriptAssetMappings.toArray(),
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cineGenie-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Fix missing metadata for assets
 */
const fixMissingMetadata = async (): Promise<number> => {
  let fixed = 0;

  // Fix images
  const images = await db.images.toArray();
  for (const img of images) {
    if (!img.uploadSource || !img.uploadedAt || !img.mimeType) {
      await db.images.update(img.id!, {
        uploadSource: img.uploadSource || 'ai-generated',
        uploadedAt: img.uploadedAt || new Date(),
        mimeType: img.mimeType || img.data.type || 'image/png',
      });
      fixed++;
    }
  }

  // Fix videos
  const videos = await db.videos.toArray();
  for (const vid of videos) {
    if (!vid.uploadSource || !vid.uploadedAt || !vid.mimeType) {
      await db.videos.update(vid.id!, {
        uploadSource: vid.uploadSource || 'ai-generated',
        uploadedAt: vid.uploadedAt || new Date(),
        mimeType: vid.mimeType || vid.data.type || 'video/mp4',
      });
      fixed++;
    }
  }

  // Fix audios
  const audios = await db.audios.toArray();
  for (const aud of audios) {
    if (!aud.uploadSource || !aud.uploadedAt || !aud.mimeType) {
      await db.audios.update(aud.id!, {
        uploadSource: aud.uploadSource || 'ai-generated',
        uploadedAt: aud.uploadedAt || new Date(),
        mimeType: aud.mimeType || aud.data.type || 'audio/mpeg',
      });
      fixed++;
    }
  }

  return fixed;
};

/**
 * Rebuild mappings from legacy scene.generatedImageId fields
 */
const rebuildMappingsFromScenes = async (): Promise<number> => {
  let created = 0;
  const scripts = await db.scripts.toArray();

  for (const script of scripts) {
    for (const act of script.acts) {
      for (const scene of act.scenes) {
        const sceneId = `act${scene.actIndex}-scene${scene.sceneIndex}`;

        // Check if mapping already exists
        if (scene.generatedImageId) {
          const existing = await db.scriptAssetMappings
            .where({
              scriptId: script.id!,
              sceneId,
              assetType: 'image',
              assetId: scene.generatedImageId,
            })
            .first();

          if (!existing) {
            await db.scriptAssetMappings.add({
              scriptId: script.id!,
              sceneId,
              assetType: 'image',
              assetId: scene.generatedImageId,
              linkedAt: new Date(),
              role: 'scene-image',
            });
            created++;
          }
        }

        if (scene.generatedVideoId) {
          const existing = await db.scriptAssetMappings
            .where({
              scriptId: script.id!,
              sceneId,
              assetType: 'video',
              assetId: scene.generatedVideoId,
            })
            .first();

          if (!existing) {
            await db.scriptAssetMappings.add({
              scriptId: script.id!,
              sceneId,
              assetType: 'video',
              assetId: scene.generatedVideoId,
              linkedAt: new Date(),
              role: 'scene-video',
            });
            created++;
          }
        }
      }
    }
  }

  return created;
};

/**
 * Remove duplicate mappings
 */
const removeDuplicateMappings = async (): Promise<number> => {
  const mappings = await db.scriptAssetMappings.toArray();
  const seen = new Set<string>();
  let removed = 0;

  for (const mapping of mappings) {
    const key = `${mapping.scriptId}-${mapping.sceneId || 'null'}-${mapping.assetType}-${mapping.assetId}`;
    if (seen.has(key)) {
      await db.scriptAssetMappings.delete(mapping.id!);
      removed++;
    } else {
      seen.add(key);
    }
  }

  return removed;
};

export { verifyMigration, exportDatabase, fixMissingMetadata, rebuildMappingsFromScenes, removeDuplicateMappings };
export type { MigrationTestResult };
