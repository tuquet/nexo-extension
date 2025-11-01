// ...existing code...
import { DEFAULT_ASPECT_RATIO } from '@src/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AspectRatio } from '@src/types';
// ...existing code...

type Theme = 'light' | 'dark' | 'system';
type ContainerSize = 'narrow' | 'normal' | 'wide' | 'fluid';

type PreferencesState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  fontScale: number;
  setFontScale: (s: number) => void;
  containerSize: ContainerSize;
  setContainerSize: (s: ContainerSize) => void;
  toggleContainerSize: () => void;
  resetPreferences: () => void;
  defaultAspectRatio: AspectRatio;
  setDefaultAspectRatio: (ar: AspectRatio) => void;
};

const SIZES: ContainerSize[] = ['narrow', 'normal', 'wide', 'fluid'];

// Persist wrapper (localStorage)
const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: t => set({ theme: t }),
      toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      compactMode: false,
      setCompactMode: v => set({ compactMode: v }),
      fontScale: 1,
      setFontScale: s => set({ fontScale: s }),
      containerSize: 'normal',
      setContainerSize: s => set({ containerSize: s }),
      toggleContainerSize: () => {
        const currentIndex = SIZES.indexOf(get().containerSize);
        const nextIndex = (currentIndex + 1) % SIZES.length;
        set({ containerSize: SIZES[nextIndex] });
      },
      resetPreferences: () =>
        set({
          theme: 'system',
          compactMode: false,
          fontScale: 1,
          containerSize: 'normal',
          defaultAspectRatio: DEFAULT_ASPECT_RATIO,
        }),
      defaultAspectRatio: DEFAULT_ASPECT_RATIO,
      setDefaultAspectRatio: ar => set({ defaultAspectRatio: ar }),
    }),
    {
      name: 'preferences', // storage key
      version: 1,
      partialize: state =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['set', 'toggle', 'reset'].some(p => key.startsWith(p))),
        ) as PreferencesState,
    },
  ),
);

export type { PreferencesState, ContainerSize };
export { usePreferencesStore };
