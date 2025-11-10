/* eslint-disable func-style */
import { defaultPrompts as seedPrompts } from './seed-prompts';
import type { PromptRecord } from './db';

/**
 * Re-export default prompts from seed-prompts.ts
 * This is the array of prompts that will be seeded into the database
 */
export const defaultPrompts: Omit<PromptRecord, 'createdAt' | 'updatedAt'>[] = seedPrompts;

/**
 * Seed default prompts into database with ID-based duplicate check
 * - Checks if prompts with specific IDs already exist before seeding
 * - Only adds prompts that don't exist in the database
 * - Adds timestamps (createdAt, updatedAt)
 * - Returns count of added prompts
 *
 * @param db - Dexie database instance
 * @returns Number of prompts added (0 if all IDs already exist)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedDefaultPrompts(db: any): Promise<number> {
  // Check which IDs already exist
  const existingIds = new Set((await db.prompts.toArray()).map((p: PromptRecord) => p.id));

  // Filter out prompts that already exist
  const promptsToAdd = defaultPrompts.filter(prompt => !existingIds.has(prompt.id));

  if (promptsToAdd.length === 0) {
    console.log(`[Seed] All ${defaultPrompts.length} default prompts already exist, skipping seed`);
    return 0;
  }

  const now = new Date();
  const promptsWithTimestamps = promptsToAdd.map(prompt => ({
    ...prompt,
    createdAt: now,
    updatedAt: now,
  }));

  const addedIds = await db.prompts.bulkAdd(promptsWithTimestamps, { allKeys: true });
  console.log(
    `[Seed] Added ${addedIds.length} default prompt template${addedIds.length > 1 ? 's' : ''} (${defaultPrompts.length - addedIds.length} already existed)`,
  );
  return addedIds.length;
}
