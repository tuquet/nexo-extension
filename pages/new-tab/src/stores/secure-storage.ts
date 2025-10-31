import CryptoJS from 'crypto-js';

// CẢNH BÁO BẢO MẬT:
// Khóa này được lưu trữ trong mã nguồn phía client. Mặc dù nó cung cấp một lớp
// bảo vệ chống lại việc đọc trực tiếp từ bộ nhớ, nó không thể bảo vệ hoàn toàn
// khỏi một kẻ tấn công có chủ đích và kỹ năng.
// Đây là một biện pháp "xáo trộn" (obfuscation) chứ không phải là bảo mật tuyệt đối.
// KHÔNG BAO GIỜ sử dụng phương pháp này cho dữ liệu cực kỳ nhạy cảm ở phía máy chủ.
const SECRET_KEY =
  process.env.NODE_ENV === 'production' ? 'prod-!@#$-cinegenie-secret-key-!@#$' : 'dev-cinegenie-secret-key';

export const encryptData = (data: string): string => {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.error('Lỗi giải mã dữ liệu:', error);
    return ''; // Trả về chuỗi rỗng nếu giải mã thất bại
  }
};
