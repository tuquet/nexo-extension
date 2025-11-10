/**
 * Scene Validation Utility
 * Validates scene JSON structure for DualModeEditor
 */

import type { Scene } from '@src/types';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: Partial<Scene>;
}

/**
 * Validates scene JSON string
 * Checks required fields: scene_number, location, time, action, visual_style, audio_style, dialogues
 */
const validateSceneJSON = (jsonString: string): ValidationResult => {
  try {
    const parsed = JSON.parse(jsonString) as Partial<Scene>;

    // Check required fields
    if (typeof parsed.scene_number !== 'number') {
      return { isValid: false, error: 'Field "scene_number" must be a number' };
    }

    if (typeof parsed.time !== 'string') {
      return { isValid: false, error: 'Field "time" is required and must be a string' };
    }

    if (typeof parsed.location !== 'string') {
      return { isValid: false, error: 'Field "location" is required and must be a string' };
    }

    if (typeof parsed.action !== 'string') {
      return { isValid: false, error: 'Field "action" is required and must be a string' };
    }

    if (typeof parsed.visual_style !== 'string') {
      return { isValid: false, error: 'Field "visual_style" is required and must be a string' };
    }

    if (typeof parsed.audio_style !== 'string') {
      return { isValid: false, error: 'Field "audio_style" is required and must be a string' };
    }

    // Validate dialogues array
    if (!Array.isArray(parsed.dialogues)) {
      return { isValid: false, error: 'Field "dialogues" must be an array' };
    }

    // Validate each dialogue
    for (const dialogue of parsed.dialogues) {
      if (!dialogue.roleId || typeof dialogue.roleId !== 'string') {
        return { isValid: false, error: 'Each dialogue must have a "roleId" (string)' };
      }

      if (typeof dialogue.line !== 'string') {
        return { isValid: false, error: 'Each dialogue must have a "line" (string)' };
      }

      // Check roleId format (camelCase, no accents, no spaces)
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(dialogue.roleId)) {
        return {
          isValid: false,
          error: `Invalid roleId "${dialogue.roleId}". Must be camelCase (no spaces, accents, or special chars)`,
        };
      }
    }

    return { isValid: true, data: parsed };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

export { validateSceneJSON };
export type { ValidationResult };
