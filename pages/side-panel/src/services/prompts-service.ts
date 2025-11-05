/**
 * Side Panel Prompts Integration
 * Database-based prompt management aligned with new-tab logic
 *
 * This replaces the old hardcoded GEMINI_PROMPTS array
 * All prompts are now stored in IndexedDB and managed through PromptRecord
 */

import { db } from '@extension/database';
import { PROMPT_CATEGORY_META } from '@extension/shared';
import type { PromptRecord } from '@extension/database';
import type { PromptCategory } from '@extension/shared';

/**
 * Get all prompts from database
 */
const getAllPrompts = async (): Promise<PromptRecord[]> => {
  try {
    return await db.prompts.toArray();
  } catch (error) {
    console.error('Failed to load prompts:', error);
    return [];
  }
};

/**
 * Get prompts by category
 */
const getPromptsByCategory = async (category: PromptCategory): Promise<PromptRecord[]> => {
  try {
    return await db.prompts.where('category').equals(category).toArray();
  } catch (error) {
    console.error(`Failed to load prompts for category ${category}:`, error);
    return [];
  }
};

/**
 * Search prompts by title, description, or tags
 */
const searchPrompts = async (query: string): Promise<PromptRecord[]> => {
  try {
    const lowercaseQuery = query.toLowerCase();
    const allPrompts = await db.prompts.toArray();

    return allPrompts.filter(
      p =>
        p.title.toLowerCase().includes(lowercaseQuery) ||
        p.description?.toLowerCase().includes(lowercaseQuery) ||
        p.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)),
    );
  } catch (error) {
    console.error('Failed to search prompts:', error);
    return [];
  }
};

/**
 * Get prompt by ID
 */
const getPromptById = async (id: number): Promise<PromptRecord | undefined> => {
  try {
    return await db.prompts.get(id);
  } catch (error) {
    console.error(`Failed to load prompt ${id}:`, error);
    return undefined;
  }
};

/**
 * Get category metadata (icon, label, description)
 */
const getCategoryMeta = (category: PromptCategory) => PROMPT_CATEGORY_META[category];

/**
 * Get all categories with metadata
 */
const getAllCategories = () =>
  Object.entries(PROMPT_CATEGORY_META).map(([value, meta]) => ({
    value: value as PromptCategory,
    label: meta.label,
    icon: meta.icon,
    description: meta.description,
  }));

export { getAllPrompts, getPromptsByCategory, searchPrompts, getPromptById, getCategoryMeta, getAllCategories };
