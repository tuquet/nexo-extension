# Database Schema v7 Migration Guide

## Overview

Schema v7 introduces **asset independence** - a fundamental architectural change where assets (images, videos, audio) are no longer tied to a single script. This enables:

- ✅ Asset reusability across multiple scripts/scenes
- ✅ Manual file upload from local disk
- ✅ Gallery-based asset management
- ✅ Many-to-many relationship between scripts and assets

## Breaking Changes

### Before (Schema v6):
```typescript
interface ImageRecord {
  id?: number;
  data: Blob;
  scriptId: number; // ❌ Tied to single script
}
```

### After (Schema v7):
```typescript
interface ImageRecord {
  id?: number;
  data: Blob;
  uploadSource: 'ai-generated' | 'manual-upload' | 'imported'; // ✅ Track origin
  originalFilename?: string; // ✅ Preserve filename
  uploadedAt: Date; // ✅ Timestamp
  mimeType?: string; // ✅ MIME type
}

// New many-to-many mapping table
interface ScriptAssetMapping {
  id?: number;
  scriptId: number;
  sceneId?: string; // "act0-scene2"
  assetType: 'image' | 'video' | 'audio';
  assetId: number;
  linkedAt: Date;
  role?: 'scene-image' | 'scene-video' | 'dialogue-audio';
}
```

## Migration Process

### Automatic Migration

When users upgrade to v7, Dexie automatically runs the migration:

```typescript
// db.ts - Line 276
this.version(7)
  .stores({
    images: '++id, uploadedAt, uploadSource', // scriptId removed
    scriptAssetMappings: '++id, scriptId, assetType, assetId', // New table
  })
  .upgrade(async tx => {
    // 1. Read all existing assets
    const oldImages = await tx.table('images').toArray();
    
    // 2. Create mappings from old scriptId
    const mappings = [];
    for (const img of oldImages) {
      if (img.scriptId) {
        mappings.push({
          scriptId: img.scriptId,
          assetType: 'image',
          assetId: img.id,
          linkedAt: new Date(),
        });
      }
      
      // 3. Add new metadata fields
      await tx.table('images').update(img.id, {
        uploadSource: 'ai-generated',
        uploadedAt: new Date(),
        mimeType: img.data.type,
      });
    }
    
    // 4. Bulk insert mappings
    await tx.table('scriptAssetMappings').bulkAdd(mappings);
  });
```

### What Gets Migrated

| Asset Type | Old Field | New Behavior |
|------------|-----------|--------------|
| **Images** | `scriptId` → Removed | Creates `ScriptAssetMapping` entry |
| **Videos** | `scriptId` → Removed | Creates `ScriptAssetMapping` entry |
| **Audios** | `scriptId` → Removed | Creates `ScriptAssetMapping` entry |
| **All** | - | Adds `uploadSource: 'ai-generated'` |
| **All** | - | Adds `uploadedAt: Date` |
| **All** | - | Adds `mimeType: string` |

### Data Preservation

✅ **Preserved:**
- All asset Blobs (unchanged)
- Script-to-asset relationships (via new mapping table)
- Asset IDs (unchanged)

❌ **Removed:**
- Direct `scriptId` field from asset records

## Code Changes Required

### 1. Asset Generation

**Before:**
```typescript
const imageId = await db.images.add({
  data: blob,
  scriptId: activeScript.id, // ❌ No longer valid
});
```

**After:**
```typescript
// Step 1: Save asset without scriptId
const imageId = await db.images.add({
  data: blob,
  uploadSource: 'ai-generated',
  uploadedAt: new Date(),
  mimeType: blob.type,
});

// Step 2: Create mapping
await db.scriptAssetMappings.add({
  scriptId: activeScript.id,
  sceneId: 'act0-scene2',
  assetType: 'image',
  assetId: imageId,
  linkedAt: new Date(),
});
```

### 2. Asset Queries

**Before:**
```typescript
// Get all images for a script
const images = await db.images.where({ scriptId: 123 }).toArray();
```

**After:**
```typescript
// Get mappings first
const mappings = await db.scriptAssetMappings
  .where({ scriptId: 123, assetType: 'image' })
  .toArray();

// Then fetch actual images
const imageIds = mappings.map(m => m.assetId);
const images = await db.images.bulkGet(imageIds);
```

### 3. Asset Deletion

**Before:**
```typescript
await db.images.delete(imageId);
// Script references break automatically
```

**After:**
```typescript
// Delete asset
await db.images.delete(imageId);

// Delete all mappings
await db.scriptAssetMappings
  .where({ assetType: 'image', assetId: imageId })
  .delete();
```

## New Features Enabled

### 1. Manual File Upload

```typescript
const file = event.target.files[0];
const imageId = await db.images.add({
  data: file,
  uploadSource: 'manual-upload', // 🆕 Track origin
  originalFilename: file.name,
  uploadedAt: new Date(),
  mimeType: file.type,
});
```

### 2. Asset Reuse

```typescript
// Link same asset to multiple scenes
await db.scriptAssetMappings.bulkAdd([
  { scriptId: 1, sceneId: 'act0-scene1', assetType: 'image', assetId: 42 },
  { scriptId: 1, sceneId: 'act1-scene3', assetType: 'image', assetId: 42 },
  { scriptId: 2, sceneId: 'act0-scene0', assetType: 'image', assetId: 42 },
]);
```

### 3. Gallery Management

