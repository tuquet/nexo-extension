/**
 * Database module for side-panel page
 * Re-exports the shared database instance from @extension/database
 *
 * Side-panel uses the same database as new-tab for consistent state.
 * This allows:
 * 1. Reading prompt templates for automation
 * 2. Creating new scripts from side-panel automation
 * 3. Real-time sync between new-tab and side-panel
 */
export { db } from '@extension/database';
export type {
  PromptRecord,
  ScriptStory,
  ImageRecord,
  VideoRecord,
  AudioRecord,
  Act,
  Scene,
  Dialogue,
  Character,
  Setting,
  BuildMeta,
} from '@extension/database';
