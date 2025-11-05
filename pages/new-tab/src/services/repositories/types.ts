/**
 * Repository Layer - Type Definitions
 *
 * Purpose: Define interfaces for repository pattern
 * Benefits:
 * - Abstraction over database implementation
 * - Easy to mock for testing
 * - Follows Dependency Inversion Principle
 */

import type { ScriptStory } from '@src/types';

/**
 * Generic repository interface
 * All repositories should extend this
 */
export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: number): Promise<T | undefined>;
  add(entity: Omit<T, 'id'>): Promise<number>;
  update(entity: T): Promise<void>;
  delete(id: number): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Script repository interface
 * Extends base repository with script-specific operations
 */
export interface IScriptRepository extends IRepository<ScriptStory> {
  bulkAdd(scripts: Omit<ScriptStory, 'id'>[]): Promise<number[]>;
  count(): Promise<number>;
}

/**
 * Asset data stored in IndexedDB (DB v7: no scriptId)
 */
export interface AssetData {
  id?: number;
  data: Blob;
  uploadSource: 'ai-generated' | 'manual-upload' | 'imported';
  uploadedAt: Date;
  mimeType?: string;
}

/**
 * Asset repository interface
 * Handles images, videos, and audio files
 */
export interface IAssetRepository {
  // Add asset and return ID (with optional mapping)
  add(data: Blob, scriptId: number, sceneId?: string, role?: string): Promise<number>;

  // Get asset by ID
  get(id: number): Promise<AssetData | undefined>;

  // Get asset as URL (for display)
  getAsUrl(id: number): Promise<string | null>;

  // Get all assets for a script
  getByScriptId(scriptId: number): Promise<AssetData[]>;

  // Delete asset
  delete(id: number): Promise<void>;

  // Delete all assets for a script
  deleteByScriptId(scriptId: number): Promise<void>;

  // Clear all assets
  clear(): Promise<void>;

  // Count assets
  count(): Promise<number>;
}

/**
 * Asset URL cache entry
 * Keeps track of object URLs to prevent memory leaks
 */
export interface AssetUrlCache {
  url: string;
  createdAt: number;
}

export type { ScriptStory };
