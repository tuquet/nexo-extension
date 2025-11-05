import ShortScript from './seed-data/short-script.json';
import VeoScript from './seed-data/veo3-script.json';
import type { PromptRecord } from './db';

/**
 * Array of default prompts for bulk import
 * Supports both single object and array imports
 *
 * To add more prompts, simply add to this array:
 * export const defaultPrompts = [
 *   transformPromptData(ShortScript),
 *   transformPromptData(AnotherPromptData),
 * ];
 */
export const defaultPrompts: Array<Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>> = [ShortScript, VeoScript];
