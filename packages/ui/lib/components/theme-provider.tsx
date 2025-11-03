import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void | Promise<void>;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => {},
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// eslint-disable-next-line func-style
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from chrome.storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(storageKey);
          const savedTheme = result[storageKey] as Theme;
          if (savedTheme) {
            setTheme(savedTheme);
          }
        } else {
          // Fallback to localStorage for non-extension environments
          const savedTheme = localStorage.getItem(storageKey) as Theme;
          if (savedTheme) {
            setTheme(savedTheme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [storageKey]);

  // Apply theme to DOM
  useEffect(() => {
    if (!isLoaded) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, isLoaded]);

  const value = {
    theme,
    setTheme: async (newTheme: Theme) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.set({ [storageKey]: newTheme });
        } else {
          // Fallback to localStorage for non-extension environments
          localStorage.setItem(storageKey, newTheme);
        }
        setTheme(newTheme);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
