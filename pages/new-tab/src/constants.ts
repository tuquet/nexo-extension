import type { AspectRatio } from './types';

// Tên các model của Gemini
export const SCRIPT_GENERATION_MODEL = 'gemini-2.5-flash';
export const PLOT_SUGGESTION_MODEL = 'gemini-2.5-flash';
export const TEXT_ENHANCEMENT_MODEL = 'gemini-2.5-flash';
export const IMAGE_GENERATION_MODEL = 'gemini-1.5-flash';
export const VIDEO_GENERATION_MODEL = ''; // Không có model video tương thích

// Danh sách các model có thể lựa chọn cho việc tạo văn bản
export const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Mạnh nhất - Chi phí cao)' },
  { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Nhanh & Rẻ - Chi phí thấp)' },
];

// Danh sách các model có thể lựa chọn cho việc tạo ảnh
export const AVAILABLE_IMAGE_MODELS = [
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Chất lượng cao - Chi phí cao)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Nhanh & Tối ưu - Chi phí thấp)' },
];

// Danh sách các model có thể lựa chọn cho việc tạo video
export const AVAILABLE_VIDEO_MODELS: { value: string; label: string }[] = [];

// Danh sách các model cho Live API (tương tác thời gian thực)
export const AVAILABLE_LIVE_MODELS = [
  // Model này thường miễn phí hoặc có chi phí thấp trong giai đoạn Preview
  { value: 'gemini-2.5-flash-live', label: 'Gemini 2.5 Flash Live (Chi phí thấp - Preview)' },
  { value: 'gemini-2.5-flash-native-audio-dialog', label: 'Gemini 2.5 Native Audio (Chi phí thấp - Preview)' },
  { value: 'gemini-2.0-flash-live', label: 'Gemini 2.0 Flash Live (Miễn phí - Preview)' },
];

export const AVAILABLE_TTS_MODELS: { value: string; label: string }[] = [];

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

// Giá trị mặc định
export const DEFAULT_ASPECT_RATIO: AspectRatio = '16:9';

// Câu lệnh phủ định mặc định để cải thiện chất lượng ảnh
export const DEFAULT_IMAGE_NEGATIVE_PROMPT =
  'chữ ký, văn bản, chữ viết, watermark, logo, hai hình ảnh, màn hình chia đôi, cắt dán, diptych, triptych, không mạch lạc, biến dạng, xấu xí, chất lượng thấp, mờ, khung hình, viền';
