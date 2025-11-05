// ...existing code...
import { DEFAULT_ASPECT_RATIO } from '@extension/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AspectRatio } from '@src/types';
// ...existing code...

type ContainerSize = 'narrow' | 'normal' | 'wide' | 'fluid';

type PreferencesState = {
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
  typingDelay: number; // milliseconds per character (10-200ms)
  setTypingDelay: (delay: number) => void;
};

const SIZES: ContainerSize[] = ['narrow', 'normal', 'wide', 'fluid'];

// Persist wrapper (chrome.storage.local for cross-page sync)
const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
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
          compactMode: false,
          fontScale: 1,
          containerSize: 'normal',
          defaultAspectRatio: DEFAULT_ASPECT_RATIO,
          typingDelay: 50,
        }),
      defaultAspectRatio: DEFAULT_ASPECT_RATIO,
      setDefaultAspectRatio: ar => set({ defaultAspectRatio: ar }),
      typingDelay: 50,
      setTypingDelay: delay => set({ typingDelay: Math.max(10, Math.min(200, delay)) }),
    }),
    {
      name: 'preferences', // storage key (same as Options page)
      version: 1,
      partialize: state =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['set', 'toggle', 'reset'].some(p => key.startsWith(p))),
        ) as PreferencesState,
    },
  ),
);

// Listen for chrome.storage changes from Options page and sync to store
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.preferences) {
      const newPrefs = changes.preferences.newValue;
      if (newPrefs?.state) {
        const store = usePreferencesStore.getState();
        // Only update if values actually changed to avoid infinite loops
        if (
          newPrefs.state.containerSize !== store.containerSize ||
          newPrefs.state.compactMode !== store.compactMode ||
          newPrefs.state.fontScale !== store.fontScale ||
          newPrefs.state.defaultAspectRatio !== store.defaultAspectRatio ||
          newPrefs.state.typingDelay !== store.typingDelay
        ) {
          usePreferencesStore.setState({
            containerSize: newPrefs.state.containerSize || store.containerSize,
            compactMode: newPrefs.state.compactMode ?? store.compactMode,
            fontScale: newPrefs.state.fontScale ?? store.fontScale,
            defaultAspectRatio: newPrefs.state.defaultAspectRatio || store.defaultAspectRatio,
            typingDelay: newPrefs.state.typingDelay ?? store.typingDelay,
          });
        }
      }
    }
  });
}

export type { PreferencesState, ContainerSize };
export { usePreferencesStore };
