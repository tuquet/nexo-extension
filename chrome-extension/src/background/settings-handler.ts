import { DEFAULT_MODELS } from '../../../pages/new-tab/src/constants';
import type {
  AppSettings as MessageAppSettings,
  BaseResponse,
  GetSettingsMessage,
  SaveSettingsMessage,
} from './types/messages';

/**
 * Định nghĩa cấu trúc cho tất cả cài đặt của extension.
 * Extended version with additional fields not exposed in messages.
 */
interface AppSettings extends MessageAppSettings {
  modelSettings?: {
    scriptGeneration: string;
    plotSuggestion: string;
    imageGeneration: string;
    videoGeneration: string;
    ttsModel: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
  preferences?: {
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
    theme: 'light' | 'dark' | 'system';
  };
  apiKeys?: {
    gemini: string;
    vbee: string;
  };
}

/**
 * Các giá trị cài đặt mặc định.
 */
const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {
    gemini: '',
    vbee: '',
  },
  modelSettings: {
    scriptGeneration: DEFAULT_MODELS.scriptGeneration,
    plotSuggestion: DEFAULT_MODELS.plotSuggestion,
    imageGeneration: DEFAULT_MODELS.imageGeneration,
    videoGeneration: DEFAULT_MODELS.videoGeneration,
    ttsModel: 'n_hanoi_male_baotrungreviewphim_review_vc',
    temperature: 1.2,
    topP: 0.95,
    topK: 50,
    maxOutputTokens: 8192,
  },
  preferences: {
    aspectRatio: '16:9',
    theme: 'system',
  },
};

/**
 * Lấy tất cả cài đặt từ chrome.storage.
 */
const getSettings = async (): Promise<AppSettings> => {
  const result = await chrome.storage.local.get('app_settings');
  return {
    ...DEFAULT_SETTINGS,
    ...(result.app_settings || {}),
    apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(result.app_settings?.apiKeys || {}) },
    modelSettings: { ...DEFAULT_SETTINGS.modelSettings, ...(result.app_settings?.modelSettings || {}) },
    preferences: { ...DEFAULT_SETTINGS.preferences, ...(result.app_settings?.preferences || {}) },
  };
};

/**
 * Lưu một phần hoặc toàn bộ cài đặt vào chrome.storage.
 */
const saveSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      apiKeys: { ...currentSettings.apiKeys, ...newSettings.apiKeys },
      modelSettings: { ...currentSettings.modelSettings, ...newSettings.modelSettings },
      preferences: { ...currentSettings.preferences, ...newSettings.preferences },
    };
    await chrome.storage.local.set({ app_settings: updatedSettings });
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
};

// Các hàm xử lý sẽ được export để router gọi
export const handleGetSettings = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: GetSettingsMessage,
): Promise<BaseResponse<MessageAppSettings>> => {
  try {
    const settings = await getSettings();
    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Không thể lấy cài đặt',
        code: 'SETTINGS_ERROR',
      },
    };
  }
};

export const handleSaveSettings = async (message: SaveSettingsMessage): Promise<BaseResponse<void>> => {
  try {
    const { payload } = message;
    const success = await saveSettings(payload);
    if (success) {
      return { success: true };
    }
    throw new Error('Không thể lưu cài đặt');
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Không thể lưu cài đặt',
        code: 'SETTINGS_ERROR',
      },
    };
  }
};

export { getSettings };
