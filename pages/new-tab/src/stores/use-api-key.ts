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
    try {
      // Save to app_settings structure to match background handler
      const result = await chrome.storage.local.get('app_settings');
      const appSettings = result.app_settings || {};
      const updatedSettings = {
        ...appSettings,
        apiKeys: {
          ...(appSettings.apiKeys || {}),
          gemini: k || '',
          vbee: appSettings.apiKeys?.vbee || '',
        },
      };
      await chrome.storage.local.set({ app_settings: updatedSettings });
      set({ apiKey: k });
    } catch (error) {
      console.error('Không thể lưu API key:', error);
    }
  },
  isApiKeySet: () => !!get().apiKey?.trim(),
  loadApiKey: async () => {
    // Chỉ tải một lần
    if (get().isLoaded) return;

    try {
      // Load from app_settings structure
      const result = await chrome.storage.local.get('app_settings');
      if (result.app_settings?.apiKeys?.gemini) {
        set({ apiKey: result.app_settings.apiKeys.gemini, isLoaded: true });
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
