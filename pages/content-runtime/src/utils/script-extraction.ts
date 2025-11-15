/**
 * Shared utilities for script JSON extraction and validation
 * Used by both AI Studio and Gemini Web content scripts
 */

import type { ContentDebugLogger } from './content-debug-logger';

/**
 * Clean up JSON string (minimal processing to avoid breaking valid JSON)
 */
export const cleanupJSON = (jsonString: string): string => {
  let cleaned = jsonString.trim();

  // --- Robust Markdown code block removal (from doc) ---
  const markdownStart = '```';
  const markdownEnd = '```';
  if (cleaned.startsWith(markdownStart) && cleaned.endsWith(markdownEnd)) {
    cleaned = cleaned.substring(3, cleaned.length - 3).trim();
    // Remove language keyword if present
    const possibleLangKeyword = cleaned.split(/\s/, 1)[0].toLowerCase();
    if (
      possibleLangKeyword.length > 1 &&
      possibleLangKeyword.length < 15 &&
      ['json', 'javascript', 'js'].includes(possibleLangKeyword)
    ) {
      cleaned = cleaned.substring(possibleLangKeyword.length).trim();
    }
  }

  // 1. Remove zero-width spaces AND control characters (CRITICAL - backspace breaks JSON)
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  cleaned = cleaned.replace(/[\b]/g, ''); // Backspace characters (literal \b)
  // eslint-disable-next-line no-control-regex
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); // Other control chars (except \t, \n, \r)

  // 2. Fix single-quote string delimiters to double-quote (CRITICAL - do this FIRST)
  // Handle cases like: "description": "text...'  => "description": "text..."
  // Pattern: "key": "...text...'<end>  where <end> is comma, brace, bracket, or newline
  cleaned = cleaned.replace(
    /("[^"]+"\s*:\s*")([^"]*?)(')(\s*[,}\]\n]|$)/g,
    (match, prefix, content, quote, suffix) => `${prefix}${content}"${suffix}`,
  );

  // Handle full single-quote strings: "key": 'value'  => "key": "value"
  cleaned = cleaned.replace(/("[^"]+"\s*:)\s*'([^']*)'/g, '$1 "$2"');

  // 3. Remove all // ... style comments (single-line)
  // Remove // comments at line start or after whitespace, but not in URLs (e.g., http://)
  cleaned = cleaned.replace(/(^|[^:])\/\/.*$/gm, '$1');

  // 4. Escape control characters in string values (newlines, tabs, etc)
  // Note: Backspace (\b) is removed in step 1, not escaped here
  cleaned = cleaned.replace(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g, (match, key, value) => {
    const escapedValue = value.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\f/g, '\\f');
    return `"${key}": "${escapedValue}"`;
  });

  // 5. Fix unescaped nested quotes in string values (convert to single quotes)
  cleaned = cleaned.replace(/"([^"]+)"\s*:\s*"([^"]*"[^"]*(?:"[^"]*)*?)"/g, (match, key, value) => {
    const fixedValue = value.replace(/"/g, "'");
    return `"${key}": "${fixedValue}"`;
  });

  // 6. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  return cleaned.trim();
};

/**
 * Extract JSON from AI response element
 * Handles multiple formats: code blocks, markdown, plain text
 *
 * Strategy (in order):
 * 1. Try code blocks first (most reliable)
 * 2. Remove markdown artifacts (```, ```json)
 * 3. Extract balanced JSON object (proper { } nesting)
 * 4. Fallback to regex match
 */
export const extractJSON = (responseElement: HTMLElement, debugLogger: ContentDebugLogger): string => {
  console.log('[Script Extraction] Extracting JSON from response...');
  debugLogger.debug('Starting JSON extraction');

  let text = responseElement.textContent || '';

  // Strategy 1: Try code blocks first (most reliable)
  const codeBlocks = responseElement.querySelectorAll('code, pre');
  if (codeBlocks.length > 0) {
    for (const block of Array.from(codeBlocks)) {
      const blockText = block.textContent || '';

      // Must contain script structure
      if (blockText.includes('"title"') && blockText.includes('"acts"')) {
        console.log('[Script Extraction] Found JSON in code block');
        debugLogger.info('JSON found in code block', { length: blockText.length });
        text = blockText;
        break;
      }
    }
  }

  // Strategy 2: Remove markdown artifacts
  text = text.replace(/```json\s*/gi, '');
  text = text.replace(/```javascript\s*/gi, '');
  text = text.replace(/```\s*$/gi, '');
  text = text.replace(/```/g, '');

  // Strategy 3: Extract balanced JSON object with proper nesting
  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        endIndex = i + 1;
        break; // Found complete JSON object
      }
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    const extracted = text.substring(startIndex, endIndex);
    console.log('[Script Extraction] JSON extracted with balanced braces');
    debugLogger.info('JSON extracted', {
      startIndex,
      endIndex,
      length: extracted.length,
    });

    // Clean up before returning
    debugLogger.info('[Script Extraction]', extracted);
    const cleaned = cleanupJSON(extracted);
    debugLogger.debug('JSON cleaned', { originalLength: extracted.length, cleanedLength: cleaned.length });
    return cleaned;
  }

  // Strategy 4: Fallback - simple regex match
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    console.log('[Script Extraction] JSON extracted with regex fallback');
    debugLogger.warn('Using regex fallback for JSON extraction');
    return cleanupJSON(jsonMatch[0]);
  }

  console.error('[Script Extraction] Failed to extract JSON');
  debugLogger.error('JSON extraction failed', { textLength: text.length });
  return text.trim();
};

