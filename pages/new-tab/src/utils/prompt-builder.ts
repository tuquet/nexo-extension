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
JSON Output Structure:
{
  "title": "Tiêu đề phim hấp dẫn",
  "alias": "tieu-de-alias-webfriendly",
  "logline": "Tóm tắt câu chuyện trong một câu",
  "genre": ["Thể loại 1", "Thể loại 2"],
  "tone": "Tông điệu tổng thể (vd: tối tăm, hài hước)",
  "themes": ["Chủ đề 1", "Chủ đề 2"],
  "notes": "Ghi chú sản xuất hoặc tầm nhìn đạo diễn",
  "setting": {
    "time": "Khoảng thời gian (vd: Hiện đại, 2075)",
    "location": "Địa điểm chính (vd: Tokyo, Mars)"
  },
  "characters": [
    {
      "name": "Tên nhân vật",
      "roleId": "protagonist/mentor/narrator (camelCase, không dấu)",
      "description": "Mô tả tính cách, ngoại hình, động lực"
    }
  ],
  "acts": [
    {
      "act_number": 1,
      "summary": "Tóm tắt các sự kiện trong hồi này",
      "scenes": [
        {
          "scene_number": 1,
          "location": "Địa điểm cụ thể",
          "time": "Day/Night",
          "action": "Mô tả hành động và sự kiện",
          "visual_style": "Phong cách thị giác (vd: High-contrast lighting)",
          "audio_style": "Phong cách âm thanh (vd: Orchestral score)",
          "dialogues": [
            {
              "roleId": "protagonist (PHẢI khớp với characters)",
              "line": "Lời thoại (CHỈ lời nói, không hành động)"
            }
          ]
        }
      ]
    }
  ]
}

⚠️ LƯU Ý QUAN TRỌNG:
1. PHẢI có nhân vật với roleId "narrator" để dẫn truyện/thuyết minh
2. Với cảnh không có lời thoại, tạo entry narrator với nội dung = action field
3. roleId trong dialogues PHẢI khớp với roleId trong mảng characters
4. Trường "line" CHỈ chứa lời nói, không có hành động hay chú thích
5. Cấu trúc 3 hồi: Hồi 1 (25%), Hồi 2 (50%), Hồi 3 (25%)
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
 */
export const getDefaultSystemInstruction = (
  language: 'en-US' | 'vi-VN',
): string => `You are a professional screenwriter. Based on the user's prompt, generate a complete and detailed movie script in ${language}.
The script must follow the three-act structure.
Ensure every field in the provided JSON schema is filled with creative, relevant, and well-written content.
The 'roleId' in dialogue must correspond to one of the character roleIds defined in the 'characters' array (e.g., 'Protagonist', 'Mentor'). Do not invent new roleIds for dialogue.
For each dialogue 'line', provide only the spoken words. Do not include parenthetical remarks, actions, or context like '(internal monologue)' or '(shouting)'.
IMPORTANT RULE: Always include a character with the roleId 'narrator' in the 'characters' list. For any scene that has no character dialogue, you MUST create a single entry in the 'dialogues' array. This entry will have the 'roleId' set to 'narrator' and the 'line' will be the exact content of the 'action' field for that scene. This ensures every scene has content for voice-over.`;

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

  return `--- SYSTEM PROMPT ---
${finalSystemInstruction}

--- USER PROMPT ---
${prompt}

--- REQUIRED JSON OUTPUT SCHEMA ---
${READABLE_SCRIPT_SCHEMA_GUIDE}`;
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

========================
USER REQUEST:
========================
${prompt}

========================
REQUIRED OUTPUT FORMAT:
========================
Trả về JSON theo cấu trúc sau:
${READABLE_SCRIPT_SCHEMA_GUIDE}

Hãy điền ĐẦY ĐỦ tất cả các trường với nội dung sáng tạo, chi tiết và phù hợp với yêu cầu!`;
};
