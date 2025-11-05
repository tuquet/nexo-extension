import Dexie from 'dexie';
import type { Table } from 'dexie';

// ============================================================================
// Type Definitions
// ============================================================================

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface ScriptStory {
  id?: number; // Unique identifier for the script
  title: string;
  genre: string[];
  alias: string;
  logline: string;
  tone: string;
  notes: string;
  setting: Setting;
  themes: string[];
  characters: Character[];
  acts: Act[];
  buildMeta?: BuildMeta | null;
  titleImage?: string; // Base64 string for the title image
}

export interface Act {
  act_number: number;
  scenes: Scene[];
  summary: string;
}

export interface Scene {
  scene_number: number;
  time: string;
  location: string;
  action: string;
  audio_style: string;
  visual_style: string;
  dialogues: Dialogue[];
  generatedImageId?: number;
  isGeneratingImage?: boolean;
  generatedVideoId?: number;
  isGeneratingVideo?: boolean;
  actIndex: number; // Add actIndex to scene for easier access
  sceneIndex: number; // Add sceneIndex to scene for easier access
}

export interface Dialogue {
  roleId: string;
  line: string;
  projectBlockItemId?: string; // To map with Vbee's response
  generatedAudioId?: number; // The ID of the audio in IndexedDB
  isGeneratingAudio?: boolean; // To show loading state
}

export interface Character {
  description: string;
  name: string;
  roleId: string;
}

export interface Setting {
  time: string;
  location: string;
}

export interface BuildMeta {
  vbeeProjectId?: string | number;
  fullScriptAudioId?: number;
  is_video_generated?: boolean;
  is_audio_generated?: boolean;
  is_image_generated?: boolean;
  is_transcript_generated?: boolean;
  is_video_compiled?: boolean;
  is_has_folder?: boolean;
  configs?: Record<string, unknown>;
  history?: Array<{
    at: string; // ISO timestamp
    action: string;
    status: string;
    by?: string;
    note?: string;
  }>;
  updated_at?: string;
}

// ============================================================================
// Asset Record Interfaces (Refactored: Assets are independent, reusable)
// ============================================================================

export type AssetUploadSource = 'ai-generated' | 'manual-upload' | 'imported';

export interface ImageRecord {
  id?: number;
  data: Blob;
  // Metadata for independent asset management
  uploadSource: AssetUploadSource;
  originalFilename?: string;
  uploadedAt: Date;
  mimeType?: string; // e.g., 'image/png', 'image/jpeg'
}

export interface VideoRecord {
  id?: number;
  data: Blob;
  uploadSource: AssetUploadSource;
  originalFilename?: string;
  uploadedAt: Date;
  mimeType?: string; // e.g., 'video/mp4', 'video/webm'
  duration?: number; // Duration in seconds
}

export interface AudioRecord {
  id?: number;
  data: Blob;
  uploadSource: AssetUploadSource;
  originalFilename?: string;
  uploadedAt: Date;
  mimeType?: string; // e.g., 'audio/mpeg', 'audio/wav'
  duration?: number; // Duration in seconds
  isFullScript?: boolean; // Legacy: marks full script audio from Vbee
}

// ============================================================================
// Script-Asset Mapping (Many-to-Many Relationship)
// ============================================================================

export interface ScriptAssetMapping {
  id?: number; // Auto-increment primary key
  scriptId: number; // Foreign key to script
  sceneId?: string; // Optional: specific scene (format: "act-X-scene-Y")
  assetType: 'image' | 'video' | 'audio'; // Type of asset
  assetId: number; // Foreign key to images/videos/audios table
  linkedAt: Date; // When the asset was linked to this script
  role?: 'scene-image' | 'scene-video' | 'dialogue-audio' | 'full-script-audio' | 'background'; // Asset role
}

// ============================================================================
// Prompt Template Interface (Enhanced for Automation)
// ============================================================================

export interface PromptRecord {
  id?: number; // Auto-increment primary key
  title: string;
  category: 'script-generation' | 'image-generation' | 'video-generation' | 'character-dev' | 'general';
  prompt: string;
  description?: string;
  tags?: string[];
  icon?: string;
  createdAt: Date;
  updatedAt: Date;

  // ============================================================================
  // Advanced Automation Fields
  // ============================================================================

  /**
   * System instruction override for this prompt
   * If provided, replaces the default system instruction in API calls
   */
  systemInstruction?: string;

  /**
   * Expected output format
   * - 'json-structured': Use predefined JSON schema (SCRIPT_GENERATION_SCHEMA)
   * - 'json-free': Free-form JSON response
   * - 'text': Plain text response
   * - 'markdown': Markdown formatted text
   */
  outputFormat?: 'json-structured' | 'json-free' | 'text' | 'markdown';

  /**
   * Custom JSON schema for structured output (when outputFormat = 'json-structured')
   * Should be a valid Type schema object from @google/genai
   */
  customSchema?: string; // JSON stringified schema

  /**
   * Model preferences for this prompt
   */
  modelSettings?: {
    preferredModel?: string; // e.g., 'gemini-2.5-flash', 'gemini-2.5-pro'
    temperature?: number; // 0.0 - 2.0
    topP?: number; // 0.0 - 1.0
    topK?: number;
    maxOutputTokens?: number;
  };

  /**
   * Pre-processing configuration
   * - variables: Support {{variable}} syntax in prompts
   * - contextInjection: Auto-inject character/setting context
   */
  preprocessing?: {
    enableVariables?: boolean; // Enable {{variable}} replacement
    variableDefinitions?: string; // JSON stringified array of variable definitions
    injectContext?: boolean;
  };

