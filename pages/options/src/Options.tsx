import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ThemeProvider, ErrorDisplay, LoadingSpinner, Toaster, useTheme } from '@extension/ui';
import OptionsLayout from '@src/components/layout/OptionsLayout';
import { useEffect } from 'react';

// Sync theme from chrome.storage to ThemeProvider on mount
const ThemeSync = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    chrome.storage.local.get(['preferences'], result => {
      const theme = result.preferences?.state?.theme;
      if (theme) {
        setTheme(theme);
      }
    });
  }, [setTheme]);

  return null;
};

const Options = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <ThemeSync />
    <OptionsLayout />
    <Toaster />
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
