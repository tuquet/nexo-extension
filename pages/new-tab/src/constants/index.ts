/**
 * DEPRECATED: All constants have been moved to @extension/shared
 * This file is kept for legacy re-exports only
 *
 * DO NOT add new constants here - use @extension/shared instead:
 * - @extension/shared/lib/constants/ai-models
 * - @extension/shared/lib/constants/api-config
 * - @extension/shared/lib/constants/ui-options
 * - @extension/shared/lib/constants/responsive
 */

// Re-export from shared for backward compatibility
export {
  DEFAULT_MODELS,
  AVAILABLE_TEXT_MODELS,
  AVAILABLE_IMAGE_MODELS,
  AVAILABLE_VIDEO_MODELS,
  AVAILABLE_TTS_MODELS,
} from '@extension/shared/lib/constants/ai-models';

export {
  VBEE_API_BASE_URL,
  VBEE_PROJECT_URL,
  DEFAULT_IMAGE_NEGATIVE_PROMPT,
  DEFAULT_ASPECT_RATIO,
} from '@extension/shared/lib/constants/api-config';

export {
  PREDEFINED_GENRES,
  VIDEO_LOADING_MESSAGES,
  SCRIPT_GENERATION_LOADING_MESSAGES,
} from '@extension/shared/lib/constants/ui-options';

export { BREAKPOINTS, QUERIES } from '@extension/shared/lib/constants/responsive';