  /**
   * Post-processing steps for API response
   */
  postprocessing?: {
    steps?: Array<'trim' | 'remove-quotes' | 'parse-json' | 'extract-field'>;
    extractField?: string; // JSON path like 'data.script.title'
  };

  /**
   * Metadata for organization and analytics
   */
  metadata?: {
    author?: string;
    version?: string;
    usageCount?: number;
    lastUsedAt?: Date;
    rating?: number; // 1-5 stars
    isFavorite?: boolean;
  };
}

// ============================================================================
// Dexie Database Class
// ============================================================================

/**
 * Defines the structure of our IndexedDB database using Dexie.
 * This is the single source of truth for the entire extension.
 */
export class CineGenieDB extends Dexie {
  scripts!: Table<ScriptStory, number>;
  images!: Table<ImageRecord, number>;
  videos!: Table<VideoRecord, number>;
  audios!: Table<AudioRecord, number>;
  prompts!: Table<PromptRecord, number>;
  scriptAssetMappings!: Table<ScriptAssetMapping, number>;

  constructor() {
    super('cineGenieDatabase'); // Database name

    // Version 3: Initial schema with scripts, images, videos
    this.version(3).stores({
      scripts: '++id, title',
      images: '++id',
      videos: '++id',
    });

    // Version 4: Add scriptId indexes for relational linking
    this.version(4).stores({
      scripts: '++id, title',
      images: '++id, scriptId', // Index scriptId for efficient lookups
      videos: '++id, scriptId',
    });

    // Version 5: Add audios table
    this.version(5).stores({
      scripts: '++id, title',
      images: '++id, scriptId',
      videos: '++id, scriptId',
      audios: '++id, scriptId', // Add audios table with scriptId index
    });

    // Version 6: Add prompts table
    this.version(6).stores({
      scripts: '++id, title',
      images: '++id, scriptId',
      videos: '++id, scriptId',
      audios: '++id, scriptId',
      prompts: '++id, category, createdAt', // Add prompts table with indexed fields
    });

    // Version 7: BREAKING CHANGE - Assets become independent, reusable
    // Remove scriptId from assets, add metadata, create mapping table
    this.version(7)
      .stores({
        scripts: '++id, title',
        images: '++id, uploadedAt, uploadSource', // Remove scriptId, add metadata indexes
        videos: '++id, uploadedAt, uploadSource',
        audios: '++id, uploadedAt, uploadSource',
        prompts: '++id, category, createdAt',
        scriptAssetMappings: '++id, scriptId, assetType, assetId, [scriptId+assetType], [assetType+assetId]', // Many-to-many mapping
      })
      .upgrade(async tx => {
        // Migration: Convert old schema to new schema
        console.log('[DB Migration v7] Starting asset independence migration...');

        const oldImages = await tx.table<ImageRecord & { scriptId?: number }>('images').toArray();
        const oldVideos = await tx.table<VideoRecord & { scriptId?: number }>('videos').toArray();
        const oldAudios = await tx.table<AudioRecord & { scriptId?: number }>('audios').toArray();

        const mappings: Omit<ScriptAssetMapping, 'id'>[] = [];
        const now = new Date();

        // Migrate images
        for (const img of oldImages) {
          if (img.id && img.scriptId) {
            mappings.push({
              scriptId: img.scriptId,
              assetType: 'image',
              assetId: img.id,
              linkedAt: now,
              role: 'scene-image',
            });
          }
          // Update image record with new metadata
          await tx.table('images').update(img.id!, {
            uploadSource: 'ai-generated' as AssetUploadSource,
            uploadedAt: now,
            mimeType: img.data.type || 'image/png',
          });
        }

        // Migrate videos
        for (const vid of oldVideos) {
          if (vid.id && vid.scriptId) {
            mappings.push({
              scriptId: vid.scriptId,
              assetType: 'video',
              assetId: vid.id,
              linkedAt: now,
              role: 'scene-video',
            });
          }
          await tx.table('videos').update(vid.id!, {
            uploadSource: 'ai-generated' as AssetUploadSource,
            uploadedAt: now,
            mimeType: vid.data.type || 'video/mp4',
          });
        }

        // Migrate audios
        for (const aud of oldAudios) {
          if (aud.id && aud.scriptId) {
            mappings.push({
              scriptId: aud.scriptId,
              assetType: 'audio',
              assetId: aud.id,
              linkedAt: now,
              role: aud.isFullScript ? 'full-script-audio' : 'dialogue-audio',
            });
          }
          await tx.table('audios').update(aud.id!, {
            uploadSource: 'ai-generated' as AssetUploadSource,
            uploadedAt: now,
            mimeType: aud.data.type || 'audio/mpeg',
          });
        }

        // Create mappings
        if (mappings.length > 0) {
          await tx.table('scriptAssetMappings').bulkAdd(mappings);
          console.log(`[DB Migration v7] Created ${mappings.length} asset mappings`);
        }

        console.log('[DB Migration v7] Migration completed successfully');
      });
  }

  /**
   * Clears all data from all tables in the database.
   * This is a destructive operation.
   */
  async clearAllData(): Promise<void> {
    // Use a transaction to ensure all tables are cleared atomically.
    await this.transaction(
      'rw',
      [this.scripts, this.images, this.videos, this.audios, this.prompts, this.scriptAssetMappings],
      async () => {
        await this.scripts.clear();
        await this.images.clear();
        await this.videos.clear();
        await this.audios.clear();
        await this.prompts.clear();
        await this.scriptAssetMappings.clear();
      },
    );
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

/**
 * Singleton database instance.
 * Import and use this instance across all extension contexts.
 *
 * @example
 * ```typescript
 * import { db } from '@extension/database';
 *
 * const scripts = await db.scripts.toArray();
 * ```
 */
export const db = new CineGenieDB();
