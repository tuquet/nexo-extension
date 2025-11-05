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
