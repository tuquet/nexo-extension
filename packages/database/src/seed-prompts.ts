/**
 * Seed Prompt Template for CineGenie Database
 *
 * This file contains a single, comprehensive prompt template that demonstrates
 * ALL available options for the handleGenerateScript API. It serves as:
 * - A complete reference implementation
 * - A testing template for automation features
 * - Documentation of the full API surface
 *
 * Usage:
 * import { SEED_PROMPT } from './seed-prompts';
 * await db.prompts.add(SEED_PROMPT);
 */

import PromptDataDefault from './seed-data/prompt.json';
import type { PromptRecord } from './db';

/**
 * Single comprehensive seed prompt with ALL handleGenerateScript options
 */
export const SEED_PROMPT: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  ...PromptDataDefault,
  postprocessing: {
    ...PromptDataDefault.postprocessing,
    steps: (PromptDataDefault.postprocessing.steps ?? []) as Array<
      'trim' | 'remove-quotes' | 'parse-json' | 'extract-field'
    >,
  },
  metadata: {
    ...PromptDataDefault.metadata,
    lastUsedAt: undefined,
    rating: undefined,
  },
};
