import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

type PreferencesState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  fontScale: number; // 1.0 = default
  setFontScale: (s: number) => void;
  containerSize: 'narrow' | 'normal' | 'wide';
  setContainerSize: (s: 'narrow' | 'normal' | 'wide') => void;
  toggleContainerSize: () => void;
};

const usePreferencesStore = create<PreferencesState>(set => ({
  theme: 'system',
  setTheme: t => set({ theme: t }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  compactMode: false,
  setCompactMode: v => set({ compactMode: v }),
  fontScale: 1,
  setFontScale: s => set({ fontScale: s }),
  containerSize: 'normal',
  setContainerSize: s => set({ containerSize: s }),
  toggleContainerSize: () =>
    set(state => ({
      containerSize: state.containerSize === 'narrow' ? 'normal' : state.containerSize === 'normal' ? 'wide' : 'narrow',
    })),
}));

export type { PreferencesState };
export { usePreferencesStore };
