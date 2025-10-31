import { decryptData, encryptData } from './secure-storage';
import { create } from 'zustand';

interface ApiKeyStore {
  apiKey: string | null;
  isLoaded: boolean; // Thêm trạng thái để biết key đã được tải từ storage chưa
  setApiKey: (k: string | null) => Promise<void>;
  isApiKeySet: () => boolean;
  loadApiKey: () => Promise<void>;
}

const useApiKey = create<ApiKeyStore>((set, get) => ({
  apiKey: null,
  isLoaded: false,
  setApiKey: async k => {
    const encryptedKey = k ? encryptData(k) : '';
    // Sử dụng chrome.storage.local để lưu trữ an toàn
    await chrome.storage.local.set({ apiKey: encryptedKey });
    set({ apiKey: k });
  },
  isApiKeySet: () => !!get().apiKey?.trim(),
  loadApiKey: async () => {
    // Chỉ tải một lần
    if (get().isLoaded) return;

    try {
      // Lấy key đã mã hóa từ chrome.storage
      const result = await chrome.storage.local.get('apiKey');
      if (result.apiKey && typeof result.apiKey === 'string') {
        const decryptedKey = decryptData(result.apiKey);
        set({ apiKey: decryptedKey, isLoaded: true });
      } else {
        set({ isLoaded: true }); // Đánh dấu đã tải xong dù không có key
      }
    } catch (error) {
      console.error('Không thể tải API key từ storage:', error);
      set({ isLoaded: true }); // Đánh dấu đã tải xong để tránh lặp lại lỗi
    }
  },
}));

export { useApiKey };
