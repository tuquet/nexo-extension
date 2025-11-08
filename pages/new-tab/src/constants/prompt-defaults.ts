/**
 * Default prompt template and constants
 * Centralized configuration for prompt creation
 */

import type { PromptRecord } from '@src/db';

export const DEFAULT_PROMPT_TEMPLATE: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'New Prompt',
  category: 'general',
  prompt: 'Your prompt template here...',
  description: '',
  tags: [],
  icon: '💡',
  systemInstruction: '',
  outputFormat: 'json-structured',
  modelSettings: {
    preferredModel: 'gemini-2.5-flash',
    temperature: 1.0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
  preprocessing: {
    enableVariables: false,
    variableDefinitions: [],
    injectContext: false,
  },
  postprocessing: {
    steps: ['trim', 'parse-json'],
  },
};

export const MODEL_DEFAULTS = {
  PREFERRED_MODEL: 'gemini-2.5-flash',
  TEMPERATURE: 1.0,
  TOP_P: 0.95,
  TOP_K: 40,
  MAX_OUTPUT_TOKENS: 8192,
} as const;

export const OUTPUT_FORMATS = ['json-structured', 'json-free', 'text', 'markdown'] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];