```typescript
// Get all assets (independent of scripts)
const allImages = await db.images.toArray();

// Filter by upload source
const manualUploads = await db.images
  .where({ uploadSource: 'manual-upload' })
  .toArray();

// Find orphaned assets (not linked to any script)
const mappings = await db.scriptAssetMappings.toArray();
const linkedIds = new Set(mappings.map(m => m.assetId));
const orphans = allImages.filter(img => !linkedIds.has(img.id));
```

## Backward Compatibility

### Legacy Scene Fields

Scene objects still contain `generatedImageId` and `generatedVideoId` for backward compatibility:

```typescript
interface Scene {
  generatedImageId?: number; // ⚠️ Legacy - still used by old code
  generatedVideoId?: number; // ⚠️ Legacy - still used by old code
}
```

**Migration strategy:**
- New code uses `ScriptAssetMapping` to query assets
- Falls back to `scene.generatedImageId` if mapping not found
- Both systems work during transition period

### Example: useSceneAssets Hook

```typescript
const { imageUrl } = useSceneAssets({
  scriptId: 123,
  sceneId: 'act0-scene2',
  legacyImageId: scene.generatedImageId, // ✅ Fallback support
});
```

## Testing the Migration

### Pre-Migration Checklist

1. **Backup database:**
   ```typescript
   // Export all data before upgrade
   const backup = {
     scripts: await db.scripts.toArray(),
     images: await db.images.toArray(),
     videos: await db.videos.toArray(),
     audios: await db.audios.toArray(),
   };
   localStorage.setItem('db-backup-v6', JSON.stringify(backup));
   ```

2. **Verify data integrity:**
   ```typescript
   const imageCount = await db.images.count();
   const videoCount = await db.videos.count();
   const audioCount = await db.audios.count();
   console.log(`Pre-migration counts: ${imageCount} images, ${videoCount} videos, ${audioCount} audios`);
   ```

### Post-Migration Verification

1. **Check mapping creation:**
   ```typescript
   const mappingCount = await db.scriptAssetMappings.count();
   console.log(`Created ${mappingCount} asset mappings`);
   ```

2. **Verify metadata:**
   ```typescript
   const images = await db.images.toArray();
   const hasMetadata = images.every(img => 
     img.uploadSource && img.uploadedAt && img.mimeType
   );
   console.log(`All images have metadata: ${hasMetadata}`);
   ```

3. **Test asset queries:**
   ```typescript
   // Should work with both old and new schema
   const sceneAssets = await db.scriptAssetMappings
     .where({ scriptId: 1, sceneId: 'act0-scene0' })
     .toArray();
   console.log(`Scene has ${sceneAssets.length} assets`);
   ```

## Rollback Strategy

⚠️ **WARNING:** Schema v7 is a breaking change. Rolling back requires data migration.

### If Migration Fails

1. **Check console logs:**
   ```
   [DB Migration v7] Starting asset independence migration...
   [DB Migration v7] Created X asset mappings
   [DB Migration v7] Migration completed successfully
   ```

2. **Inspect database:**
   ```typescript
   // Check if scriptAssetMappings table exists
   const tables = await db.tables;
   console.log('Tables:', tables.map(t => t.name));
   ```

3. **Manual cleanup (if needed):**
   ```typescript
   // Clear corrupted data and reimport backup
   await db.scriptAssetMappings.clear();
   await db.transaction('rw', db.scriptAssetMappings, async () => {
     // Rebuild mappings from backup
   });
   ```

## Troubleshooting

### Issue: Assets not appearing in Gallery

**Cause:** Missing metadata fields  
**Solution:**
```typescript
// Add metadata to existing assets
const images = await db.images.toArray();
for (const img of images) {
  if (!img.uploadSource) {
    await db.images.update(img.id, {
      uploadSource: 'ai-generated',
      uploadedAt: new Date(),
      mimeType: img.data.type,
    });
  }
}
```

### Issue: Scene assets not loading

**Cause:** Missing ScriptAssetMapping entries  
**Solution:**
```typescript
// Rebuild mappings from scene.generatedImageId
const scripts = await db.scripts.toArray();
for (const script of scripts) {
  for (const act of script.acts) {
    for (const scene of act.scenes) {
      if (scene.generatedImageId) {
        await db.scriptAssetMappings.add({
          scriptId: script.id,
          sceneId: `act${scene.actIndex}-scene${scene.sceneIndex}`,
          assetType: 'image',
          assetId: scene.generatedImageId,
          linkedAt: new Date(),
        });
      }
    }
  }
}
```

### Issue: Duplicate mappings

**Cause:** Migration ran multiple times  
**Solution:**
```typescript
// Remove duplicates
const mappings = await db.scriptAssetMappings.toArray();
const seen = new Set();
for (const mapping of mappings) {
  const key = `${mapping.scriptId}-${mapping.sceneId}-${mapping.assetType}-${mapping.assetId}`;
  if (seen.has(key)) {
    await db.scriptAssetMappings.delete(mapping.id);
  } else {
    seen.add(key);
  }
}
```

## Migration Timeline

- **v6 (Current)**: Assets tied to scripts via `scriptId`
- **v7 (This Release)**: Asset independence + mapping table
- **v8 (Future)**: Remove legacy `generatedImageId` fields

## Support

If you encounter issues during migration:

1. Check browser console for migration logs
2. Export database to JSON and report issue
3. Use legacy fallback by keeping `generatedImageId` fields populated

---

**Last Updated:** November 5, 2025  
**Schema Version:** 7  
**Database Name:** cineGenieDatabase
