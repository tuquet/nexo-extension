/**
 * Lỗi cơ bản cho các vấn đề liên quan đến API.
 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Lỗi xảy ra khi có vấn đề về xác thực, thường là do API key không hợp lệ.
 */
export class ApiAuthError extends ApiError {
  constructor(message = 'Lỗi xác thực API. Vui lòng kiểm tra lại khóa API của bạn.') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/**
 * Lỗi xảy ra khi API trả về nội dung không hợp lệ hoặc bị chặn do các bộ lọc an toàn.
 */
export class ApiContentError extends ApiError {
  constructor(message = 'API đã trả về nội dung không hợp lệ hoặc đã bị chặn.') {
    super(message);
    this.name = 'ApiContentError';
  }
}
