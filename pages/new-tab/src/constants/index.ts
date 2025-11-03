import type { AspectRatio } from '../types';

// Tên các model của Gemini
export const VBEE_API_BASE_URL = 'https://vbee.vn/api/v1';
export const VBEE_PROJECT_URL = 'https://studio.vbee.vn/projects';

export const DEFAULT_MODELS = {
  scriptGeneration: 'gemini-2.5-flash',
  plotSuggestion: 'gemini-2.5-flash',
  textEnhancement: 'gemini-2.5-flash',
  imageGeneration: 'imagen-4.0-generate-001',
  videoGeneration: 'veo-3.1-fast-generate-preview',
};

// Danh sách các model có thể lựa chọn cho việc tạo văn bản
export const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Chất lượng cao)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Nhanh & Tiết kiệm)' },
];

// Danh sách các model có thể lựa chọn cho việc tạo ảnh
export const AVAILABLE_IMAGE_MODELS = [{ value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Chất lượng cao)' }];
// Danh sách các model có thể lựa chọn cho việc tạo video
export const AVAILABLE_VIDEO_MODELS: { value: string; label: string }[] = [
  { value: 'veo-3.1-fast-generate-preview', label: ' Veo 3.1 Fast Generate (Xem trước)' },
  { value: 'veo-3.0-standard-generate', label: 'Veo 3.0 Standard (Tiêu chuẩn)' },
  { value: 'veo-4.0-hq-generate', label: 'Veo 4.0 HQ (Chất lượng cao)' },
];

// Danh sách các model cho Live API (tương tác thời gian thực)
export const AVAILABLE_LIVE_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Chất lượng cao)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Nhanh & Tiết kiệm)' },
];

export const AVAILABLE_TTS_MODELS: { value: string; label: string }[] = [
  { value: 'n_hanoi_male_baotrungreviewphim_review_vc', label: 'Bảo Trung Review Phim (Nam HN)' },
  { value: 'n_hanoi_male_baotrungdoctruyen_story_vc', label: 'Bảo Trung Đọc Truyện (Nam HN)' },
  { value: 'n_backan_male_khanhdoctruyen_story_vc', label: 'Khánh Đọc Truyện (Nam HN)' },
  { value: 'n_hn_male_ngankechuyen_ytstable_vc', label: 'Ngạn Kể Chuyện (Nam HN)' },
  { value: 'n_thainguyen_male_huisheng_story_vc', label: 'Huisheng Đọc Truyện (Nam HN)' },
  { value: 'n_hn_male_duyonyx_oaistable_vc', label: 'Duyonyx Đọc Truyện (Nam HN)' },
  { value: 'n_hanoi_female_dieuanhn2_story_vc', label: 'Diệu Anh Đọc Truyện (Nữ HN)' },
  { value: 'n_hanoi_female_tranngocaudio_book_vc', label: 'Trần Ngọc Sách Nói (Nữ HN)' },
];

// Các thể loại phim được định nghĩa trước cho UI
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
];

// Các thông báo tải video trên UI
export const VIDEO_LOADING_MESSAGES = [
  'Đang tạo video, quá trình này có thể mất vài phút...',
  'Đang kết hợp các khung hình...',
  'Đang thêm hiệu ứng điện ảnh...',
  'AI đang làm việc chăm chỉ...',
  'Sắp xong rồi, vui lòng chờ...',
];

// Các thông báo tải khi tạo kịch bản
export const SCRIPT_GENERATION_LOADING_MESSAGES = [
  'AI đang phân tích ý tưởng của bạn...',
  'Đang xây dựng cấu trúc câu truyện...',
  'Phác thảo các nhân vật chính...',
  'Viết những dòng thoại đầu tiên...',
  'Sắp xếp các cảnh quay...',
  'Thêm thắt các tình tiết bất ngờ...',
  'Kiểm tra lại mạch truyện...',
];

// Giá trị mặc định
export const DEFAULT_ASPECT_RATIO: AspectRatio = '9:16';

// Câu lệnh phủ định mặc định để cải thiện chất lượng ảnh
export const DEFAULT_IMAGE_NEGATIVE_PROMPT =
  'chữ ký, văn bản, chữ viết, watermark, logo, hai hình ảnh, màn hình chia đôi, cắt dán, diptych, triptych, không mạch lạc, biến dạng, xấu xí, chất lượng thấp, mờ, khung hình, viền';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const QUERIES = {
  sm: `(max-width: ${BREAKPOINTS.sm}px)`,
  md: `(max-width: ${BREAKPOINTS.md}px)`,
  lg: `(max-width: ${BREAKPOINTS.lg}px)`,
  xl: `(max-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(max-width: ${BREAKPOINTS['2xl']}px)`,
};