/**
 * Validate JSON structure for script
 * Enhanced with detailed error logging and debug info
 */
export const validateScriptJSON = (jsonString: string, debugLogger: ContentDebugLogger): boolean => {
  try {
    console.log('[Script Extraction] Validating JSON structure...');
    debugLogger.debug('Starting JSON validation', {
      length: jsonString.length,
      preview: jsonString.substring(0, 100),
    });

    const parsed = JSON.parse(jsonString);

    // Check required fields
    const requiredFields = ['title', 'logline', 'acts', 'characters'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        console.error(`[Script Extraction] Missing required field: ${field}`);
        debugLogger.error('Validation failed: missing field', { field, availableFields: Object.keys(parsed) });
        return false;
      }
    }

    // Check acts structure
    if (!Array.isArray(parsed.acts) || parsed.acts.length === 0) {
      console.error('[Script Extraction] Invalid acts structure');
      debugLogger.error('Validation failed: invalid acts', {
        isArray: Array.isArray(parsed.acts),
        length: parsed.acts?.length,
      });
      return false;
    }

    // Check characters array
    if (!Array.isArray(parsed.characters) || parsed.characters.length === 0) {
      console.error('[Script Extraction] Invalid characters structure');
      debugLogger.error('Validation failed: invalid characters', {
        isArray: Array.isArray(parsed.characters),
        length: parsed.characters?.length,
      });
      return false;
    }

    console.log('[Script Extraction] ✓ JSON validation passed');
    debugLogger.info('JSON validation passed', {
      title: parsed.title,
      acts: parsed.acts.length,
      characters: parsed.characters.length,
    });
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Script Extraction] JSON parse error:', error);

    // Extract position from error message for precise debugging
    const position = error instanceof SyntaxError ? extractErrorPosition(errorMsg) : null;

    debugLogger.error('JSON parse error', {
      error: errorMsg,
      jsonPreview: jsonString.substring(0, 200),
      position,
    });

    // Show problematic JSON snippet for debugging
    if (position !== null) {
      const start = Math.max(0, position - 50);
      const end = Math.min(jsonString.length, position + 50);
      const snippet = jsonString.substring(start, end);
      console.error('[Script Extraction] Error near position', position, ':', snippet);
      debugLogger.error('JSON error snippet', { position, snippet });
    }

    return false;
  }
};

/**
 * Extract position from JSON parse error message
 */
export const extractErrorPosition = (errorMessage: string): number | null => {
  const match = errorMessage.match(/position (\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
};

/**
 * Save generated script via background service worker
 */
export const saveScriptToDatabase = async (scriptJSON: string, debugLogger: ContentDebugLogger): Promise<void> => {
  console.log('[Script Extraction] Saving script to database...');
  debugLogger.info('Saving script to database');

  const response = await chrome.runtime.sendMessage({
    type: 'SAVE_GENERATED_SCRIPT',
    payload: { scriptJSON },
  });

  if (response && response.success) {
    console.log('[Script Extraction] ✅ Script saved successfully!');
    debugLogger.info('Script saved successfully', { scriptId: response.scriptId });
  } else {
    console.error('[Script Extraction] ❌ Failed to save script');
    debugLogger.error('Failed to save script', { response });
    throw new Error('Failed to save script to database');
  }
};
