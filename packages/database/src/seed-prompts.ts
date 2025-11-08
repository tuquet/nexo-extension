import VeoScriptRaw from './seed-data/veo3-script.json';
import type { PromptRecord } from './db';

export const defaultPrompts: Array<Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  // ShortScript,
  VeoScriptRaw,
  // LoiTuSu,
];
