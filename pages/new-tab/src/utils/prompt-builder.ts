import { getSystemInstruction } from '@extension/shared';
import { DEFAULT_MODEL_SETTINGS } from '@src/constants/script-generation';
import type { PromptRecord } from '@extension/database';
import type { GenerationFormData } from '@src/types/script-generation';

/**
 * Utility functions for prompt building and template processing
 * Extracted from components for reusability and testability
 */

/**
 * Readable JSON schema structure for script generation
 * Simplified version for user guidance (not the actual API schema)
 */
const READABLE_SCRIPT_SCHEMA_GUIDE = `
{
  "title": "YOUTUBE VIDEO TITLE (Must contain main keyword + be compelling) - [Max 60 characters for best display]",
  "alias": "url-webfriendly-alias-with-keywords", // Slug URL/File Name: KEYWORD ONLY, no spaces, hyphenated (e.g., 'best-horror-film-explained')
  "logline": "STORY SUMMARY (Use target keywords, answer 'Why watch this?') - This will serve as the short video description.",
  "genre": ["Genre 1", "Genre 2"],
  "tone": "Overall tone (e.g., dark, comedic, epic)",
  "themes": ["Theme 1", "Theme 2"],
  "notes": "Production notes or directorial vision",
  "setting": {
    "time": "Time period (e.g., Modern day, 2075, WWII)",
    "location": "Main location (e.g., Tokyo, Mars, Remote Cabin)"
  },
  "characters": [
    {
      "name": "Character Name",
      "roleId": "unique-role-id (camelCase, no accents)", // Revised for flexibility (e.g., theDetective, mentorBob)
      "description": "Description of personality, appearance, motivation"
    }
  ],
  "acts": [
    {
      "act_number": 1,
      "summary": "Summary of events in this act",
      "scenes": [
        {
          "scene_number": 1,
          "location": "Specific location (INT. OFFICE / EXT. STREET)",
          "time": "Day/Night",
          "action": "Description of actions and events",
          "visual_style": "Visual style (e.g., High-contrast lighting, handheld camera)",
          "audio_style": "Audio style (e.g., Orchestral score, ambient street noise)",
          "dialogues": [
            {
              "roleId": "unique-role-id (MUST match characters)", // Must match the unique roleId defined above
              "line": "Dialogue (ONLY spoken words, no actions or parentheticals)"
            }
          ]
        }
      ]
    }
  ]
}

⚠️ IMPORTANT NOTES FOR YOUTUBE SEO:
1. TITLE: Must be highly engaging (mildly clickbait) and contain the main target keyword near the beginning.
2. ALIAS: Must be the URL-friendly version of the Title (e.g., 'best-horror-film-explained').
3. LOGLINE: Should be the opening lines of the video Description, using target keywords (e.g., 'sci-fi film,' 'emotional story') to signal content relevance to YouTube.
4. NARRATOR ROLE ID: A character with the roleId **"narrator"** is still a MUST for system-driven narration/voiceover.
5. roleId in dialogues MUST match roleId in the characters array.
6. The "line" field ONLY contains spoken words, no actions or parentheticals.
7. 3-Act structure: Act 1 (approx. 25%), Act 2 (approx. 50%), Act 3 (approx. 25%).
`;

/**
 * Replace template variables with values
 * @example
 * replaceVariables("Hello {{name}}!", { name: "World" }) // "Hello World!"
 */
export const replaceVariables = (template: string, values: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);

/**
 * Get all variable placeholders from a template string
 * @example
 * extractVariablePlaceholders("Hello {{name}} from {{city}}!") // ["name", "city"]
 */
export const extractVariablePlaceholders = (template: string): string[] => {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, m => m[1]);
};

/**
 * Validate that all required variables have values
 * Returns array of missing variable names
 */
export const validateRequiredVariables = (
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
export const buildPromptFromTemplate = (
  template: PromptRecord | null,
  variableValues: Record<string, string>,
): string => {
  if (!template) return '';

  let prompt = template.prompt;

  // Apply variable substitution if template has variables
  if (template.preprocessing?.enableVariables && Object.keys(variableValues).length > 0) {
    prompt = replaceVariables(template.prompt, variableValues);
  }

  return prompt;
};

/**
 * Get default system instruction for script generation
 * @deprecated Use getSystemInstruction from @extension/shared instead
 */
export const getDefaultSystemInstruction = getSystemInstruction;

/**
 * Build generation form data from template and user inputs
 */
export const buildGenerationFormData = (
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
 * Format full prompt for clipboard copy
 * Includes system instruction, user prompt, AND JSON schema guide
 * Both prompt and systemInstruction should already have variables replaced
 */
export const formatFullPromptForClipboard = (
  prompt: string,
  systemInstruction: string | undefined,
  language: 'en-US' | 'vi-VN',
  variableValues?: Record<string, string>,
): string => {
  let finalSystemInstruction = systemInstruction || getDefaultSystemInstruction(language);

  // Replace variables in system instruction if provided
  if (variableValues && Object.keys(variableValues).length > 0) {
    finalSystemInstruction = replaceVariables(finalSystemInstruction, variableValues);
  }

  return `# 🟦 SYSTEM PROMPT\n\n\`\`\`\n${finalSystemInstruction}\n\`\`\`\n\n# 🟩 USER PROMPT\n\n\`\`\`\n${prompt}\n\`\`\`\n\n# 🟨 REQUIRED JSON OUTPUT SCHEMA\n\n\`\`\`json\n${READABLE_SCRIPT_SCHEMA_GUIDE.trim()}\n\`\`\``;
};

/**
 * Format complete prompt for AI Studio automation
 * Includes system instruction, user prompt, and JSON schema guide
 */
export const formatPromptForAutomation = (
  prompt: string,
  systemInstruction: string | undefined,
  language: 'en-US' | 'vi-VN',
): string => {
  const finalSystemInstruction = systemInstruction || getDefaultSystemInstruction(language);

  return `${finalSystemInstruction}

USER REQUEST:
${prompt}

OUTPUT FORMAT - Return ONLY this JSON structure (no markdown, no explanations):
${READABLE_SCRIPT_SCHEMA_GUIDE.trim()}`;
};
