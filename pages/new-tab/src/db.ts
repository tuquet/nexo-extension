/**
 * Database module for new-tab page
 * Re-exports the shared database instance from @extension/database
 */
export { db } from '@extension/database';
export type {
  ScriptStory,
  ImageRecord,
  VideoRecord,
  AudioRecord,
  PromptRecord,
  Act,
  Scene,
  Dialogue,
  Character,
  Setting,
  BuildMeta,
  AspectRatio,
} from '@extension/database';

// Re-export ScriptStory from types for backward compatibility
export type { ScriptStory as ScriptStoryType } from './types';
