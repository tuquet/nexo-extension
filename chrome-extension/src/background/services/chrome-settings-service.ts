import { DEFAULT_MODELS } from '../../../../pages/new-tab/src/constants';
import type { AppSettings, ISettingsService } from '../core/interfaces';

/**
 * Default application settings
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
 * ChromeSettingsService - Encapsulates chrome.storage.local operations
 *
 * Implements ISettingsService interface for dependency injection.
 * Provides clean abstraction over Chrome storage API with type safety.
 *
 * @example
 * ```typescript
 * const service = new ChromeSettingsService();
 * const apiKey = await service.get('apiKeys.gemini');
 * await service.set('apiKeys.gemini', 'new-key');
 * ```
 */
export class ChromeSettingsService implements ISettingsService {
  private readonly STORAGE_KEY = 'app_settings';

  /**
   * Get specific setting value
   *
   * @param key Dot-notation path to setting (e.g., 'apiKeys.gemini')
   * @returns Setting value or undefined if not found
   */
  async get<T>(key: string): Promise<T | undefined> {
    const allSettings = await this.getAll();
    return this.getNestedValue(allSettings, key) as T | undefined;
  }

  /**
   * Set specific setting value
   *
   * @param key Dot-notation path to setting
   * @param value Value to set
   */
  async set<T>(key: string, value: T): Promise<void> {
    const currentSettings = await this.getAll();
    const updatedSettings = this.setNestedValue(currentSettings as Record<string, unknown>, key, value) as AppSettings;
    await chrome.storage.local.set({ [this.STORAGE_KEY]: updatedSettings });
  }

  /**
   * Get all application settings with defaults merged
   *
   * @returns Complete AppSettings object
   */
  async getAll(): Promise<AppSettings> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    const stored = result[this.STORAGE_KEY] || {};

    // Deep merge with defaults
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(stored.apiKeys || {}) },
      modelSettings: { ...DEFAULT_SETTINGS.modelSettings, ...(stored.modelSettings || {}) },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...(stored.preferences || {}) },
    };
  }

  /**
   * Save partial or complete settings
   *
   * @param settings Partial settings object to merge with existing
   */
  async saveAll(settings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await this.getAll();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      apiKeys: { ...currentSettings.apiKeys, ...settings.apiKeys },
      modelSettings: { ...currentSettings.modelSettings, ...settings.modelSettings },
      preferences: { ...currentSettings.preferences, ...settings.preferences },
    };
    await chrome.storage.local.set({ [this.STORAGE_KEY]: updatedSettings });
  }

  /**
   * Remove specific setting
   *
   * @param key Setting key to remove
   */
  async remove(key: string): Promise<void> {
    if (key === this.STORAGE_KEY) {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } else {
      const currentSettings = await this.getAll();
      this.deleteNestedValue(currentSettings as Record<string, unknown>, key);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: currentSettings });
    }
  }

  /**
   * Clear all settings (reset to defaults)
   */
  async clear(): Promise<void> {
    await chrome.storage.local.remove(this.STORAGE_KEY);
  }

  /**
   * Get storage usage information
   *
   * @returns Bytes used and available quota
   */
  async getStorageInfo(): Promise<{ bytesInUse: number; quota: number }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse(this.STORAGE_KEY);
    // Chrome storage.local quota is approximately 5MB (5242880 bytes)
    return {
      bytesInUse,
      quota: 5242880,
    };
  }

  // --- Helper methods for nested object access ---

  /**
   * Get value from nested object using dot notation
   * @example getNestedValue({ a: { b: 'value' } }, 'a.b') => 'value'
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Set value in nested object using dot notation
   * @example setNestedValue({}, 'a.b.c', 'value') => { a: { b: { c: 'value' } } }
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: Record<string, unknown> = obj;

    // Navigate to parent object
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[lastKey] = value;
    return obj;
  }

  /**
   * Delete value from nested object using dot notation
   */
  private deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: Record<string, unknown> = obj;

    // Navigate to parent object
    for (const key of keys) {
      if (!current[key]) return;
      if (typeof current[key] === 'object') {
        current = current[key] as Record<string, unknown>;
      } else {
        return;
      }
    }

    delete current[lastKey];
  }
}
