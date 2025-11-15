/**
 * Prompt validation utilities
 * Extracted for reusability and testing
 */

import type { PromptFormData } from '@src/components/prompts/prompt-form';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

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

export { validatePromptData, validatePromptJSON };
export type { ValidationResult };
