import LongPhilosophy from './seed-data/prompt/LongPhilosophy.json';
import ShortTeacherStudentDialogue from './seed-data/prompt/ShortTeacherStudentDialogue.json';
import type { PromptRecord } from './db';

export const defaultPrompts: Array<Omit<PromptRecord, 'createdAt' | 'updatedAt'>> = [
  ShortTeacherStudentDialogue,
  LongPhilosophy,
];
