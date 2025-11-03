/**
 * Centralized constants for script generation
 * Avoids magic strings and enables easy i18n migration
 */

export const FORM_STORAGE_KEYS = {
  SCRIPT_CREATION: 'creationFormData',
  LANGUAGE: 'creationFormData_language',
  SCRIPT_LENGTH: 'creationFormData_scriptLength',
  LOGLINE: 'creationFormData_logline',
  GENRES: 'creationFormData_genres',
  SUGGESTION_MODEL: 'creationFormData_suggestionModel',
  RAW_PROMPT: 'creationFormData_rawPrompt',
} as const;

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'API key is not set. Please configure it in settings.',
  WINDOW_NOT_FOUND: 'Cannot open side panel - current window not found',
  SIDE_PANEL_FAILED: 'Failed to open side panel',
  GENERATION_FAILED: 'Failed to generate script',
  IMPORT_FAILED: 'Failed to import script',
  INVALID_JSON: 'Invalid JSON content. Please check and try again.',
  EMPTY_PROMPT: 'Please enter a summary or main idea to create script',
  TEMPLATE_REQUIRED: 'Please select a template from the library above',
  GENERIC: 'An unexpected error occurred',
} as const;

export const SUCCESS_MESSAGES = {
  SCRIPT_CREATED: 'Script created successfully!',
  SCRIPT_IMPORTED: 'Script imported successfully!',
  FILE_IMPORTED: 'File imported successfully!',
  PROMPT_COPIED: 'Prompt copied to clipboard!',
  SIDE_PANEL_OPENED: 'Side panel opened',
  SIDE_PANEL_DESCRIPTION: 'Prompt has been pre-filled, you can edit and submit',
} as const;

export const DEFAULT_MODEL_SETTINGS = {
  SCRIPT_MODEL: 'gemini-2.5-flash',
  TEMPERATURE: 1.0,
  TOP_P: 0.95,
  TOP_K: 40,
  MAX_OUTPUT_TOKENS: 8192,
} as const;

export const AUTOMATE_STORAGE_KEY = 'automatePromptData' as const;
export const AUTOMATE_DATA_TTL = 10000; // 10 seconds
