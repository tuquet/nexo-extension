import LoiTuSuRaw from './seed-data/loi-tu-su.json';
import ShortScriptRaw from './seed-data/short-script.json';
import VeoScriptRaw from './seed-data/veo3-script.json';
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
/**
 * Normalize seed object to match PromptRecord expectations.
 * - Ensures preprocessing.variableDefinitions is a string (JSON stringified) when provided as object
 */
type RawPreprocessing = {
  enableVariables?: boolean;
  variableDefinitions?: unknown;
  injectContext?: boolean;
};

const normalizeSeed = (raw: unknown) => {
  const result = { ...(raw as Record<string, unknown>) } as Record<string, unknown>;
  const preprocessing = result.preprocessing as RawPreprocessing | undefined;
  if (preprocessing && typeof preprocessing.variableDefinitions !== 'string') {
    result.preprocessing = {
      ...(preprocessing as Record<string, unknown>),
      variableDefinitions: JSON.stringify(preprocessing.variableDefinitions || []),
    };
  }
  return result as Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>;
};

const ShortScript = normalizeSeed(ShortScriptRaw);
const VeoScript = normalizeSeed(VeoScriptRaw);
const LoiTuSu = normalizeSeed(LoiTuSuRaw);

export const defaultPrompts: Array<Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  ShortScript,
  VeoScript,
  LoiTuSu,
];
