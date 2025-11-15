/**
 * Script Repository
 *
 * Purpose: Abstract database operations for scripts
 * Benefits:
 * - Single place for all script DB operations
 * - Easy to test (can mock)
 * - Easy to switch DB implementation
 * - Follows Repository Pattern
 */

import { db } from '@src/db';
import type { IScriptRepository, ScriptStory } from './types';

/**
 * Script repository implementation using Dexie
 */
export class ScriptRepository implements IScriptRepository {
  /**
   * Get all scripts
   */
  async getAll(): Promise<ScriptStory[]> {
    try {
      return await db.scripts.reverse().toArray();
    } catch (error) {
      console.error('[ScriptRepository] Failed to get all scripts:', error);
      throw new Error('Không thể tải danh sách kịch bản');
    }
  }

  /**
   * Get script by ID
   */
  async getById(id: number): Promise<ScriptStory | undefined> {
    try {
      return await db.scripts.get(id);
    } catch (error) {
      console.error(`[ScriptRepository] Failed to get script ${id}:`, error);
      throw new Error(`Không thể tải kịch bản #${id}`);
    }
  }

  /**
   * Add new script
   * @returns ID of created script
   */
  async add(script: Omit<ScriptStory, 'id'>): Promise<number> {
    try {
      const id = await db.scripts.add(script as ScriptStory);
      return id as number;
    } catch (error) {
      console.error('[ScriptRepository] Failed to add script:', error);
      throw new Error('Không thể tạo kịch bản mới');
    }
  }

  /**
   * Add multiple scripts
   * @returns Array of created script IDs
   */
  async bulkAdd(scripts: Omit<ScriptStory, 'id'>[]): Promise<number[]> {
    try {
      const ids = await db.scripts.bulkAdd(scripts as ScriptStory[], { allKeys: true });
      return ids as number[];
    } catch (error) {
      console.error('[ScriptRepository] Failed to bulk add scripts:', error);
      throw new Error('Không thể nhập nhiều kịch bản');
    }
  }

  /**
   * Update existing script
   */
  async update(script: ScriptStory): Promise<void> {
    try {
      if (!script.id) {
        throw new Error('Script ID is required for update');
      }
      await db.scripts.put(script);
    } catch (error) {
      console.error('[ScriptRepository] Failed to update script:', error);
      throw new Error('Không thể cập nhật kịch bản');
    }
  }

  /**
   * Delete script by ID
   */
  async delete(id: number): Promise<void> {
    try {
      await db.scripts.delete(id);
    } catch (error) {
      console.error(`[ScriptRepository] Failed to delete script ${id}:`, error);
      throw new Error(`Không thể xóa kịch bản #${id}`);
    }
  }

  /**
   * Clear all scripts
   */
  async clear(): Promise<void> {
    try {
      await db.scripts.clear();
    } catch (error) {
      console.error('[ScriptRepository] Failed to clear scripts:', error);
      throw new Error('Không thể xóa tất cả kịch bản');
    }
  }

  /**
   * Count total scripts
   */
  async count(): Promise<number> {
    try {
      return await db.scripts.count();
    } catch (error) {
      console.error('[ScriptRepository] Failed to count scripts:', error);
      return 0;
    }
  }
}

/**
 * Singleton instance
 * Use this throughout the application
 */
export const scriptRepository = new ScriptRepository();
