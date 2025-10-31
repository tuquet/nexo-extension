import { useEffect } from 'react';
import { create } from 'zustand';

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

type ThemeStore = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const useThemeStore = create<ThemeStore>(set => ({
  theme: getInitialTheme(),
  setTheme: t =>
    set(() => {
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        if (t === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        try {
          window.localStorage.setItem('theme', t);
        } catch {
          /* ignore */
        }
      }
      return { theme: t };
    }),
  toggleTheme: () =>
    set(state => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        if (next === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        try {
          window.localStorage.setItem('theme', next);
        } catch {
          /* ignore */
        }
      }
      return { theme: next };
    }),
}));

export const useTheme = (): [Theme, () => void] => {
  const theme = useThemeStore(s => s.theme);
  const toggleTheme = useThemeStore(s => s.toggleTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return [theme, toggleTheme];
};

export type Theme = 'light' | 'dark';
