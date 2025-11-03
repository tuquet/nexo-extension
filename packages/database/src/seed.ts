/* eslint-disable func-style */
import { SEED_PROMPT } from './seed-prompts';
import type { PromptRecord } from './db';

export const defaultPrompts: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [SEED_PROMPT];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedDefaultPrompts(db: any): Promise<number> {
  const existingCount = await db.prompts.count();
  if (existingCount > 0) {
    console.log(`[Seed] Prompts table already has ${existingCount} records, skipping seed`);
    return 0;
  }
  console.log('[Seed] Initializing prompts table with default template...');
  const now = new Date();
  const promptsToAdd = defaultPrompts.map(prompt => ({
    ...prompt,
    createdAt: now,
    updatedAt: now,
  }));
  const addedIds = await db.prompts.bulkAdd(promptsToAdd, { allKeys: true });
  console.log(`[Seed] Added ${addedIds.length} default prompt template`);
  return addedIds.length;
}
