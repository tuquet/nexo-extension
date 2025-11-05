/**
 * AI Model Constants
 * Centralized definitions for all AI models and their configurations
 */

// Model default selections
export const DEFAULT_MODELS = {
  scriptGeneration: 'gemini-2.5-flash',
  plotSuggestion: 'gemini-2.5-flash',
  textEnhancement: 'gemini-2.5-flash',
  imageGeneration: 'gemini-2.5-flash-image',
  videoGeneration: 'veo-3.1-fast-generate-preview',
} as const;

// Available text generation models
export const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Chất lượng cao)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Nhanh & Tiết kiệm)' },
] as const;

// Available image generation models
export const AVAILABLE_IMAGE_MODELS = [
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Chất lượng cao)' },
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (Nhanh & Tiết kiệm)' },
] as const;

// Available video generation models
export const AVAILABLE_VIDEO_MODELS = [
  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast Generate (Xem trước)' },
  { value: 'veo-3.0-standard-generate', label: 'Veo 3.0 Standard (Tiêu chuẩn)' },
  { value: 'veo-4.0-hq-generate', label: 'Veo 4.0 HQ (Chất lượng cao)' },
] as const;

// Available TTS models
export const AVAILABLE_TTS_MODELS = [
  { value: 'n_hanoi_male_baotrungreviewphim_review_vc', label: 'Bảo Trung Review Phim (Nam HN)' },
  { value: 'n_hanoi_male_baotrungdoctruyen_story_vc', label: 'Bảo Trung Đọc Truyện (Nam HN)' },
  { value: 'n_backan_male_khanhdoctruyen_story_vc', label: 'Khánh Đọc Truyện (Nam HN)' },
  { value: 'n_hn_male_ngankechuyen_ytstable_vc', label: 'Ngạn Kể Chuyện (Nam HN)' },
  { value: 'n_thainguyen_male_huisheng_story_vc', label: 'Huisheng Đọc Truyện (Nam HN)' },
  { value: 'n_hn_male_duyonyx_oaistable_vc', label: 'Duyonyx Đọc Truyện (Nam HN)' },
  { value: 'n_hanoi_female_dieuanhn2_story_vc', label: 'Diệu Anh Đọc Truyện (Nữ HN)' },
  { value: 'n_hanoi_female_tranngocaudio_book_vc', label: 'Trần Ngọc Sách Nói (Nữ HN)' },
] as const;

// Model settings defaults
export const DEFAULT_MODEL_SETTINGS = {
  SCRIPT_MODEL: 'gemini-2.5-flash',
  TEMPERATURE: 1.0,
  TOP_P: 0.95,
  TOP_K: 40,
  MAX_OUTPUT_TOKENS: 8192,
} as const;
