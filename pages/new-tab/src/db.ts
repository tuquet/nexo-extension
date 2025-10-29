import Dexie from 'dexie';
import type { Root } from './types';
import type { Table } from 'dexie';

// Interface for the image table records
export interface ImageRecord {
  id?: number;
  scriptId: number; // Foreign key to the script
  data: Blob;
}

// Interface for the new video table records
export interface VideoRecord {
  id?: number;
  scriptId: number; // Foreign key to the script
  data: Blob;
}

/**
 * Defines the structure of our IndexedDB database using Dexie.
 * This class sets up tables for 'scripts', 'images', and 'videos'.
 */
export class CineGenieDB extends Dexie {
  scripts!: Table<Root, number>;
  images!: Table<ImageRecord, number>;
  videos!: Table<VideoRecord, number>;

  constructor() {
    super('cineGenieDatabase'); // Database name

    // Define database schema. Dexie uses this to manage migrations.
    this.version(3).stores({
      scripts: '++id, title',
      images: '++id',
      videos: '++id',
    });

    // NEW: Version 4 adds scriptId to images and videos for relational linking
    this.version(4).stores({
      scripts: '++id, title',
      images: '++id, scriptId', // Index scriptId for efficient lookups
      videos: '++id, scriptId',
    });
  }

  /**
   * Clears all data from all tables in the database.
   * This is a destructive operation.
   */
  async clearAllData(): Promise<void> {
    // Use a transaction to ensure all tables are cleared atomically.
    await this.transaction('rw', this.scripts, this.images, this.videos, async () => {
      await this.scripts.clear();
      await this.images.clear();
      await this.videos.clear();
    });
  }
}

// Create and export a singleton instance of the database.
export const db = new CineGenieDB();
