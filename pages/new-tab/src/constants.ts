import type { AspectRatio } from './types';

// Tên các model của Gemini
export const SCRIPT_GENERATION_MODEL = 'gemini-2.5-pro';
export const PLOT_SUGGESTION_MODEL = 'gemini-2.5-flash';
export const TEXT_ENHANCEMENT_MODEL = 'gemini-2.5-flash';
export const IMAGE_GENERATION_MODEL = 'imagen-4.0-generate-001';
export const VIDEO_GENERATION_MODEL = 'veo-3.1-fast-generate-preview';

// Các thể loại phim được định nghĩa trước cho UI
export const PREDEFINED_GENRES = [
  'Hành động',
  'Phiêu lưu',
  'Hoạt hình',
  'Hài',
  'Tội phạm',
  'Tài liệu',
  'Chính kịch',
  'Gia đình',
  'Giả tưởng',
  'Lịch sử',
  'Kinh dị',
  'Nhạc kịch',
  'Huyền bí',
  'Lãng mạn',
  'Khoa học viễn tưởng',
  'Giật gân',
  'Chiến tranh',
  'Viễn Tây',
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
