/* eslint-disable func-style */
import { defaultPrompts as seedPrompts } from './seed-prompts';
import type { PromptRecord } from './db';

/**
 * Re-export default prompts from seed-prompts.ts
 * This is the array of prompts that will be seeded into the database
 */
export const defaultPrompts: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>[] = seedPrompts;

/**
 * Seed default prompts into database with duplicate check
 * - Checks if prompts already exist before seeding
 * - Adds timestamps (createdAt, updatedAt)
 * - Returns count of added prompts
 *
 * @param db - Dexie database instance
 * @returns Number of prompts added (0 if already seeded)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedDefaultPrompts(db: any): Promise<number> {
  const existingCount = await db.prompts.count();
  if (existingCount > 0) {
    console.log(`[Seed] Prompts table already has ${existingCount} records, skipping seed`);
    return 0;
  }

  console.log('[Seed] Initializing prompts table with default templates...');
  const now = new Date();
  const promptsToAdd = defaultPrompts.map(prompt => ({
    ...prompt,
    createdAt: now,
    updatedAt: now,
  }));

  const addedIds = await db.prompts.bulkAdd(promptsToAdd, { allKeys: true });
  console.log(`[Seed] Added ${addedIds.length} default prompt template${addedIds.length > 1 ? 's' : ''}`);
  return addedIds.length;
}
