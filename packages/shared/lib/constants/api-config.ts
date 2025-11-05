/**
 * API Configuration Constants
 * External API URLs and endpoints
 */

// Vbee TTS API configuration
export const VBEE_API_BASE_URL = 'https://vbee.vn/api/v1';
export const VBEE_PROJECT_URL = 'https://studio.vbee.vn/projects';

// Image generation defaults
export const DEFAULT_IMAGE_NEGATIVE_PROMPT =
  'chữ ký, văn bản, chữ viết, watermark, logo, hai hình ảnh, màn hình chia đôi, cắt dán, diptych, triptych, không mạch lạc, biến dạng, xấu xí, chất lượng thấp, mờ, khung hình, viền';

// Default aspect ratio for media generation
export const DEFAULT_ASPECT_RATIO = '9:16' as const;
