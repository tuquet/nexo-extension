/**
 * Shared database for side-panel
 * Accesses the same IndexedDB as new-tab page
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';

interface PromptRecord {
  id?: number;
  title: string;
  category: 'script-generation' | 'image-generation' | 'video-generation' | 'character-dev' | 'general';
  prompt: string;
  description?: string;
  tags?: string[];
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shared database instance (same database as new-tab)
 */
class CineGenieDB extends Dexie {
  prompts!: Table<PromptRecord, number>;

  constructor() {
    super('cineGenieDatabase'); // Same database name as new-tab

    // Match the version from new-tab db.ts
    this.version(6).stores({
      scripts: '++id, title',
      images: '++id, scriptId',
      videos: '++id, scriptId',
      audios: '++id, scriptId',
      prompts: '++id, category, createdAt',
    });
  }
}

const db = new CineGenieDB();

export { db };
export type { PromptRecord };
