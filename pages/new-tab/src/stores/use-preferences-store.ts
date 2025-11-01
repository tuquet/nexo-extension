import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type ContainerSize = 'narrow' | 'normal' | 'wide' | 'fluid';
type PreferencesState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  fontScale: number; // 1.0 = default
  setFontScale: (s: number) => void;
  containerSize: 'narrow' | 'normal' | 'wide' | 'fluid';
  setContainerSize: (s: 'narrow' | 'normal' | 'wide' | 'fluid') => void;
  toggleContainerSize: () => void;
};
const SIZES: ContainerSize[] = ['narrow', 'normal', 'wide', 'fluid'];
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
    set(state => {
      const { containerSize } = state;
      const currentIndex = SIZES.indexOf(containerSize);
      const nextIndex = (currentIndex + 1) % SIZES.length;
      return { containerSize: SIZES[nextIndex] };
    }),
}));

export type { PreferencesState };
export { usePreferencesStore };
