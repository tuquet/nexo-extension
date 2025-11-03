/**
 * Validates dialogue lines to ensure they don't contain stage directions
 * that would interfere with TTS (Text-to-Speech) generation.
 *
 * Stage directions are typically indicated by:
 * - Parentheses: (shouting), (whispers), (internal monologue)
 * - Square brackets: [action], [pause]
 * - Asterisks: *sighs*, *laughs*
 */

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

/**
 * Checks if a dialogue line contains stage directions or action descriptions.
 * Returns validation result with warnings.
 */
export const validateDialogueLine = (line: string): ValidationResult => {
  const warnings: string[] = [];

  // Check for parentheses (most common stage direction format)
  if (/\([^)]+\)/.test(line)) {
    warnings.push('Lời thoại chứa chú thích trong ngoặc đơn (ảnh hưởng TTS)');
  }

  // Check for square brackets
  if (/\[[^\]]+\]/.test(line)) {
    warnings.push('Lời thoại chứa chú thích trong ngoặc vuông (ảnh hưởng TTS)');
  }

  // Check for asterisks (common for actions like *sighs*, *laughs*)
  if (/\*[^*]+\*/.test(line)) {
    warnings.push('Lời thoại chứa hành động đánh dấu bằng dấu * (ảnh hưởng TTS)');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
};

/**
 * Strips stage directions from a dialogue line.
 * This is a best-effort cleanup that removes common patterns.
 */
export const stripStageDirections = (line: string): string => {
  let cleaned = line;

  // Remove content in parentheses
  cleaned = cleaned.replace(/\([^)]+\)/g, '');

  // Remove content in square brackets
  cleaned = cleaned.replace(/\[[^\]]+\]/g, '');

  // Remove content between asterisks
  cleaned = cleaned.replace(/\*[^*]+\*/g, '');

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};
