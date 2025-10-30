import { createStorage, StorageEnum } from '../base/index.js';
import type { ThemeStateType, ThemeStorageType } from '../base/index.js';

const storage = createStorage<ThemeStateType>(
  'theme-storage-key',
  {
    theme: 'light',
    isLight: true,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const themeStorage: ThemeStorageType = {
  ...storage,
  toggle: async () => {
    await storage.set(currentState => {
      const newTheme = currentState.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return {
        theme: newTheme,
        isLight: newTheme === 'light',
      };
    });
  },
};
