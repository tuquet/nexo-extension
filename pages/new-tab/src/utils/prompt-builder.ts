import { SYSTEM_INSTRUCTION_SCRIPT_EN, SCRIPT_GENERATION_SCHEMA } from '@extension/shared';
import { DEFAULT_MODEL_SETTINGS } from '@extension/shared/lib/constants/ai-models';
import type { PromptRecord } from '@extension/database';
import type { GenerationFormData } from '@src/types/script-generation';

/**
 * Utility functions for prompt building and template processing
 * Extracted from components for reusability and testability
 */

/**
 * Replace template variables with values
 * @example
 * replaceVariables("Hello {{name}}!", { name: "World" }) // "Hello World!"
 */
const replaceVariables = (template: string, values: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);

/**
 * Get all variable placeholders from a template string
 * @example
 * extractVariablePlaceholders("Hello {{name}} from {{city}}!") // ["name", "city"]
 */
const extractVariablePlaceholders = (template: string): string[] => {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, m => m[1]);
};

/**
 * Validate that all required variables have values
 * Returns array of missing variable names
 */
const validateRequiredVariables = (
  template: string,
  values: Record<string, string>,
  variableDefinitions?: string,
): string[] => {
  try {
    const definitions = variableDefinitions ? JSON.parse(variableDefinitions) : [];
    const requiredVars = definitions
      .filter((def: { required?: boolean }) => def.required)
      .map((def: { name: string }) => def.name);

    // Check which required variables are missing or empty
    return requiredVars.filter((varName: string) => !values[varName]?.trim());
  } catch {
    // If no definitions, check all placeholders in template
    const placeholders = extractVariablePlaceholders(template);
    return placeholders.filter(varName => !values[varName]?.trim());
  }
};

/**
 * Build final prompt from template and variable values
 */
const buildPromptFromTemplate = (template: PromptRecord | null, variableValues: Record<string, string>): string => {
  if (!template) return '';

  let prompt = template.prompt;

  // Apply variable substitution if template has variables
  if (template.preprocessing?.enableVariables && Object.keys(variableValues).length > 0) {
    prompt = replaceVariables(template.prompt, variableValues);
  }

  return prompt;
};

/**
 * Build generation form data from template and user inputs
 */
const buildGenerationFormData = (
  template: PromptRecord,
  variableValues: Record<string, string>,
  language: 'en-US' | 'vi-VN',
): GenerationFormData => {
  const finalPrompt = buildPromptFromTemplate(template, variableValues);
  const modelSettings = template.modelSettings;

  // Replace variables in system instruction (Fix #2: Inconsistent variable replacement)
  let finalSystemInstruction = template.systemInstruction;
  if (finalSystemInstruction && template.preprocessing?.enableVariables && Object.keys(variableValues).length > 0) {
    finalSystemInstruction = replaceVariables(finalSystemInstruction, variableValues);
  }

  return {
    prompt: finalPrompt,
    language,
    scriptModel: modelSettings?.preferredModel || DEFAULT_MODEL_SETTINGS.SCRIPT_MODEL,
    temperature: modelSettings?.temperature ?? DEFAULT_MODEL_SETTINGS.TEMPERATURE,
    topP: modelSettings?.topP ?? DEFAULT_MODEL_SETTINGS.TOP_P,
    topK: modelSettings?.topK ?? DEFAULT_MODEL_SETTINGS.TOP_K,
    maxOutputTokens: modelSettings?.maxOutputTokens ?? DEFAULT_MODEL_SETTINGS.MAX_OUTPUT_TOKENS,
    systemInstruction: finalSystemInstruction,
  };
};

/**
 * Internal helper: Format prompt with consistent structure
 * Used by both clipboard and automation functions
 */
const formatPromptBlock = (prompt: string, systemInstruction: string, schema: string): string =>
  `# 🟦 SYSTEM PROMPT
${systemInstruction}

# 🟩 USER PROMPT
${prompt}

# 🟨 REQUIRED JSON OUTPUT SCHEMA ( Code Block )
${schema}`;

/**
 * Format full prompt for clipboard copy
 * Includes system instruction, user prompt, AND JSON schema guide
 * Both prompt and systemInstruction should already have variables replaced
 */
const formatFullPromptForClipboard = (
  prompt: string,
  systemInstruction: string | undefined,
  variableValues?: Record<string, string>,
): string => {
  let finalSystemInstruction = systemInstruction || SYSTEM_INSTRUCTION_SCRIPT_EN;

  // Replace variables in system instruction if provided
  if (variableValues && Object.keys(variableValues).length > 0) {
    finalSystemInstruction = replaceVariables(finalSystemInstruction, variableValues);
  }

  return formatPromptBlock(prompt, finalSystemInstruction, JSON.stringify(SCRIPT_GENERATION_SCHEMA, null, 2));
};

/**
 * Format complete prompt for AI Studio automation
 * Includes system instruction, user prompt, and JSON schema guide
 * Consistent structure with formatFullPromptForClipboard
 */
const formatPromptForAutomation = (
  prompt: string,
  systemInstruction: string | undefined,
  variableValues?: Record<string, string>,
): string => {
  let finalSystemInstruction = systemInstruction || SYSTEM_INSTRUCTION_SCRIPT_EN;

  // Replace variables in system instruction if provided (same as clipboard version)
  if (variableValues && Object.keys(variableValues).length > 0) {
    finalSystemInstruction = replaceVariables(finalSystemInstruction, variableValues);
  }

  return formatPromptBlock(prompt, finalSystemInstruction, JSON.stringify(SCRIPT_GENERATION_SCHEMA, null, 2));
};

export {
  replaceVariables,
  extractVariablePlaceholders,
  validateRequiredVariables,
  buildPromptFromTemplate,
  buildGenerationFormData,
  formatFullPromptForClipboard,
  formatPromptForAutomation,
};
