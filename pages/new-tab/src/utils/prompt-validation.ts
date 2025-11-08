/**
 * Prompt validation utilities
 * Extracted for reusability and testing
 */

import type { PromptFormData } from '@src/components/prompts/prompt-form';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const VALID_CATEGORIES = [
  'script-generation',
  'image-generation',
  'video-generation',
  'character-dev',
  'general',
] as const;

type ValidCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Validate prompt data object
 */
const validatePromptData = (data: Partial<PromptFormData>): ValidationResult => {
  if (!data.title || !data.title.trim()) {
    return { isValid: false, error: 'Field "title" is required' };
  }

  if (!data.category) {
    return { isValid: false, error: 'Field "category" is required' };
  }

  if (!data.prompt || !data.prompt.trim()) {
    return { isValid: false, error: 'Field "prompt" is required' };
  }

  if (!VALID_CATEGORIES.includes(data.category as ValidCategory)) {
    return {
      isValid: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate and parse JSON string
 */
const validatePromptJSON = (jsonString: string): ValidationResult & { data?: PromptFormData } => {
  try {
    const parsed = JSON.parse(jsonString) as PromptFormData;
    const validation = validatePromptData(parsed);

    if (!validation.isValid) {
      return validation;
    }

    return { isValid: true, data: parsed };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    };
  }
};

export { validatePromptData, validatePromptJSON, VALID_CATEGORIES };
export type { ValidationResult, ValidCategory };
