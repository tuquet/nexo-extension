/**
 * UI Constants
 * Predefined options for UI components (genres, loading messages, etc.)
 */

// Predefined genres for script generation
export const PREDEFINED_GENRES = [
  { label: 'Hành động', value: 'Action' },
  { label: 'Phiêu lưu', value: 'Adventure' },
  { label: 'Hoạt hình', value: 'Animation' },
  { label: 'Hài', value: 'Comedy' },
  { label: 'Tội phạm', value: 'Crime' },
  { label: 'Tài liệu', value: 'Documentary' },
  { label: 'Chính kịch', value: 'Drama' },
  { label: 'Gia đình', value: 'Family' },
  { label: 'Giả tưởng', value: 'Fantasy' },
  { label: 'Lịch sử', value: 'History' },
  { label: 'Kinh dị', value: 'Horror' },
  { label: 'Nhạc kịch', value: 'Musical' },
  { label: 'Huyền bí', value: 'Mystery' },
  { label: 'Lãng mạn', value: 'Romance' },
  { label: 'Khoa học viễn tưởng', value: 'Sci-Fi' },
  { label: 'Giật gân', value: 'Thriller' },
  { label: 'Chiến tranh', value: 'War' },
  { label: 'Viễn Tây', value: 'Western' },
  { label: 'Đối thoại Giác ngộ', value: 'Enlightenment Dialogue' },
  { label: 'Cuộc trò chuyện của Thiền sư', value: "Zen Master's Dialogue" },
] as const;

// Video generation loading messages
export const VIDEO_LOADING_MESSAGES = [
  'Đang tạo video, quá trình này có thể mất vài phút...',
  'Đang kết hợp các khung hình...',
  'Đang thêm hiệu ứng điện ảnh...',
  'AI đang làm việc chăm chỉ...',
  'Sắp xong rồi, vui lòng chờ...',
] as const;

// Script generation loading messages
export const SCRIPT_GENERATION_LOADING_MESSAGES = [
  'AI đang phân tích ý tưởng của bạn...',
  'Đang xây dựng cấu trúc câu truyện...',
  'Phác thảo các nhân vật chính...',
  'Viết những dòng thoại đầu tiên...',
  'Sắp xếp các cảnh quay...',
  'Thêm thắt các tình tiết bất ngờ...',
  'Kiểm tra lại mạch truyện...',
] as const;

// Form storage keys for script generation
export const FORM_STORAGE_KEYS = {
  SCRIPT_CREATION: 'creationFormData',
  LANGUAGE: 'creationFormData_language',
  SCRIPT_LENGTH: 'creationFormData_scriptLength',
  LOGLINE: 'creationFormData_logline',
  GENRES: 'creationFormData_genres',
  SUGGESTION_MODEL: 'creationFormData_suggestionModel',
  RAW_PROMPT: 'creationFormData_rawPrompt',
  PLATFORM: 'creationFormData_platform',
} as const;

// Error messages for user-facing errors
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

// Success messages for user-facing confirmations
export const SUCCESS_MESSAGES = {
  SCRIPT_CREATED: 'Script created successfully!',
  SCRIPT_IMPORTED: 'Script imported successfully!',
  FILE_IMPORTED: 'File imported successfully!',
  PROMPT_COPIED: 'Prompt copied to clipboard!',
  SIDE_PANEL_OPENED: 'Side panel opened',
  SIDE_PANEL_DESCRIPTION: 'Prompt has been pre-filled, you can edit and submit',
} as const;

// Automation storage constants
export const AUTOMATE_STORAGE_KEY = 'automatePromptData' as const;
export const AUTOMATE_DATA_TTL = 10000; // 10 seconds
