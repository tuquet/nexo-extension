export { db, CineGenieDB } from './src/db.js';
export type {
  ScriptStory,
  Act,
  Scene,
  Dialogue,
  Character,
  Setting,
  BuildMeta,
  AspectRatio,
  ImageRecord,
  VideoRecord,
  AudioRecord,
  PromptRecord,
} from './src/db.js';

// Seed utilities
export { seedDefaultPrompts, defaultPrompts } from './src/seed.js';
